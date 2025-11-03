<template>
  <div class="container">
    <!-- 加载状态或数据不存在 -->
    <div v-if="travel === null || travel === undefined" class="loading-container">
      <a-spin size="large" />
      <p>加载中...</p>
    </div>
    
    <!-- 正常内容 -->
    <template v-else>
    <!-- 根据模式切换Hero组件 -->
    <!-- 注意：Inspiration模式的返回按钮已集成在ExperienceDay组件的封面设计中 -->
    <template v-if="travel?.mode !== 'inspiration'">
      <div class="header">
        <a-button @click="router.back()" class="back-button">
          <template #icon>
            <arrow-left-outlined />
          </template>
          {{ t('travelDetail.backToJourney') }}
        </a-button>
      </div>
    </template>
    <PlannerHero
      v-if="travel?.mode === 'planner'"
      :title="travel?.title || ''"
      :cover-image="getCoverImage()"
      :status="travel?.status || 'draft'"
      :status-label="getStatusLabel(travel?.status)"
      :duration="travel?.duration || 7"
      :participants="travel?.participants || 1"
    />

    <SeekerHero
      v-else-if="travel?.mode === 'seeker'"
      :title="travel?.title || ''"
      :cover-image="getCoverImage()"
      :show-mood-tracker="true"
    />

    <!-- Inspiration 模式的 Hero 展示已集成在 ExperienceDay 组件中 -->

    <!-- 主要内容区域 -->
    <div class="main-content" :class="{ 'inspiration-mode': travel?.mode === 'inspiration' }">
      <a-row :gutter="[24, 24]">
        <!-- 左侧面板 - 根据模式切换 -->
        <!-- 灵感模式：全宽显示 (24列) -->
        <a-col :xs="24" :lg="travel?.mode === 'inspiration' ? 24 : 16" :class="{ 'inspiration-full-width': travel?.mode === 'inspiration' }">
          <!-- Planner 模式：详细时间表 -->
          <PlannerTimeline v-if="travel?.mode === 'planner'" :itinerary="(travel?.data as any)?.plannerItinerary || null" />

          <!-- Seeker 模式：心情笔记 -->
          <SeekerMoodNotes v-else-if="travel?.mode === 'seeker'" />

          <!-- Inspiration 模式：体验日 -->
          <ExperienceDay v-else-if="travel?.mode === 'inspiration'" />

          <!-- 默认时间表 -->
          <a-card :title="t('travelDetail.timeline')" class="timeline-card" :bordered="false" v-else>
            <a-timeline>
              <a-timeline-item v-for="day in timelineDays" :key="day.date" color="blue">
                <template #dot>
                  <calendar-outlined :style="{ fontSize: '16px' }" />
                </template>
                <div class="day-card">
                  <div class="day-header">
                    <h3>{{ day.title }}</h3>
                    <a-space>
                      <a-button type="text" size="small">
                        <template #icon>
                          <edit-outlined />
                        </template>
                      </a-button>
                    </a-space>
                  </div>
                  <p class="day-description">{{ day.description }}</p>
                  <div class="day-activities">
                    <a-tag v-for="activity in day.activities" :key="activity" color="cyan" class="activity-tag">
                      {{ activity }}
                    </a-tag>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
            <div class="timeline-actions">
              <a-button type="dashed" block>
                <template #icon>
                  <plus-outlined />
                </template>
                {{ t('travelDetail.addNewDay') }}
              </a-button>
            </div>
          </a-card>
        </a-col>

        <!-- 右侧面板 - 根据模式切换（灵感模式隐藏） -->
        <a-col 
          :xs="24" 
          :lg="8" 
          style="position: relative;"
          v-if="travel?.mode !== 'inspiration'"
        >
          <!-- Planner 模式：效率工具 -->
          <PlannerSidebar v-if="travel?.mode === 'planner'" />

          <!-- Seeker 模式：陪伴与记录 -->
          <SeekerSidebar v-else-if="travel?.mode === 'seeker'" />

          <!-- 默认侧边栏 -->
          <a-space direction="vertical" size="large" style="width: 100%" v-if="!travel?.mode || (travel?.mode !== 'planner' && travel?.mode !== 'seeker' && travel?.mode !== 'inspiration')">
            <!-- 讨论区 -->
            <a-card :title="t('travelDetail.discussion')" class="sidebar-card" :bordered="false">
              <div class="chat-area">
                <div class="chat-messages">
                  <div class="chat-placeholder">
                    <message-outlined :style="{ fontSize: '32px', color: '#ccc' }" />
                    <p>{{ t('travelDetail.chatPlaceholder') }}</p>
                  </div>
                </div>
                <a-input 
                  placeholder="输入消息..."
                  v-model:value="chatInput"
                  @pressEnter="sendMessage"
                >
                  <template #suffix>
                    <thunderbolt-outlined />
                  </template>
                </a-input>
              </div>
            </a-card>

            <!-- 成员管理 -->
            <a-card :title="t('travelDetail.members')" class="sidebar-card" :bordered="false">
              <a-list :dataSource="members" item-layout="horizontal" size="small">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #avatar>
                        <a-avatar>{{ item.name[0] }}</a-avatar>
                      </template>
                      <template #title>{{ item.name }}</template>
                      <template #description>{{ item.emoji }} {{ item.mood }}</template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
              <a-button type="dashed" block style="margin-top: 1rem">
                <template #icon>
                  <user-add-outlined />
                </template>
                {{ t('travelDetail.inviteMember') }}
              </a-button>
            </a-card>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <!-- AI 浮动助手 -->
    <div class="ai-float-button" v-if="aiSuggestion">
      <a-popover placement="leftTop" :title="t('travelDetail.aiAssistant')">
        <template #content>
          <p>{{ aiSuggestion }}</p>
        </template>
        <a-button 
          type="primary" 
          shape="circle" 
          size="large"
          :style="{ width: '56px', height: '56px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }"
        >
          <template #icon>
            <bulb-outlined />
          </template>
        </a-button>
      </a-popover>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTravelListStore, type Travel } from '@/stores/travelList'
import { useTravelStore } from '@/stores/travel'
import { useI18n } from 'vue-i18n'
import PlannerHero from '@/components/TravelDetail/PlannerHero.vue'
import SeekerHero from '@/components/TravelDetail/SeekerHero.vue'
// InspirationHero 组件已移除，功能已集成到 ExperienceDay 组件中
import PlannerTimeline from '@/components/TravelDetail/PlannerTimeline.vue'
import SeekerMoodNotes from '@/components/TravelDetail/SeekerMoodNotes.vue'
import ExperienceDay from '@/components/TravelDetail/ExperienceDay.vue'
import PlannerSidebar from '@/components/TravelDetail/PlannerSidebar.vue'
import SeekerSidebar from '@/components/TravelDetail/SeekerSidebar.vue'
import { getTravelSuggestion } from '@/services/deepseekAPI'

const { t } = useI18n()
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  BulbOutlined,
  EditOutlined,
  ShareAltOutlined,
  MessageOutlined,
  UserAddOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  PlusOutlined,
  FileOutlined,
  TeamOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const travelListStore = useTravelListStore()
const travelStore = useTravelStore()

const travel = ref<Travel | null>(null)
const chatInput = ref('')
const aiSuggestion = ref<string>('')

// 根据模式设置AI建议
const setAISuggestion = async () => {
  if (!travel.value) return
  
  // 使用 DeepSeek API 获取真实 AI 建议
  try {
    const suggestion = await getTravelSuggestion(
      travel.value.mode as 'planner' | 'seeker' | 'inspiration',
      `旅行标题：${travel.value.title}`
    )
    aiSuggestion.value = suggestion
  } catch (error) {
    console.error('Failed to get AI suggestion:', error)
    // 失败时使用静态建议
    const suggestions: { [key: string]: string[] } = {
      planner: [
        t('travelDetail.aiSuggestion.planner1'),
        t('travelDetail.aiSuggestion.planner2'),
        t('travelDetail.aiSuggestion.planner3')
      ],
      seeker: [
        t('travelDetail.aiSuggestion.seeker1'),
        t('travelDetail.aiSuggestion.seeker2'),
        t('travelDetail.aiSuggestion.seeker3')
      ],
      inspiration: [
        t('travelDetail.aiSuggestion.inspiration1'),
        t('travelDetail.aiSuggestion.inspiration2'),
        t('travelDetail.aiSuggestion.inspiration3')
      ]
    }
    const modeSuggestions = suggestions[travel.value.mode] || []
    aiSuggestion.value = modeSuggestions[Math.floor(Math.random() * modeSuggestions.length)]
  }
}

// 监听travel变化，更新AI建议
const initAI = () => {
  if (travel.value) {
    setAISuggestion()
  }
}

// 加载旅程数据
onMounted(() => {
  const id = route.params.id as string
  console.log('TravelDetailView mounted, id:', id)
  travel.value = travelListStore.getTravel(id)
  console.log('Loaded travel:', travel.value)
  console.log('Travel mode:', travel.value?.mode)
  
  // 调试信息：检查模式判断
  if (!travel.value) {
    console.error('❌ 未找到旅程数据，ID:', id)
  } else if (!travel.value.mode) {
    console.warn('⚠️ 旅程数据缺少 mode 字段，使用默认模式')
  } else {
    console.log('✅ 旅程模式:', travel.value.mode)
    if (travel.value.mode === 'inspiration') {
      console.log('✅ 这是灵感模式，应该显示 ExperienceDay（已集成封面设计），隐藏右侧面板')
    }
  }
  
  console.log('Should show sidebar for mode:', travel.value?.mode || 'default')
  // 将存储在 Travel 数据中的 planner 行程注入到全局 store，保证 Timeline 一致
  if (travel.value?.mode === 'planner') {
    const dataObj: any = travel.value.data || {}
    if (dataObj.plannerItinerary) {
      travelStore.setItineraryData(travelStore.itineraryData) // 保持现有接口
      ;(travelStore as any).plannerItinerary = dataObj.plannerItinerary
    } else if (dataObj.itineraryData) {
      // 尝试从通用结构生成一个最小 PlannerItineraryResponse，供 Timeline 使用
      try {
        const mappedDays = (dataObj.itineraryData.itinerary || []).map((d: any, idx: number) => ({
          date: `Day ${d.day || idx + 1}`,
          title: d.title || `第${d.day || idx + 1}天`,
          description: '',
          status: 'planned',
          stats: { duration: (d.activities || []).length * 2, cost: 0 },
          timeSlots: (d.activities || []).map((a: any) => ({
            time: a.time || '10:00',
            activity: a.activity || '',
            location: '',
            icon: '📍',
            category: a.type || 'attraction',
            categoryColor: 'blue',
            notes: '',
            estimatedDuration: 1,
            estimatedCost: 0
          }))
        }))
        ;(travelStore as any).plannerItinerary = {
          title: travel.value.title || '智能行程规划',
          destination: travel.value.location || '目的地',
          duration: mappedDays.length,
          totalCost: 0,
          summary: '',
          days: mappedDays,
          recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
          aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
        }
      } catch (e) {
        console.warn('Fallback mapping plannerItinerary failed:', e)
      }
    }
  }

  initAI()
})

// 发送消息
const sendMessage = () => {
  if (chatInput.value.trim()) {
    console.log('发送消息:', chatInput.value)
    chatInput.value = ''
  }
}

// 获取当前天数
const getCurrentDay = () => {
  return 3 // 暂时使用固定值
}

// 成员列表
const members = ref([
  { name: '小明', emoji: '😊', mood: '很兴奋' },
  { name: '小红', emoji: '🤗', mood: '期待中' }
])

// 获取封面图片
const getCoverImage = () => {
  if (travel.value?.coverImage) {
    return travel.value.coverImage
  }
  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200'
}

// 获取日期范围
const getDateRange = () => {
  if (travel.value?.startDate && travel.value?.endDate) {
    const start = new Date(travel.value.startDate).toLocaleDateString('zh-CN')
    const end = new Date(travel.value.endDate).toLocaleDateString('zh-CN')
    return `${start} ~ ${end}`
  }
  return t('travelList.toBeDetermined')
}

// 获取状态颜色
const getStatusColor = (status?: string) => {
  const colors: { [key: string]: string } = {
    draft: 'default',
    active: 'processing',
    completed: 'success'
  }
  return colors[status || 'draft'] || 'default'
}

// 获取状态标签
const getStatusLabel = (status?: string) => {
  return t(`travelList.status.${status || 'draft'}` as any)
}

// 获取模式标签
const getModeLabel = (mode?: string) => {
  return t(`travelList.travelMode.${mode || 'planner'}` as any)
}

// 获取引用
const getQuote = () => {
  const quotes: { [key: string]: string } = {
    planner: '一次精心安排的完美旅程',
    seeker: '让心情指引我的旅程',
    inspiration: '将灵感转化为真实体验'
  }
  return quotes[travel.value?.mode || 'planner'] || '一次美好的旅程'
}

// Timeline 数据
const timelineDays = ref([
  {
    date: 'Day 1',
    title: '第一天 - 抵达目的地',
    description: '上午抵达机场，下午入住酒店并休整',
    activities: ['✈️ 接机', '🏨 入住酒店', '🍜 当地美食', '🌅 休息']
  },
  {
    date: 'Day 2',
    title: '第二天 - 探索主要景点',
    description: '全天深度游览当地著名景点和特色体验',
    activities: ['🏛️ 主要景点', '📸 拍照打卡', '🍽️ 当地餐厅', '🎁 购物']
  },
  {
    date: 'Day 3',
    title: '第三天 - 特色体验与返程',
    description: '体验当地特色活动，下午准备返程',
    activities: ['🎨 特色体验', '🛍️ 伴手礼', '✈️ 返程']
  }
])

// 任务列表
const tasks = ref([
  { title: '预订机票', completed: true },
  { title: '预订酒店', completed: false },
  { title: '准备签证', completed: false },
  { title: '购买保险', completed: false }
])

// 获取预算百分比
const getBudgetPercent = () => {
  if (!travel.value) return 0
  const total = travel.value.budget || 5000
  const spent = travel.value.spent || 0
  return Math.round((spent / total) * 100)
}

// 获取预算颜色
const getBudgetColor = () => {
  const percent = getBudgetPercent()
  if (percent < 50) return '#52c41a'
  if (percent < 80) return '#faad14'
  return '#ff4d4f'
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.back-button {
  height: 36px;
}

/* Hero区域 */
.hero-section {
  position: relative;
  overflow: hidden;
}

.hero-cover {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-cover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6));
}

.hero-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 3rem;
  color: white;
  z-index: 10;
}

.hero-welcome {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
}

.welcome-emoji {
  font-size: 1.2rem;
}

.welcome-text {
  font-style: italic;
}

.hero-info {
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-separator {
  color: rgba(255, 255, 255, 0.6);
}

.meta-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.hero-extra {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.hero-extra span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* AI摘要 */
.ai-summary {
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.ai-icon {
  font-size: 1.5rem;
  color: #ffd700;
  flex-shrink: 0;
}

.ai-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
}

/* 操作按钮 */
.hero-actions {
  display: flex;
  gap: 1rem;
}

/* 主要内容 */
.main-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 4vw, 3rem);
  width: 100%;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

/* 灵感模式：全宽布局 */
.main-content.inspiration-mode {
  max-width: 1800px;
  padding: 0 clamp(1.5rem, 5vw, 4rem);
}

.main-content :deep(.ant-col) {
  min-height: 200px;
}

/* 灵感模式专用优化 */
.main-content :deep(.ant-row) {
  --ant-col-lg-offset: 0;
}

.main-content.inspiration-mode :deep(.ant-col.inspiration-full-width) {
  max-width: 100%;
  flex: 0 0 100%;
  padding: 0;
}

/* 隐藏空白的右侧面板 */
.main-content :deep(.ant-col[class*="lg-8"]:empty) {
  display: none;
}

/* 响应式断点 */
@media (min-width: 1400px) {
  .main-content.inspiration-mode {
    max-width: 2000px;
  }
}

@media (max-width: 1400px) {
  .main-content.inspiration-mode {
    max-width: 1600px;
  }
}

@media (max-width: 1200px) {
  .main-content.inspiration-mode {
    max-width: 1400px;
  }
}

@media (max-width: 991px) {
  .main-content {
    padding: 0 clamp(1rem, 3vw, 2rem);
  }
  
  .main-content.inspiration-mode {
    max-width: 100%;
    padding: 0 clamp(1rem, 3vw, 2rem);
  }
  
  .main-content :deep(.ant-col[class*="lg-8"]) {
    display: none;
  }
  
  .main-content :deep(.ant-col[class*="lg-16"]),
  .main-content :deep(.ant-col[class*="lg-24"]) {
    max-width: 100%;
    flex: 0 0 100%;
  }
}

.timeline-card,
.sidebar-card {
  border-radius: 12px;
}

.chat-area {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-messages {
  min-height: 150px;
  max-height: 200px;
  overflow-y: auto;
}

.chat-placeholder {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.file-placeholder {
  text-align: center;
  padding: 1rem;
  color: #999;
}

.file-placeholder p {
  margin: 0.5rem 0;
}

.day-card {
  background: #fafafa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.day-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.day-description {
  color: #666;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.day-activities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.activity-tag {
  margin: 0;
}

.timeline-actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.budget-info {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-content {
    padding: 2rem 1rem;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-extra {
    flex-direction: column;
    gap: 0.5rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .main-content {
    padding: 0 1rem;
  }
}

/* AI 浮动助手 */
.ai-float-button {
  position: fixed;
  right: 24px;
  bottom: 80px;
  z-index: 1000;
}

.ai-float-button :deep(.ant-btn) {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .ai-float-button {
    right: 16px;
    bottom: 70px;
  }
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
}

.loading-container p {
  color: #666;
  font-size: 1rem;
}
</style>

<template>
  <div class="container" :class="{ 'inspiration-container': travel?.mode === 'inspiration' }">
    <!-- 加载状态或数据不存在 -->
    <div v-if="travel === null || travel === undefined" class="loading-container">
      <a-spin size="large" />
      <p>加载中...</p>
    </div>
    
    <!-- 正常内容 -->
    <template v-else>
    <!-- 根据模式切换Hero组件 -->
    <!-- 所有模式统一显示返回按钮 -->
    <div class="header">
      <a-button @click="router.back()" class="back-button">
        <template #icon>
          <arrow-left-outlined />
        </template>
        {{ t('travelDetail.backToJourney') }}
      </a-button>
    </div>
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
        <!-- 灵感模式：16列，右侧8列显示公共组件 -->
        <a-col :xs="24" :lg="travel?.mode === 'inspiration' ? 16 : 16" :class="{ 'inspiration-full-width': travel?.mode === 'inspiration' }">
          <!-- Planner 模式：详细时间表 -->
          <PlannerTimeline v-if="travel?.mode === 'planner'" :itinerary="(travel?.data as any)?.plannerItinerary || null" />

          <!-- Seeker 模式：心情笔记 -->
          <SeekerMoodNotes v-else-if="travel?.mode === 'seeker'" />

          <!-- Inspiration 模式：体验日 -->
          <template v-else-if="travel?.mode === 'inspiration'">
            <!-- 签证指引（Inspiration模式显示在顶部） -->
            <VisaGuide 
              v-if="visaInfo && destinationCountry"
              :visa-info="visaInfo"
              :destination-country="destinationCountry"
              :destination-name="destinationName"
              style="margin-bottom: 24px;"
            />
            <ExperienceDay />
          </template>

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

        <!-- 右侧面板 - 所有模式都显示 -->
        <a-col 
          :xs="24" 
          :lg="8" 
          :class="{ 'sidebar-after-hero': travel?.mode === 'inspiration' }"
        >
          <!-- Planner 模式：效率工具 -->
          <PlannerSidebar v-if="travel?.mode === 'planner'" :travel-id="travel?.id" />

          <!-- Seeker 模式：陪伴与记录 -->
          <SeekerSidebar v-else-if="travel?.mode === 'seeker'" :travel-id="travel?.id" />

          <!-- Inspiration 模式：公共组件 -->
          <template v-else-if="travel?.mode === 'inspiration'">
            <a-space direction="vertical" size="large" style="width: 100%">
              <VisaGuide 
                v-if="visaInfo && destinationCountry"
                :visa-info="visaInfo"
                :destination-country="destinationCountry"
                :destination-name="destinationName"
                style="margin-bottom: 24px;"
              />
              <DiscussionArea :travel-id="travel?.id" />
              <TaskList :travel-id="travel?.id" />
              <BudgetManager :travel-id="travel?.id" :initial-spent="travel?.spent || 0" :initial-total="travel?.budget || 0" />
            </a-space>
          </template>
          
          <!-- 签证指引（所有模式显示在右侧边栏顶部，如果有目的地信息） -->
          <VisaGuide 
            v-if="visaInfo && destinationCountry && travel?.mode !== 'inspiration'"
            :visa-info="visaInfo"
            :destination-country="destinationCountry"
            :destination-name="destinationName"
            style="margin-bottom: 24px;"
          />

          <!-- 默认侧边栏 -->
          <a-space direction="vertical" size="large" style="width: 100%" v-if="!travel?.mode || (travel?.mode !== 'planner' && travel?.mode !== 'seeker' && travel?.mode !== 'inspiration')">
            <!-- 讨论区 -->
            <DiscussionArea :travel-id="travel?.id" />
            
            <!-- 任务清单 -->
            <TaskList :travel-id="travel?.id" />
            
            <!-- 预算管理 -->
            <BudgetManager :travel-id="travel?.id" :initial-spent="travel?.spent || 0" :initial-total="travel?.budget || 0" />

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

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
import VisaGuide from '@/components/TravelDetail/VisaGuide.vue'
import DiscussionArea from '@/components/TravelDetail/DiscussionArea.vue'
import TaskList from '@/components/TravelDetail/TaskList.vue'
import BudgetManager from '@/components/TravelDetail/BudgetManager.vue'
import { getUserNationalityCode } from '@/config/userProfile'
import { getVisaInfo } from '@/config/visa'
import { PRESET_COUNTRIES } from '@/constants/countries'

const { t } = useI18n()
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
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

// 从目的地字符串提取国家代码（统一的提取函数）
const extractCountryCodeFromDestination = (destStr: string): string | null => {
  if (!destStr) return null
  
  const destLower = destStr.toLowerCase()
  
  // 国家别名映射（地名、常见英文名称等）
  const countryAliases: Record<string, string[]> = {
    'US': ['alaska', '阿拉斯加', 'fairbanks', '费尔班克斯', 'usa', 'united states', '美国', 'america'],
    'JP': ['japan', '日本'],
    'KR': ['korea', 'south korea', '韩国'],
    'TH': ['thailand', '泰国'],
    'SG': ['singapore', '新加坡'],
    'MY': ['malaysia', '马来西亚'],
    'ID': ['indonesia', '印尼'],
    'PH': ['philippines', '菲律宾'],
    'VN': ['vietnam', '越南'],
    'AU': ['australia', '澳大利亚'],
    'CA': ['canada', '加拿大'],
    'NZ': ['new zealand', '新西兰'],
    'GB': ['united kingdom', 'uk', '英国', 'britain'],
    'FR': ['france', '法国'],
    'DE': ['germany', '德国'],
    'IT': ['italy', '意大利'],
    'ES': ['spain', '西班牙'],
    'FI': ['finland', '芬兰'],
    'TW': ['taiwan', '台湾'],
    'HK': ['hong kong', '香港'],
    'MO': ['macau', 'macao', '澳门']
  }
  
  // 遍历PRESET_COUNTRIES，匹配国家名称或代码
  for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
    // 1. 匹配国家名称（中文）
    if (destLower.includes(country.name.toLowerCase())) {
      return code
    }
    
    // 2. 匹配国家代码
    if (destLower.includes(code.toLowerCase())) {
      return code
    }
    
    // 3. 匹配别名
    const aliases = countryAliases[code] || []
    if (aliases.some(alias => destLower.includes(alias.toLowerCase()))) {
      return code
    }
  }
  
  return null
}

// 提取目的地国家代码
const destinationCountry = computed(() => {
  if (!travel.value) return null
  
  // 尝试从不同数据源提取目的地
  const data = travel.value.data as any
  
  // 1. 从 location 字段提取（优先级最高，因为可能被用户或AI更新）
  if (travel.value.location) {
    const countryCode = extractCountryCodeFromDestination(travel.value.location)
    if (countryCode) return countryCode
  }
  
  // 2. 从 destination 字段提取
  if (travel.value.destination) {
    const countryCode = extractCountryCodeFromDestination(travel.value.destination)
    if (countryCode) return countryCode
  }
  
  // 3. 从 itineraryData 或 plannerItinerary 中提取
  if (data?.itineraryData?.destination) {
    const countryCode = extractCountryCodeFromDestination(data.itineraryData.destination)
    if (countryCode) return countryCode
  }
  
  // 4. 从 days 数组中的 locations 提取
  if (data?.days && Array.isArray(data.days)) {
    for (const day of data.days) {
      if (day.location) {
        const countryCode = extractCountryCodeFromDestination(day.location)
        if (countryCode) return countryCode
      }
    }
  }
  
  return null
})

// 获取目的地名称
const destinationName = computed(() => {
  if (!destinationCountry.value) return ''
  const country = PRESET_COUNTRIES[destinationCountry.value as keyof typeof PRESET_COUNTRIES]
  return country?.name || ''
})

// 获取签证信息
const visaInfo = computed(() => {
  const countryCode = destinationCountry.value
  if (!countryCode) return null
  
  const nationalityCode = getUserNationalityCode()
  if (!nationalityCode) return null
  
  const visaInfos = getVisaInfo(countryCode, nationalityCode, null)
  if (visaInfos.length === 0) return null
  
  // 返回第一个签证信息（通常是主要的）
  return visaInfos[0]
})


// 加载旅程数据
onMounted(() => {
  const id = route.params.id as string
  console.log('TravelDetailView mounted, id:', id)
  travel.value = travelListStore.getTravel(id)
  console.log('Loaded travel:', travel.value)
  console.log('Travel mode:', travel.value?.mode)
  
  // 修复Inspiration模式的滚动问题
  const fixScroll = () => {
    if (travel.value?.mode === 'inspiration') {
      // 强制设置body和html的滚动属性
      const body = document.body
      const html = document.documentElement
      
      // 移除所有可能阻止滚动的样式
      body.style.overflow = 'auto'
      body.style.overflowY = 'auto'
      body.style.height = 'auto'
      body.style.minHeight = '100vh'
      body.style.maxHeight = 'none'
      body.style.position = 'relative'
      
      html.style.overflow = 'auto'
      html.style.overflowY = 'auto'
      html.style.height = 'auto'
      html.style.minHeight = '100vh'
      html.style.maxHeight = 'none'
      
      // 确保容器也可以滚动
      const container = document.querySelector('.container.inspiration-container')
      if (container) {
        const containerEl = container as HTMLElement
        containerEl.style.overflowY = 'visible'
        containerEl.style.height = 'auto'
        containerEl.style.minHeight = '100vh'
        containerEl.style.position = 'relative'
      }
      
      // 确保#app可以滚动
      const app = document.getElementById('app')
      if (app) {
        app.style.overflowY = 'auto'
        app.style.height = 'auto'
        app.style.minHeight = '100vh'
        app.style.position = 'relative'
      }
      
      // 确保main-content可以滚动（桌面端）
      if (window.innerWidth > 991) {
        const mainContent = document.querySelector('.main-content.inspiration-mode')
        if (mainContent) {
          const mainEl = mainContent as HTMLElement
          mainEl.style.overflow = 'visible'
          mainEl.style.overflowY = 'visible'
          mainEl.style.overflowX = 'hidden'
          mainEl.style.height = 'auto'
          mainEl.style.minHeight = '200vh'
          mainEl.style.maxHeight = 'none'
        }
      }
      
      // 强制启用页面滚动 - 添加滚动事件监听
      const enableScroll = () => {
        // 允许所有滚动事件
        document.body.style.overscrollBehavior = 'auto'
        document.body.style.overscrollBehaviorY = 'auto'
        html.style.overscrollBehavior = 'auto'
        html.style.overscrollBehaviorY = 'auto'
        
        // 确保可以滚动 - 添加滚动监听器
        const handleWheel = (e: WheelEvent) => {
          // 允许滚动事件正常传播
          e.stopPropagation = () => {} // 重写阻止传播
        }
        
        // 移除旧的事件监听器（如果存在）
        document.removeEventListener('wheel', handleWheel as any, { passive: true } as any)
        // 添加新的事件监听器
        document.addEventListener('wheel', handleWheel as any, { passive: true, capture: true } as any)
      }
      enableScroll()
      
      // 确保可以滚动
      console.log('Scroll fix applied:', {
        bodyOverflow: body.style.overflowY,
        htmlOverflow: html.style.overflowY,
        bodyHeight: body.style.height,
        htmlHeight: html.style.height,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      })
      
      // 强制触发重排，确保样式生效
      void document.body.offsetHeight
      void document.documentElement.offsetHeight
    }
  }
  
  // 延迟执行，确保DOM已完全渲染
  setTimeout(() => {
    fixScroll()
    // 强制触发滚动检查
    window.scrollTo(0, 0)
    // 测试滚动
    setTimeout(() => {
      window.scrollTo(0, 1)
      window.scrollTo(0, 0)
    }, 200)
  }, 100)
  
  // 监听travel变化，重新修复滚动
  watch(() => travel.value?.mode, () => {
    setTimeout(() => {
      fixScroll()
      window.scrollTo(0, 0)
    }, 100)
  })
  
  // 监听窗口大小变化，重新修复滚动
  window.addEventListener('resize', () => {
    if (travel.value?.mode === 'inspiration') {
      setTimeout(() => {
        fixScroll()
      }, 100)
    }
  })
  
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

})


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
  position: relative;
  overflow-x: hidden;
}

/* Inspiration模式：确保容器可以滚动 */
.container.inspiration-container {
  overflow-y: visible;
  height: auto;
  min-height: 100vh;
}

/* 桌面端：确保main-content可以滚动 */
@media (min-width: 992px) {
  .main-content.inspiration-mode {
    overflow: visible !important;
    overflow-y: visible !important;
    overflow-x: hidden !important;
    height: auto !important;
    /* 移除固定的min-height，让内容自然决定高度 */
    position: relative;
    max-height: none !important;
  }
  
  .container.inspiration-container {
    /* 移除固定的min-height，让内容自然决定高度 */
    overflow-y: visible !important;
    height: auto !important;
    max-height: none !important;
  }
  
  /* 强制body和html可以滚动 */
  body {
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100vh !important;
    max-height: none !important;
  }
  
  html {
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100vh !important;
    max-height: none !important;
  }
  
  #app {
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100vh !important;
    max-height: none !important;
  }
}

/* 确保body可以滚动 - 通过JavaScript动态设置 */

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

/* 灵感模式布局调整 */
.main-content.inspiration-mode {
  max-width: 1600px;
  padding: 0 clamp(1.5rem, 4vw, 3rem);
  margin-top: 0 !important;
  overflow: visible !important;
  overflow-y: visible !important;
  overflow-x: hidden !important;
  height: auto !important;
  /* 移除固定的min-height，让内容自然决定高度 */
  position: relative;
}

/* 灵感模式：与其他模式保持一致，不需要特殊宽度处理 */

/* 桌面端：灵感模式封面样式 - 与其他模式保持一致 */
@media (min-width: 992px) {
  .main-content.inspiration-mode :deep(.inspiration-hero) {
    /* 与其他模式保持一致，使用标准布局，不需要特殊宽度处理 */
  }
}

/* 移动端：与其他模式保持一致 */
@media (max-width: 991px) {
  .main-content.inspiration-mode :deep(.inspiration-hero) {
    /* 与其他模式保持一致 */
    min-height: 100vh;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

.main-content.inspiration-mode :deep(.hero-layer *) {
  pointer-events: auto; /* 恢复内部元素的交互 */
}

/* 确保滚动容器正确 */
.main-content.inspiration-mode {
  overflow: visible !important;
  height: auto !important;
}

.main-content :deep(.ant-col) {
  min-height: 200px;
}

/* 灵感模式专用优化 */
.main-content :deep(.ant-row) {
  --ant-col-lg-offset: 0;
}

.main-content.inspiration-mode :deep(.ant-col.inspiration-full-width) {
  /* Inspiration模式现在使用16:8布局，不再需要全宽 */
}

/* 隐藏空白的右侧面板 */
.main-content :deep(.ant-col[class*="lg-8"]:empty) {
  display: none;
}

/* Inspiration模式：右侧边栏正常显示，使用sticky定位 */
@media (min-width: 992px) {
  .main-content.inspiration-mode :deep(.sidebar-after-hero) {
    display: block !important; /* 确保显示 */
    position: sticky;
    top: 68vh; /* 从顶部开始显示，与左侧内容对齐 */
    align-self: flex-start;
    z-index: 10;
    max-height: none !important; /* 移除高度限制，允许完整显示内容 */
    overflow-y: visible !important; /* 允许内容自然显示 */
    height: auto !important;
  }
}

/* 移动端：使用相对定位 */
@media (max-width: 991px) {
  .main-content.inspiration-mode :deep(.hero-layer) {
    position: relative !important;
    width: 100% !important;
    height: auto !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  
  .main-content.inspiration-mode :deep(.sidebar-after-hero) {
    position: relative !important;
    top: auto !important;
  }
}

/* 确保Inspiration模式的左侧内容正常显示（不再需要margin-top，因为封面现在是sticky） */
@media (min-width: 992px) {
  .main-content.inspiration-mode :deep(.ant-col[class*="lg-16"]) {
    margin-top: 0; /* sticky定位不需要margin-top */
    position: relative;
    z-index: 2;
    /* 移除固定的min-height和padding-bottom，让内容自然决定高度 */
  }
}

/* 确保experience-journey自然显示，不强制最小高度 */
.main-content.inspiration-mode :deep(.experience-journey) {
  /* 移除固定的min-height，让内容自然决定高度 */
}

/* 确保itinerary-timeline部分正常显示和滚动 */
.main-content.inspiration-mode :deep(.itinerary-timeline) {
  position: relative;
  z-index: 2;
  background: #f5f5f7;
}

/* 确保main-content不会覆盖封面 */
.main-content.inspiration-mode {
  margin-top: 0;
  position: relative;
}

@media (max-width: 991px) {
  .main-content.inspiration-mode :deep(.sidebar-after-hero) {
    position: relative !important;
    top: auto !important;
    right: auto !important;
    width: 100% !important;
    margin-top: 24px !important;
  }
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

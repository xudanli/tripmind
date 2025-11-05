<template>
  <a-card :bordered="false" class="sidebar-container">
    <a-tabs v-model:activeKey="activeKey" :tab-position="'top'">
      <!-- 讨论区 Tab -->
      <a-tab-pane key="discussion" tab="讨论区">
        <DiscussionArea :travel-id="travelId" />
      </a-tab-pane>

      <!-- 任务清单 Tab -->
      <a-tab-pane key="tasks" tab="任务">
        <TaskList :travel-id="travelId" :initial-tasks="computedInitialTasks" />
      </a-tab-pane>

      <!-- 预算管理 Tab -->
      <a-tab-pane key="budget" tab="预算">
        <BudgetManager :travel-id="travelId" :initial-spent="initialSpent" :initial-total="initialTotal" />
      </a-tab-pane>

      <!-- 成员管理 Tab -->
      <a-tab-pane key="members" tab="旅伴">
        <MemberManagement :travel-id="travelId" />
      </a-tab-pane>

      <!-- 订票信息 Tab -->
      <a-tab-pane key="bookings" tab="订票">
        <BookingInfo :travel-id="travelId" />
      </a-tab-pane>

      <!-- 相关攻略 Tab -->
      <a-tab-pane key="guides" tab="攻略">
        <TravelGuides :travel-id="travelId" />
      </a-tab-pane>

      <!-- Planner 模式：文件管理 Tab -->
      <a-tab-pane v-if="mode === 'planner'" key="files" :tab="t('travelDetail.plannerSidebar.files')">
        <a-card :bordered="false" class="inner-card">
          <div class="file-section">
            <a-list :dataSource="dynamicFiles" item-layout="horizontal" size="small">
              <template #renderItem="{ item }">
                <a-list-item>
                  <template #actions>
                    <a-button type="text" size="small">
                      <download-outlined />
                    </a-button>
                  </template>
                  <a-list-item-meta>
                    <template #title>
                      <a>{{ item.name }}</a>
                    </template>
                    <template #description>
                      <span>{{ item.size }}</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
            <a-button type="dashed" block style="margin-top: 1rem">
              <plus-outlined /> {{ t('travelDetail.plannerSidebar.uploadFile') }}
            </a-button>
          </div>
        </a-card>
      </a-tab-pane>

      <!-- Seeker 模式：AI陪伴 Tab -->
      <a-tab-pane v-if="mode === 'seeker'" key="aiCompanion" :tab="t('travelDetail.seekerSidebar.aiCompanion')">
        <a-card :bordered="false" class="inner-card seeker-card">
          <div class="ai-chat">
            <div class="ai-message">
              <heart-outlined class="ai-icon" />
              <p>"今天阳光很柔，我帮你留出一个下午的空白，好吗？"</p>
            </div>
            <a-input 
              :placeholder="t('travelDetail.seekerSidebar.chatPlaceholder')"
              v-model:value="chatInput"
              @pressEnter="sendMessage"
              size="large"
              class="chat-input"
            />
          </div>
        </a-card>
      </a-tab-pane>

      <!-- Seeker 模式：心情记录 Tab -->
      <a-tab-pane v-if="mode === 'seeker'" key="mood" :tab="t('travelDetail.seekerSidebar.moodRecord')">
        <a-card :bordered="false" class="inner-card seeker-card">
          <div class="mood-chart">
            <div class="mood-points">
              <div v-for="point in moodPoints" :key="point.day" class="mood-point">
                <div class="point-value" :style="{ height: point.value + '%' }"></div>
                <span class="point-day">{{ point.day }}</span>
              </div>
            </div>
            <div class="mood-legend">
              <span>{{ t('travelDetail.seekerSidebar.moodChart.relaxed') }}</span>
              <span>{{ t('travelDetail.seekerSidebar.moodChart.happy') }}</span>
              <span>{{ t('travelDetail.seekerSidebar.moodChart.calm') }}</span>
            </div>
          </div>
        </a-card>
      </a-tab-pane>

      <!-- Seeker 模式：推荐 Tab -->
      <a-tab-pane v-if="mode === 'seeker'" key="recommendations" :tab="t('travelDetail.seekerSidebar.recommendations')">
        <a-card :bordered="false" class="inner-card seeker-card">
          <div class="recommendations">
            <a-card size="small" class="recommendation-item">
              <div class="rec-content">
                <span class="rec-emoji">🌊</span>
                <div class="rec-info">
                  <div class="rec-title">海边漫步</div>
                  <div class="rec-desc">慢走30分钟，放松心情</div>
                </div>
              </div>
            </a-card>
            <a-card size="small" class="recommendation-item">
              <div class="rec-content">
                <span class="rec-emoji">☕</span>
                <div class="rec-info">
                  <div class="rec-title">咖啡休息</div>
                  <div class="rec-desc">品尝当地特色咖啡</div>
                </div>
              </div>
            </a-card>
          </div>
        </a-card>
      </a-tab-pane>
    </a-tabs>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'
import DiscussionArea from './DiscussionArea.vue'
import TaskList from './TaskList.vue'
import BudgetManager from './BudgetManager.vue'
import MemberManagement from './MemberManagement.vue'
import BookingInfo from './BookingInfo.vue'
import TravelGuides from './TravelGuides.vue'
import { 
  DownloadOutlined, 
  PlusOutlined,
  HeartOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

interface Props {
  travelId?: string
  mode?: 'planner' | 'seeker' | 'inspiration' | 'default'
  files?: Array<{ name: string; size: string }>
  initialTasks?: Array<{ id: string; title: string; completed: boolean; createdAt: number }>
  initialSpent?: number
  initialTotal?: number
}

const props = withDefaults(defineProps<Props>(), {
  travelId: '',
  mode: 'default',
  files: () => [],
  initialTasks: () => [],
  initialSpent: 0,
  initialTotal: 0
})

const activeKey = ref('discussion')
const chatInput = ref('')

// 从 travel 数据获取初始值
const travel = computed(() => {
  if (props.travelId) {
    return travelListStore.getTravel(props.travelId)
  }
  return null
})

// Planner 模式的初始任务列表（从行程内容推断）
const plannerItinerary = computed(() => travelStore.plannerItinerary)

const computedInitialTasks = computed(() => {
  // 如果传入了初始任务，优先使用
  if (props.initialTasks && props.initialTasks.length > 0) {
    return props.initialTasks
  }
  
  // Planner 模式：从行程内容推断
  if (props.mode === 'planner' && plannerItinerary.value) {
    const tasks: Array<{ id: string; title: string; completed: boolean; createdAt: number }> = []
    tasks.push({ 
      id: 'task_ai_generated',
      title: 'AI 行程生成', 
      completed: true,
      createdAt: Date.now()
    })
    const days = plannerItinerary.value.days || []
    const allSlots = days.flatMap(d => d.timeSlots || [])
    const hasTransport = allSlots.some(s => (s.category || '').toLowerCase().includes('交'))
    const hasHotel = allSlots.some(s => (s.activity || '').includes('酒店') || (s.category || '').includes('住'))
    if (hasTransport) {
      tasks.push({ 
        id: 'task_book_transport',
        title: '预订交通', 
        completed: false,
        createdAt: Date.now()
      })
    }
    if (hasHotel) {
      tasks.push({ 
        id: 'task_book_hotel',
        title: '预订住宿', 
        completed: false,
        createdAt: Date.now()
      })
    }
    return tasks
  }
  
  return []
})

// 动态文件列表
const dynamicFiles = computed(() => props.files || [])

// 心情曲线数据
const moodPoints = ref([
  { day: 'Day 1', value: 60 },
  { day: 'Day 2', value: 80 },
  { day: 'Day 3', value: 75 },
  { day: 'Today', value: 85 }
])

const sendMessage = () => {
  console.log('发送消息:', chatInput.value)
  chatInput.value = ''
}
</script>

<style scoped>
.sidebar-container {
  border: 1px solid #f0f0f0;
  box-shadow: none;
  border-radius: 8px;
  overflow-y: auto;
}

.inner-card {
  box-shadow: none;
  border: none;
  padding: 0;
}

.file-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.seeker-card {
  background: linear-gradient(135deg, rgba(255, 240, 245, 0.3), rgba(255, 228, 225, 0.3));
  border: 1px solid rgba(255, 182, 193, 0.3);
}

.ai-chat {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ai-message {
  background: rgba(255, 182, 193, 0.1);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: start;
  gap: 0.75rem;
}

.ai-icon {
  color: #ff69b4;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.ai-message p {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-style: italic;
}

.chat-input {
  border-radius: 20px;
}

.mood-chart {
  padding: 1rem 0;
}

.mood-points {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 100px;
  margin-bottom: 1rem;
}

.mood-point {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.point-value {
  width: 30px;
  background: linear-gradient(to top, #ff69b4, #ffb6c1);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.point-day {
  font-size: 0.75rem;
  color: #999;
}

.mood-legend {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recommendation-item {
  background: rgba(255, 240, 245, 0.5);
  border: 1px solid rgba(255, 182, 193, 0.3);
  border-radius: 8px;
}

.rec-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rec-emoji {
  font-size: 1.5rem;
}

.rec-info {
  flex: 1;
}

.rec-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.rec-desc {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

/* Tab 样式优化 - 简化设计 */
:deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

:deep(.ant-tabs-nav .ant-tabs-tab) {
  padding: 8px 16px;
  margin-right: 8px;
  border: none;
  background: transparent;
}

:deep(.ant-tabs-nav .ant-tabs-tab:hover) {
  color: #1890ff;
}

:deep(.ant-tabs-nav .ant-tabs-tab-active) {
  color: #1890ff;
  font-weight: 500;
}

:deep(.ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #1890ff;
}

:deep(.ant-tabs-ink-bar) {
  background: #1890ff;
}

:deep(.ant-tabs-content) {
  padding-top: 0;
}

:deep(.ant-tabs-tabpane) {
  padding: 0;
}
</style>


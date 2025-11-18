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

      <!-- planner 和 seeker 模式已移除 -->
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
  PlusOutlined
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
// seeker 模式已移除，删除相关变量

// 从 travel 数据获取初始值
const travel = computed(() => {
  if (props.travelId) {
    return travelListStore.getTravel(props.travelId)
  }
  return null
})

// planner 和 seeker 模式已移除，不再需要相关逻辑
const computedInitialTasks = computed(() => {
  // 如果传入了初始任务，优先使用
  if (props.initialTasks && props.initialTasks.length > 0) {
    return props.initialTasks
  }
  
  // planner 模式已移除，不再从行程内容推断任务
  
  return []
})

// 动态文件列表
const dynamicFiles = computed(() => props.files || [])

// seeker 模式已移除，相关数据已删除
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

/* seeker 模式相关样式已移除 */

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


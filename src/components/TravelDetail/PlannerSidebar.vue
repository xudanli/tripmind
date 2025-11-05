<template>
  <a-space direction="vertical" size="large" style="width: 100%">
    <!-- 讨论区 -->
    <DiscussionArea :travel-id="travelId" />

    <!-- 任务清单 -->
    <TaskList :travel-id="travelId" :initial-tasks="initialTasks" />

    <!-- 预算管理 -->
    <BudgetManager :travel-id="travelId" :initial-spent="initialSpent" :initial-total="initialTotal" />

    <!-- 成员管理 -->
    <MemberManagement :travel-id="travelId" />

    <!-- 文件管理 -->
    <a-card :title="t('travelDetail.plannerSidebar.files')" class="sidebar-card" :bordered="false">
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

  </a-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'
import DiscussionArea from './DiscussionArea.vue'
import TaskList from './TaskList.vue'
import BudgetManager from './BudgetManager.vue'
import MemberManagement from './MemberManagement.vue'
import { 
  DownloadOutlined, 
  PlusOutlined,
  UserAddOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

interface Props {
  travelId?: string
  files?: Array<{ name: string; size: string }>
  members?: Array<{ name: string; role: string }>
}

const props = withDefaults(defineProps<Props>(), {
  travelId: '',
  files: () => [],
  members: () => []
})

// 从 travel 数据获取初始值
const travel = computed(() => {
  if (props.travelId) {
    return travelListStore.getTravel(props.travelId)
  }
  return null
})

// 初始任务列表（从行程内容推断）
const plannerItinerary = computed(() => travelStore.plannerItinerary)

const initialTasks = computed(() => {
  const tasks: Array<{ id: string; title: string; completed: boolean; createdAt: number }> = []
  if (plannerItinerary.value) {
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
  }
  return tasks
})

// 初始预算信息
const initialSpent = computed(() => {
  if (travel.value?.spent !== undefined) {
    return travel.value.spent
  }
  if (plannerItinerary.value?.totalCost) {
    return Math.round(plannerItinerary.value.totalCost * 0.3) // 假设已花费30%
  }
  return 0
})

const initialTotal = computed(() => {
  if (travel.value?.budget !== undefined) {
    return travel.value.budget
  }
  if (plannerItinerary.value?.totalCost) {
    return plannerItinerary.value.totalCost
  }
  return 0
})

// 动态文件列表（默认空，由用户上传/导出后才出现）
const dynamicFiles = computed(() => props.files || [])
</script>

<style scoped>
.sidebar-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}


.file-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>

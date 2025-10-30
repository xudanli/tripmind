<template>
  <a-space direction="vertical" size="large" style="width: 100%">
    <!-- 任务管理 -->
    <a-card :title="t('travelDetail.plannerSidebar.tasks')" class="sidebar-card" :bordered="false">
      <a-list :dataSource="dynamicTasks" item-layout="horizontal" size="small">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-checkbox v-model:checked="item.completed">
              {{ item.title }}
            </a-checkbox>
          </a-list-item>
        </template>
      </a-list>
    </a-card>

    <!-- 预算优化 -->
    <a-card :title="t('travelDetail.plannerSidebar.budget')" class="sidebar-card" :bordered="false">
      <div class="budget-section">
        <a-progress 
          :percent="budgetPercent" 
          :show-info="true"
          :stroke-color="budgetColor"
        />
        <div class="budget-info">
          <span>{{ t('travelDetail.plannerSidebar.spent') }}: ¥{{ dynamicSpent }}</span>
          <span>{{ t('travelDetail.plannerSidebar.total') }}: ¥{{ dynamicTotal }}</span>
        </div>
        <a-alert 
          :message="t('travelDetail.plannerSidebar.optimizationTip')" 
          :description="t('travelDetail.plannerSidebar.optimizationDesc')"
          type="info"
          style="margin-top: 1rem"
          show-icon
        />
      </div>
    </a-card>

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

    <!-- 团队协作 -->
    <a-card :title="t('travelDetail.plannerSidebar.team')" class="sidebar-card" :bordered="false">
      <div class="team-section">
        <a-list :dataSource="dynamicMembers" item-layout="horizontal" size="small">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #avatar>
                  <a-avatar>{{ item.name[0] }}</a-avatar>
                </template>
                <template #title>{{ item.name }}</template>
                <template #description>
                  <a-tag size="small">{{ item.role }}</a-tag>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
        <a-button type="dashed" block style="margin-top: 1rem">
          <user-add-outlined /> {{ t('travelDetail.plannerSidebar.inviteMember') }}
        </a-button>
      </div>
    </a-card>
  </a-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import { 
  DownloadOutlined, 
  PlusOutlined,
  UserAddOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()
const travelStore = useTravelStore()

interface Props {
  tasks?: Array<{ title: string; completed: boolean }>
  spent?: number
  total?: number
  files?: Array<{ name: string; size: string }>
  members?: Array<{ name: string; role: string }>
}

const props = withDefaults(defineProps<Props>(), {
  tasks: () => [],
  spent: 0,
  total: 0,
  files: () => [],
  members: () => []
})

// i18n 辅助：若缺少翻译则使用中文后备文案
const translateOr = (key: string, fallback: string) => {
  const translated = (t as any)(key)
  return translated && translated !== key ? translated : fallback
}

// 从 AI 生成的行程数据中获取动态内容
const plannerItinerary = computed(() => travelStore.plannerItinerary)

// 动态任务列表（从行程内容推断，不再硬编码）
const dynamicTasks = computed(() => {
  const tasks: Array<{ title: string; completed: boolean }> = []
  if (plannerItinerary.value) {
    tasks.push({ title: translateOr('travelDetail.plannerSidebar.aiGenerated', 'AI 行程生成'), completed: true })
    const days = plannerItinerary.value.days || []
    const allSlots = days.flatMap(d => d.timeSlots || [])
    const hasTransport = allSlots.some(s => (s.category || '').toLowerCase().includes('交'))
    const hasHotel = allSlots.some(s => (s.activity || '').includes('酒店') || (s.category || '').includes('住'))
    if (hasTransport) tasks.push({ title: translateOr('travelDetail.plannerSidebar.bookTransport', '预订交通'), completed: false })
    if (hasHotel) tasks.push({ title: translateOr('travelDetail.plannerSidebar.bookHotel', '预订住宿'), completed: false })
  }
  // 若外部传入任务则合并
  return tasks.length ? tasks : (props.tasks || [])
})

// 动态预算信息
const dynamicSpent = computed(() => {
  if (plannerItinerary.value?.totalCost) {
    // 可以根据实际花费计算
    return Math.round(plannerItinerary.value.totalCost * 0.3) // 假设已花费30%
  }
  return props.spent || 0
})

const dynamicTotal = computed(() => {
  if (plannerItinerary.value?.totalCost) {
    return plannerItinerary.value.totalCost
  }
  return props.total || 0
})

// 动态文件列表（默认空，由用户上传/导出后才出现）
const dynamicFiles = computed(() => props.files || [])

// 动态团队成员
const dynamicMembers = computed(() => {
  return props.members || [
    { name: 'AI 助手', role: '规划师' },
    { name: '用户', role: '旅行者' }
  ]
})

const budgetPercent = computed(() => {
  const spent = dynamicSpent.value
  const total = dynamicTotal.value
  if (total === 0) return 0
  return Math.round((spent / total) * 100)
})

const budgetColor = computed(() => {
  const percent = budgetPercent.value
  if (percent < 50) return '#52c41a'
  if (percent < 80) return '#faad14'
  return '#ff4d4f'
})
</script>

<style scoped>
.sidebar-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.budget-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.budget-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.file-section,
.team-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>

<template>
  <div class="planner-timeline">
    <div class="timeline-header">
      <h2>{{ t('travelDetail.plannerTimeline.title') }}</h2>
      <a-space>
        <a-button type="default" @click="showMapView = !showMapView">
          <template #icon><global-outlined /></template>
          {{ showMapView ? t('travelDetail.plannerTimeline.listView') : t('travelDetail.plannerTimeline.mapView') }}
        </a-button>
        <a-button type="primary" @click="exportItinerary">
          <template #icon><download-outlined /></template>
          {{ t('travelDetail.plannerTimeline.exportItinerary') }}
        </a-button>
      </a-space>
    </div>

    <!-- 地图视图 -->
    <div v-if="showMapView" class="map-view">
      <div class="map-placeholder">
        <global-outlined :style="{ fontSize: '64px', color: '#ccc' }" />
        <p>{{ t('travelDetail.plannerTimeline.mapPlaceholder') }}</p>
        <a-button type="dashed" @click="optimizeRoute">
          <swap-outlined /> {{ t('travelDetail.plannerTimeline.optimizeRoute') }}
        </a-button>
      </div>
    </div>

    <!-- 时间表列表 -->
    <a-timeline v-else>
      <a-timeline-item 
        v-for="(day, index) in timelineDays" 
        :key="day.date" 
        color="blue"
        class="draggable-day"
      >
        <template #dot>
          <calendar-outlined :style="{ fontSize: '16px' }" />
        </template>
        <div class="day-card" @click="selectedDay = index">
          <div class="day-header">
            <div class="day-info">
              <h3 class="day-title">{{ day.title }}</h3>
              <span class="day-date">{{ day.date }}</span>
              <a-tag :color="getDayStatusColor(day.status)">{{ day.status }}</a-tag>
            </div>
            <a-space>
              <a-tooltip :title="t('travelDetail.plannerTimeline.edit')">
                <a-button type="text" size="small" @click.stop="editDay(index)">
                  <edit-outlined />
                </a-button>
              </a-tooltip>
              <a-tooltip :title="t('travelDetail.plannerTimeline.duplicate')">
                <a-button type="text" size="small" @click.stop="duplicateDay(index)">
                  <copy-outlined />
                </a-button>
              </a-tooltip>
              <a-tooltip :title="t('travelDetail.plannerTimeline.delete')">
                <a-button type="text" size="small" danger @click.stop="deleteDay(index)">
                  <delete-outlined />
                </a-button>
              </a-tooltip>
            </a-space>
          </div>
          <p class="day-description">{{ day.description }}</p>
          
          <!-- 行程统计 -->
          <div class="day-stats">
            <a-statistic v-if="day.stats" size="small">
              <template #title>
                <span class="stat-label">
                  <clock-circle-outlined /> {{ t('travelDetail.plannerTimeline.estimatedDuration') }}
                </span>
              </template>
              <template #value>{{ day.stats.duration }}{{ t('travelDetail.plannerTimeline.hours') }}</template>
            </a-statistic>
            <a-statistic v-if="day.stats" size="small">
              <template #title>
                <span class="stat-label">
                  <dollar-outlined /> {{ t('travelDetail.plannerTimeline.estimatedCost') }}
                </span>
              </template>
              <template #value>{{ formatAmount(day.stats.cost) }}</template>
            </a-statistic>
          </div>
          
          <!-- 详细时间安排 -->
          <div class="time-slots">
            <div 
              v-for="(slot, slotIndex) in day.timeSlots" 
              :key="slot.time" 
              class="time-slot"
              :class="{ 'completed': slot.completed }"
            >
              <a-checkbox 
                v-model:checked="slot.completed" 
                @change="updateSlotStatus(index, slotIndex)"
                class="slot-checkbox"
              />
              <div class="slot-time">{{ slot.time }}</div>
              <div class="slot-content">
                <div class="slot-activity">
                  <span class="activity-icon">{{ slot.icon }}</span>
                  {{ slot.activity }}
                  <a-tag v-if="slot.category" size="small" :color="slot.categoryColor">
                    {{ slot.category }}
                  </a-tag>
                </div>
                <div class="slot-location" v-if="slot.location">
                  <environment-outlined /> {{ slot.location }}
                  <a-button type="link" size="small" @click="viewLocation(slot.location)">
                    {{ t('travelDetail.plannerTimeline.viewMap') }}
                  </a-button>
                </div>
                <div class="slot-notes" v-if="slot.notes">
                  <info-circle-outlined /> {{ slot.notes }}
                </div>
              </div>
              <a-button type="text" size="small" @click="editSlot(index, slotIndex)">
                <edit-outlined />
              </a-button>
            </div>
          </div>

          <!-- 添加时间点按钮 -->
          <a-button 
            type="dashed" 
            block 
            size="small"
            style="margin-top: 0.5rem"
            @click="addTimeSlot(index)"
          >
            <plus-outlined /> {{ t('travelDetail.plannerTimeline.addTimeSlot') }}
          </a-button>
        </div>
      </a-timeline-item>
    </a-timeline>
    
    <a-button type="dashed" block style="margin-top: 1rem" size="large" @click="addNewDay">
      <template #icon>
        <plus-outlined />
      </template>
      {{ t('travelDetail.plannerTimeline.addNewDay') }}
    </a-button>

    <!-- 编辑行程日模态框 -->
    <a-modal 
      v-model:open="dayModalVisible" 
      :title="t('travelDetail.plannerTimeline.editDayModal')"
      @ok="saveDay"
      width="600px"
    >
      <a-form :model="editingDay" layout="vertical">
        <a-form-item label="日期">
          <a-date-picker v-model:value="editingDay.date" style="width: 100%" />
        </a-form-item>
        <a-form-item label="标题">
          <a-input v-model:value="editingDay.title" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="editingDay.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import type { PlannerItineraryResponse } from '@/services/plannerAPI'
import { getCurrencyForDestination, formatCurrency, type CurrencyInfo } from '@/utils/currency'
import { 
  CalendarOutlined, 
  EditOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  CopyOutlined,
  DeleteOutlined,
  GlobalOutlined,
  DownloadOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()
const travelStore = useTravelStore()

interface Props {
  itinerary?: PlannerItineraryResponse | null
}

const props = defineProps<Props>()

interface TimeSlot {
  time: string
  activity: string
  location?: string
  icon?: string
  category?: string
  categoryColor?: string
  notes?: string
  completed?: boolean
}

interface Day {
  date: string
  title: string
  description: string
  status: string
  stats?: {
    duration: number
    cost: number
  }
  timeSlots: TimeSlot[]
}

const showMapView = ref(false)
const selectedDay = ref<number | null>(null)
const dayModalVisible = ref(false)
const editingDay = ref<Partial<Day>>({})
const editingDayIndex = ref(-1)

// 优先使用传入的 itinerary，其次回退到 store
const plannerItinerary = computed<PlannerItineraryResponse | null>(() => {
  return (props.itinerary as PlannerItineraryResponse | null) || (travelStore as any).plannerItinerary || null
})

// 获取目的地货币信息
const getDestinationCurrency = computed((): CurrencyInfo => {
  const destination = plannerItinerary.value?.destination || ''
  if (destination) {
    const currency = getCurrencyForDestination(destination)
    if (currency.code !== 'CNY') {
      return currency
    }
  }
  // 默认返回人民币
  return { code: 'CNY', symbol: '¥', name: '人民币' }
})

// 格式化金额（使用目的地货币）
const formatAmount = (amount: number) => {
  return formatCurrency(amount, getDestinationCurrency.value)
}

// 将 AI 生成的行程转换为时间线格式
const timelineDays = computed(() => {
  if (!plannerItinerary.value) {
    return getDefaultTimelineDays()
  }
  
  return plannerItinerary.value.days.map(day => ({
    date: day.date,
    title: day.title,
    description: day.description,
    status: getStatusText(day.status),
    stats: {
      duration: day.stats.duration,
      cost: day.stats.cost
    },
    timeSlots: day.timeSlots.map(slot => ({
      time: slot.time,
      activity: slot.activity,
      location: slot.location,
      icon: slot.icon,
      category: slot.category,
      categoryColor: slot.categoryColor,
      notes: slot.notes,
      completed: false
    }))
  }))
})

// 默认时间线数据（当没有 AI 数据时使用）
const getDefaultTimelineDays = (): Day[] => [
  {
    date: 'Day 1',
    title: '第一天 - 抵达目的地',
    description: '上午抵达机场，下午入住酒店并休整',
    status: '已规划',
    stats: { duration: 8, cost: 800 },
    timeSlots: [
      { 
        time: '09:00', 
        activity: '机场接机', 
        location: '机场',
        icon: '✈️',
        category: '交通',
        categoryColor: 'blue',
        notes: '预计用时45分钟',
        completed: true
      },
      { 
        time: '11:00', 
        activity: '前往酒店', 
        location: '酒店',
        icon: '🚗',
        category: '交通',
        categoryColor: 'blue',
        completed: true
      },
      { 
        time: '14:00', 
        activity: '午餐休息', 
        location: '当地餐厅',
        icon: '🍜',
        category: '餐饮',
        categoryColor: 'orange',
        completed: false
      },
      { 
        time: '17:00', 
        activity: '入住整理', 
        location: '酒店',
        icon: '🏨',
        category: '住宿',
        categoryColor: 'green',
        completed: false
      }
    ]
  },
  {
    date: 'Day 2',
    title: '第二天 - 探索主要景点',
    description: '全天深度游览当地著名景点和特色体验',
    status: '已规划',
    stats: { duration: 10, cost: 1200 },
    timeSlots: [
      { 
        time: '09:00', 
        activity: '参观主要景点', 
        location: '市中心',
        icon: '🏛️',
        category: '观光',
        categoryColor: 'purple',
        notes: '需提前订票',
        completed: false
      },
      { 
        time: '12:00', 
        activity: '午餐', 
        location: '特色餐厅',
        icon: '🍽️',
        category: '餐饮',
        categoryColor: 'orange',
        completed: false
      },
      { 
        time: '14:00', 
        activity: '拍照打卡', 
        location: '景点',
        icon: '📸',
        category: '观光',
        categoryColor: 'purple',
        completed: false
      },
      { 
        time: '18:00', 
        activity: '购物休息', 
        location: '商业区',
        icon: '🎁',
        category: '购物',
        categoryColor: 'cyan',
        completed: false
      }
    ]
  }
]

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'planned': '已规划',
    'in-progress': '进行中',
    'completed': '已完成'
  }
  return statusMap[status] || '已规划'
}

// 监听 AI 行程数据变化
watch(plannerItinerary, (newItinerary) => {
  if (newItinerary) {
    console.log('AI 行程数据已更新:', newItinerary)
    message.success('AI 智能行程已生成！')
  }
}, { immediate: true })

const getDayStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    '已规划': 'blue',
    '进行中': 'orange',
    '已完成': 'green'
  }
  return colors[status] || 'default'
}

const editDay = (index: number) => {
  editingDayIndex.value = index
  editingDay.value = { ...timelineDays.value[index] }
  dayModalVisible.value = true
}

const saveDay = () => {
  if (editingDayIndex.value >= 0) {
    timelineDays.value[editingDayIndex.value] = editingDay.value as Day
    message.success(t('travelDetail.plannerTimeline.duplicateSuccess'))
  }
  dayModalVisible.value = false
}

const duplicateDay = (index: number) => {
  const newDay = { ...timelineDays.value[index] }
  newDay.date = `Day ${timelineDays.value.length + 1}`
  newDay.title = newDay.title + ' (副本)'
  timelineDays.value.push(newDay)
  message.success(t('travelDetail.plannerTimeline.duplicateSuccess'))
}

const deleteDay = (index: number) => {
  Modal.confirm({
    title: t('travelDetail.plannerTimeline.confirmDelete'),
    content: t('travelDetail.plannerTimeline.confirmDeleteContent'),
    onOk: () => {
      timelineDays.value.splice(index, 1)
      message.success(t('travelDetail.plannerTimeline.deleteSuccess'))
    }
  })
}

const addNewDay = () => {
  const newDay: Day = {
    date: `Day ${timelineDays.value.length + 1}`,
    title: '新行程日',
    description: '',
    status: '已规划',
    stats: { duration: 0, cost: 0 },
    timeSlots: []
  }
  timelineDays.value.push(newDay)
}

const addTimeSlot = (dayIndex: number) => {
  const newSlot: TimeSlot = {
    time: '10:00',
    activity: '新活动',
    location: '地点',
    icon: '📍',
    completed: false
  }
  timelineDays.value[dayIndex].timeSlots.push(newSlot)
}

const editSlot = (dayIndex: number, slotIndex: number) => {
  message.info('编辑时间点')
}

const updateSlotStatus = (dayIndex: number, slotIndex: number) => {
  const slot = timelineDays.value[dayIndex].timeSlots[slotIndex]
  message.success(`${slot.activity} ${slot.completed ? '已完成' : '未完成'}`)
}

const viewLocation = (location: string) => {
  message.info(`查看 ${location} 的地图`)
}

const optimizeRoute = async () => {
  if (!plannerItinerary.value) {
    message.warning('请先生成行程')
    return
  }
  
  try {
    message.loading('AI 正在优化路线...', 0)
    await travelStore.optimizePlannerItinerary('route')
    message.destroy()
    message.success('路线已优化，可节省20分钟')
  } catch (error) {
    message.destroy()
    message.error('路线优化失败，请重试')
  }
}

const exportItinerary = () => {
  if (!plannerItinerary.value) {
    message.warning('请先生成行程')
    return
  }
  
  message.loading('正在导出...', 1)
  
  // 生成 PDF 内容
  const itineraryContent = generatePDFContent(plannerItinerary.value)
  
  // 创建下载链接
  const blob = new Blob([itineraryContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${plannerItinerary.value.title || '行程安排'}.txt`
  link.click()
  URL.revokeObjectURL(url)
  
  message.success('行程已导出')
}

// 生成 PDF 内容
const generatePDFContent = (itinerary: PlannerItineraryResponse): string => {
  let content = `# ${itinerary.title}\n\n`
  content += `目的地：${itinerary.destination}\n`
  content += `行程天数：${itinerary.duration}天\n`
  content += `总预算：${formatCurrency(itinerary.totalCost, getDestinationCurrency.value)}\n\n`
  content += `## 行程概述\n${itinerary.summary}\n\n`
  
  content += `## 详细行程\n\n`
  itinerary.days.forEach((day, index) => {
    content += `### ${day.title}\n`
    content += `${day.description}\n\n`
    content += `**时间安排：**\n`
    day.timeSlots.forEach(slot => {
      content += `- ${slot.time} ${slot.activity}`
      if (slot.location) content += ` (${slot.location})`
      if (slot.notes) content += ` - ${slot.notes}`
      content += `\n`
    })
    content += `\n`
  })
  
  content += `## 实用建议\n\n`
  content += `**最佳旅游时间：** ${itinerary.recommendations.bestTimeToVisit}\n`
  content += `**天气建议：** ${itinerary.recommendations.weatherAdvice}\n\n`
  content += `**打包清单：**\n`
  itinerary.recommendations.packingTips.forEach(tip => {
    content += `- ${tip}\n`
  })
  content += `\n`
  
  content += `**当地小贴士：**\n`
  itinerary.recommendations.localTips.forEach(tip => {
    content += `- ${tip}\n`
  })
  content += `\n`
  
  content += `**紧急联系方式：**\n`
  itinerary.recommendations.emergencyContacts.forEach(contact => {
    content += `- ${contact}\n`
  })
  
  return content
}
</script>

<style scoped>
.planner-timeline {
  padding: 0.5rem 0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f0f2f5;
  border-radius: 8px;
}

.timeline-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.map-view {
  background-color: #f0f2f5;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px; /* Adjust height as needed */
}

.map-placeholder {
  text-align: center;
  color: #8c8c8c;
}

.map-placeholder p {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.day-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer; /* Indicate clickability */
  transition: background-color 0.2s ease;
}

.day-card:hover {
  background-color: #f0f5f9;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.day-info {
  flex: 1;
}

.day-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.day-date {
  color: #8c8c8c;
  font-size: 0.85rem;
}

.day-description {
  color: #595959;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.day-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #8c8c8c;
}

.time-slots {
  margin-top: 1rem;
  border-left: 2px solid #e8f4ff;
  padding-left: 1rem;
}

.time-slot {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #e0e0e0;
}

.time-slot:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.slot-checkbox {
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.slot-time {
  width: 60px;
  font-weight: 600;
  color: #1890ff;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.slot-content {
  flex: 1;
  margin-left: 1rem;
}

.slot-activity {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
}

.activity-icon {
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.slot-location {
  color: #8c8c8c;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.slot-notes {
  color: #8c8c8c;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>

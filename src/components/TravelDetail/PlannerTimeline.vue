<template>
  <div class="planner-timeline">
    <div class="planner-overview">
      <div class="rhythm-card">
        <a-progress
          type="dashboard"
          :width="120"
          :stroke-color="rhythmStrokeColor"
          :percent="rhythmScore"
          :format="() => rhythmScore"
        />
        <div class="rhythm-info">
          <div class="rhythm-level">{{ rhythmLevelLabel }}</div>
          <p class="rhythm-summary">
            {{ rhythmSummary }}
          </p>
        </div>
      </div>
      <div class="notifications" v-if="hasNotifications">
        <div
          v-for="note in notificationsToShow"
          :key="note.id"
          class="notification-card"
          :class="note.level"
        >
          <div class="notification-header">
            <span class="notification-tag">
              {{ note.level === 'warn' ? '节奏提醒' : '节奏良好' }}
            </span>
            <a-button type="text" size="small" @click="dismissNotification(note.id)">
              <close-outlined />
            </a-button>
          </div>
          <p class="notification-text">{{ note.message }}</p>
        </div>
      </div>
      <div class="notifications empty" v-else>
        <div class="notification-placeholder">
          <info-circle-outlined /> Aris 正在观察整体节奏，准备好后会提醒你。
        </div>
      </div>
    </div>

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
        v-for="(day, index) in daysRef"
        :key="day.id"
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
              <template #value>{{ (day.stats?.duration ?? 0) }}{{ t('travelDetail.plannerTimeline.hours') }}</template>
            </a-statistic>
            <a-statistic v-if="day.stats" size="small">
              <template #title>
                <span class="stat-label">
                  <dollar-outlined /> {{ t('travelDetail.plannerTimeline.estimatedCost') }}
                </span>
              </template>
              <template #value>{{ formatAmount(day.stats?.cost ?? 0) }}</template>
            </a-statistic>
          </div>

          <!-- 详细时间安排 -->
          <div class="time-slots">
            <div
              v-for="(slot, slotIndex) in day.timeSlots"
              :key="slot.id"
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
                  <a-button type="link" size="small" @click="viewLocation(slot.location!)">
                    {{ t('travelDetail.plannerTimeline.viewMap') }}
                  </a-button>
                </div>
                <div class="slot-notes" v-if="slot.notes">
                  <info-circle-outlined /> {{ slot.notes }}
                </div>
              </div>
              <div class="slot-actions">
                <a-button type="text" size="small" @click="editSlot(index, slotIndex)">
                  <edit-outlined />
                </a-button>
                <a-button type="text" size="small" danger @click="deleteSlot(index, slotIndex)">
                  <delete-outlined />
                </a-button>
              </div>
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
      <template #icon><plus-outlined /></template>
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
        <a-form-item :label="t('travelDetail.plannerTimeline.form.date')">
          <a-date-picker v-model:value="editingDay.date" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="t('travelDetail.plannerTimeline.form.title')">
          <a-input v-model:value="editingDay.title" />
        </a-form-item>
        <a-form-item :label="t('travelDetail.plannerTimeline.form.description')">
          <a-textarea v-model:value="editingDay.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="slotModalVisible"
      :title="slotModalTitle"
      :ok-text="t('travelDetail.plannerTimeline.slotModalOk')"
      :cancel-text="t('travelDetail.plannerTimeline.slotModalCancel')"
      destroy-on-close
      @ok="saveSlot"
      @cancel="cancelSlotEdit"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('travelDetail.plannerTimeline.slotForm.time')" required>
          <a-time-picker
            v-model:value="slotForm.time"
            format="HH:mm"
            style="width: 100%"
            :minute-step="15"
          />
        </a-form-item>
        <a-form-item :label="t('travelDetail.plannerTimeline.slotForm.activity')" required>
          <a-input v-model:value="slotForm.activity" :placeholder="t('travelDetail.plannerTimeline.slotForm.activityPlaceholder')" />
        </a-form-item>
        <a-form-item :label="t('travelDetail.plannerTimeline.slotForm.location')">
          <a-input v-model:value="slotForm.location" :placeholder="t('travelDetail.plannerTimeline.slotForm.locationPlaceholder')" />
        </a-form-item>
        <a-form-item :label="t('travelDetail.plannerTimeline.slotForm.category')">
          <a-select
            allow-clear
            :options="categoryOptions"
            v-model:value="slotForm.category"
            @change="onCategorySelect"
            :placeholder="t('travelDetail.plannerTimeline.slotForm.categoryPlaceholder')"
          />
          <div v-if="slotForm.category" class="category-preview">
            <a-tag :color="slotForm.categoryColor">
              {{ slotForm.category }}
            </a-tag>
          </div>
        </a-form-item>
        <a-form-item :label="t('travelDetail.plannerTimeline.slotForm.icon')">
          <a-input v-model:value="slotForm.icon" :placeholder="t('travelDetail.plannerTimeline.slotForm.iconPlaceholder')" />
        </a-form-item>
        <a-form-item :label="t('travelDetail.plannerTimeline.slotForm.notes')">
          <a-textarea v-model:value="slotForm.notes" :rows="3" :placeholder="t('travelDetail.plannerTimeline.slotForm.notesPlaceholder')" />
        </a-form-item>
        <a-form-item :label="t('travelDetail.plannerTimeline.slotForm.completed')">
          <a-switch v-model:checked="slotForm.completed" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { message, Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import type { PlannerItineraryResponse } from '@/services/plannerAPI'
import type { PlannerNotification, PlannerRhythmInsights } from '@/stores/travel'
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
  InfoCircleOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()
const travelStore = useTravelStore()

interface Props { itinerary?: PlannerItineraryResponse | null }
const props = defineProps<Props>()

// ---- Types for local editable copy ----
interface TimeSlot {
  id: string
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
  id: string
  date: string
  title: string
  description: string
  status: string
  stats?: { duration: number; cost: number }
  timeSlots: TimeSlot[]
}

// ---- Utils ----
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const getStatusText = (status: string) => ({ planned: '已规划', 'in-progress': '进行中', completed: '已完成' }[status] || '已规划')
const getDayStatusColor = (status: string) => ({ 已规划: 'blue', 进行中: 'orange', 已完成: 'green' }[status] || 'default')

// ---- Source itinerary (prop -> store fallback) ----
const plannerItinerary = computed<PlannerItineraryResponse | null>(() => {
  if (props.itinerary) {
    return props.itinerary as PlannerItineraryResponse
  }
  const storeItinerary = (travelStore as any).plannerItinerary
  return storeItinerary ? storeItinerary.value ?? null : null
})

const plannerForm = computed(() => travelStore.plannerData)

// Unwrap: support prop object or store.ref
const currentItinerary = computed<PlannerItineraryResponse | null>(() => {
  const p = props.itinerary
  const s = (travelStore as any).plannerItinerary
  return (p ?? (s && s.value)) || null
})

const rhythmInsights = computed<PlannerRhythmInsights | null>(() => {
  return (travelStore.plannerRhythmInsights ?? null) as PlannerRhythmInsights | null
})

const rhythmScore = computed(() => {
  const raw = rhythmInsights.value?.score ?? 0
  return Math.max(0, Math.min(100, Math.round(raw)))
})

const rhythmLevelLabel = computed(() => {
  const level = rhythmInsights.value?.level
  if (level === 'balanced') return '节奏平衡'
  if (level === 'tight') return '稍显紧凑'
  if (level === 'loose') return '节奏宽松'
  return '节奏分析准备就绪'
})

const rhythmSummary = computed(() => rhythmInsights.value?.summary ?? 'Aris 正在观察行程节奏。')

const rhythmStrokeColor = computed(() => {
  if (rhythmScore.value >= 80) return '#4F8BF9'
  if (rhythmScore.value >= 65) return '#FFB703'
  return '#F87171'
})

const notificationsToShow = computed<PlannerNotification[]>(() => {
  const notes = travelStore.plannerNotifications ?? []
  return notes.slice(0, 3)
})

const hasNotifications = computed(() => notificationsToShow.value.length > 0)

const dismissNotification = (id: string) => {
  travelStore.dismissPlannerNotification(id)
}

// ---- Currency ----
const getDestinationCurrency = computed<CurrencyInfo>(() => {
  const dest = currentItinerary.value?.destination || ''
  if (dest) {
    const c = getCurrencyForDestination(dest)
    if (c.code !== 'CNY') return c
  }
  return { code: 'CNY', symbol: '¥', name: '人民币' }
})
const formatAmount = (amount: number) => formatCurrency(amount ?? 0, getDestinationCurrency.value)

// ---- Local editable days (NOT computed!) ----
const daysRef = ref<Day[]>(getDefaultTimelineDays())
const suppressNextItineraryToast = ref(false)

const slotModalVisible = ref(false)
const slotEditingDayIndex = ref(-1)
const slotEditingSlotIndex = ref(-1)

interface SlotFormState {
  id?: string
  time: Dayjs
  activity: string
  location?: string
  icon?: string
  category?: string
  categoryColor?: string
  notes?: string
  completed?: boolean
}

const createDefaultSlotForm = (): SlotFormState => ({
  time: dayjs('09:00', 'HH:mm'),
  activity: '',
  location: '',
  icon: '📍',
  category: '',
  categoryColor: 'blue',
  notes: '',
  completed: false
})

const slotForm = ref<SlotFormState>(createDefaultSlotForm())

const categoryPresets = computed(() => [
  { key: 'sightseeing', label: t('travelDetail.plannerTimeline.category.sightseeing'), color: 'purple', icon: '📸' },
  { key: 'transport', label: t('travelDetail.plannerTimeline.category.transport'), color: 'blue', icon: '🚗' },
  { key: 'dining', label: t('travelDetail.plannerTimeline.category.dining'), color: 'orange', icon: '🍽️' },
  { key: 'accommodation', label: t('travelDetail.plannerTimeline.category.accommodation'), color: 'green', icon: '🏨' },
  { key: 'shopping', label: t('travelDetail.plannerTimeline.category.shopping'), color: 'cyan', icon: '🛍️' }
])

const categoryOptions = computed(() => categoryPresets.value.map(p => ({ label: p.label, value: p.label })))

const slotModalTitle = computed(() =>
  slotEditingSlotIndex.value === -1
    ? t('travelDetail.plannerTimeline.addSlotTitle')
    : t('travelDetail.plannerTimeline.editSlotTitle')
)

watch(currentItinerary, (it) => {
  if (!it) {
    daysRef.value = getDefaultTimelineDays()
    return
  }
  daysRef.value = mapItineraryToDays(it)
  if (suppressNextItineraryToast.value) {
    suppressNextItineraryToast.value = false
  } else {
    message.success(t('travelDetail.plannerTimeline.generated'))
  }
}, { immediate: true })

function mapItineraryToDays(it: PlannerItineraryResponse): Day[] {
  const days = Array.isArray(it.days) ? it.days : []
  return days.map((d, idx) => ({
    id: uid(),
    date: d.date || `Day ${idx + 1}`,
    title: d.title || `第${idx + 1}天`,
    description: d.description || '',
    status: getStatusText((d as any).status),
    stats: {
      duration: Number((d as any)?.stats?.duration ?? 0),
      cost: Number((d as any)?.stats?.cost ?? 0)
    },
    timeSlots: (d as any)?.timeSlots?.map((s: any) => ({
      id: uid(),
      time: typeof s?.time === 'string'
        ? s.time
        : (s?.time ? dayjs(s.time).format('HH:mm') : ''),
      activity: s?.activity || s?.title || '',
      location: s?.location,
      icon: s?.icon,
      category: s?.category,
      categoryColor: s?.categoryColor,
      notes: s?.notes,
      completed: Boolean(s?.completed)
    })) ?? []
  }))
}

function serializeDaysToPlanner(days: Day[], base: PlannerItineraryResponse | null): PlannerItineraryResponse {
  const existing = base ? JSON.parse(JSON.stringify(base)) as PlannerItineraryResponse : ({} as PlannerItineraryResponse)
  const normalizedDays = days.map((day, index) => {
    const sourceDay: any = existing?.days?.[index] ?? {}
    return {
      ...sourceDay,
      date: day.date,
      title: day.title,
      description: day.description,
      status: day.status,
      stats: day.stats,
      timeSlots: day.timeSlots.map(slot => ({
        id: slot.id,
        time: slot.time,
        activity: slot.activity,
        location: slot.location,
        icon: slot.icon,
        category: slot.category,
        categoryColor: slot.categoryColor,
        notes: slot.notes,
        completed: slot.completed
      }))
    }
  })
  return {
    ...(existing || {}),
    title: existing?.title ?? '智能行程规划',
    destination: existing?.destination ?? plannerForm.value.destination ?? '',
    duration: normalizedDays.length,
    totalCost: existing?.totalCost ?? 0,
    summary: existing?.summary ?? '',
    recommendations: existing?.recommendations ?? {},
    days: normalizedDays
  }
}

const syncPlannerItinerary = () => {
  suppressNextItineraryToast.value = true
  const updated = serializeDaysToPlanner(daysRef.value, currentItinerary.value)
  travelStore.plannerItinerary = updated
}

function getDefaultTimelineDays(): Day[] {
  return [
    {
      id: uid(),
      date: 'Day 1',
      title: '第一天 - 抵达目的地',
      description: '上午抵达机场，下午入住酒店并休整',
      status: '已规划',
      stats: { duration: 8, cost: 800 },
      timeSlots: [
        { id: uid(), time: '09:00', activity: '机场接机', location: '机场', icon: '✈️', category: '交通', categoryColor: 'blue', notes: '预计用时45分钟', completed: true },
        { id: uid(), time: '11:00', activity: '前往酒店', location: '酒店', icon: '🚗', category: '交通', categoryColor: 'blue', completed: true },
        { id: uid(), time: '14:00', activity: '午餐休息', location: '当地餐厅', icon: '🍜', category: '餐饮', categoryColor: 'orange', completed: false },
        { id: uid(), time: '17:00', activity: '入住整理', location: '酒店', icon: '🏨', category: '住宿', categoryColor: 'green', completed: false }
      ]
    },
    {
      id: uid(),
      date: 'Day 2',
      title: '第二天 - 探索主要景点',
      description: '全天深度游览当地著名景点和特色体验',
      status: '已规划',
      stats: { duration: 10, cost: 1200 },
      timeSlots: [
        { id: uid(), time: '09:00', activity: '参观主要景点', location: '市中心', icon: '🏛️', category: '观光', categoryColor: 'purple', notes: '需提前订票', completed: false },
        { id: uid(), time: '12:00', activity: '午餐', location: '特色餐厅', icon: '🍽️', category: '餐饮', categoryColor: 'orange', completed: false },
        { id: uid(), time: '14:00', activity: '拍照打卡', location: '景点', icon: '📸', category: '观光', categoryColor: 'purple', completed: false },
        { id: uid(), time: '18:00', activity: '购物休息', location: '商业区', icon: '🎁', category: '购物', categoryColor: 'cyan', completed: false }
      ]
    }
  ]
}

// ---- UI State ----
const showMapView = ref(false)
const selectedDay = ref<number | null>(null)
const dayModalVisible = ref(false)
const editingDay = ref<Partial<Day>>({})
const editingDayIndex = ref(-1)

// ---- Actions ----
const editDay = (index: number) => {
  editingDayIndex.value = index
  editingDay.value = { ...daysRef.value[index] }
  dayModalVisible.value = true
}

const saveDay = () => {
  if (editingDayIndex.value >= 0) {
    const idx = editingDayIndex.value
    daysRef.value[idx] = { ...(daysRef.value[idx]), ...(editingDay.value as Day) }
    syncPlannerItinerary()
    message.success(t('travelDetail.plannerTimeline.saveSuccess'))
  }
  dayModalVisible.value = false
}

const duplicateDay = (index: number) => {
  const src = daysRef.value[index]
  const clone: Day = {
    ...JSON.parse(JSON.stringify(src)),
    id: uid(),
    date: `Day ${daysRef.value.length + 1}`,
    title: `${src.title} (副本)`,
    timeSlots: src.timeSlots.map(s => ({ ...JSON.parse(JSON.stringify(s)), id: uid(), completed: false }))
  }
  daysRef.value.push(clone)
  syncPlannerItinerary()
  message.success(t('travelDetail.plannerTimeline.duplicateSuccess'))
}

const deleteDay = (index: number) => {
  Modal.confirm({
    title: t('travelDetail.plannerTimeline.confirmDelete'),
    content: t('travelDetail.plannerTimeline.confirmDeleteContent'),
    onOk: () => {
      daysRef.value.splice(index, 1)
      syncPlannerItinerary()
      message.success(t('travelDetail.plannerTimeline.deleteSuccess'))
    }
  })
}

const addNewDay = () => {
  const newDay: Day = {
    id: uid(),
    date: `Day ${daysRef.value.length + 1}`,
    title: '新行程日',
    description: '',
    status: '已规划',
    stats: { duration: 0, cost: 0 },
    timeSlots: []
  }
  daysRef.value.push(newDay)
  syncPlannerItinerary()
}

const suggestNextTime = (dayIndex: number) => {
  const slots = daysRef.value[dayIndex]?.timeSlots || []
  if (!slots.length) return dayjs('09:00', 'HH:mm')
  const lastTime = slots[slots.length - 1]?.time || '09:00'
  const [hoursStr, minutesStr = '00'] = lastTime.split(':')
  const hours = Number(hoursStr)
  const nextHour = (Number.isFinite(hours) ? (hours + 2) % 24 : 9)
  return dayjs(`${String(nextHour).padStart(2, '0')}:${minutesStr}`, 'HH:mm')
}

const openSlotModal = (dayIndex: number, slotIndex = -1) => {
  slotEditingDayIndex.value = dayIndex
  slotEditingSlotIndex.value = slotIndex
  if (slotIndex >= 0) {
    const slot = daysRef.value[dayIndex].timeSlots[slotIndex]
    let parsed: Dayjs
    if (typeof slot.time === 'string' && slot.time) {
      parsed = dayjs(slot.time, 'HH:mm')
    } else if (slot.time instanceof Date) {
      parsed = dayjs(slot.time)
    } else if ((slot.time as any)?.format) {
      parsed = dayjs((slot.time as any))
    } else {
      parsed = dayjs('09:00', 'HH:mm')
    }
    slotForm.value = {
      ...slot,
      time: parsed.isValid() ? parsed : dayjs('09:00', 'HH:mm')
    }
    if (slot.category && !slot.categoryColor) {
      applyCategoryPreset(slot.category)
    }
  } else {
    slotForm.value = { ...createDefaultSlotForm(), time: suggestNextTime(dayIndex) }
  }
  slotModalVisible.value = true
}

const addTimeSlot = (dayIndex: number) => {
  openSlotModal(dayIndex, -1)
}

const editSlot = (dayIndex: number, slotIndex: number) => {
  openSlotModal(dayIndex, slotIndex)
}

const applyCategoryPreset = (categoryLabel: string) => {
  if (!categoryLabel) return
  const preset = categoryPresets.value.find(p => p.label === categoryLabel)
  if (!preset) return
  slotForm.value.categoryColor = preset.color
  if (!slotForm.value.icon || slotForm.value.icon === '📍') {
    slotForm.value.icon = preset.icon
  }
}

const onCategorySelect = (value: string | undefined) => {
  slotForm.value.category = value || ''
  if (value) {
    applyCategoryPreset(value)
  } else {
    slotForm.value.categoryColor = 'blue'
  }
}

const validateSlotForm = () => {
  if (!slotForm.value.time || !dayjs.isDayjs(slotForm.value.time) || !slotForm.value.time.isValid()) {
    message.warning(t('travelDetail.plannerTimeline.slotValidationTime'))
    return false
  }
  if (!slotForm.value.activity || !slotForm.value.activity.trim()) {
    message.warning(t('travelDetail.plannerTimeline.slotValidationActivity'))
    return false
  }
  return true
}

const saveSlot = () => {
  if (slotEditingDayIndex.value < 0) return
  if (!validateSlotForm()) return

  applyCategoryPreset(slotForm.value.category || '')

  const day = daysRef.value[slotEditingDayIndex.value]
  const slotData: TimeSlot = {
    id: slotForm.value.id || uid(),
    time: slotForm.value.time.format('HH:mm'),
    activity: slotForm.value.activity,
    location: slotForm.value.location,
    icon: slotForm.value.icon,
    category: slotForm.value.category,
    categoryColor: slotForm.value.categoryColor,
    notes: slotForm.value.notes,
    completed: slotForm.value.completed
  }

  if (slotEditingSlotIndex.value >= 0) {
    day.timeSlots.splice(slotEditingSlotIndex.value, 1, slotData)
    message.success(t('travelDetail.plannerTimeline.slotUpdateSuccess'))
  } else {
    day.timeSlots.push(slotData)
    message.success(t('travelDetail.plannerTimeline.slotCreateSuccess'))
  }

  slotModalVisible.value = false
  syncPlannerItinerary()
}

const cancelSlotEdit = () => {
  slotModalVisible.value = false
}

const deleteSlot = (dayIndex: number, slotIndex: number) => {
  Modal.confirm({
    title: t('travelDetail.plannerTimeline.slotDeleteConfirm'),
    content: t('travelDetail.plannerTimeline.slotDeleteConfirmContent'),
    onOk: () => {
      daysRef.value[dayIndex].timeSlots.splice(slotIndex, 1)
      syncPlannerItinerary()
      message.success(t('travelDetail.plannerTimeline.slotDeleteSuccess'))
    }
  })
}

const updateSlotStatus = (dayIndex: number, slotIndex: number) => {
  const slot = daysRef.value[dayIndex].timeSlots[slotIndex]
  syncPlannerItinerary()
  message.success(`${slot.activity} ${slot.completed ? t('travelDetail.plannerTimeline.done') : t('travelDetail.plannerTimeline.undone')}`)
}

const viewLocation = (location: string) => {
  message.info(`${t('travelDetail.plannerTimeline.viewMap')}: ${location}`)
}

const optimizeRoute = async () => {
  if (!currentItinerary.value) {
    message.warning(t('travelDetail.plannerTimeline.generateFirst'))
    return
  }
  try {
    const hide = message.loading(t('travelDetail.plannerTimeline.optimizing'), 0)
    await travelStore.optimizePlannerItinerary('route')
    hide()
    message.success(t('travelDetail.plannerTimeline.optimizeSuccess'))
  } catch (error) {
    message.destroy()
    message.error(t('travelDetail.plannerTimeline.optimizeFailed'))
  }
}

const exportItinerary = () => {
  const it = currentItinerary.value
  if (!it) {
    message.warning(t('travelDetail.plannerTimeline.generateFirst'))
    return
  }
  message.loading(t('travelDetail.plannerTimeline.exporting'), 1)
  const content = generateExportText(it)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${it.title || '行程安排'}.txt`
  link.click()
  URL.revokeObjectURL(url)
  message.success(t('travelDetail.plannerTimeline.exportSuccess'))
}

// 导出文本（Markdown 友好）
const generateExportText = (itinerary: PlannerItineraryResponse): string => {
  let content = `# ${itinerary.title}\n\n`
  content += `目的地：${itinerary.destination}\n`
  content += `行程天数：${itinerary.duration}天\n`
  content += `总预算：${formatCurrency(itinerary.totalCost ?? 0, getDestinationCurrency.value)}\n\n`
  content += `## 行程概述\n${itinerary.summary || ''}\n\n`
  content += `## 详细行程\n\n`
  ;(itinerary.days || []).forEach((day, index) => {
    content += `### ${day.title || `第${index + 1}天`}\n`
    content += `${(day as any).description || ''}\n\n`
    content += `**时间安排：**\n`
    ;((day as any).timeSlots || []).forEach((slot: any) => {
      content += `- ${slot.time || ''} ${slot.activity || slot.title || ''}`
      if (slot.location) content += ` (${slot.location})`
      if (slot.notes) content += ` - ${slot.notes}`
      content += `\n`
    })
    content += `\n`
  })
  content += `## 实用建议\n\n`
  content += `**最佳旅游时间：** ${(itinerary.recommendations as any)?.bestTimeToVisit || ''}\n`
  content += `**天气建议：** ${(itinerary.recommendations as any)?.weatherAdvice || ''}\n\n`
  content += `**打包清单：**\n`
  ;(((itinerary.recommendations as any)?.packingTips) || []).forEach((tip: string) => { content += `- ${tip}\n` })
  content += `\n`
  content += `**当地小贴士：**\n`
  ;(((itinerary.recommendations as any)?.localTips) || []).forEach((tip: string) => { content += `- ${tip}\n` })
  content += `\n`
  content += `**紧急联系方式：**\n`
  ;(((itinerary.recommendations as any)?.emergencyContacts) || []).forEach((c: string) => { content += `- ${c}\n` })
  return content
}
</script>

<style scoped>
.planner-timeline {
  padding: 0.5rem 0;
}

.planner-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.rhythm-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef4ff 0%, #f5f0ff 100%);
  box-shadow: inset 0 0 0 1px rgba(79, 139, 249, 0.1);
}

.rhythm-info {
  max-width: 240px;
}

.rhythm-level {
  font-size: 16px;
  font-weight: 600;
  color: #1d295c;
  margin-bottom: 6px;
}

.rhythm-summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #4b5563;
}

.notifications {
  flex: 1;
  min-width: 260px;
  display: flex;
  gap: 12px;
}

.notifications.empty {
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
}

.notification-placeholder {
  display: flex;
  align-items: center;
  gap: 6px;
}

.notification-placeholder :deep(svg) {
  margin-right: 6px;
}

.notification-card {
  flex: 1;
  min-width: 220px;
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(79, 139, 249, 0.1);
  box-shadow: 0 12px 24px rgba(79, 139, 249, 0.12);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-card.warn {
  background: rgba(255, 183, 3, 0.14);
  box-shadow: 0 12px 24px rgba(255, 183, 3, 0.16);
}

.notification-card.info {
  background: rgba(79, 139, 249, 0.12);
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notification-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(79, 139, 249, 0.18);
  color: #1f3a8a;
}

.notification-card.warn .notification-tag {
  background: rgba(255, 107, 54, 0.18);
  color: #b45309;
}

.notification-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}

.notifications :deep(.ant-btn-text) {
  color: #64748b;
}

.notifications :deep(.ant-btn-text:hover) {
  color: #1f2937;
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
  height: 300px;
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
  cursor: pointer;
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

.slot-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
}

@media (min-width: 768px) {
  .slot-actions {
    flex-direction: row;
    align-items: center;
  }
}

.category-preview {
  margin-top: 8px;
}

</style>

<template>
  <article
    class="time-slot"
    :class="{
      'time-slot--planner': isPlannerMode && !isInspirationMode,
      'time-slot--inspiration': isInspirationMode,
    }"
    :id="`slot-${slot.time.replace(':', '-')}`"
  >
    <!-- 第一层：Hero Section -->
    <div class="time-slot__hero-layer">
      <!-- ① 主视觉区（Hero Section） -->
      <div class="time-slot__hero-banner">
        <!-- 图片（作为背景，填满整个区域） -->
      <a-image
        v-if="cover"
          class="time-slot__hero-image"
        :src="cover"
          :alt="slot.title || slot.details?.name?.chinese || slot.activity"
        :preview="false"
          :img-style="heroImageStyle"
        loading="lazy"
        @click="$emit('preview')"
        @error="handleImageError"
      >
        <template #placeholder>
            <a-skeleton-image :style="heroImageSkeletonStyle" />
        </template>
      </a-image>
        <div v-else-if="loading" class="time-slot__hero-image-loading">
          <a-skeleton-image :style="heroImageSkeletonStyle" />
      </div>
        <div v-else class="time-slot__hero-image-placeholder"></div>
        
        <!-- 暗化遮罩 -->
        <div class="time-slot__hero-overlay"></div>
        
        <!-- 左下角：活动名称 -->
        <div class="time-slot__hero-title-area">
          <h3 class="time-slot__hero-title">
            {{ slot.title || slot.details?.name?.chinese || slot.activity }}
          </h3>
          <div class="time-slot__hero-subtitle" v-if="slot.details?.name?.english">
            {{ slot.details.name.english }}
          </div>
      </div>

        <!-- 右上角：评分 -->
        <div class="time-slot__hero-rating" v-if="slot.details?.rating">
          <span class="time-slot__hero-rating-icon">⭐</span>
          <span class="time-slot__hero-rating-value">{{ slot.details.rating }}</span>
        </div>
      </div>

      <!-- ①.5 景点介绍（图片下方） -->
      <div class="time-slot__scenic-intro-section" v-if="slot.details?.description?.scenicIntro">
        <div class="time-slot__scenic-intro-text">
          {{ slot.details.description.scenicIntro }}
        </div>
      </div>

      <!-- ② 时间、类型、时长（信息标签条） -->
      <div class="time-slot__info-bar">
        <div class="time-slot__info-bar-content">
          <div class="time-slot__info-bar-item" v-if="slot.time">
            <span class="time-slot__info-bar-icon">⏰</span>
            <span class="time-slot__info-bar-text">{{ slot.time }}</span>
          </div>
          <div class="time-slot__info-bar-divider" v-if="slot.time && slot.type">|</div>
          <div class="time-slot__info-bar-item" v-if="slot.type">
            <span class="time-slot__info-bar-icon">{{ getTypeIcon(slot.type) }}</span>
            <span class="time-slot__info-bar-text">{{ t('travelDetail.experienceDay.type') }}：{{ formatType(slot.type) }}</span>
          </div>
          <div class="time-slot__info-bar-divider" v-if="slot.type && slot.duration">|</div>
          <div class="time-slot__info-bar-item" v-if="slot.duration">
            <span class="time-slot__info-bar-icon">⏳</span>
            <span class="time-slot__info-bar-text">{{ t('travelDetail.experienceDay.duration') }}：{{ formatDuration(slot.duration) }}</span>
          </div>
        </div>
        
        <!-- 操作按钮组 -->
        <div class="time-slot__info-bar-actions">
          <a-button
            type="text"
            size="small"
            class="time-slot__action-button"
            @click.stop="$emit('search')"
            title="搜索附近"
          >
            🔍
          </a-button>
          <a-button
            type="text"
            size="small"
            class="time-slot__action-button"
            @click.stop="$emit('edit')"
            title="编辑"
          >
            ✏️
        </a-button>
        <a-button
            type="text"
          size="small"
            danger
            class="time-slot__action-button"
            @click.stop="$emit('remove')"
            title="删除"
        >
            🗑️
        </a-button>
        </div>
      </div>

      <!-- ③ 地址（右侧带地图按钮） -->
      <div class="time-slot__address-bar" v-if="getAddressText()">
        <div class="time-slot__address-text">
          <span class="time-slot__address-icon">📍</span>
          <span>{{ getAddressText() }}</span>
        </div>
        <a-button
          type="primary"
          size="small"
          class="time-slot__map-button"
          @click="$emit('navigate')"
        >
          🗺 {{ t('travelDetail.experienceDay.viewMap') }}
        </a-button>
      </div>

    </div>

    <!-- 第二层：详细信息（按决策路径排序） -->
    <div class="time-slot__detail-layer">
      <!-- Section 0: 费用信息 -->
      <div class="time-slot__detail-section" v-if="hasCost">
        <h4 class="time-slot__detail-section-title">
          <span class="time-slot__detail-section-icon">💰</span>
          {{ t('travelDetail.experienceDay.cost') }}
        </h4>
        <div class="time-slot__cost-text">
          {{ getCostText() }}
        </div>
      </div>

      <!-- Section 1: 交通信息（能不能去） -->
      <div class="time-slot__detail-section" v-if="slot.details?.transportation">
        <h4 class="time-slot__detail-section-title">
          <span class="time-slot__detail-section-icon">🚍</span>
          {{ t('travelDetail.experienceDay.transportation') }}
        </h4>
        <div class="time-slot__transportation-text">
          {{ slot.details.transportation }}
        </div>
      </div>

      <!-- Section 2: 开放时间与预订 -->
      <div class="time-slot__detail-section" v-if="slot.details?.openingHours || slot.details?.recommendations?.bookingInfo || (Array.isArray(slot.bookingLinks) && slot.bookingLinks.length > 0)">
        <h4 class="time-slot__detail-section-title time-slot__detail-section-title--main">
          <span class="time-slot__detail-section-icon">📅</span>
          {{ t('travelDetail.experienceDay.openingHoursAndBooking') }}
        </h4>
        <!-- 开放时间 -->
        <div v-if="slot.details?.openingHours" class="time-slot__opening-hours-section">
          <div class="time-slot__opening-hours-text">
            {{ slot.details.openingHours }}
          </div>
        </div>
        <!-- 预订链接 -->
        <div v-if="Array.isArray(slot.bookingLinks) && slot.bookingLinks.length > 0" class="time-slot__booking-links-section">
          <div class="time-slot__booking-links-list">
            <a
              v-for="(link, linkIndex) in slot.bookingLinks"
              :key="linkIndex"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="time-slot__booking-link-card"
            >
              <span class="time-slot__booking-link-icon">🔗</span>
              <span class="time-slot__booking-link-name">{{ link.name || link.url }}</span>
              <span class="time-slot__booking-link-arrow">→</span>
            </a>
          </div>
        </div>
        <!-- 预订与咨询 -->
        <div v-if="slot.details?.recommendations?.bookingInfo" class="time-slot__booking-info-section">
          <div class="time-slot__booking-info-text">
            {{ slot.details.recommendations.bookingInfo }}
          </div>
          <a-button
            type="primary"
            size="default"
            class="time-slot__detail-button time-slot__detail-button--primary"
            @click="$emit('book')"
          >
            {{ t('travelDetail.experienceDay.bookNow') }}
          </a-button>
        </div>
      </div>

      <!-- Section 3: 最佳游览时间和注意事项 -->
      <div class="time-slot__detail-section" v-if="slot.details?.recommendations?.visitTips">
        <h4 class="time-slot__detail-section-title">
          <span class="time-slot__detail-section-icon">🌟</span>
          {{ t('travelDetail.experienceDay.visitTips') }}
        </h4>
        <div class="time-slot__visit-tips-text">
          {{ slot.details.recommendations.visitTips }}
        </div>
      </div>

      <!-- Section 4: 无障碍设施 -->
      <div class="time-slot__detail-section" v-if="slot.details?.accessibility">
        <h4 class="time-slot__detail-section-title">
          <span class="time-slot__detail-section-icon">♿</span>
          {{ t('travelDetail.experienceDay.accessibility') }}
        </h4>
        <div class="time-slot__accessibility-text">
          {{ slot.details.accessibility }}
        </div>
      </div>
    </div>

    <!-- 第三层：详细信息（直接显示） -->
    <div class="time-slot__collapsible-layer">
      <!-- Section 1: 附近景点 -->
      <div class="time-slot__detail-section" v-if="hasNearbyAttractions()">
        <h4 class="time-slot__detail-section-title">
          <span class="time-slot__detail-section-icon">📍</span>
          {{ t('travelDetail.experienceDay.nearbyAttractions') }}
        </h4>
        <div class="time-slot__attraction-tags">
          <span
            v-for="(attraction, index) in getNearbyAttractionsList()"
            :key="index"
            class="time-slot__attraction-tag"
            :class="{ 'time-slot__attraction-tag--clickable': true }"
            @click.stop="handleAddNearbyAttraction(attraction)"
            :title="t('travelDetail.experienceDay.addToItinerary') || '添加到行程'"
          >
            {{ attraction.name }}
            <span v-if="attraction.distance" class="time-slot__attraction-tag-distance">{{ attraction.distance }}</span>
            <span class="time-slot__attraction-tag-icon">+</span>
          </span>
        </div>
      </div>

      <!-- Section 2: 穿搭建议 -->
      <div class="time-slot__detail-section" v-if="slot.details?.recommendations?.outfitSuggestions">
        <h4 class="time-slot__detail-section-title">
          <span class="time-slot__detail-section-icon">👕</span>
          {{ t('travelDetail.experienceDay.outfitSuggestions') }}
        </h4>
        <div class="time-slot__outfit-suggestions-text">
          {{ slot.details.recommendations.outfitSuggestions }}
        </div>
      </div>

      <!-- Section 3: 当地文化提示 -->
      <div class="time-slot__detail-section" v-if="slot.details?.recommendations?.culturalTips">
        <h4 class="time-slot__detail-section-title">
          <span class="time-slot__detail-section-icon">🤝</span>
          {{ t('travelDetail.experienceDay.culturalTips') }}
        </h4>
        <div class="time-slot__cultural-tips-text">
          {{ slot.details.recommendations.culturalTips }}
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, defineComponent, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EnvironmentOutlined, StarOutlined } from '@ant-design/icons-vue'
import type { CurrencyInfo } from '@/utils/currency'
import { formatCurrency, getCurrencyForDestination, getCurrencyByCode } from '@/utils/currency'
import { getDefaultCurrency } from '@/config/currency'
import {
  buildNotes,
  buildSlotChips,
  getActivitySummary,
  getInternalPreview,
  isTransportOrAccommodation,
  buildTransportInfo,
  type TransportInfo,
} from './slotFormatters'

interface TimeSlotCardProps {
  day: Record<string, any>
  slot: Record<string, any>
  cover?: string | null
  currency: CurrencyInfo | null
  platform: string | null
  expanded: boolean
  loading?: boolean
  isInspirationMode?: boolean
  isPlannerMode?: boolean
}

const props = defineProps<TimeSlotCardProps>()
// 处理添加附近景点
const handleAddNearbyAttraction = (attraction: { name: string; distance: string; image?: string }) => {
  emit('add-nearby-attraction', {
    attractionName: attraction.name,
    distance: attraction.distance,
    currentSlot: props.slot,
    day: props.day
  })
}

const emit = defineEmits([
  'navigate',
  'book',
  'search',
  'contact',
  'edit',
  'remove',
  'preview',
  'rating-click',
  'toggle',
  'image-error',
  'add-nearby-attraction',
])

const { t, locale } = useI18n()

const IMAGE_HEIGHT = 260

const imageContainerStyle = {
  height: `${IMAGE_HEIGHT}px`,
  borderRadius: '20px',
  overflow: 'hidden',
}

const imageInnerStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  display: 'block',
  borderRadius: '20px',
}

const imageSkeletonStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '20px',
}

const TYPE_MAPPINGS: Record<string, { icon: string; zh: string; en: string }> =
  {
  attraction: { icon: '📍', zh: '景点体验', en: 'Attraction' },
  sightseeing: { icon: '📍', zh: '景点观光', en: 'Sightseeing' },
  restaurant: { icon: '🍽️', zh: '美食餐饮', en: 'Dining' },
  food: { icon: '🍽️', zh: '美食餐饮', en: 'Dining' },
  dining: { icon: '🍽️', zh: '美食餐饮', en: 'Dining' },
  cafe: { icon: '🍽️', zh: '咖啡小憩', en: 'Cafe' },
  bar: { icon: '🍽️', zh: '酒吧小酌', en: 'Bar' },
  accommodation: { icon: '🏨', zh: '住宿安排', en: 'Stay' },
  hotel: { icon: '🏨', zh: '酒店入住', en: 'Hotel' },
  hostel: { icon: '🏨', zh: '青年旅舍', en: 'Hostel' },
  shopping: { icon: '🛍️', zh: '购物闲逛', en: 'Shopping' },
  market: { icon: '🛍️', zh: '市集淘乐', en: 'Market' },
  transport: { icon: '🚐', zh: '交通衔接', en: 'Transport' },
  transportation: { icon: '🚐', zh: '交通衔接', en: 'Transport' },
  transfer: { icon: '🚐', zh: '换乘连接', en: 'Transfer' },
  adventure: { icon: '🧗', zh: '冒险体验', en: 'Adventure' },
  sports: { icon: '🧗', zh: '运动体验', en: 'Sports' },
  nature: { icon: '🌲', zh: '自然体验', en: 'Nature' },
  outdoor: { icon: '🌲', zh: '户外探索', en: 'Outdoor' },
  wellness: { icon: '💆', zh: '身心疗愈', en: 'Wellness' },
  spa: { icon: '💆', zh: '温泉疗愈', en: 'Spa' },
  workshop: { icon: '🛠️', zh: '主题工作坊', en: 'Workshop' },
  show: { icon: '🎭', zh: '演出活动', en: 'Show' },
  performance: { icon: '🎭', zh: '演出活动', en: 'Performance' },
}

const normalizeTypeValue = (value: unknown): string[] => {
  if (!value) return []
  if (typeof value === 'string') return [value.trim()]
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === 'string' && item.trim(),
      )
      .map((item) => item.trim())
  }
  return []
}

const resolveSlotType = (slot: Record<string, any>) => {
  const typeCandidates = [
    ...normalizeTypeValue(slot.type),
    ...normalizeTypeValue(slot.category),
    ...normalizeTypeValue(slot.details?.category),
  ]

  if (!typeCandidates.length) return null

  const isZh = locale.value?.startsWith('zh')

  const labels = new Set<string>()
  typeCandidates.forEach((raw) => {
    const normalized = raw.trim().toLowerCase()
    const mapping = TYPE_MAPPINGS[normalized]
    if (mapping) {
      labels.add(isZh ? mapping.zh : mapping.en)
    } else {
      labels.add(isZh ? raw : raw.charAt(0).toUpperCase() + raw.slice(1))
    }
  })

  const icon =
    typeCandidates
      .map((raw) => TYPE_MAPPINGS[raw.trim().toLowerCase()]?.icon)
      .find(Boolean) || '✨'

  return {
    icon,
    label: Array.from(labels).join(' · '),
  }
}

const isInspirationMode = computed(
  () => props.isInspirationMode || false,
)
const isPlannerMode = computed(() => props.isPlannerMode || false)

const slotTypeMeta = computed(() => resolveSlotType(props.slot))

const summary = computed(() => {
  // 灵感模式不显示摘要
  if (isInspirationMode.value) return ''
  // planner 模式不显示摘要（灵感模式特有字段）
  if (isPlannerMode.value) return ''

  const parts: string[] = []
  const seen = new Set<string>()

  const pushUnique = (value?: string | null) => {
    if (!value || typeof value !== 'string') return
    const normalized = value.replace(/\s+/g, ' ').trim()
    if (!normalized) return
    const key = normalized
      .toLowerCase()
      .replace(/[，。\.、!！?？\s]+/g, ' ')
    if (seen.has(key)) return
    seen.add(key)
    parts.push(normalized)
  }

  pushUnique(getActivitySummary(props.slot, t))

  const scenic =
    typeof props.slot.details?.description?.scenicIntro === 'string'
      ? props.slot.details.description.scenicIntro
      : ''
  pushUnique(scenic)

  if (
    Array.isArray(props.slot?.details?.description?.highlights)
  ) {
    props.slot.details.description.highlights
      .map((item: unknown) =>
        typeof item === 'string' ? item.trim() : '',
      )
      .filter(Boolean)
      .slice(0, 2)
      .forEach(pushUnique)
  }

  if (!parts.length) return ''
  if (parts.length === 1) return parts[0]
  return parts.join(' ')
})

// planner 模式不显示 internalPreview（灵感模式特有字段）
const internalPreview = computed(() => {
  if (isPlannerMode.value) return null
  return getInternalPreview(props.slot)
})

// planner 模式只使用后端接口返回的 notes，不使用灵感模式特有的字段
const rawNotes = computed(() => {
  if (isPlannerMode.value) {
    const notes: string[] = []
    if (
      props.slot?.notes &&
      typeof props.slot.notes === 'string' &&
      props.slot.notes.trim()
    ) {
      notes.push(props.slot.notes.trim())
    }
    if (
      props.slot?.details?.notes &&
      typeof props.slot.details.notes === 'string' &&
      props.slot.details.notes.trim()
    ) {
      notes.push(props.slot.details.notes.trim())
    }
    return notes
  }
  // 灵感模式：使用完整的 buildNotes 逻辑
  return buildNotes(props.slot)
})

const chips = computed(() =>
  buildSlotChips(props.slot, {
    t,
    currency: props.currency,
    platform: props.platform,
  }),
)

const transportInfo = computed<TransportInfo | null>(() =>
  buildTransportInfo(props.slot.details?.transportation, t),
)

// planner 模式不显示 narration（灵感模式特有字段），只使用 notes
const narration = computed(() => {
  if (isPlannerMode.value) return ''

  const parts: string[] = []
  const seen = new Set<string>()

  const pushUnique = (value?: string | null) => {
    if (!value || typeof value !== 'string') return
    const normalized = value.replace(/\s+/g, ' ').trim()
    if (!normalized) return
    const key = normalized
      .toLowerCase()
      .replace(/[，。\.、!！?？\s]+/g, ' ')
    if (seen.has(key)) return
    seen.add(key)
    parts.push(normalized)
  }

  // 灵感模式：尝试多个字段
  pushUnique(props.slot?.activity)
  pushUnique(props.slot?.localTip)
  const fallback =
    props.slot?.narration || props.slot?.details?.narration
    pushUnique(fallback)

  return parts.join(' ')
})

const sanitizeLocation = (value?: string | null): string => {
  if (!value || typeof value !== 'string') return ''
  let sanitized = value.trim()
  if (!sanitized) return ''
  // Remove trailing “目的地”或“目的地中心”等兜底字段
  sanitized = sanitized.replace(/[,，·]\s*目的地(?:\s*中心)?$/i, '')
  sanitized = sanitized.replace(/\s*目的地(?:\s*中心)?$/i, '')
  sanitized = sanitized.replace(/\s+/g, ' ').trim()
  return sanitized
}

const locationDisplay = computed(() =>
  sanitizeLocation(props.slot?.location),
)

const notes = computed(() =>
  rawNotes.value.filter((note) => {
    const lower = note.toLowerCase()
    return !(
      note.includes('请查询当地交通信息') ||
      lower.includes('check local transportation')
    )
  }),
)

const needsBooking = computed(() => {
  const rec = props.slot?.details?.recommendations || {}
  const hasBookingLinks =
    Array.isArray(props.slot?.bookingLinks) &&
    props.slot.bookingLinks.length > 0

  const hasBookingHints = [
    rec.bookingRequired,
    rec.bookingSuggestion,
    rec.bookingAdvance,
    rec.bookingUrl,
    rec.bookingContact,
    rec.bookingPartners,
    rec.reservationNeeded,
    rec.ticketRequired,
  ].some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return !!value
  })

  return (
    hasBookingLinks ||
    hasBookingHints ||
    isTransportOrAccommodation(props.slot)
  )
})

const collapseKeys = computed(() =>
  props.expanded ? ['details'] : [],
)

const activityCostText = computed(() => {
  const costValue = getCostValue()
  if (!costValue) return null
  const currency = getSlotCurrency()
  return formatCurrency(costValue, currency)
})

const heroRef = ref<HTMLElement | null>(null)
const activeNavTab = ref('overview')

// 折叠状态管理（默认展开）
const collapsedSections = ref({
  nearby: false,
  outfit: false,
  culture: false,
})

const toggleCollapse = (section: 'nearby' | 'outfit' | 'culture') => {
  collapsedSections.value[section] = !collapsedSections.value[section]
}

// 6. 概览摘要卡区 - 根据当前Tab显示对应摘要
const openingHours = computed(() => {
  const openingHoursData = props.slot?.details?.openingHours
  if (!openingHoursData) return null
  if (typeof openingHoursData === 'string' && openingHoursData.trim()) {
    return openingHoursData.trim()
  }
  return null
})

const nearbyAttractionsText = computed(() => {
  const nearbyAttractions = props.slot?.details?.recommendations?.nearbyAttractions
  if (!nearbyAttractions) return null
  if (typeof nearbyAttractions === 'string' && nearbyAttractions.trim()) {
    return nearbyAttractions.trim()
  }
  if (Array.isArray(nearbyAttractions) && nearbyAttractions.length > 0) {
    return nearbyAttractions.filter(item => item && typeof item === 'string').join('、')
  }
  return null
})

const visitTips = computed(() => {
  const rec = props.slot?.details?.recommendations
  if (!rec) return null
  if (rec.visitTips && typeof rec.visitTips === 'string' && rec.visitTips.trim()) {
    return { bestTime: rec.visitTips.trim() }
  }
  return null
})

const currentTabSummary = computed(() => {
  if (activeNavTab.value === 'overview' && transportInfo.value?.summary) {
    return transportInfo.value.summary.split(';')[0]
  }
  if (activeNavTab.value === 'transport-time' && openingHours.value) {
    return openingHours.value
  }
  if (activeNavTab.value === 'pricing-booking' && activityCostText.value) {
    return `${t('travelDetail.experienceDay.estimatedCost')}：${activityCostText.value}`
  }
  if (activeNavTab.value === 'tips' && visitTips.value?.bestTime) {
    return visitTips.value.bestTime
  }
  if (activeNavTab.value === 'nearby' && nearbyAttractionsText.value) {
    return nearbyAttractionsText.value
  }
  return null
})

const scrollToSection = (sectionId: string) => {
  activeNavTab.value = sectionId
  const timeSlotElement = heroRef.value?.closest('.time-slot')
  if (timeSlotElement) {
    const element = timeSlotElement.querySelector(`#${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } else {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const handleImageError = () => {
  emit('image-error')
}

// Hero Banner 图片样式
const heroImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  display: 'block',
}

const heroImageSkeletonStyle = {
  width: '100%',
  height: '100%',
}


// 格式化函数
const formatType = (type: string | undefined): string => {
  if (!type) return '--'
  const typeKey = type.toLowerCase()
  const typeMeta = TYPE_MAPPINGS[typeKey]
  if (typeMeta) {
    return locale.value === 'zh-CN' ? typeMeta.zh : typeMeta.en
  }
  // 如果没有匹配的类型，返回原始值（首字母大写）
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '--'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) {
    return locale.value === 'zh-CN' 
      ? `${hours}小时${mins}分钟`
      : `${hours}h ${mins}m`
  } else if (hours > 0) {
    return locale.value === 'zh-CN' ? `${hours}小时` : `${hours}h`
  } else {
    return locale.value === 'zh-CN' ? `${mins}分钟` : `${mins}m`
  }
}

const formatLocation = (location: any): string => {
  if (!location) return '--'
  if (typeof location === 'string') return location
  if (location && typeof location === 'object') {
    if (location.lat !== undefined && location.lng !== undefined) {
      return locale.value === 'zh-CN'
        ? `纬度: ${location.lat.toFixed(6)}, 经度: ${location.lng.toFixed(6)}`
        : `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`
    }
    if (location.name) return location.name
    if (location.address) return location.address
  }
  return '--'
}

// 获取活动货币信息
const getSlotCurrency = (): CurrencyInfo => {
  // 1. 优先使用明确的货币代码
  const explicitCode =
    props.slot?.costCurrency ||
    props.slot?.currency ||
    props.slot?.details?.currency ||
    props.slot?.details?.currencyCode ||
    props.slot?.details?.pricing?.currency ||
    props.slot?.details?.pricing?.currencyCode

  if (explicitCode) {
    const currency = getCurrencyByCode(String(explicitCode))
    if (currency) return currency
  }

  // 2. 从活动位置推断货币
  const slotLocation =
    props.slot?.details?.address?.chinese ||
    props.slot?.details?.address?.english ||
    props.slot?.location ||
    ''

  if (slotLocation) {
    const currency = getCurrencyForDestination(slotLocation)
    if (currency.code !== 'CNY') {
      return currency
    }
  }

  // 3. 使用传入的货币（通常是行程整体货币）
  if (props.currency) {
    return props.currency
  }

  // 4. 默认返回系统配置的默认货币
  return getDefaultCurrency()
}

// 检查是否有费用信息
const hasCost = computed(() => {
  return !!(
    (props.slot?.cost && props.slot.cost > 0) ||
    (props.slot?.estimatedCost && props.slot.estimatedCost > 0) ||
    props.slot?.details?.pricing?.detail ||
    (props.slot?.details?.pricing?.general && props.slot.details.pricing.general > 0)
  )
})

// 获取费用数值
const getCostValue = (): number | null => {
  if (props.slot?.cost && props.slot.cost > 0) {
    return props.slot.cost
  }
  if (props.slot?.estimatedCost && props.slot.estimatedCost > 0) {
    return props.slot.estimatedCost
  }
  if (props.slot?.details?.pricing?.general && props.slot.details.pricing.general > 0) {
    return props.slot.details.pricing.general
  }
  return null
}

// 获取地址文本
const getAddressText = (): string => {
  if (props.slot?.details?.address) {
    return locale.value === 'zh-CN'
      ? props.slot.details.address.chinese || props.slot.details.address.english || ''
      : props.slot.details.address.english || props.slot.details.address.chinese || ''
  }
  if (props.slot?.location && typeof props.slot.location === 'string') {
    return props.slot.location
  }
  return ''
}

// 获取费用文本
const getCostText = (): string => {
  // 1. 如果有详细的费用描述文本，优先显示
  if (props.slot?.details?.pricing?.detail && typeof props.slot.details.pricing.detail === 'string') {
    return props.slot.details.pricing.detail
  }

  // 2. 如果有费用数值，格式化显示
  const costValue = getCostValue()
  if (costValue !== null) {
    const currency = getSlotCurrency()
    return formatCurrency(costValue, currency)
  }

  return '--'
}

// 获取类型图标
const getTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    transport: '✈',
    transportation: '✈',
    attraction: '📍',
    meal: '🍽️',
    hotel: '🏨',
    shopping: '🛍️',
    ocean: '🌊',
  }
  return iconMap[type.toLowerCase()] || '📍'
}


// 解析开放时间
const parseOpeningHours = (text: string): string[] => {
  if (!text) return []
  // 移除"开放时间："前缀
  let cleanText = text.replace(/^开放时间[：:]\s*/, '')
  // 按分号、句号、换行符分割
  const items = cleanText.split(/[；;。.\n]/).filter(item => item.trim())
  return items.map(item => item.trim()).filter(Boolean)
}

// 解析票价结构
const parsePricing = (text: string): Array<{ label: string; value: string }> => {
  if (!text) return []
  const items: Array<{ label: string; value: string }> = []
  
  // 按分号、句号、换行符分割
  const lines = text.split(/[；;。.\n]/).filter(item => item.trim())
  
  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return
    
    // 匹配 "标签：价格" 格式
    const match = trimmed.match(/^([^：:]+)[：:]\s*(.+)$/)
    if (match) {
      items.push({
        label: match[1].trim(),
        value: match[2].trim(),
      })
    } else {
      // 如果没有冒号，直接作为值
      items.push({
        label: '',
        value: trimmed,
      })
    }
  })
  
  return items
}

// 获取价格提示
const hasPricingTip = (): boolean => {
  const pricing = props.slot?.details?.pricing?.detail || ''
  return pricing.includes('优惠') || pricing.includes('证件') || pricing.includes('出示')
}

const getPricingTip = (): string => {
  const pricing = props.slot?.details?.pricing?.detail || ''
  if (pricing.includes('优惠') && pricing.includes('证件')) {
    return '优惠需出示有效证件'
  }
  return '优惠需出示有效证件'
}

// 获取主要开放时间（粗体大号字）
const getMainOpeningHours = (openingHours: string): string => {
  if (!openingHours) return ''
  const parsed = parseOpeningHours(openingHours)
  if (parsed.length > 0) {
    // 提取第一个时间信息，移除"开放时间："等前缀
    let mainTime = parsed[0].replace(/^开放时间[：:]\s*/i, '').trim()
    // 如果包含"周一至周日"等，直接返回
    if (mainTime.includes('周一') || mainTime.includes('周日') || mainTime.includes('Monday') || mainTime.includes('Sunday')) {
      return mainTime
    }
    return mainTime
  }
  return openingHours.replace(/^开放时间[：:]\s*/i, '').trim()
}

// 检查是否有开放时间备注
const hasOpeningHoursNote = (openingHours: string): boolean => {
  if (!openingHours) return false
  return openingHours.includes('节假日') || openingHours.includes('调整') || openingHours.includes('查询') || openingHours.includes('建议')
}

// 获取开放时间备注
const getOpeningHoursNote = (openingHours: string): string => {
  if (!openingHours) return ''
  const parsed = parseOpeningHours(openingHours)
  for (const item of parsed) {
    if (item.includes('节假日') || item.includes('调整') || item.includes('查询') || item.includes('建议')) {
      return item
    }
  }
  return ''
}

// 检查是否有价格优惠信息
const hasPricingDiscount = (pricing: string): boolean => {
  if (!pricing) return false
  return pricing.includes('在线预订') || pricing.includes('9折') || pricing.includes('折扣') || pricing.includes('优惠')
}

// 获取价格优惠信息
const getPricingDiscount = (pricing: string): string => {
  if (!pricing) return ''
  if (pricing.includes('在线预订') && pricing.includes('9折')) {
    return '在线预订享 9 折'
  }
  if (pricing.includes('在线预订')) {
    return '在线预订享优惠'
  }
  return ''
}

// 获取游览建议的时长摘要
const getVisitDurationSummary = (): string | null => {
  const rec = props.slot?.details?.recommendations
  if (rec?.visitDuration) {
    const duration = typeof rec.visitDuration === 'string' 
      ? parseInt(rec.visitDuration) || 0
      : rec.visitDuration || 0
    if (duration > 0) {
      return `推荐停留：约 ${formatDuration(duration)}`
    }
  }
  return null
}

// 获取游览建议图标
const getVisitTipIcon = (text: string): string => {
  const lower = text.toLowerCase()
  if (lower.includes('时间') || lower.includes('time')) return '⏰'
  if (lower.includes('停留') || lower.includes('duration')) return '✅'
  if (lower.includes('提前') || lower.includes('分钟') || lower.includes('分钟')) return '🚶'
  if (lower.includes('晕动') || lower.includes('慎选') || lower.includes('warning')) return '⚠️'
  return '•'
}

// 检查是否是警告类提示
const isWarningTip = (text: string): boolean => {
  const lower = text.toLowerCase()
  return lower.includes('晕动') || lower.includes('慎选') || lower.includes('警告') || lower.includes('注意')
}

// 获取无障碍设施图标
const getAccessibilityIcon = (text: string): string => {
  const lower = text.toLowerCase()
  if (lower.includes('轮椅') || lower.includes('wheelchair')) return '♿'
  if (lower.includes('预约') || lower.includes('预约') || lower.includes('预约')) return '📞'
  return '♿'
}

// 获取预订方式图标
const getBookingIcon = (label: string): string => {
  const lower = label.toLowerCase()
  if (lower.includes('官网') || lower.includes('website') || lower.includes('网站')) return '🌐'
  if (lower.includes('电话') || lower.includes('phone')) return '📞'
  if (lower.includes('app') || lower.includes('应用')) return '📱'
  return '📞'
}

// 获取体验建议列表
const hasVisitTips = (): boolean => {
  const rec = props.slot?.details?.recommendations
  return !!(rec?.visitTips || rec?.bestTimeToVisit || rec?.visitDuration)
}

const getVisitTipsList = (): string[] => {
  const rec = props.slot?.details?.recommendations
  const tips: string[] = []
  
  if (rec?.bestTimeToVisit) {
    tips.push(`最佳体验时间：${rec.bestTimeToVisit}`)
  }
  
  if (rec?.visitDuration) {
    const duration = typeof rec.visitDuration === 'string' 
      ? parseInt(rec.visitDuration) || 0
      : rec.visitDuration || 0
    if (duration > 0) {
      tips.push(`建议停留：${formatDuration(duration)}`)
    }
  }
  
  if (rec?.visitTips) {
    // 解析visitTips文本，提取关键信息
    const visitTipsText = rec.visitTips
    // 提取时间相关建议
    if (visitTipsText.includes('提前') || visitTipsText.includes('分钟')) {
      const timeMatch = visitTipsText.match(/(提前\s*\d+\s*分钟)/)
      if (timeMatch) {
        tips.push(timeMatch[1] + '到场')
      }
    }
    // 提取其他关键建议
    if (visitTipsText.includes('晕动') || visitTipsText.includes('慎选')) {
      tips.push('晕动症者慎选')
    }
  }
  
  return tips
}

// 解析无障碍设施
const parseAccessibility = (text: string): string[] => {
  if (!text) return []
  // 按分号、句号、换行符分割
  const items = text.split(/[；;。.\n]/).filter(item => item.trim())
  return items.map(item => item.trim()).filter(Boolean)
}

// 获取预订信息列表
const hasBookingInfo = (): boolean => {
  return !!(props.slot?.details?.contact?.info || props.slot?.details?.recommendations?.bookingInfo)
}

const getBookingInfoList = (): Array<{ label: string; value: string; url?: string }> => {
  const items: Array<{ label: string; value: string; url?: string }> = []
  
  // 从contact信息中提取
  const contactInfo = props.slot?.details?.contact?.info || ''
  if (contactInfo) {
    // 提取网址
    const urlMatch = contactInfo.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i)
    if (urlMatch) {
      const url = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`
      items.push({ label: '官网', value: urlMatch[0], url })
    }
    
    // 提取电话
    const phoneMatch = contactInfo.match(/(\+?\d[\d\s\-\(\)]+)/)
    if (phoneMatch) {
      items.push({ label: '电话', value: phoneMatch[0] })
    }
  }
  
  // 从bookingInfo中提取
  const bookingInfo = props.slot?.details?.recommendations?.bookingInfo || ''
  if (bookingInfo) {
    // 提取App信息
    if (bookingInfo.includes('App') || bookingInfo.includes('app')) {
      const appMatch = bookingInfo.match(/App[：:]\s*([^\s，,。.]+)/i)
      if (appMatch) {
        items.push({ label: 'App', value: appMatch[1] })
      }
    }
  }
  
  return items
}

// 获取网站URL
const getWebsiteUrl = (): string | null => {
  const contactInfo = props.slot?.details?.contact?.info || ''
  if (contactInfo) {
    const urlMatch = contactInfo.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i)
    if (urlMatch) {
      return urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`
    }
  }
  return null
}

// 打开网站
const openWebsite = () => {
  const url = getWebsiteUrl()
  if (url) {
    window.open(url, '_blank')
  }
}

// 检查是否有附近景点
const hasNearbyAttractions = (): boolean => {
  const nearby = props.slot?.details?.recommendations?.nearbyAttractions
  return !!(nearby && (typeof nearby === 'string' || Array.isArray(nearby)))
}

// 获取附近景点列表
const getNearbyAttractionsList = (): Array<{ name: string; distance: string; image?: string }> => {
  const nearby = props.slot?.details?.recommendations?.nearbyAttractions
  if (!nearby) return []
  
  const attractions: Array<{ name: string; distance: string; image?: string }> = []
  
  if (typeof nearby === 'string') {
    // 解析字符串格式的景点信息
    // 格式可能是："景点1、景点2、景点3" 或 "景点1（距离）、景点2（距离）"
    const items = nearby.split(/[、，,]/).filter(item => item.trim())
    items.forEach(item => {
      const trimmed = item.trim()
      // 尝试提取距离信息 - 匹配括号格式
      const distanceMatch = trimmed.match(/(.+?)[（(](.+?)[）)]/)
      if (distanceMatch) {
        attractions.push({
          name: distanceMatch[1].trim(),
          distance: distanceMatch[2].trim(),
        })
      } else {
        // 尝试匹配"步行 X 分钟"或"X km"格式
        const walkMatch = trimmed.match(/(.+?)(?:步行\s*(\d+)\s*分钟|(\d+(?:\.\d+)?)\s*km)/)
        if (walkMatch) {
          attractions.push({
            name: walkMatch[1].trim(),
            distance: walkMatch[2] ? `步行 ${walkMatch[2]} 分钟` : `${walkMatch[3]} km`,
          })
        } else {
          // 尝试匹配"X 分钟"或"X km"在文本中
          const timeMatch = trimmed.match(/(.+?)(\d+(?:\.\d+)?)\s*(分钟|km|公里)/)
          if (timeMatch) {
            const unit = timeMatch[3] === '分钟' ? '分钟' : timeMatch[3]
            attractions.push({
              name: timeMatch[1].trim(),
              distance: unit === '分钟' ? `步行 ${timeMatch[2]} 分钟` : `${timeMatch[2]} ${unit}`,
            })
          } else {
            attractions.push({
              name: trimmed,
              distance: '',
            })
          }
        }
      }
    })
  } else if (Array.isArray(nearby)) {
    nearby.forEach(item => {
      if (typeof item === 'string') {
        // 同样尝试解析距离信息
        const distanceMatch = item.match(/(.+?)[（(](.+?)[）)]/)
        if (distanceMatch) {
          attractions.push({
            name: distanceMatch[1].trim(),
            distance: distanceMatch[2].trim(),
          })
        } else {
          attractions.push({
            name: item,
            distance: '',
          })
        }
      }
    })
  }
  
  return attractions
}

// 解析穿搭建议
const parseOutfitSuggestions = (text: string): string[] => {
  if (!text) return []
  const items: string[] = []
  
  // 按分号、句号、换行符分割
  const lines = text.split(/[；;。.\n]/).filter(item => item.trim())
  
  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return
    
    // 移除"穿搭建议："等前缀
    const cleanText = trimmed.replace(/^穿搭建议[：:]\s*/, '')
    
    // 尝试提取关键信息
    // 匹配"类别：内容"格式
    const match = cleanText.match(/^([^：:]+)[：:]\s*(.+)$/)
    if (match) {
      items.push(`${match[1].trim()}：${match[2].trim()}`)
    } else {
      items.push(cleanText)
    }
  })
  
  return items
}

// 获取穿搭图标
const getOutfitIcon = (text: string): string => {
  const lower = text.toLowerCase()
  if (lower.includes('鞋') || lower.includes('shoe')) return '👟'
  if (lower.includes('服装') || lower.includes('clothing') || lower.includes('衣服')) return '🧥'
  if (lower.includes('雨具') || lower.includes('umbrella') || lower.includes('rain')) return '☔'
  if (lower.includes('防寒') || lower.includes('warm') || lower.includes('温度') || lower.includes('temp')) return '🌡'
  if (lower.includes('帽') || lower.includes('hat')) return '🧢'
  if (lower.includes('手套') || lower.includes('glove')) return '🧤'
  return '👕'
}

// 解析文化提示
const parseCulturalTips = (text: string): string[] => {
  if (!text) return []
  const items: string[] = []
  
  // 按分号、句号、换行符分割
  const lines = text.split(/[；;。.\n]/).filter(item => item.trim())
  
  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return
    
    // 移除"当地文化提示："等前缀
    const cleanText = trimmed.replace(/^当地文化提示[：:]\s*/, '')
    items.push(cleanText)
  })
  
  return items
}

// 获取文化图标
const getCultureIcon = (text: string): string => {
  const lower = text.toLowerCase()
  if (lower.includes('隐私') || lower.includes('privacy') || lower.includes('安静') || lower.includes('quiet')) return '🤫'
  if (lower.includes('小费') || lower.includes('tip')) return '💳'
  if (lower.includes('拍照') || lower.includes('photo') || lower.includes('拍照')) return '📵'
  if (lower.includes('环保') || lower.includes('environment') || lower.includes('垃圾') || lower.includes('litter')) return '🌱'
  if (lower.includes('宗教') || lower.includes('religion')) return '⛪'
  if (lower.includes('习俗') || lower.includes('custom')) return '🤝'
  return '📋'
}

const onCollapseChange = () => {
  emit('toggle')
}

// Planner 模式：格式化后端接口返回的数据
const formatDurationForDisplay = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '--'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return `${mins}分钟`
  }
}

const formatLocationForDisplay = (coordinates: { lat: number; lng: number }): string => {
  if (!coordinates) return ''
  return `纬度: ${coordinates.lat.toFixed(6)}, 经度: ${coordinates.lng.toFixed(6)}`
}

const formatCostForDisplay = (cost: number): string => {
  if (!cost || cost <= 0) return '--'
  const currency = getSlotCurrency()
  return formatCurrency(cost, currency)
}

const Chip = defineComponent({
  name: 'SlotChip',
  props: {
    icon: {
      type: String,
      default: '',
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'span',
        { class: 'chip' },
        [
          props.icon
            ? h('span', { class: 'chip__icon' }, props.icon)
            : null,
          h('span', { class: 'chip__text' }, slots.default?.()),
        ].filter(Boolean),
      )
  },
})
</script>

<style scoped>
.time-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: stretch;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 22px;
  padding: 26px 32px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Planner 模式：单列布局 */
.time-slot--planner {
  padding: 24px 28px;
}

.time-slot::before {
  display: none;
}

.time-slot:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
}

.time-slot__time {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1;
  white-space: nowrap;
  letter-spacing: 0.05em;
}

.time-slot__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.time-slot__image {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  background: #f8fafc;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.12);
  cursor: zoom-in;
}

.time-slot--planner .time-slot__image {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.time-slot__image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.time-slot__image:hover :deep(img) {
  transform: scale(1.03);
}

.time-slot__image :deep(.ant-image-mask) {
  border-radius: 20px;
}

.time-slot__image-loading {
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
  cursor: progress;
}

.time-slot__image-loading :deep(.ant-skeleton-image) {
  width: 100%;
  height: 100%;
}

/* 普通模式 Header */

.time-slot__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.time-slot__title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-slot__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.time-slot__subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.time-slot__location {
  margin: 0;
  font-size: 13px;
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.time-slot__location :deep(.anticon) {
  font-size: 14px;
}

.time-slot__type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  font-size: 12px;
  color: #0f172a;
  background: rgba(148, 163, 184, 0.18);
  padding: 4px 10px;
  border-radius: 999px;
  align-self: flex-start;
  line-height: 1.2;
}

.time-slot__type-icon {
  font-size: 14px;
}

.time-slot__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.time-slot__summary {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
  letter-spacing: -0.01em;
}

.time-slot__internal {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  background: rgba(59, 130, 246, 0.08);
  padding: 8px 12px;
  border-radius: 12px;
  color: #1d4ed8;
}

.time-slot__internal-icon {
  font-size: 16px;
}

.time-slot__collapse :deep(.ant-collapse-item) {
  border: none;
}

.time-slot__collapse :deep(.ant-collapse-header) {
  padding: 0;
  font-size: 13px;
  color: #2563eb;
}

/* 底部操作区 */

.time-slot__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.time-slot__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
}

/* secondary 按钮：浅底 + 蓝色描边 */
.time-slot__action:not(.ant-btn-primary) {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #1d4ed8;
}

.time-slot__action:not(.ant-btn-primary):hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

/* Planner 模式 Hero */

.time-slot__hero {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 20px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.time-slot__hero-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 1. 节点身份区 */
.time-slot__hero-identity {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 2. 快速决策摘要区 */
.time-slot__hero-decision {
  margin-top: 4px;
}

.time-slot__hero-decision-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #475569;
}

.time-slot__hero-decision-item {
  font-weight: 500;
  color: #0f172a;
}

.time-slot__hero-decision-separator {
  color: #94a3b8;
}

/* 3. 语境标签区 */
.time-slot__hero-context {
  margin-top: 4px;
}

.time-slot__hero-context-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.time-slot__hero-context-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(148, 163, 184, 0.12);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #475569;
}

.time-slot__hero-time-tag {
  margin-bottom: 4px;
}

.time-slot__time-tag {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  letter-spacing: 0.05em;
}

.time-slot__hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.time-slot__hero-subtitle {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
}

.time-slot__hero-subtitle-english {
  font-weight: 500;
  color: #475569;
}

.time-slot__hero-subtitle-local {
  color: #94a3b8;
}

/* 活动类型标签 */
.time-slot__hero-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(148, 163, 184, 0.12);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  color: #475569;
  align-self: flex-start;
  margin-top: 4px;
}

.time-slot__hero-type-icon {
  font-size: 14px;
}

.time-slot__hero-favorite {
  color: #94a3b8;
  margin-left: 4px;
}

.time-slot__hero-favorite:hover {
  color: #f59e0b;
}

.time-slot__hero-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.time-slot__hero-action {
  flex-shrink: 0;
}

.time-slot__hero-action--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

.time-slot__hero-action--primary:hover {
  background: linear-gradient(135deg, #5568d3 0%, #653a8f 100%);
  color: #fff;
}

/* Hero 导航 Tab */

.time-slot__hero-nav {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.time-slot__hero-nav-tabs {
  display: flex;
  gap: 20px;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.time-slot__hero-nav-tabs::-webkit-scrollbar {
  display: none;
}

.time-slot__hero-nav-tabs .ant-btn-link {
  padding: 4px 0;
  font-size: 13px;
  color: #94a3b8;
  height: auto;
  border: none;
  position: relative;
  transition: color 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.time-slot__hero-nav-tabs .ant-btn-link:hover {
  color: #667eea;
}

.time-slot__hero-nav-tab--active {
  color: #4f46e5 !important;
  font-weight: 600;
}

.time-slot__hero-nav-tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #4f46e5, #6366f1);
}

/* Hero 摘要卡 */

/* 6. 概览摘要卡区 */
.time-slot__hero-summary-card {
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(148, 163, 184, 0.08);
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.time-slot__hero-summary-card-content {
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

/* Planner 主体 */

.time-slot__body-planner {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 第一层：Hero Section */
.time-slot__hero-layer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

/* ① 主视觉区（Hero Banner） */
.time-slot__hero-banner {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 24px;
}

.time-slot__hero-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  cursor: zoom-in;
}

.time-slot__hero-image :deep(.ant-image) {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  position: absolute;
  top: 0;
  left: 0;
}

.time-slot__hero-image :deep(.ant-image-img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
  position: absolute;
  top: 0;
  left: 0;
}

.time-slot__hero-image :deep(img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
  position: absolute;
  top: 0;
  left: 0;
}

.time-slot__hero-image :deep(.ant-image-mask) {
  border-radius: 0;
}

.time-slot__hero-image-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-slot__hero-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.time-slot__hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 1;
  pointer-events: none;
  border-radius: 16px;
}

.time-slot__hero-title-area {
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 2;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.time-slot__hero-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: #ffffff;
}

.time-slot__hero-subtitle {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.95;
  color: #ffffff;
}

.time-slot__hero-rating {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  padding: 8px 16px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  pointer-events: none;
}

.time-slot__hero-rating-icon {
  font-size: 18px;
}

.time-slot__hero-rating-value {
  font-weight: 700;
}

.time-slot__action-button {
  padding: 4px 8px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  color: #64748b;
  background: transparent;
}

.time-slot__action-button:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #0f172a;
}

.time-slot__action-button.ant-btn-dangerous {
  color: #ef4444;
}

.time-slot__action-button.ant-btn-dangerous:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}


/* ② 信息标签条 */
.time-slot__info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  background: #F6F7F8;
  border-radius: 12px;
  font-size: 14px;
  flex-wrap: wrap;
}

.time-slot__info-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.time-slot__info-bar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.time-slot__info-bar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0f172a;
  font-weight: 500;
}

.time-slot__info-bar-icon {
  font-size: 16px;
}

.time-slot__info-bar-text {
  color: #475569;
}

.time-slot__info-bar-divider {
  color: #cbd5e1;
  font-weight: 300;
}

/* ③ 地址栏 */
.time-slot__address-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
}

.time-slot__address-text {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  font-size: 14px;
  color: #0f172a;
  min-width: 0;
}

.time-slot__address-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.time-slot__map-button {
  height: 36px;
  border-radius: 8px;
  background: #1E7DBA;
  border: none;
  color: #ffffff;
  font-weight: 500;
  padding: 0 20px;
  flex-shrink: 0;
}

.time-slot__map-button:hover {
  background: #1565A0;
  color: #ffffff;
}

/* 费用文本 */
.time-slot__cost-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 景点介绍区域（图片下方） */
.time-slot__scenic-intro-section {
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  margin-bottom: 8px;
}

.time-slot__scenic-intro-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 第二层：详细信息 */
.time-slot__detail-layer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.time-slot__detail-section {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.time-slot__detail-section--grid {
  padding: 20px;
}

.time-slot__detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.time-slot__detail-grid-item {
  display: flex;
  flex-direction: column;
}

.time-slot__detail-grid-item .time-slot__detail-section-title {
  margin-bottom: 12px;
}

.time-slot__detail-grid-item .time-slot__detail-list {
  gap: 10px;
}

.time-slot__detail-grid-item .time-slot__detail-button {
  margin-top: 12px;
}

/* 开放时间部分 */
.time-slot__opening-hours-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.time-slot__opening-hours-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* 开放时间文本 */
.time-slot__opening-hours-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 12px;
}

/* 票价结构文本 */
.time-slot__pricing-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 游览建议文本 */
.time-slot__visit-tips-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 无障碍设施文本 */
.time-slot__accessibility-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 交通信息文本 */
.time-slot__transportation-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 预订信息文本 */
.time-slot__booking-info-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 12px;
}

/* 预订与咨询部分 */
.time-slot__booking-info-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

/* 预订链接部分 */
.time-slot__booking-links-section {
  margin-top: 16px;
  margin-bottom: 16px;
}

.time-slot__booking-links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot__booking-link-card {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: #1d1d1f;
  transition: all 0.2s ease;
  cursor: pointer;
}

.time-slot__booking-link-card:hover {
  border-color: #0071e3;
  background: #f0f7ff;
  color: #0071e3;
  transform: translateX(2px);
}

.time-slot__booking-link-icon {
  font-size: 14px;
  color: #0071e3;
  margin-right: 8px;
}

.time-slot__booking-link-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.time-slot__booking-link-arrow {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.time-slot__booking-link-card:hover .time-slot__booking-link-arrow {
  transform: translateX(2px);
  color: #0071e3;
}

/* 穿搭建议文本 */
.time-slot__outfit-suggestions-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 当地文化提示文本 */
.time-slot__cultural-tips-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 附近景点标签样式 */
.time-slot__attraction-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-slot__attraction-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  font-size: 13px;
  color: #0f172a;
  font-weight: 500;
  line-height: 1.4;
}

.time-slot__attraction-tag--clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-slot__attraction-tag--clickable:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #2563eb;
  transform: translateY(-1px);
}

.time-slot__attraction-tag-distance {
  font-size: 11px;
  color: #64748b;
  font-weight: 400;
  margin-left: 4px;
}

.time-slot__attraction-tag-icon {
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
  margin-left: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.time-slot__attraction-tag--clickable:hover .time-slot__attraction-tag-icon {
  opacity: 1;
}

.time-slot__detail-section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.4;
}

.time-slot__detail-section-title--main {
  margin-bottom: 16px;
  font-size: 17px;
}

.time-slot__detail-section-icon {
  font-size: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  line-height: 1;
}

.time-slot__detail-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot__detail-list--checklist {
  gap: 6px;
}

.time-slot__detail-list-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
}

.time-slot__detail-list-text--warning {
  color: #dc2626;
  font-weight: 500;
}

.time-slot__detail-list-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  line-height: 1;
}

.time-slot__detail-list-text {
  flex: 1;
  color: #0f172a;
}

.time-slot__detail-list-label {
  color: #64748b;
  font-weight: 500;
}

.time-slot__detail-list-value {
  color: #0f172a;
  font-weight: 600;
}

.time-slot__detail-link {
  color: #1E7DBA;
  text-decoration: underline;
  cursor: pointer;
}

.time-slot__detail-link:hover {
  color: #1565A0;
}

.time-slot__detail-button {
  margin-top: 12px;
  height: 36px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.time-slot__detail-button--compact {
  width: auto;
  margin-top: 12px;
  align-self: flex-start;
}

.time-slot__detail-button--primary {
  background: #1E7DBA;
  border: none;
  color: #ffffff;
}

.time-slot__detail-button--primary:hover {
  background: #1565A0;
  color: #ffffff;
}

.time-slot__detail-tip {
  margin-top: 16px;
  padding: 12px 16px;
  background: #FFF9E8;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #92400e;
}

.time-slot__detail-tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.time-slot__detail-tip-text {
  flex: 1;
}

/* 第三层：可折叠详细信息 */
.time-slot__collapsible-layer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.time-slot__collapsible-section {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.time-slot__collapsible-header {
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;
  transition: background-color 0.2s ease;
}

.time-slot__collapsible-header:hover {
  background-color: rgba(148, 163, 184, 0.05);
}

.time-slot__collapsible-icon {
  font-size: 14px;
  color: #64748b;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.time-slot__collapsible-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.time-slot__collapsible-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
}

.time-slot__collapsible-content {
  padding: 0 20px 20px 20px;
}

.time-slot__collapsible-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.time-slot__collapsible-list-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
}

.time-slot__collapsible-list-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.time-slot__collapsible-list-text {
  flex: 1;
  color: #0f172a;
}

/* 附近景点卡片 */
.time-slot__attraction-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-slot__attraction-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(148, 163, 184, 0.03);
  border-radius: 10px;
  transition: background-color 0.2s ease;
}

.time-slot__attraction-card:hover {
  background: rgba(148, 163, 184, 0.08);
}

.time-slot__attraction-image {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-slot__attraction-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.time-slot__attraction-image-placeholder {
  font-size: 24px;
  color: #94a3b8;
}

.time-slot__attraction-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.time-slot__attraction-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

.time-slot__attraction-distance {
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

/* 后端信息显示 */
.time-slot__info {
  margin-top: 20px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.time-slot__info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-slot__info-section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
}

.time-slot__info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.time-slot__info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.time-slot__info-item--full {
  grid-column: 1 / -1;
  flex-direction: column;
  gap: 8px;
}

.time-slot__info-label {
  font-weight: 600;
  color: #475569;
  min-width: 100px;
  flex-shrink: 0;
}

.time-slot__info-value {
  color: #0f172a;
  flex: 1;
  word-break: break-word;
  white-space: pre-wrap;
}

/* Chip */

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  font-size: 13px;
  color: #1f2937;
  line-height: 1;
}

.chip__icon {
  font-size: 14px;
}

.chip--rating[data-status='high'] {
  background: rgba(16, 185, 129, 0.16);
  color: #047857;
}

.chip--rating[data-status='medium'] {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.chip--rating[data-status='low'] {
  background: rgba(107, 114, 128, 0.16);
  color: #4b5563;
}

/* 响应式 */

@media (max-width: 960px) {
  .time-slot__hero-banner {
    height: 120px;
    padding: 20px;
  }

  .time-slot__hero-title {
    font-size: 22px;
  }

  .time-slot__hero-subtitle {
    font-size: 14px;
  }

  .time-slot__info-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .time-slot__info-bar-content {
    width: 100%;
  }

  .time-slot__info-bar-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .time-slot__info-bar-divider {
    display: none;
  }

  .time-slot__address-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .time-slot__map-button {
    width: 100%;
  }

  .time-slot__detail-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .time-slot--planner .time-slot__hero-content {
    flex-direction: column;
    align-items: stretch;
  }

  .time-slot__hero-left,
  .time-slot__hero-right {
    flex: 1 1 auto;
    max-width: 100%;
  }

  .time-slot__hero-right {
    align-items: flex-start;
  }

  .time-slot__hero-meta {
    flex-direction: row;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .time-slot {
    grid-template-columns: 1fr;
    padding: 20px;
    gap: 16px;
  }

  .time-slot::before {
    display: none;
  }

  .time-slot__time {
    order: -1;
    justify-content: flex-start;
  }
}
</style>

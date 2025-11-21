<template>
  <article
    class="time-slot"
    :class="{
      'time-slot--planner': isPlannerMode && !isInspirationMode,
      'time-slot--inspiration': isInspirationMode,
    }"
    :id="`slot-${slot.time.replace(':', '-')}`"
  >
    <!-- 顶部 Hero 区域（仅 planner 模式） -->
    <div
      v-if="isPlannerMode && !isInspirationMode"
      class="time-slot__hero"
      ref="heroRef"
    >
      <div class="time-slot__hero-content">
        <!-- 1. 节点身份区（Who / When） -->
        <div class="time-slot__hero-identity">
          <div class="time-slot__hero-time-tag">
            <span class="time-slot__time-tag">{{ slot.time }}</span>
          </div>
          <h3 class="time-slot__hero-title">
            {{ slot.title || slot.activity }}
          </h3>
          <div class="time-slot__hero-subtitle">
            <span
              v-if="slot.details?.name?.english"
              class="time-slot__hero-subtitle-english"
            >
              {{ slot.details.name.english }}
            </span>
            <span
              v-if="
                slot.details?.name?.local &&
                slot.details.name.local !== slot.details.name.english
              "
              class="time-slot__hero-subtitle-local"
            >
              {{ slot.details.name.local }}
            </span>
          </div>
          <!-- 活动类型标签 -->
          <div v-if="slotTypeMeta" class="time-slot__hero-type-tag">
            <span class="time-slot__hero-type-icon">
              {{ slotTypeMeta.icon }}
            </span>
            <span>{{ slotTypeMeta.label }}</span>
          </div>
        </div>

        <!-- 2. 快速决策摘要区（How long / How much） -->
        <div class="time-slot__hero-decision">
          <div class="time-slot__hero-decision-row">
            <span
              v-if="formatDuration && formatDuration !== '--'"
              class="time-slot__hero-decision-item"
            >
              {{ formatDuration }}
            </span>
            <span
              v-if="
                formatDuration &&
                formatDuration !== '--' &&
                activityCostText
              "
              class="time-slot__hero-decision-separator"
            >
              ·
            </span>
            <span
              v-if="activityCostText"
              class="time-slot__hero-decision-item"
            >
              {{ activityCostText }}
            </span>
          </div>
        </div>

        <!-- 3. 语境标签区（What context） -->
        <div class="time-slot__hero-context">
          <div class="time-slot__hero-context-tags">
            <span
              v-if="transportInfo?.summary"
              class="time-slot__hero-context-tag"
            >
              {{ transportInfo.summary.split(';')[0] }}
            </span>
            <!-- 可以添加其他语境标签 -->
          </div>
        </div>

        <!-- 4. 行为入口区（What can I do） -->
        <div class="time-slot__hero-actions">
          <a-button
            v-if="needsBooking"
            type="primary"
            size="small"
            class="time-slot__hero-action time-slot__hero-action--primary"
            @click="$emit('book')"
          >
            🗓 {{ t('travelDetail.experienceDay.book') }}
          </a-button>
          <a-button
            type="default"
            ghost
            size="small"
            class="time-slot__hero-action"
            @click="$emit('navigate')"
          >
            📍 {{ t('travelDetail.experienceDay.navigate') }}
          </a-button>
          <a-button
            type="default"
            ghost
            size="small"
            class="time-slot__hero-action"
            @click="$emit('search')"
          >
            🔍 {{ t('travelDetail.experienceDay.searchNearby') }}
          </a-button>
          <a-button
            type="text"
            size="small"
            class="time-slot__hero-favorite"
          >
            <star-outlined />
          </a-button>
          <a-dropdown>
            <a-button size="small" class="time-slot__hero-action">
              ⋯
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="$emit('contact')">
                  📞 {{ t('travelDetail.experienceDay.contact') }}
                </a-menu-item>
                <a-menu-item @click="$emit('edit')">
                  ✏️ {{ t('travelDetail.experienceDay.edit') }}
                </a-menu-item>
                <a-menu-item danger @click="$emit('remove')">
                  🗑️ {{ t('travelDetail.experienceDay.delete') }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>

      <!-- 锚点导航 Tab -->
      <div class="time-slot__hero-nav">
        <div class="time-slot__hero-nav-tabs">
          <a-button
            type="link"
            :class="{
              'time-slot__hero-nav-tab--active': activeNavTab === 'overview',
            }"
            @click="scrollToSection('overview')"
          >
            {{ t('travelDetail.experienceDay.navOverview') }}
          </a-button>
          <a-button
            type="link"
            :class="{
              'time-slot__hero-nav-tab--active':
                activeNavTab === 'transport-time',
            }"
            @click="scrollToSection('transport-time')"
          >
            {{ t('travelDetail.experienceDay.navTransportTime') }}
          </a-button>
          <a-button
            type="link"
            :class="{
              'time-slot__hero-nav-tab--active':
                activeNavTab === 'pricing-booking',
            }"
            @click="scrollToSection('pricing-booking')"
          >
            {{ t('travelDetail.experienceDay.navPricingBooking') }}
          </a-button>
          <a-button
            type="link"
            :class="{
              'time-slot__hero-nav-tab--active': activeNavTab === 'tips',
            }"
            @click="scrollToSection('tips')"
          >
            {{ t('travelDetail.experienceDay.navTips') }}
          </a-button>
          <a-button
            type="link"
            :class="{
              'time-slot__hero-nav-tab--active': activeNavTab === 'nearby',
            }"
            @click="scrollToSection('nearby')"
          >
            {{ t('travelDetail.experienceDay.navNearby') }}
          </a-button>
        </div>
      </div>

      <!-- 6. 概览摘要卡区（Overview highlight） -->
      <div
        v-if="currentTabSummary"
        class="time-slot__hero-summary-card"
      >
        <div class="time-slot__hero-summary-card-content">
          {{ currentTabSummary }}
        </div>
      </div>
    </div>

    <!-- 原有布局（非 planner 模式或灵感模式） -->
    <template v-else>
      <div class="time-slot__time">
        {{ slot.time }}
      </div>

    <div class="time-slot__body">
        <header
          v-if="!isInspirationMode"
          class="time-slot__header"
        >
        <div class="time-slot__title-group">
            <h4 class="time-slot__title">
              {{ slot.title || slot.activity }}
            </h4>
            <p
              v-if="slot.details?.name?.english"
              class="time-slot__subtitle"
            >
              {{ slot.details.name.english }}
            </p>
            <p
              v-if="locationDisplay"
              class="time-slot__location"
            >
              <environment-outlined />
              {{ locationDisplay }}
            </p>
            <p
              v-if="slotTypeMeta"
              class="time-slot__type"
            >
              <span class="time-slot__type-icon">
                {{ slotTypeMeta.icon }}
              </span>
            <span>{{ slotTypeMeta.label }}</span>
          </p>
        </div>

        <div class="time-slot__chips">
            <Chip
              v-if="chips.stay"
              icon="⏱"
            >
              {{ chips.stay }}
            </Chip>
          <Chip
            v-if="chips.rating"
            class="chip--rating"
            :data-status="chips.rating.status"
            role="button"
            tabindex="0"
            @click="$emit('rating-click')"
          >
            ⭐ {{ chips.rating.text }}
          </Chip>
            <Chip
              v-if="chips.seasonal"
              icon="🍂"
            >
              {{ chips.seasonal }}
            </Chip>
            <Chip
              v-if="chips.cost"
              icon="💰"
            >
              {{ chips.cost }}
            </Chip>
        </div>
      </header>

      <a-image
        v-if="cover"
        class="time-slot__image"
        :src="cover"
        :alt="slot.title || slot.activity"
        :preview="false"
        :style="imageContainerStyle"
        :img-style="imageInnerStyle"
        loading="lazy"
        @click="$emit('preview')"
        @error="handleImageError"
      >
        <template #placeholder>
          <a-skeleton-image :style="imageSkeletonStyle" />
        </template>
      </a-image>
        <div
          v-else-if="props.loading"
          class="time-slot__image-loading"
          :style="imageContainerStyle"
        >
        <a-skeleton-image :style="imageSkeletonStyle" />
      </div>

        <!-- 灵感模式隐藏所有文本内容 -->
        <template v-if="!isInspirationMode">
          <!-- planner 模式不显示 summary 和 internalPreview（灵感模式特有字段） -->
          <p
            v-if="summary && !isPlannerMode"
            class="time-slot__summary"
          >
            {{ summary }}
          </p>

          <div
            v-if="internalPreview && !isPlannerMode"
            class="time-slot__internal"
          >
        <span class="time-slot__internal-icon">💭</span>
            <span class="time-slot__internal-label">
              {{ t('travelDetail.experienceDay.internalTrackQuestion') }}：
            </span>
        <span>{{ internalPreview }}</span>
      </div>

      <a-collapse
        ghost
        class="time-slot__collapse"
        :active-key="collapseKeys"
        @change="onCollapseChange"
      >
        <a-collapse-panel
          key="details"
              :header="
                expanded
                  ? t('travelDetail.experienceDay.collapse')
                  : t('travelDetail.experienceDay.more')
              "
        >
          <SlotInfoGrid
            :slot="slot"
            :currency="currency"
            :platform="platform"
            :notes="notes"
            :booking-links="slot.bookingLinks || []"
                :is-planner-mode="isPlannerMode"
          />
        </a-collapse-panel>
      </a-collapse>
        </template>

      <div class="time-slot__actions">
          <a-button
            type="primary"
            size="small"
            class="time-slot__action"
            @click="$emit('navigate')"
            aria-label="navigate"
          >
          📍 {{ t('travelDetail.experienceDay.navigate') }}
        </a-button>
        <a-button
          v-if="needsBooking"
          size="small"
          class="time-slot__action"
          @click="$emit('book')"
          aria-label="book"
        >
          🗓 {{ t('travelDetail.experienceDay.book') }}
        </a-button>
          <a-button
            size="small"
            class="time-slot__action"
            @click="$emit('search')"
            aria-label="search-nearby"
          >
          🔍 {{ t('travelDetail.experienceDay.searchNearby') }}
        </a-button>
        <a-dropdown>
            <a-button
              size="small"
              class="time-slot__action"
            >
              ⋯
            </a-button>
          <template #overlay>
            <a-menu>
                <a-menu-item @click="$emit('contact')">
                  📞 {{ t('travelDetail.experienceDay.contact') }}
                </a-menu-item>
                <a-menu-item @click="$emit('edit')">
                  ✏️ {{ t('travelDetail.experienceDay.edit') }}
                </a-menu-item>
                <a-menu-item danger @click="$emit('remove')">
                  🗑️ {{ t('travelDetail.experienceDay.delete') }}
                </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
      </div>
    </template>

    <!-- Planner 模式的主体内容 -->
    <div
      v-if="isPlannerMode && !isInspirationMode"
      class="time-slot__body-planner"
    >
      <a-image
        v-if="cover"
        class="time-slot__image"
        :src="cover"
        :alt="slot.title || slot.activity"
        :preview="false"
        :style="imageContainerStyle"
        :img-style="imageInnerStyle"
        loading="lazy"
        @click="$emit('preview')"
        @error="handleImageError"
      >
        <template #placeholder>
          <a-skeleton-image :style="imageSkeletonStyle" />
        </template>
      </a-image>
      <div
        v-else-if="props.loading"
        class="time-slot__image-loading"
        :style="imageContainerStyle"
      >
        <a-skeleton-image :style="imageSkeletonStyle" />
      </div>

      <SlotInfoGrid
        :slot="slot"
        :currency="currency"
        :platform="platform"
        :notes="notes"
        :booking-links="slot.bookingLinks || []"
        :is-planner-mode="isPlannerMode"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, defineComponent, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EnvironmentOutlined, StarOutlined } from '@ant-design/icons-vue'
import type { CurrencyInfo } from '@/utils/currency'
import SlotInfoGrid from './SlotInfoGrid.vue'
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

// Hero 区域需要的 computed 属性
const formatDuration = computed(() => {
  const duration = props.slot?.duration || 0
  if (!duration) return '--'
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  if (hours > 0 && minutes > 0) {
    return `${hours * 60 + minutes}–${
      hours * 60 + minutes + 15
    }分钟`
  } else if (hours > 0) {
    return `${hours}–${hours + 1}小时`
  } else if (minutes > 0) {
    return `${minutes}–${minutes + 15}分钟`
  }
  return '--'
})

const activityCostText = computed(() => {
  if (!props.slot?.cost || props.slot.cost <= 0) return null
  const cost = props.slot.cost
  const currency =
    props.currency || {
      code: 'CNY',
      symbol: '¥',
      name: '人民币',
    }
  return `${currency.symbol}${cost.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
})

const heroRef = ref<HTMLElement | null>(null)
const activeNavTab = ref('overview')

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

const onCollapseChange = () => {
  emit('toggle')
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
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 20px;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 22px;
  padding: 26px 32px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Planner 模式：单列布局，去掉左侧时间轴列 */
.time-slot--planner {
  grid-template-columns: minmax(0, 1fr);
  padding: 24px 28px;
}

.time-slot::before {
  content: '';
  position: absolute;
  left: 28px;
  top: 32px;
  bottom: 32px;
  width: 4px;
  border-radius: 999px;
}

.time-slot--planner::before {
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

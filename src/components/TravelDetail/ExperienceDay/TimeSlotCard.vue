<template>
  <article class="time-slot">
    <div class="time-slot__time">{{ slot.time }}</div>
    <div class="time-slot__body">
      <header class="time-slot__header">
        <div class="time-slot__title-group">
          <h4 class="time-slot__title">{{ slot.title || slot.activity }}</h4>
          <p v-if="slot.details?.name?.english" class="time-slot__subtitle">{{ slot.details.name.english }}</p>
          <p v-if="locationDisplay" class="time-slot__location">
            <environment-outlined /> {{ locationDisplay }}
          </p>
          <p v-if="slotTypeMeta" class="time-slot__type">
            <span class="time-slot__type-icon">{{ slotTypeMeta.icon }}</span>
            <span>{{ slotTypeMeta.label }}</span>
          </p>
        </div>
        <div class="time-slot__chips">
          <Chip v-if="chips.stay" icon="⏱">{{ chips.stay }}</Chip>
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
          <Chip v-if="chips.seasonal" icon="🍂">{{ chips.seasonal }}</Chip>
          <Chip v-if="chips.cost" icon="💰">{{ chips.cost }}</Chip>
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
      <div v-else-if="props.loading" class="time-slot__image-loading" :style="imageContainerStyle">
        <a-skeleton-image :style="imageSkeletonStyle" />
      </div>

      <p v-if="summary" class="time-slot__summary">{{ summary }}</p>

      <div v-if="narration" class="time-slot__narration">
        <span class="time-slot__narration-icon">🎙️</span>
        <span class="time-slot__narration-label">
          {{
            t('travelDetail.experienceDay.activityDetailLabel') ||
              t('travelDetail.experienceDay.activity') ||
              '活动'
          }}：
            </span>
        <span>{{ narration }}</span>
      </div>

      <div v-if="internalPreview" class="time-slot__internal">
        <span class="time-slot__internal-icon">💭</span>
        <span class="time-slot__internal-label">{{ t('travelDetail.experienceDay.internalTrackQuestion') }}：</span>
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
          :header="expanded ? t('travelDetail.experienceDay.collapse') : t('travelDetail.experienceDay.more')"
        >
          <SlotInfoGrid
            :slot="slot"
            :currency="currency"
            :platform="platform"
            :notes="notes"
            :booking-links="slot.bookingLinks || []"
          />
        </a-collapse-panel>
      </a-collapse>

      <div class="time-slot__actions">
        <a-button type="primary" size="small" class="time-slot__action" @click="$emit('navigate')" aria-label="navigate">
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
        <a-button size="small" class="time-slot__action" @click="$emit('search')" aria-label="search-nearby">
          🔍 {{ t('travelDetail.experienceDay.searchNearby') }}
        </a-button>
        <a-dropdown>
          <a-button size="small" class="time-slot__action">⋯</a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="$emit('contact')">📞 {{ t('travelDetail.experienceDay.contact') }}</a-menu-item>
              <a-menu-item @click="$emit('edit')">✏️ {{ t('travelDetail.experienceDay.edit') }}</a-menu-item>
              <a-menu-item danger @click="$emit('remove')">🗑️ {{ t('travelDetail.experienceDay.delete') }}</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, defineComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { EnvironmentOutlined } from '@ant-design/icons-vue'
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

const TYPE_MAPPINGS: Record<string, { icon: string; zh: string; en: string }> = {
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
      .filter((item): item is string => typeof item === 'string' && item.trim())
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

const slotTypeMeta = computed(() => resolveSlotType(props.slot))
const summary = computed(() => {
  const parts: string[] = []
  const seen = new Set<string>()

  const pushUnique = (value?: string | null) => {
    if (!value || typeof value !== 'string') return
    const normalized = value.replace(/\s+/g, ' ').trim()
    if (!normalized) return
    const key = normalized.toLowerCase().replace(/[，。\.、!！?？\s]+/g, ' ')
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

  if (Array.isArray(props.slot?.details?.description?.highlights)) {
    props.slot.details.description.highlights
      .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .slice(0, 2)
      .forEach(pushUnique)
  }

  if (!parts.length) return ''
  if (parts.length === 1) return parts[0]
  return parts.join(' ')
})

const internalPreview = computed(() => getInternalPreview(props.slot))
const rawNotes = computed(() => buildNotes(props.slot))
const chips = computed(() =>
  buildSlotChips(props.slot, {
    t,
    currency: props.currency,
    platform: props.platform,
  })
)
const transportInfo = computed<TransportInfo | null>(() =>
  buildTransportInfo(props.slot.details?.transportation, t)
)

const narration = computed(() => {
  const parts: string[] = []
  const seen = new Set<string>()

  const pushUnique = (value?: string | null) => {
    if (!value || typeof value !== 'string') return
    const normalized = value.replace(/\s+/g, ' ').trim()
    if (!normalized) return
    const key = normalized.toLowerCase().replace(/[，。\.、!！?？\s]+/g, ' ')
    if (seen.has(key)) return
    seen.add(key)
    parts.push(normalized)
  }

  pushUnique(props.slot?.activity)
  pushUnique(props.slot?.localTip)

  const fallback = props.slot?.narration || props.slot?.details?.narration
  if (!parts.length) {
    pushUnique(fallback)
  }

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

const locationDisplay = computed(() => sanitizeLocation(props.slot?.location))

const notes = computed(() =>
  rawNotes.value.filter((note) => {
    const lower = note.toLowerCase()
    return !(
      note.includes('请查询当地交通信息') ||
      lower.includes('check local transportation')
    )
  })
)

const needsBooking = computed(() => {
  const rec = props.slot?.details?.recommendations || {}
  const hasBookingLinks =
    Array.isArray(props.slot?.bookingLinks) && props.slot.bookingLinks.length > 0

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

  return hasBookingLinks || hasBookingHints || isTransportOrAccommodation(props.slot)
})
const collapseKeys = computed(() => (props.expanded ? ['details'] : []))

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
          props.icon ? h('span', { class: 'chip__icon' }, props.icon) : null,
          h('span', { class: 'chip__text' }, slots.default?.()),
        ].filter(Boolean)
      )
  },
})
</script>

<style scoped>
.time-slot {
  position: relative;
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 20px;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 22px;
  padding: 26px 32px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
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

.time-slot__narration {
  margin: 12px 0 0;
  display: flex;
  background: linear-gradient(135deg, rgba(255, 245, 233, 0.9) 0%, rgba(255, 228, 196, 0.75) 100%);
  border-radius: 12px;
  padding: 10px 14px;
  color: #8b4513;
  gap: 8px;
  line-height: 1.6;
  font-size: 13px;
}

.time-slot__narration-icon {
  font-size: 16px;
  margin-top: 2px;
}

.time-slot__narration-label {
  font-weight: 600;
  
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
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #1d4ed8;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.time-slot__action:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

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

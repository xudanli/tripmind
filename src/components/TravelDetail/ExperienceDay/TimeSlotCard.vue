<template>
  <article class="time-slot">
    <div class="time-slot__time">{{ slot.time }}</div>
    <div class="time-slot__body">
      <header class="time-slot__header">
        <div class="time-slot__title-group">
          <h4 class="time-slot__title">{{ slot.title || slot.activity }}</h4>
          <p v-if="slot.details?.name?.english" class="time-slot__subtitle">{{ slot.details.name.english }}</p>
          <p v-if="slot.location" class="time-slot__location">
            <environment-outlined /> {{ slot.location }}
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

const { t } = useI18n()

const IMAGE_HEIGHT = 260

const imageContainerStyle = {
  height: `${IMAGE_HEIGHT}px`,
}

const imageInnerStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  display: 'block',
}

const imageSkeletonStyle = {
  width: '100%',
  height: '100%',
}

const summary = computed(() => getActivitySummary(props.slot, t))
const internalPreview = computed(() => getInternalPreview(props.slot))
const notes = computed(() => buildNotes(props.slot))
const chips = computed(() =>
  buildSlotChips(props.slot, {
    t,
    currency: props.currency,
    platform: props.platform,
  })
)
const needsBooking = computed(() => {
  const rec = props.slot?.details?.recommendations
  return !!(rec?.bookingRequired || isTransportOrAccommodation(props.slot))
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
  margin-bottom: 16px;
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

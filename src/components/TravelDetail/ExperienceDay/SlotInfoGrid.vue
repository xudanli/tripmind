<template>
  <div class="slot-info-grid">
    <div class="slot-info-grid__column">
      <InfoBlock
        v-if="transportText"
        icon="🚌"
        :label="t('travelDetail.experienceDay.transportation')"
      >
        <span>{{ transportText }}</span>
      </InfoBlock>

      <InfoBlock
        v-if="bookingText"
        icon="📅"
        :label="t('travelDetail.experienceDay.booking')"
      >
        <span>{{ bookingText }}</span>
      </InfoBlock>

      <InfoBlock
        v-if="openingText"
        icon="🕘"
        :label="t('travelDetail.experienceDay.openingHours')"
      >
        <span>{{ openingText }}</span>
      </InfoBlock>

      <InfoBlock
        v-if="locationLines.length"
        icon="📍"
        :label="t('travelDetail.experienceDay.location')"
      >
        <div class="slot-info-grid__location">
          <div
            v-for="(line, index) in locationLines"
            :key="index"
            :class="['slot-info-grid__location-line', `slot-info-grid__location-line--${line.type}`]"
          >
            {{ line.text }}
          </div>
        </div>
      </InfoBlock>

      <InfoBlock
        v-if="bookingLinks.length"
        icon="🔗"
        :label="t('travelDetail.experienceDay.viewBookingOptions')"
      >
        <a
          v-for="(link, index) in bookingLinks"
          :key="index"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="slot-info-grid__booking-link"
        >
          {{ link.name || t('travelDetail.experienceDay.book') }} →
        </a>
      </InfoBlock>
    </div>

    <div class="slot-info-grid__column">
      <InfoBlock
        v-if="outfit"
        icon="👗"
        :label="t('travelDetail.experienceDay.outfitSuggestions')"
      >
        <span>{{ outfit }}</span>
      </InfoBlock>

      <InfoBlock
        v-if="culture"
        icon="🌍"
        :label="t('travelDetail.experienceDay.culturalTips')"
      >
        <span>{{ culture }}</span>
      </InfoBlock>

      <InfoBlock
        v-if="preTrip"
        icon="💡"
        :label="t('travelDetail.experienceDay.preTripAdvice')"
      >
        <span>{{ preTrip }}</span>
      </InfoBlock>

      <InfoBlock
        v-if="pricingText"
        icon="💵"
        :label="t('travelDetail.experienceDay.pricingDetails')"
      >
        <span>{{ pricingText }}</span>
      </InfoBlock>

      <InfoBlock
        v-if="notSuitable"
        icon="⚠️"
        :label="t('travelDetail.experienceDay.notSuitableFor')"
      >
        <span>{{ notSuitable }}</span>
      </InfoBlock>

      <InfoBlock
        v-if="notes && notes.length"
        icon="📌"
        :label="t('travelDetail.experienceDay.notes')"
      >
        <ul class="slot-info-grid__notes">
          <li v-for="(note, index) in notes" :key="index">{{ note }}</li>
        </ul>
      </InfoBlock>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CurrencyInfo } from '@/utils/currency'
import {
  buildBookingText,
  buildPreTrip,
  buildPricing,
  buildTransportText,
  formatOpeningHours,
  getSlotLocationLines,
  type LocationLineEntry,
} from './slotFormatters'

interface SlotInfoGridProps {
  slot: Record<string, any>
  currency: CurrencyInfo | null
  platform: string | null
  notes?: string[]
  bookingLinks: Array<{ name?: string; url: string }>
}

const props = withDefaults(defineProps<SlotInfoGridProps>(), {
  bookingLinks: () => [],
  notes: () => [],
})

const { t } = useI18n()

const transportText = computed(() => buildTransportText(props.slot.details?.transportation, t))
const bookingText = computed(() => buildBookingText(props.slot, t))
const openingText = computed(() => formatOpeningHours(props.slot.details?.openingHours?.hours || ''))
const locationLines = computed<LocationLineEntry[]>(() => getSlotLocationLines(props.slot))
const outfit = computed(() => props.slot.details?.recommendations?.outfitSuggestions || '')
const culture = computed(() => props.slot.details?.recommendations?.culturalTips || '')
const preTrip = computed(() => buildPreTrip(props.slot.details?.recommendations, t))
const pricingText = computed(() => {
  if (!props.slot.details?.pricing) return null
  return buildPricing(props.slot.details.pricing, props.currency || { code: 'CNY', symbol: '¥', name: '人民币' }, t)
})
const notSuitable = computed(() => props.slot.details?.recommendations?.notSuitableFor || '')
const notes = computed(() => (props.notes?.length ? props.notes : []))

const InfoBlock = defineComponent({
  name: 'InfoBlock',
  props: {
    icon: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () =>
      h('section', { class: 'info-block' }, [
        h('header', { class: 'info-block__header' }, [
          h('span', { class: 'info-block__icon' }, props.icon),
          h('span', { class: 'info-block__label' }, props.label),
        ]),
        h('div', { class: 'info-block__content' }, slots.default?.()),
      ])
  },
})
</script>

<style scoped>
.slot-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.slot-info-grid__column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-block {
  background: #fafafa;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-block__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.info-block__icon {
  font-size: 18px;
}

.info-block__content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  word-break: break-word;
}

.slot-info-grid__location {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-info-grid__location-line {
  font-size: 14px;
}

.slot-info-grid__location-line--primary {
  font-weight: 600;
  color: #111827;
}

.slot-info-grid__location-line--english {
  color: #374151;
}

.slot-info-grid__location-line--chinese {
  color: #111827;
}

.slot-info-grid__location-line--landmark {
  color: #2563eb;
}

.slot-info-grid__notes {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
}

.slot-info-grid__booking-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #2563eb;
  text-decoration: none;
}

.slot-info-grid__booking-link:hover {
  text-decoration: underline;
}
</style>

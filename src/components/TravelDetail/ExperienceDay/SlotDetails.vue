/**
 * SlotDetails - 详情区域组件
 * 显示费用、交通、预订、亮点等详细信息
 */

<template>
  <div class="time-slot__detail-layer">
    <!-- Section 0: 费用信息 -->
    <div class="time-slot__detail-section" v-if="hasCost">
      <h4 class="time-slot__detail-section-title">
        <span class="time-slot__detail-section-icon">💰</span>
        {{ t('travelDetail.experienceDay.cost') }}
      </h4>
      <div class="time-slot__cost-text">
        {{ costText }}
      </div>
    </div>

    <!-- Section 1: 交通信息 -->
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
    <div class="time-slot__detail-section" v-if="showBookingSection">
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
      <div v-if="hasBookingLinks" class="time-slot__booking-links-section">
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

    <!-- Section 3: 核心亮点 -->
    <div class="time-slot__detail-section" v-if="hasHighlights">
      <h4 class="time-slot__detail-section-title">
        <span class="time-slot__detail-section-icon">✨</span>
        核心亮点
      </h4>
      <ul class="time-slot__highlights-list">
        <li v-for="(highlight, index) in highlightsList" :key="index" class="time-slot__highlights-item">
          {{ highlight }}
        </li>
      </ul>
    </div>

    <!-- Section 4: 行家建议 -->
    <div class="time-slot__detail-section" v-if="slot.details?.insiderTip">
      <h4 class="time-slot__detail-section-title">
        <span class="time-slot__detail-section-icon">💡</span>
        行家建议
      </h4>
      <div class="time-slot__insider-tip-text">
        {{ slot.details.insiderTip }}
      </div>
    </div>

    <!-- Section 5: 预约要求 -->
    <div class="time-slot__detail-section" v-if="slot.details?.bookingSignal">
      <h4 class="time-slot__detail-section-title">
        <span class="time-slot__detail-section-icon">📋</span>
        预约要求
      </h4>
      <div class="time-slot__booking-signal-text">
        {{ slot.details.bookingSignal }}
      </div>
    </div>

    <!-- Section 6: 最佳游览时间和注意事项 -->
    <div class="time-slot__detail-section" v-if="hasVisitTips">
      <h4 class="time-slot__detail-section-title">
        <span class="time-slot__detail-section-icon">🌟</span>
        {{ t('travelDetail.experienceDay.visitTips') }}
      </h4>
      <div class="time-slot__visit-tips-text">
        <div v-if="slot.details?.recommendations?.bestTimeToVisit" class="visit-tip-item">
          <strong>最佳游览时间：</strong>{{ slot.details.recommendations.bestTimeToVisit }}
        </div>
        <div v-if="slot.details?.recommendations?.visitDuration" class="visit-tip-item">
          <strong>建议停留时长：</strong>{{ visitDurationText }}
        </div>
        <div v-if="slot.details?.recommendations?.visitTips" class="visit-tip-item">
          {{ slot.details.recommendations.visitTips }}
        </div>
      </div>
    </div>

    <!-- Section 7: 无障碍设施 -->
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
    <div class="time-slot__detail-section" v-if="hasNearbyAttractions">
      <h4 class="time-slot__detail-section-title">
        <span class="time-slot__detail-section-icon">📍</span>
        {{ t('travelDetail.experienceDay.nearbyAttractions') }}
      </h4>
      <div class="time-slot__attraction-tags">
        <span
          v-for="(attraction, index) in nearbyAttractionsList"
          :key="index"
          class="time-slot__attraction-tag"
          :class="{ 'time-slot__attraction-tag--clickable': true }"
          @click.stop="$emit('add-nearby-attraction', attraction)"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimeSlot } from './types'
import { useSlotFormatting } from '@/composables/useSlotFormatting'

interface Props {
  slot: TimeSlot
  currency?: any
}

const props = defineProps<Props>()

defineEmits<{
  book: []
  'add-nearby-attraction': [attraction: { name: string; distance?: string; image?: string }]
}>()

const { t } = useI18n()
const { hasCost, getCostText, formatVisitDuration } = useSlotFormatting(props.slot, props.currency)

// 计算属性
const costText = computed(() => getCostText())

const showBookingSection = computed(() => {
  return !!(
    props.slot.details?.openingHours ||
    props.slot.details?.recommendations?.bookingInfo ||
    props.slot.bookingLinks?.length
  )
})

const hasBookingLinks = computed(() => {
  return Array.isArray(props.slot.bookingLinks) && props.slot.bookingLinks.length > 0
})

const hasHighlights = computed(() => {
  return Array.isArray(props.slot.details?.highlights) && props.slot.details.highlights.length > 0
})

const highlightsList = computed(() => {
  return props.slot.details?.highlights || []
})

const hasVisitTips = computed(() => {
  return !!(
    props.slot.details?.recommendations?.visitTips ||
    props.slot.details?.recommendations?.bestTimeToVisit ||
    props.slot.details?.recommendations?.visitDuration
  )
})

const visitDurationText = computed(() => {
  return formatVisitDuration(props.slot.details?.recommendations?.visitDuration)
})

const hasNearbyAttractions = computed(() => {
  const nearby = props.slot.nearbyAttractions
  if (!nearby) return false
  if (typeof nearby === 'string') return nearby.trim().length > 0
  if (Array.isArray(nearby)) return nearby.length > 0
  return false
})

const nearbyAttractionsList = computed(() => {
  const nearby = props.slot.nearbyAttractions
  if (!nearby) return []
  
  if (typeof nearby === 'string') {
    return nearby.split(/[、,，]/).map(name => ({ name: name.trim() })).filter(item => item.name)
  }
  
  if (Array.isArray(nearby)) {
    return nearby.map(item => {
      if (typeof item === 'string') {
        return { name: item }
      }
      if (typeof item === 'object' && item.name) {
        return item
      }
      return null
    }).filter(Boolean) as Array<{ name: string; distance?: string; image?: string }>
  }
  
  return []
})
</script>

<style scoped>
.time-slot__detail-layer,
.time-slot__collapsible-layer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.time-slot__detail-section {
  padding: 16px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.time-slot__detail-section:last-child {
  border-bottom: none;
}

.time-slot__detail-section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-slot__detail-section-title--main {
  font-size: 18px;
  color: #1e40af;
}

.time-slot__detail-section-icon {
  font-size: 18px;
}

.time-slot__cost-text,
.time-slot__transportation-text,
.time-slot__opening-hours-text,
.time-slot__booking-info-text,
.time-slot__insider-tip-text,
.time-slot__booking-signal-text,
.time-slot__accessibility-text,
.time-slot__outfit-suggestions-text,
.time-slot__cultural-tips-text {
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
}

.time-slot__opening-hours-section,
.time-slot__booking-links-section,
.time-slot__booking-info-section {
  margin-top: 12px;
}

.time-slot__booking-links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot__booking-link-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 8px;
  text-decoration: none;
  color: #1e40af;
  transition: all 0.2s;
}

.time-slot__booking-link-card:hover {
  background: rgba(59, 130, 246, 0.15);
  transform: translateX(2px);
}

.time-slot__booking-link-icon {
  font-size: 16px;
}

.time-slot__booking-link-name {
  flex: 1;
  font-weight: 500;
}

.time-slot__booking-link-arrow {
  font-size: 16px;
}

.time-slot__detail-button {
  margin-top: 12px;
}

.time-slot__highlights-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.time-slot__highlights-item {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
  position: relative;
}

.time-slot__highlights-item::before {
  content: '✨';
  position: absolute;
  left: -20px;
}

.time-slot__visit-tips-text {
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
}

.visit-tip-item {
  margin-bottom: 8px;
}

.visit-tip-item strong {
  color: #0f172a;
  font-weight: 600;
}

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
  background: rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  font-size: 13px;
  color: #475569;
}

.time-slot__attraction-tag--clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.time-slot__attraction-tag--clickable:hover {
  background: rgba(59, 130, 246, 0.15);
  color: #1e40af;
}

.time-slot__attraction-tag-distance {
  font-size: 11px;
  color: #64748b;
}

.time-slot__attraction-tag-icon {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
}
</style>


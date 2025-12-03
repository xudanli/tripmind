<template>
  <div class="slot-details">
    <div class="info-grid" v-if="hasEssentialInfo">
      <div class="info-card info-card--cost" v-if="hasCost">
        <div class="info-card__icon">💰</div>
        <div class="info-card__content">
          <div class="info-card__label">{{ t('travelDetail.experienceDay.cost') }}</div>
          <div class="info-card__value">{{ costText }}</div>
        </div>
      </div>

      <div class="info-card info-card--transport" v-if="slot.details?.transportation">
        <div class="info-card__icon">🚍</div>
        <div class="info-card__content">
          <div class="info-card__label">{{ t('travelDetail.experienceDay.transportation') }}</div>
          <div class="info-card__value">{{ slot.details.transportation }}</div>
        </div>
      </div>

      <div class="info-card info-card--access" v-if="slot.details?.accessibility">
        <div class="info-card__icon">♿</div>
        <div class="info-card__content">
          <div class="info-card__label">{{ t('travelDetail.experienceDay.accessibility') }}</div>
          <div class="info-card__value">{{ slot.details.accessibility }}</div>
        </div>
      </div>
    </div>

    <div class="booking-card" v-if="showBookingSection">
      <div class="booking-card__header">
        <span class="section-icon">📅</span>
        <span class="section-title">{{ t('travelDetail.experienceDay.openingHoursAndBooking') }}</span>
      </div>
      
      <div class="booking-card__body">
        <div v-if="slot.details?.openingHours" class="booking-row">
          <span class="booking-label">🕒 {{ t('travelDetail.experienceDay.openingTime') || '开放时间：' }}</span>
          <span class="booking-value">{{ slot.details.openingHours }}</span>
        </div>

        <div v-if="slot.details?.bookingSignal" class="booking-row">
          <span class="booking-label">📋 {{ t('travelDetail.experienceDay.bookingRequirement') || '预约要求：' }}</span>
          <span class="booking-value highlight">{{ slot.details.bookingSignal }}</span>
        </div>

        <div v-if="slot.details?.recommendations?.bookingInfo" class="booking-info-text">
          {{ slot.details.recommendations.bookingInfo }}
        </div>

        <div v-if="hasBookingLinks" class="booking-links-grid">
          <a
            v-for="(link, linkIndex) in slot.bookingLinks"
            :key="linkIndex"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="booking-link-btn"
          >
            <span class="link-icon">🔗</span>
            <span class="link-text">{{ link.name || t('travelDetail.experienceDay.bookingLink') || '预订链接' }}</span>
            <span class="link-arrow">→</span>
          </a>
        </div>

        <div v-if="slot.details?.recommendations?.bookingInfo && !hasBookingLinks" class="booking-action">
          <a-button type="primary" block @click="$emit('book')">
            {{ t('travelDetail.experienceDay.bookNow') }}
          </a-button>
        </div>
      </div>
    </div>

    <div class="detail-section" v-if="hasHighlights">
      <h4 class="section-header">
        <span class="section-icon">✨</span>
        {{ t('travelDetail.experienceDay.highlights') || '核心亮点' }}
      </h4>
      <ul class="highlights-list">
        <li v-for="(highlight, index) in highlightsList" :key="index" class="highlight-item">
          {{ highlight }}
        </li>
      </ul>
    </div>

    <div class="tips-container" v-if="hasTips">
      <div class="tip-block" v-if="slot.details?.insiderTip">
        <div class="tip-title">💡 {{ t('travelDetail.experienceDay.insiderTip') || '行家建议' }}</div>
        <div class="tip-content">{{ slot.details.insiderTip }}</div>
      </div>

      <div class="tip-block" v-if="hasVisitTips">
        <div class="tip-title">🌟 {{ t('travelDetail.experienceDay.visitTipsTitle') || '游览贴士' }}</div>
        <div class="tip-content">
          <div v-if="slot.details?.recommendations?.bestTimeToVisit" class="tip-row">
            <span class="tip-label">{{ t('travelDetail.experienceDay.bestTimeLabel') || '最佳时间：' }}</span>{{ slot.details.recommendations.bestTimeToVisit }}
          </div>
          <div v-if="slot.details?.recommendations?.visitDuration" class="tip-row">
            <span class="tip-label">{{ t('travelDetail.experienceDay.suggestedDurationLabel') || '建议时长：' }}</span>{{ visitDurationText }}
          </div>
          <div v-if="slot.details?.recommendations?.visitTips" class="tip-text">
            {{ slot.details.recommendations.visitTips }}
          </div>
        </div>
      </div>

      <div class="tip-grid">
        <div class="tip-mini-card" v-if="slot.details?.recommendations?.outfitSuggestions">
          <span class="mini-icon">👕</span>
          <div class="mini-content">
            <div class="mini-title">{{ t('travelDetail.experienceDay.outfitSuggestions') }}</div>
            <div class="mini-text">{{ slot.details.recommendations.outfitSuggestions }}</div>
          </div>
        </div>
        <div class="tip-mini-card" v-if="slot.details?.recommendations?.culturalTips">
          <span class="mini-icon">🤝</span>
          <div class="mini-content">
            <div class="mini-title">{{ t('travelDetail.experienceDay.culturalTips') }}</div>
            <div class="mini-text">{{ slot.details.recommendations.culturalTips }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-section" v-if="hasNearbyAttractions">
      <h4 class="section-header">
        <span class="section-icon">📍</span>
        {{ t('travelDetail.experienceDay.nearbyAttractions') }}
      </h4>
      <div class="attraction-tags">
        <span
          v-for="(attraction, index) in nearbyAttractionsList"
          :key="index"
          class="attraction-tag"
          @click.stop="$emit('add-nearby-attraction', attraction)"
          :title="t('travelDetail.experienceDay.addToItinerary')"
        >
          <span class="tag-name">{{ attraction.name }}</span>
          <span v-if="attraction.distance" class="tag-dist">{{ attraction.distance }}</span>
          <span class="tag-action">+</span>
        </span>
      </div>
    </div>

    <!-- 获取位置信息按钮 -->
    <div class="location-action-section" v-if="!hasLocationInfo && slot.title && slot.coordinates">
      <a-button
        type="primary"
        :loading="props.loadingLocation"
        block
        @click="handleFetchLocation"
        class="fetch-location-btn"
      >
        <template #icon>
          <span>📍</span>
        </template>
        {{ t('travelDetail.experienceDay.fetchLocationInfo') || '立即获取位置信息' }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import type { TimeSlot } from './types'
import { useSlotFormatting } from '@/composables/useSlotFormatting'
import { hasCompleteLocationInfo } from '@/utils/locationCheck'

interface Props {
  slot: TimeSlot
  currency?: any
  loadingLocation?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  book: []
  'add-nearby-attraction': [attraction: { name: string; distance?: string; image?: string }]
  'fetch-location': []
}>()

// 检查是否已有完整的位置信息
const hasLocationInfo = computed(() => {
  return hasCompleteLocationInfo(props.slot.details)
})

// 处理获取位置信息
const handleFetchLocation = () => {
  if (props.loadingLocation) return
  emit('fetch-location')
}

const { t } = useI18n()
// 使用单个 slot 模式，与 SlotInfoBar.vue 保持一致
const { getCostText, formatVisitDuration } = useSlotFormatting(props.slot, props.currency)

// --- 计算属性 ---

// 1. 基础信息
const costText = computed(() => getCostText()) // 单个模式下 getCostText 不需要参数

const hasCost = computed(() => {
  return !!(props.slot.cost || props.slot.details?.pricing?.detail)
})

const hasEssentialInfo = computed(() => {
  return hasCost.value || props.slot.details?.transportation || props.slot.details?.accessibility
})

// 2. 预订信息
const showBookingSection = computed(() => {
  return !!(
    props.slot.details?.openingHours ||
    props.slot.details?.recommendations?.bookingInfo ||
    props.slot.bookingLinks?.length ||
    props.slot.details?.bookingSignal
  )
})

const hasBookingLinks = computed(() => {
  return Array.isArray(props.slot.bookingLinks) && props.slot.bookingLinks.length > 0
})

// 3. 亮点
const hasHighlights = computed(() => {
  return Array.isArray(props.slot.details?.highlights) && props.slot.details.highlights.length > 0
})

const highlightsList = computed(() => {
  return props.slot.details?.highlights || []
})

// 4. 贴士
const hasVisitTips = computed(() => {
  return !!(
    props.slot.details?.recommendations?.visitTips ||
    props.slot.details?.recommendations?.bestTimeToVisit ||
    props.slot.details?.recommendations?.visitDuration
  )
})

const hasTips = computed(() => {
  return !!(
    props.slot.details?.insiderTip || 
    hasVisitTips.value || 
    props.slot.details?.recommendations?.outfitSuggestions ||
    props.slot.details?.recommendations?.culturalTips
  )
})

const visitDurationText = computed(() => {
  return formatVisitDuration(props.slot.details?.recommendations?.visitDuration)
})

// 5. 附近景点
const hasNearbyAttractions = computed(() => {
  const nearby = props.slot.details?.recommendations?.nearbyAttractions
  if (!nearby) return false
  if (typeof nearby === 'string') return nearby.trim().length > 0
  if (Array.isArray(nearby)) return nearby.length > 0
  return false
})

const nearbyAttractionsList = computed(() => {
  const nearby = props.slot.details?.recommendations?.nearbyAttractions
  if (!nearby) return []
  
  if (typeof nearby === 'string') {
    // 支持多种分隔符：中文顿号、逗号、英文逗号
    return nearby.split(/[、,，]/).map(item => {
      const trimmed = item.trim()
      // 尝试提取距离 (例如: "景点A (500m)")
      const match = trimmed.match(/^(.+?)(?:\s*[（(](.+?)[）)])?$/)
      if (match) {
        return { name: match[1].trim(), distance: match[2] ? match[2].trim() : undefined }
      }
      return { name: trimmed }
    }).filter(item => item.name)
  }
  
  if (Array.isArray(nearby)) {
    return nearby.map(item => {
      if (typeof item === 'string') return { name: item }
      if (typeof item === 'object' && item.name) return item
      return null
    }).filter(Boolean) as Array<{ name: string; distance?: string; image?: string }>
  }
  
  return []
})
</script>

<style scoped>
.slot-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 8px;
}

/* --- 1. 信息网格 --- */
.info-grid {
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  flex-wrap: nowrap; /* 强制单行显示，不换行 */
}

.info-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  flex: 1; /* 每个卡片平均分配空间 */
  min-width: 0; /* 允许收缩 */
  flex-shrink: 0; /* 防止过度收缩 */
}

.info-card__icon {
  font-size: 18px;
  flex-shrink: 0; /* 图标不收缩 */
}

.info-card__content {
  flex: 1;
  min-width: 0; /* 防止文本溢出 */
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-card__label {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap; /* 标签不换行 */
}

.info-card__value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.4;
  /* 文本过长时显示省略号 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 最多显示2行 */
  -webkit-box-orient: vertical;
  word-break: break-word;
}

/* --- 2. 预订卡片 --- */
.booking-card {
  background: #f0f9ff; /* 浅蓝色背景 */
  border: 1px solid #bae6fd;
  border-radius: 16px;
  overflow: hidden;
}

.booking-card__header {
  padding: 12px 16px;
  background: rgba(186, 230, 253, 0.2);
  border-bottom: 1px solid rgba(186, 230, 253, 0.5);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #0369a1;
}

.booking-card__body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booking-row {
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
}

.booking-label {
  color: #64748b;
  font-weight: 500;
}

.booking-value.highlight {
  color: #0284c7;
  font-weight: 600;
}

.booking-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin-top: 4px;
}

.booking-link-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #bae6fd;
  text-decoration: none;
  color: #0284c7;
  font-size: 13px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.booking-link-btn:hover {
  background: #e0f2fe;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(2, 132, 199, 0.1);
}

.link-arrow {
  font-size: 16px;
  line-height: 1;
  opacity: 0.6;
}

/* --- 3. 核心亮点 --- */
.section-header {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.highlights-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.highlight-item {
  position: relative;
  padding-left: 24px;
  font-size: 15px;
  color: #334155;
  line-height: 1.6;
}

.highlight-item::before {
  content: '✦';
  position: absolute;
  left: 0;
  color: #f59e0b; /* 金色 */
  font-size: 16px;
}

/* --- 4. 贴士容器 --- */
.tips-container {
  background: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tip-block {
  padding-bottom: 16px;
  border-bottom: 1px dashed #e2e8f0;
}

.tip-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tip-content {
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
}

.tip-row {
  margin-bottom: 4px;
}

.tip-label {
  color: #475569;
  font-weight: 500;
}

.tip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.tip-mini-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  gap: 10px;
}

.mini-icon {
  font-size: 20px;
}

.mini-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}

.mini-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.4;
}

/* --- 获取位置信息按钮区域 --- */
.location-action-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.fetch-location-btn {
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 12px;
}

/* --- 5. 附近景点 --- */
.attraction-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attraction-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.attraction-tag:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-1px);
}

.tag-dist {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 6px;
  border-left: 1px solid #e2e8f0;
}

.tag-action {
  font-weight: bold;
  margin-left: 4px;
  font-size: 16px;
  line-height: 1;
}
</style>
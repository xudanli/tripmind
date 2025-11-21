<template>
  <div class="slot-info-grid" :class="{ 'slot-info-grid--planner': isPlannerMode }">
    <!-- Planner 模式：左右两栏布局 -->
    <template v-if="isPlannerMode">
      <div class="slot-info-grid__layout">
        <!-- 左侧主内容列 (60-70%) -->
        <div class="slot-info-grid__main">
          <!-- 实用游览建议（黄色背景块）- 放在最顶部 -->
          <div v-if="visitTips" id="overview" class="slot-info-grid__section">
            <div class="slot-info-grid__tips-wrapper">
              <div class="slot-info-grid__tips-narration" :class="{ 'slot-info-grid__tips-narration--collapsed': !tipsExpanded }">
                <span class="slot-info-grid__tips-icon">💡</span>
                <div class="slot-info-grid__tips-content">
                  <p v-if="visitTips.bestTime" class="slot-info-grid__tips-item">
                    {{ visitTips.bestTime }}
                  </p>
                </div>
              </div>
              <a-button
                v-if="shouldShowExpandButton"
                type="link"
                size="small"
                class="slot-info-grid__tips-expand-btn"
                @click="tipsExpanded = !tipsExpanded"
              >
                {{ tipsExpanded ? t('travelDetail.experienceDay.collapse') : t('travelDetail.experienceDay.expand') }}
              </a-button>
            </div>
          </div>

          <!-- 基础信息分组卡片 -->
          <div id="transport-time" class="slot-info-grid__section">
            <div class="slot-info-grid__card slot-info-grid__card--two-columns">
              <div class="slot-info-grid__card-column">
                <!-- 位置 -->
                <div v-if="locationLines.length" class="slot-info-grid__card-section">
                  <div class="slot-info-grid__card-header">
                    <span class="slot-info-grid__card-icon">📍</span>
                    <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.location') }}</span>
                    <a-button type="link" size="small" class="slot-info-grid__card-action" @click="handleNavigate">
                      {{ t('travelDetail.experienceDay.viewMap') }}
                    </a-button>
                  </div>
                  <div class="slot-info-grid__location">
                    <div
                      v-for="(line, index) in locationLines"
                      :key="index"
                      :class="['slot-info-grid__location-line', `slot-info-grid__location-line--${line.type}`]"
                    >
                      {{ line.text }}
                    </div>
                  </div>
                </div>

                <!-- 交通 -->
                <div v-if="transportInfo" class="slot-info-grid__card-section">
                  <div class="slot-info-grid__card-header">
                    <span class="slot-info-grid__card-icon">🚌</span>
                    <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.transportation') }}</span>
                  </div>
        <template v-if="transportInfo.summary || transportInfo.items.length">
          <p v-if="transportInfo.summary" class="slot-info-grid__text">{{ transportInfo.summary }}</p>
          <ul v-if="transportInfo.items.length" class="slot-info-grid__list">
            <li v-for="(item, index) in transportInfo.items" :key="index">{{ item }}</li>
          </ul>
        </template>
                </div>
              </div>

              <div class="slot-info-grid__card-column">
                <!-- 开放时间 -->
                <div v-if="openingHours" class="slot-info-grid__card-section">
                  <div class="slot-info-grid__card-header">
                    <span class="slot-info-grid__card-icon">🕘</span>
                    <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.openingHours') }}</span>
                  </div>
                  <span>{{ openingHours }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 费用与预订 -->
          <div id="pricing-booking" class="slot-info-grid__section">
            <div class="slot-info-grid__card">
              <!-- 费用详情 -->
              <div v-if="pricingText || hasActivityCost" class="slot-info-grid__card-section">
                <div class="slot-info-grid__card-header">
                  <span class="slot-info-grid__card-icon">💵</span>
                  <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.pricingDetails') }}</span>
                </div>
                <div class="slot-info-grid__pricing">
                  <p v-if="hasActivityCost" class="slot-info-grid__pricing-main">
                    <strong>{{ t('travelDetail.experienceDay.estimatedCost') }}：</strong>
                    {{ activityCostText }}
                  </p>
                  <p v-if="pricingText" class="slot-info-grid__pricing-detail">{{ pricingText }}</p>
                </div>
              </div>

              <!-- 预订 -->
              <div v-if="bookingText" class="slot-info-grid__card-section">
                <div class="slot-info-grid__card-header">
                  <span class="slot-info-grid__card-icon">📅</span>
                  <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.booking') }}</span>
                </div>
                <span>{{ bookingText }}</span>
              </div>
            </div>
          </div>

          <!-- 实用提示（穿搭/文化/安全） -->
          <div v-if="outfitList.length || cultureList.length || accessibilityInfo" id="tips" class="slot-info-grid__section">
            <div class="slot-info-grid__card">
              <!-- 穿搭建议 -->
              <div v-if="outfitList.length && props.slot.details?.recommendations?.outfitSuggestions" class="slot-info-grid__card-section">
                <div class="slot-info-grid__card-header">
                  <span class="slot-info-grid__card-icon">👗</span>
                  <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.outfitSuggestions') }}</span>
                </div>
                <div class="slot-info-grid__card-content" :class="{ 'slot-info-grid__card-content--collapsed': !outfitExpanded }">
                  <ul class="slot-info-grid__list">
                    <li v-for="(item, index) in outfitList" :key="index">{{ item }}</li>
                  </ul>
                </div>
                <a-button
                  v-if="outfitList.length > 2"
                  type="link"
                  size="small"
                  class="slot-info-grid__expand-btn"
                  @click="outfitExpanded = !outfitExpanded"
                >
                  {{ outfitExpanded ? t('travelDetail.experienceDay.collapse') : t('travelDetail.experienceDay.expand') }}
                </a-button>
              </div>

              <!-- 文化提示 -->
              <div v-if="cultureList.length && props.slot.details?.recommendations?.culturalTips" class="slot-info-grid__card-section">
                <div class="slot-info-grid__card-header">
                  <span class="slot-info-grid__card-icon">🌍</span>
                  <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.culturalTips') }}</span>
                </div>
                <div class="slot-info-grid__card-content" :class="{ 'slot-info-grid__card-content--collapsed': !cultureExpanded }">
                  <ul class="slot-info-grid__list">
                    <li v-for="(item, index) in cultureList" :key="index">{{ item }}</li>
                  </ul>
                </div>
                <a-button
                  v-if="cultureList.length > 2"
                  type="link"
                  size="small"
                  class="slot-info-grid__expand-btn"
                  @click="cultureExpanded = !cultureExpanded"
                >
                  {{ cultureExpanded ? t('travelDetail.experienceDay.collapse') : t('travelDetail.experienceDay.expand') }}
                </a-button>
              </div>

              <!-- 无障碍设施 -->
              <div v-if="accessibilityInfo" class="slot-info-grid__card-section">
                <div class="slot-info-grid__card-header">
                  <span class="slot-info-grid__card-icon">♿</span>
                  <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.accessibility') }}</span>
                </div>
                <div class="slot-info-grid__card-content">
                  <span>{{ accessibilityInfo }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 附近景点 -->
          <div v-if="nearbyAttractionsText" id="nearby" class="slot-info-grid__section">
            <div class="slot-info-grid__card">
              <div class="slot-info-grid__card-header">
                <span class="slot-info-grid__card-icon">📍</span>
                <span class="slot-info-grid__card-title">{{ t('travelDetail.experienceDay.nearbyAttractions') }}</span>
              </div>
              <div class="slot-info-grid__nearby-tags">
                <span
                  v-for="(attraction, index) in nearbyAttractionsList"
                  :key="index"
                  class="slot-info-grid__nearby-tag"
                >
                  {{ attraction }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧辅助信息列 (30-40%) -->
        <div class="slot-info-grid__sidebar">
          <!-- 穿搭建议 -->
          <div v-if="outfitList.length && props.slot.details?.recommendations?.outfitSuggestions" class="slot-info-grid__sidebar-card">
            <div class="slot-info-grid__sidebar-header">
              <span class="slot-info-grid__sidebar-icon">👗</span>
              <span class="slot-info-grid__sidebar-title">{{ t('travelDetail.experienceDay.outfitSuggestions') }}</span>
            </div>
            <div class="slot-info-grid__sidebar-content" :class="{ 'slot-info-grid__sidebar-content--collapsed': !outfitExpanded }">
              <ul class="slot-info-grid__list">
                <li v-for="(item, index) in outfitList" :key="index">{{ item }}</li>
              </ul>
            </div>
            <a-button
              v-if="outfitList.length > 2"
              type="link"
              size="small"
              class="slot-info-grid__expand-btn"
              @click="outfitExpanded = !outfitExpanded"
            >
              {{ outfitExpanded ? t('travelDetail.experienceDay.collapse') : t('travelDetail.experienceDay.expand') }}
            </a-button>
          </div>

          <!-- 文化提示 -->
          <div v-if="cultureList.length && props.slot.details?.recommendations?.culturalTips" class="slot-info-grid__sidebar-card">
            <div class="slot-info-grid__sidebar-header">
              <span class="slot-info-grid__sidebar-icon">🌍</span>
              <span class="slot-info-grid__sidebar-title">{{ t('travelDetail.experienceDay.culturalTips') }}</span>
            </div>
            <div class="slot-info-grid__sidebar-content" :class="{ 'slot-info-grid__sidebar-content--collapsed': !cultureExpanded }">
              <ul class="slot-info-grid__list">
                <li v-for="(item, index) in cultureList" :key="index">{{ item }}</li>
              </ul>
            </div>
            <a-button
              v-if="cultureList.length > 2"
              type="link"
              size="small"
              class="slot-info-grid__expand-btn"
              @click="cultureExpanded = !cultureExpanded"
            >
              {{ cultureExpanded ? t('travelDetail.experienceDay.collapse') : t('travelDetail.experienceDay.expand') }}
            </a-button>
          </div>

          <!-- 无障碍设施 -->
          <div v-if="accessibilityInfo" class="slot-info-grid__sidebar-card">
            <div class="slot-info-grid__sidebar-header">
              <span class="slot-info-grid__sidebar-icon">♿</span>
              <span class="slot-info-grid__sidebar-title">{{ t('travelDetail.experienceDay.accessibility') }}</span>
            </div>
            <div class="slot-info-grid__sidebar-content">
              <span>{{ accessibilityInfo }}</span>
            </div>
          </div>

          <!-- 联系方式 -->
          <div v-if="contactInfo" class="slot-info-grid__sidebar-card">
            <div class="slot-info-grid__sidebar-header">
              <span class="slot-info-grid__sidebar-icon">📞</span>
              <span class="slot-info-grid__sidebar-title">{{ t('travelDetail.experienceDay.contact') }}</span>
            </div>
            <div class="slot-info-grid__sidebar-content">
              <div class="slot-info-grid__contact-links" v-html="contactInfo ? formatContactInfo(contactInfo) : ''"></div>
            </div>
          </div>
         </div>
      </div>
    </template>

    <!-- 原有单栏布局（非 planner 模式） -->
    <template v-else>
      <!-- 位置信息 - 优先显示 -->
      <InfoBlock
        v-if="locationLines.length"
        icon="📍"
        :label="t('travelDetail.experienceDay.location')"
      class="info-block--location"
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

    <!-- 交通信息 -->
    <InfoBlock
      v-if="transportInfo"
      icon="🚌"
      :label="t('travelDetail.experienceDay.transportation')"
      class="info-block--transportation"
    >
      <template v-if="transportInfo.summary || transportInfo.items.length">
        <p v-if="transportInfo.summary" class="slot-info-grid__text">{{ transportInfo.summary }}</p>
        <ul v-if="transportInfo.items.length" class="slot-info-grid__list">
          <li v-for="(item, index) in transportInfo.items" :key="index">{{ item }}</li>
        </ul>
      </template>
    </InfoBlock>

    <!-- 开放时间 -->
    <InfoBlock
      v-if="openingHours"
      icon="🕘"
      :label="t('travelDetail.experienceDay.openingHours')"
      class="info-block--hours"
    >
      <span>{{ openingHours }}</span>
    </InfoBlock>

    <!-- 费用信息 - 突出显示 -->
    <InfoBlock
      v-if="pricingText || hasActivityCost"
      icon="💵"
      :label="t('travelDetail.experienceDay.pricingDetails')"
      class="info-block--pricing"
    >
      <div class="slot-info-grid__pricing">
        <p v-if="hasActivityCost" class="slot-info-grid__pricing-main">
          <strong>{{ t('travelDetail.experienceDay.estimatedCost') }}：</strong>
          {{ activityCostText }}
        </p>
        <p v-if="pricingText" class="slot-info-grid__pricing-detail">{{ pricingText }}</p>
      </div>
    </InfoBlock>

    <!-- 评分信息 -->
    <InfoBlock
      v-if="ratingInfo"
      icon="⭐"
      :label="t('travelDetail.experienceDay.rating')"
      class="info-block--rating"
    >
      <span class="slot-info-grid__rating">{{ ratingInfo }}</span>
    </InfoBlock>

    <!-- 预订信息 -->
    <InfoBlock
      v-if="bookingText"
      icon="📅"
      :label="t('travelDetail.experienceDay.booking')"
      class="info-block--booking"
    >
      <span>{{ bookingText }}</span>
    </InfoBlock>

    <!-- 最佳游览时间 - 使用活动亮点样式 -->
    <div v-if="visitTips" class="slot-info-grid__tips-wrapper">
      <div class="slot-info-grid__tips-narration">
        <span class="slot-info-grid__tips-icon">💡</span>
        <div class="slot-info-grid__tips-content">
          <p v-if="visitTips.bestTime" class="slot-info-grid__tips-item">
            {{ visitTips.bestTime }}
          </p>
        </div>
      </div>
    </div>

    <!-- 着装建议 - planner 模式显示后端返回的数据 -->
    <InfoBlock
      v-if="outfitList.length && (!isPlannerMode || props.slot.details?.recommendations?.outfitSuggestions)"
      icon="👗"
      :label="t('travelDetail.experienceDay.outfitSuggestions')"
      class="info-block--outfit"
    >
      <ul class="slot-info-grid__list">
        <li v-for="(item, index) in outfitList" :key="index">{{ item }}</li>
      </ul>
    </InfoBlock>

    <!-- 文化提示 - planner 模式显示后端返回的数据 -->
    <InfoBlock
      v-if="cultureList.length && (!isPlannerMode || props.slot.details?.recommendations?.culturalTips)"
      icon="🌍"
      :label="t('travelDetail.experienceDay.culturalTips')"
      class="info-block--culture"
    >
      <ul class="slot-info-grid__list">
        <li v-for="(item, index) in cultureList" :key="index">{{ item }}</li>
      </ul>
    </InfoBlock>

    <!-- 行前建议 - planner 模式不显示（灵感模式特有字段） -->
    <InfoBlock
      v-if="preTrip && !isPlannerMode"
      icon="💡"
      :label="t('travelDetail.experienceDay.preTripAdvice')"
      class="info-block--pretrip"
    >
      <span>{{ preTrip }}</span>
    </InfoBlock>

    <!-- 不适合人群 - planner 模式不显示（灵感模式特有字段） -->
    <InfoBlock
      v-if="notSuitable && !isPlannerMode"
      icon="⚠️"
      :label="t('travelDetail.experienceDay.notSuitableFor')"
      class="info-block--warning"
    >
      <span>{{ notSuitable }}</span>
    </InfoBlock>

    <!-- 预订链接 -->
      <InfoBlock
        v-if="bookingLinks.length"
        icon="🔗"
        :label="t('travelDetail.experienceDay.viewBookingOptions')"
      class="info-block--links"
      >
      <div class="slot-info-grid__booking-links">
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
    </div>
      </InfoBlock>

    <!-- 联系方式 -->
      <InfoBlock
      v-if="contactInfo"
      icon="📞"
      :label="t('travelDetail.experienceDay.contact')"
      class="info-block--contact"
    >
      <span>{{ contactInfo }}</span>
      </InfoBlock>

    <!-- 无障碍信息 -->
      <InfoBlock
      v-if="accessibilityInfo"
      icon="♿"
      :label="t('travelDetail.experienceDay.accessibility')"
      class="info-block--accessibility"
    >
      <span>{{ accessibilityInfo }}</span>
      </InfoBlock>

    <!-- 附近景点 -->
      <InfoBlock
      v-if="nearbyAttractionsText"
      icon="📍"
      :label="t('travelDetail.experienceDay.nearbyAttractions')"
      class="info-block--nearby"
    >
      <span>{{ nearbyAttractionsText }}</span>
      </InfoBlock>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CurrencyInfo } from '@/utils/currency'
import {
  buildBookingText,
  buildPreTrip,
  buildPricing,
  buildTransportInfo,
  formatOpeningHours,
  getSlotLocationLines,
  type LocationLineEntry,
  type TransportInfo,
} from './slotFormatters'

interface SlotInfoGridProps {
  slot: Record<string, any>
  currency: CurrencyInfo | null
  platform: string | null
  notes?: string[]
  bookingLinks: Array<{ name?: string; url: string }>
  isPlannerMode?: boolean
}

const props = withDefaults(defineProps<SlotInfoGridProps>(), {
  bookingLinks: () => [],
  notes: () => [],
  isPlannerMode: false,
})

const emit = defineEmits(['navigate'])

const { t } = useI18n()

const handleNavigate = () => {
  emit('navigate')
}

const transportInfo = computed<TransportInfo | null>(() =>
  buildTransportInfo(props.slot.details?.transportation, t)
)
const bookingText = computed(() => buildBookingText(props.slot, t))
// 开放时间
const openingHours = computed(() => {
  const openingHoursData = props.slot?.details?.openingHours
  if (!openingHoursData) return null
  
  // 如果 openingHours 是字符串，直接返回
  if (typeof openingHoursData === 'string' && openingHoursData.trim()) {
    return openingHoursData.trim()
  }
  
  // 如果 openingHours 是对象，尝试使用 hours 字段
  if (typeof openingHoursData === 'object' && openingHoursData !== null) {
    if (openingHoursData.hours) {
      return formatOpeningHours(openingHoursData.hours)
    }
    // 如果对象本身有值，尝试转换为字符串
    if (Object.keys(openingHoursData).length > 0) {
      return JSON.stringify(openingHoursData)
    }
  }
  
  return null
})
const locationLines = computed<LocationLineEntry[]>(() => getSlotLocationLines(props.slot))
const normalizeList = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === 'string'
          ? item.replace(/\\n/g, '\n').split(/[\n\r]+/).map((token) => token.replace(/^•\s*/, '').trim())
          : []
      )
      .flat()
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .replace(/\\n/g, '\n')
      .split(/[\n\r]+/)
      .map((item) => item.replace(/^•\s*/, '').trim())
      .filter(Boolean)
  }
  return []
}

const outfitList = computed(() =>
  normalizeList(props.slot.details?.recommendations?.outfitSuggestions)
)
const cultureList = computed(() =>
  normalizeList(props.slot.details?.recommendations?.culturalTips)
)
const preTrip = computed(() => buildPreTrip(props.slot.details?.recommendations, t))
const pricingText = computed(() => {
  if (!props.slot.details?.pricing) return null
  return buildPricing(props.slot.details.pricing, props.currency || { code: 'CNY', symbol: '¥', name: '人民币' }, t)
})

// 活动费用（从 slot.cost 获取）
const hasActivityCost = computed(() => {
  return props.slot?.cost && props.slot.cost > 0
})

const activityCostText = computed(() => {
  if (!hasActivityCost.value) return ''
  const cost = props.slot.cost
  const currency = props.currency || { code: 'CNY', symbol: '¥', name: '人民币' }
  return `${currency.symbol}${cost.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
})

// 评分信息
const ratingInfo = computed(() => {
  const rating = props.slot?.details?.rating
  if (!rating?.score) return null
  const score = Number(rating.score).toFixed(1)
  const reviewCount = rating.reviewCount
  if (reviewCount) {
    return `${score}/5（${reviewCount}${t('travelDetail.experienceDay.reviews')}）`
  }
  return `${score}/5`
})

// 最佳游览时间
const visitTips = computed(() => {
  const rec = props.slot?.details?.recommendations
  if (!rec) return null
  
  const tips: {
    bestTime?: string
  } = {}
  
  // 优先使用 visitTips 字段作为最佳游览时间
  if (rec.visitTips && typeof rec.visitTips === 'string' && rec.visitTips.trim()) {
    tips.bestTime = rec.visitTips.trim()
  } else if (rec.bestTimeToVisit) {
    tips.bestTime = rec.bestTimeToVisit
  }
  
  return Object.keys(tips).length > 0 ? tips : null
})

const notSuitable = computed(() => props.slot.details?.recommendations?.notSuitableFor || '')
const notes = computed(() => (props.notes?.length ? props.notes : []))

// 联系方式
const contactInfo = computed(() => {
  const contact = props.slot?.details?.contact
  if (!contact) return null
  
  // 支持 contact.info 字符串格式
  if (typeof contact.info === 'string' && contact.info.trim()) {
    return contact.info.trim()
  }
  
  // 支持 contact 对象格式（电话、邮箱、网站等）
  const parts: string[] = []
  if (contact.phone) parts.push(`电话: ${contact.phone}`)
  if (contact.email) parts.push(`邮箱: ${contact.email}`)
  if (contact.website) parts.push(`网站: ${contact.website}`)
  
  return parts.length > 0 ? parts.join('; ') : null
})

// 无障碍信息
const accessibilityInfo = computed(() => {
  const accessibility = props.slot?.details?.accessibility
  if (!accessibility) return null
  
  // 如果是字符串，直接返回
  if (typeof accessibility === 'string' && accessibility.trim()) {
    return accessibility.trim()
  }
  
  // 如果是对象，组合显示
  if (typeof accessibility === 'object') {
    const parts: string[] = []
    if (accessibility.wheelchair) parts.push('轮椅通道')
    if (accessibility.elevator) parts.push('电梯')
    if (accessibility.restroom) parts.push('无障碍卫生间')
    if (accessibility.parking) parts.push('无障碍停车位')
    if (accessibility.description) parts.push(accessibility.description)
    
    return parts.length > 0 ? parts.join('; ') : null
  }
  
  return null
})

// 附近景点
const nearbyAttractionsText = computed(() => {
  const nearbyAttractions = props.slot?.details?.recommendations?.nearbyAttractions
  if (!nearbyAttractions) return null
  
  // 如果是字符串，直接返回
  if (typeof nearbyAttractions === 'string' && nearbyAttractions.trim()) {
    return nearbyAttractions.trim()
  }
  
  // 如果是数组，用逗号连接
  if (Array.isArray(nearbyAttractions) && nearbyAttractions.length > 0) {
    return nearbyAttractions.filter(item => item && typeof item === 'string').join('、')
  }
  
  return null
})

// 附近景点列表（用于标签显示）
const nearbyAttractionsList = computed(() => {
  const nearbyAttractions = props.slot?.details?.recommendations?.nearbyAttractions
  if (!nearbyAttractions) return []
  
  if (typeof nearbyAttractions === 'string') {
    // 尝试按常见分隔符分割
    return nearbyAttractions.split(/[、,，;；]/).map(s => s.trim()).filter(Boolean)
  }
  
  if (Array.isArray(nearbyAttractions)) {
    return nearbyAttractions.filter(item => item && typeof item === 'string')
  }
  
  return []
})

// 展开/收起状态
const outfitExpanded = ref(false)
const cultureExpanded = ref(false)
const tipsExpanded = ref(false)

// 判断是否需要显示展开按钮（文本超过3-4行）
const shouldShowExpandButton = computed(() => {
  if (!visitTips.value?.bestTime) return false
  const text = visitTips.value.bestTime
  // 简单判断：如果文本长度超过150字符，可能需要折叠
  return text.length > 150
})

// 格式化联系方式（提取链接）
const formatContactInfo = (info: string | null) => {
  if (!info) return ''
  
  // 提取 URL
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const phoneRegex = /(\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4})/g
  
  let formatted = info
  
  // 替换 URL 为链接
  formatted = formatted.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="slot-info-grid__link">${url}</a>`
  })
  
  // 替换电话为 tel 链接
  formatted = formatted.replace(phoneRegex, (phone) => {
    const tel = phone.replace(/[\s-]/g, '')
    return `<a href="tel:${tel}" class="slot-info-grid__link">${phone}</a>`
  })
  
  return formatted
}

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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-block {
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-block__header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.info-block__icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.info-block__label {
  font-weight: 500;
}

.info-block__content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  word-break: break-word;
  /* 内容对齐标签文字：图标宽度(16px) + gap(6px) = 22px */
  padding-left: 22px;
}

.slot-info-grid__location {
  display: flex;
  flex-direction: column;
  gap: 10px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__location-line {
  font-size: 14px;
  line-height: 1.7;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__location-line--primary {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}

.slot-info-grid__location-line--english {
  color: #64748b;
}

.slot-info-grid__location-line--chinese {
  color: #475569;
}

.slot-info-grid__location-line--landmark {
  color: #1890ff;
}

.slot-info-grid__text {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.slot-info-grid__list {
  margin: 0;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #475569;
  list-style: none;
}

.slot-info-grid__list li {
  position: relative;
  padding-left: 18px;
  line-height: 1.7;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #999;
}

.slot-info-grid__notes {
  margin: 0;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #666;
  list-style: none;
}

.slot-info-grid__notes li {
  position: relative;
  padding-left: 16px;
  line-height: 1.6;
}

.slot-info-grid__notes li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #999;
}

.slot-info-grid__booking-link {
  display: inline-block;
  font-size: 14px;
  color: #1890ff;
  text-decoration: none;
  line-height: 1.6;
}

.slot-info-grid__booking-link:hover {
  text-decoration: underline;
}

.slot-info-grid__pricing {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slot-info-grid__pricing-main {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.slot-info-grid__pricing-main strong {
  color: #333;
  font-weight: 500;
}

.slot-info-grid__pricing-detail {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.slot-info-grid__rating {
  font-size: 14px;
  font-weight: 500;
  color: #fa8c16;
}

.slot-info-grid__tips-wrapper {
  margin-top: 0;
  margin-bottom: 0;
  width: 100%;
  max-width: 100%;
}

.slot-info-grid__tips-narration {
  display: flex;
  background: linear-gradient(135deg, rgba(255, 245, 233, 0.9) 0%, rgba(255, 228, 196, 0.75) 100%);
  border-radius: 12px;
  padding: 16px 18px;
  color: #8b4513;
  gap: 12px;
  line-height: 1.7;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  width: 100%;
  max-width: 100%;
}

.slot-info-grid__tips-narration--collapsed {
  max-height: 84px; /* 约3-4行 */
  overflow: hidden;
  position: relative;
}

.slot-info-grid__tips-narration--collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, transparent, rgba(255, 245, 233, 0.95));
  pointer-events: none;
}

.slot-info-grid__tips-expand-btn {
  margin-top: 8px;
  padding: 0;
  height: auto;
  font-size: 12px;
  align-self: flex-start;
}

.slot-info-grid__tips-icon {
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.slot-info-grid__tips-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slot-info-grid__tips-item {
  margin: 0;
  font-size: 13px;
  color: #8b4513;
  line-height: 1.6;
}

.slot-info-grid__tips-item strong {
  color: #8b4513;
  font-weight: 600;
  margin-right: 4px;
}

.slot-info-grid__booking-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Planner 模式：单栏布局 */
.slot-info-grid--planner .slot-info-grid__layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.slot-info-grid__main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0; /* 防止内容溢出 */
}

.slot-info-grid__section {
  scroll-margin-top: 100px;
  min-width: 0; /* 防止内容溢出 */
}

.slot-info-grid__card {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__card--two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 24px;
}

.slot-info-grid__card-column {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.slot-info-grid__card-section {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.slot-info-grid__card-column .slot-info-grid__card-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.slot-info-grid__card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.slot-info-grid__card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  font-size: 16px;
  flex-shrink: 0;
}

.slot-info-grid__card-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  flex: 1;
  min-width: 0;
}

.slot-info-grid__card-action {
  padding: 0;
  height: auto;
  font-size: 13px;
  flex-shrink: 0;
}

.slot-info-grid__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__nearby-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__nearby-tag {
  display: inline-block;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 8px 14px;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.slot-info-grid__nearby-tag:hover {
  background: rgba(102, 126, 234, 0.2);
}

/* 辅助信息列（放在主内容下方，单列布局） */
.slot-info-grid__sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0; /* 防止内容溢出 */
}

.slot-info-grid__sidebar-card {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.slot-info-grid__sidebar-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  font-size: 16px;
  flex-shrink: 0;
}

.slot-info-grid__sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  min-width: 0;
}

.slot-info-grid__sidebar-content {
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__sidebar-content--collapsed {
  max-height: 150px;
  overflow: hidden;
  position: relative;
}

.slot-info-grid__sidebar-content--collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #fff);
}

.slot-info-grid__expand-btn {
  margin-top: 8px;
  padding: 0;
  height: auto;
  font-size: 12px;
}

.slot-info-grid__contact-links {
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slot-info-grid__link {
  color: #1890ff;
  text-decoration: none;
  margin: 0 4px;
}

.slot-info-grid__link:hover {
  text-decoration: underline;
}

/* 响应式 */
@media (max-width: 768px) {
  .slot-info-grid__card--two-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .slot-info-grid__card-column .slot-info-grid__card-section {
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }

  .slot-info-grid__card-column .slot-info-grid__card-section:last-child {
    border-bottom: none;
  }
}

/* 确保所有文本内容都能完整显示 */
.slot-info-grid--planner * {
  box-sizing: border-box;
}

.slot-info-grid--planner p,
.slot-info-grid--planner span,
.slot-info-grid--planner div {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
</style>

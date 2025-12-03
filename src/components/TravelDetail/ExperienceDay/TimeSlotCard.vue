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
      <!-- Hero 区域组件 -->
      <SlotHero
        :slot="slot"
        :cover="cover"
        :loading="loading"
        :currency="currency"
        @preview="$emit('preview')"
        @image-error="$emit('image-error')"
      />

      <!-- 信息条组件 -->
      <SlotInfoBar
        :slot="slot"
        :currency="currency"
        @search="$emit('search')"
        @edit="$emit('edit')"
        @remove="$emit('remove')"
      />

      <!-- 地址栏 -->
      <div class="time-slot__address-bar" v-if="addressText">
        <div class="time-slot__address-content">
          <span class="time-slot__address-icon">📍</span>
          <span class="time-slot__address-text">{{ addressText }}</span>
        </div>
        <a-button
          type="default" 
          size="small"
          class="time-slot__map-button"
          @click="handleNavigate"
        >
          <template #icon>🗺️</template>
          {{ t('travelDetail.experienceDay.viewMap') }}
        </a-button>
      </div>
    </div>

    <!-- 第二层：详细信息 -->
    <div class="time-slot__details-layer">
      <SlotDetails
      :slot="slot"
      :currency="currency"
      :loading-location="loadingLocation"
      @book="$emit('book')"
      @add-nearby-attraction="handleAddNearbyAttraction"
      @fetch-location="handleFetchLocation"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import type { CurrencyInfo } from '@/utils/currency'
import type { TimeSlot, ItineraryDay, TimeSlotCardProps } from './types'
import { useSlotFormatting } from '@/composables/useSlotFormatting'
import { useSlotActions } from '@/composables/useSlotActions'
import { generateLocation } from '@/services/locationAPI'
import { convertLocationInfoToDetails } from '@/services/locationAPI'
import { getAttractionDetails, convertAttractionDetailsToPricingDetail } from '@/services/externalAPI'
import { getCurrentLanguage } from '@/utils/i18n'
import SlotHero from './SlotHero.vue'
import SlotInfoBar from './SlotInfoBar.vue'
import SlotDetails from './SlotDetails.vue'

interface Props extends TimeSlotCardProps {
  day: ItineraryDay
  slot: TimeSlot
  currency: CurrencyInfo | null
  platform: string | null
  expanded: boolean
  loading?: boolean
  isInspirationMode?: boolean
  isPlannerMode?: boolean
  destination?: string // 🔧 新增：从父组件传递的目的地信息
}

const props = defineProps<Props>()

const emit = defineEmits<{
  navigate: []
  book: []
  search: []
  contact: []
  edit: []
  remove: []
  preview: []
  'rating-click': []
  toggle: []
  'image-error': []
  'add-nearby-attraction': [data: {
    attractionName: string
    distance: string
    currentSlot: TimeSlot
    day: ItineraryDay
  }]
  'fetch-location': []
}>()

const { t } = useI18n()
const route = useRoute()

// 使用 composables
const { getAddressText: getAddressTextFromFormatting } = useSlotFormatting(props.slot, props.currency)
const { handleNavigate: handleNavigateAction } = useSlotActions(
  props.slot,
  undefined, // destination - 可以从 props 或 store 获取
  false // shouldShowChineseOnly - 可以从 props 或 store 获取
)

// 计算属性
const isInspirationMode = computed(() => props.isInspirationMode || false)
const isPlannerMode = computed(() => props.isPlannerMode || false)
const addressText = computed(() => getAddressTextFromFormatting())

// 处理函数
const handleNavigate = () => {
  handleNavigateAction()
  emit('navigate')
}

const handleAddNearbyAttraction = (attraction: { name: string; distance?: string; image?: string }) => {
  emit('add-nearby-attraction', {
    attractionName: attraction.name,
    distance: attraction.distance || '',
    currentSlot: props.slot,
    day: props.day
  })
}

// 获取位置信息
const loadingLocation = ref(false)
const loadingTripAdvisor = ref(false)

// 🔧 新增：从 TripAdvisor ID 获取景点详情
const fetchTripAdvisorDetails = async (tripAdvisorId: string) => {
  if (loadingTripAdvisor.value) return
  
  loadingTripAdvisor.value = true
  
  try {
    console.log('[TimeSlotCard] 从 TripAdvisor ID 获取景点详情:', tripAdvisorId)
    const lang = getCurrentLanguage()
    const attractionDetails = await getAttractionDetails(tripAdvisorId, lang)
    
    // 更新 slot 的 details，合并 TripAdvisor 详情
    if (!props.slot.details) {
      props.slot.details = {}
    }
    
    // 合并 TripAdvisor 详情到 slot.details
    props.slot.details = {
      ...props.slot.details,
      // 保留原有的 tripAdvisorId
      tripAdvisorId: props.slot.details.tripAdvisorId || tripAdvisorId,
      // 更新评分信息（如果 TripAdvisor 有）
      rating: attractionDetails.rating ? {
        score: attractionDetails.rating.rating,
        reviewCount: attractionDetails.rating.reviewCount,
        platform: 'TripAdvisor'
      } : props.slot.details.rating,
      // 更新门票信息（如果 TripAdvisor 有）
      pricing: attractionDetails.ticketInfo ? {
        ...props.slot.details.pricing,
        detail: convertAttractionDetailsToPricingDetail(attractionDetails) || props.slot.details.pricing?.detail
      } : props.slot.details.pricing,
      // 更新开放时间（如果 TripAdvisor 有）
      openingHours: attractionDetails.openingHours || props.slot.details.openingHours,
      // 更新联系方式（如果 TripAdvisor 有）
      contactInfo: attractionDetails.phone || attractionDetails.website || props.slot.details.contactInfo,
      // 更新描述（如果 TripAdvisor 有）
      description: attractionDetails.description || props.slot.details.description,
      // 更新 TripAdvisor URL
      tripadvisorUrl: attractionDetails.tripadvisorUrl || props.slot.details.tripadvisorUrl
    }
    
    // 如果有坐标信息，更新 slot 的 coordinates
    if (attractionDetails.coordinates) {
      props.slot.coordinates = {
        lat: attractionDetails.coordinates.lat,
        lng: attractionDetails.coordinates.lng
      }
    }
    
    // 如果有地址信息，更新 slot 的 location
    if (attractionDetails.address) {
      props.slot.location = attractionDetails.address
    }
    
    // 触发父组件更新
    emit('fetch-location')
    
    console.log('[TimeSlotCard] TripAdvisor 景点详情获取成功:', {
      tripAdvisorId,
      name: attractionDetails.name,
      hasRating: !!attractionDetails.rating,
      hasTicketInfo: !!attractionDetails.ticketInfo
    })
  } catch (error: any) {
    // 如果是景点不存在错误，不显示错误提示（这是正常情况）
    if (error.message === 'ATTRACTION_NOT_FOUND') {
      console.warn('[TimeSlotCard] TripAdvisor 景点不存在:', tripAdvisorId)
      return
    }
    
    console.error('[TimeSlotCard] 获取 TripAdvisor 景点详情失败:', error)
    // 不显示错误提示，避免干扰用户
  } finally {
    loadingTripAdvisor.value = false
  }
}

// 🔧 新增：监听 slot.details.tripAdvisorId，自动获取 TripAdvisor 详情
watch(
  () => props.slot.details?.tripAdvisorId,
  (tripAdvisorId) => {
    // 如果存在 tripAdvisorId 且还没有获取过详情，自动获取
    if (tripAdvisorId && !props.slot.details?.tripadvisorUrl) {
      fetchTripAdvisorDetails(tripAdvisorId)
    }
  },
  { immediate: true }
)

// 🔧 新增：组件挂载时，如果有 tripAdvisorId，自动获取详情
onMounted(() => {
  const tripAdvisorId = props.slot.details?.tripAdvisorId
  if (tripAdvisorId && !props.slot.details?.tripadvisorUrl) {
    fetchTripAdvisorDetails(tripAdvisorId)
  }
})

const handleFetchLocation = async () => {
  if (loadingLocation.value) return
  
  const slot = props.slot
  const day = props.day
  
  // 检查必要信息
  if (!slot.title || !slot.coordinates) {
    message.warning(t('travelDetail.experienceDay.locationFetchRequiresInfo') || '活动需要名称和坐标信息才能获取位置详情')
    return
  }
  
  // 🔧 修复：从多个数据源获取目的地信息（按优先级）
  // 1. 优先使用从父组件传递的 destination prop
  let destination = props.destination || ''
  
  // 2. 如果 prop 中没有，从 travelListStore 获取当前行程的目的地
  if (!destination) {
    try {
      const { useTravelListStore } = await import('@/stores/travelList')
      const travelListStore = useTravelListStore()
      const currentTravelId = route.params?.id as string
      
      if (currentTravelId) {
        const currentTravel = travelListStore.getTravel(currentTravelId)
        if (currentTravel) {
          // 尝试多个可能的目的地字段
          destination = currentTravel.destination || 
                       currentTravel.location || 
                       currentTravel.data?.destination ||
                       currentTravel.data?.itineraryData?.destination ||
                       ''
          
          // 如果目的地包含国家信息（如 "巴黎 · 法国"），提取城市名
          if (destination && destination.includes(' · ')) {
            destination = destination.split(' · ')[0].trim()
          }
        }
      }
    } catch (error) {
      console.warn('[TimeSlotCard] 从 travelListStore 获取目的地失败:', error)
    }
  }
  
  // 3. 如果还没有目的地，尝试从 slot.details.address 中提取城市名
  if (!destination && (slot.details?.address?.chinese || slot.details?.address?.english)) {
    const address = slot.details.address.chinese || slot.details.address.english || ''
    // 尝试提取城市名（支持中英文地址格式）
    const cityMatch = address.match(/([^省市区县,，]+?)(?:市|省|区|县|,|，)/) || 
                     address.match(/([A-Za-z\s]+?)(?:,|$)/)
    if (cityMatch && cityMatch[1]) {
      destination = cityMatch[1].trim()
    }
  }
  
  // 4. 如果还是没有目的地，尝试从 slot.location 中提取
  if (!destination && slot.location) {
    const locationStr = typeof slot.location === 'string' ? slot.location : ''
    if (locationStr) {
      // 尝试提取城市名
      const cityMatch = locationStr.match(/([^省市区县,，]+?)(?:市|省|区|县|,|，)/) || 
                       locationStr.match(/([A-Za-z\s]+?)(?:,|$)/)
      if (cityMatch && cityMatch[1]) {
        destination = cityMatch[1].trim()
      } else {
        // 如果匹配不到，直接使用 location（可能是完整地址）
        destination = locationStr
      }
    }
  }
  
  // 5. 如果还是没有目的地，尝试从 day 数据中获取（如果 day 有目的地信息）
  if (!destination && day.destination) {
    destination = day.destination
  }
  
  if (!destination) {
    console.error('[TimeSlotCard] 无法获取目的地信息:', {
      travelId: route.params?.id,
      slotTitle: slot.title,
      slotLocation: slot.location,
      hasDetails: !!slot.details,
      hasAddress: !!(slot.details?.address?.chinese || slot.details?.address?.english),
      propsDestination: props.destination
    })
    message.warning(t('travelDetail.experienceDay.noDestination') || '无法获取目的地信息，请确保行程已设置目的地')
    return
  }
  
  console.log('[TimeSlotCard] 获取到目的地:', destination, '来源:', props.destination ? 'props' : 'fallback')
  
  loadingLocation.value = true
  
  try {
    // 调用位置信息生成API
    const locationInfo = await generateLocation({
      activityName: slot.title,
      destination: destination,
      activityType: (slot.type || 'attraction') as any,
      coordinates: slot.coordinates
    })
    
    // 转换为 details 格式
    const locationDetails = convertLocationInfoToDetails(locationInfo)
    
    // 更新 slot 的 details（深度合并）
    if (!slot.details) {
      slot.details = {}
    }
    slot.details = {
      ...slot.details,
      ...locationDetails,
      // 确保 recommendations 被正确合并
      recommendations: {
        ...slot.details.recommendations,
        ...locationDetails.recommendations
      }
    }
    
    // 如果有地址信息，更新 slot 的 location
    if (locationInfo.address) {
      slot.location = locationInfo.address
    }
    
    // 如果有坐标信息，更新 slot 的 coordinates
    if (locationInfo.coordinates) {
      slot.coordinates = locationInfo.coordinates
    }
    
    // 触发父组件更新（通过 emit）
    emit('fetch-location')
    
    message.success(t('travelDetail.experienceDay.locationFetched') || '位置信息获取成功')
  } catch (error: any) {
    console.error('[TimeSlotCard] 获取位置信息失败:', error)
    message.error(t('travelDetail.experienceDay.locationFetchFailed') || `获取位置信息失败: ${error.message || '未知错误'}`)
  } finally {
    loadingLocation.value = false
  }
}

// 这些函数已经移到 composables 和子组件中，不再需要
</script>

<style scoped>
/* ---------------------------------- */
/* 核心卡片容器：现代化 + 悬浮感 */
/* ---------------------------------- */
.time-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  /* 增加一点点透明度让背景融合 */
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  /* 更细腻的边框 */
  border: 1px solid rgba(226, 232, 240, 0.8);
  /* 多重阴影打造立体感 */
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 10px 15px -3px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; /* 防止内部圆角溢出 */
  margin-bottom: 24px;
}

.time-slot:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 10px 25px -5px rgba(0, 0, 0, 0.06),
    0 8px 10px -6px rgba(0, 0, 0, 0.03);
  border-color: rgba(148, 163, 184, 0.4);
}

.time-slot--planner {
  padding: 20px;
}

.time-slot--inspiration {
  padding: 24px;
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

/* 第一层：Hero Section - 已移至优化样式部分 */

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

.time-slot__hero-mode {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 12px 24px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 70%, transparent 100%);
  pointer-events: none;
  border-radius: 0 0 16px 16px;
}

.time-slot__hero-mode-text {
  display: inline-block;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
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

/* ---------------------------------- */
/* Hero Layer：结构微调 */
/* ---------------------------------- */
.time-slot__hero-layer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ---------------------------------- */
/* 信息条 (Info Bar) 容器优化 */
/* ---------------------------------- */
.time-slot__info-wrapper {
  margin-top: 4px;
  /* 给子组件一些呼吸空间，如果 SlotInfoBar 自身带 margin 可移除 */
}

/* ---------------------------------- */
/* 地址栏：极简胶囊风格 */
/* ---------------------------------- */
.time-slot__address-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: background-color 0.2s;
}

.time-slot__address-bar:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.time-slot__address-content {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.time-slot__address-icon {
  font-size: 16px;
  filter: grayscale(0.5);
}

.time-slot__address-text {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-slot__map-button {
  flex-shrink: 0;
  font-size: 12px;
  background: white;
  border-color: #e2e8f0;
  color: #334155;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.time-slot__map-button:hover {
  color: #1E7DBA;
  border-color: #1E7DBA;
  background: #f0f9ff;
}

/* ---------------------------------- */
/* 详情层：更清爽的分割 */
/* ---------------------------------- */
.time-slot__details-layer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
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

/* 核心亮点列表 */
.time-slot__highlights-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot__highlights-item {
  padding: 8px 12px;
  background: rgba(30, 125, 186, 0.05);
  border-left: 3px solid #1E7DBA;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
}

/* 行家建议文本 */
.time-slot__insider-tip-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  background: rgba(255, 193, 7, 0.05);
  border-left: 3px solid #FFC107;
  border-radius: 4px;
}

/* 预约要求文本 */
.time-slot__booking-signal-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  background: rgba(76, 175, 80, 0.05);
  border-left: 3px solid #4CAF50;
  border-radius: 4px;
}

/* 游览建议文本 */
.time-slot__visit-tips-text {
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visit-tip-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.visit-tip-item:last-child {
  border-bottom: none;
}

.visit-tip-item strong {
  color: #1890ff;
  margin-right: 6px;
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
    flex-direction: row; /* 保持行布局，但在极小屏幕可能需要换行 */
    padding: 8px 12px;
  }

  .time-slot__map-button {
    width: auto; /* 不再强制全宽 */
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

/* ---------------------------------- */
/* SlotHero 内部样式穿透或复写 (如果需要) */
/* ---------------------------------- */
/* 假设 SlotHero 内部使用了 .slot-hero__banner 等类名 */
/* 这里我们优化通用的图片容器样式 */
:deep(.slot-hero__image-container) {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* ---------------------------------- */
/* 全局排版与颜色工具类 (Scoped) */
/* ---------------------------------- */

/* ---------------------------------- */
/* 灵感亮点：胶囊样式优化 */
/* ---------------------------------- */
/* 1. 列表容器：改为横向换行布局 */
:deep(.time-slot__highlights-list) {
  display: flex !important;
  flex-direction: row !important; /* 强制横向 */
  flex-wrap: wrap !important;     /* 允许换行 */
  gap: 8px !important;            /* 胶囊之间的间距 */
  margin-top: 4px;
}

/* 2. 单个胶囊项：圆角 + 柔和背景 */
:deep(.time-slot__highlights-item) {
  /* 布局 */
  display: inline-flex !important;
  align-items: center !important;
  width: auto !important; /* 取消原先的宽带铺满 */
  
  /* 胶囊形状 */
  border-radius: 20px !important; /* 核心：大圆角 */
  padding: 6px 14px !important;
  
  /* 颜色风格：清新的蓝色系 */
  background: #eff6ff !important; /* 极浅蓝 (Slate-50 或 Blue-50) */
  color: #1d4ed8 !important;      /* 深蓝文字 */
  border: 1px solid rgba(59, 130, 246, 0.2) !important; /* 细微描边增加精致感 */
  border-left: 1px solid rgba(59, 130, 246, 0.2) !important; /* 覆盖原先粗边框 */
  
  /* 字体 */
  font-size: 13px !important;
  font-weight: 500 !important;
  line-height: 1.4 !important;
  
  /* 动效 */
  transition: all 0.2s ease;
}

/* 3. 鼠标悬停效果 */
:deep(.time-slot__highlights-item:hover) {
  background: #dbeafe !important;
  transform: translateY(-1px);
}

/* 4. 如果里面有图标，调整图标间距 */
:deep(.time-slot__highlights-item .anticon),
:deep(.time-slot__highlights-item svg) {
  margin-right: 6px;
  font-size: 14px;
}

/* 优化 Tips 的视觉 */

:deep(.time-slot__insider-tip-text) {
  background: #fffbeb !important;
  border-left: 3px solid #fbbf24 !important;
  color: #92400e !important;
  border-radius: 0 6px 6px 0 !important;
  box-shadow: 0 1px 2px rgba(251, 191, 36, 0.1);
}

/* 优化 Grid 布局中的 Section */
:deep(.time-slot__detail-section) {
  background: transparent !important; /* 移除白色背景，直接展示在卡片上，更干净 */
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

:deep(.time-slot__detail-section-title) {
  font-size: 15px !important;
  font-weight: 700 !important;
  color: #1e293b !important; /* Slate-800 */
  margin-bottom: 12px !important;
  display: flex;
  align-items: center;
}

/* 装饰性 Icon 背景 */
:deep(.time-slot__detail-section-icon) {
  width: 24px;
  height: 24px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 6px;
  margin-right: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---------------------------------- */
/* 响应式调整 */
/* ---------------------------------- */
@media (max-width: 640px) {
  .time-slot {
    border-radius: 16px;
    padding: 16px !important; /* 强制覆盖 planner/inspiration 的 padding */
    margin-bottom: 16px;
  }

  .time-slot__address-bar {
    flex-direction: row; /* 保持行布局，但在极小屏幕可能需要换行 */
    padding: 8px 12px;
  }
  
  .time-slot__map-button span {
    display: none; /* 手机端只显示图标 */
  }
  
  .time-slot__map-button :deep(.anticon) {
    margin-right: 0;
  }
}
</style>

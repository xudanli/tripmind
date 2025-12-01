import { computed, ref, type Ref } from 'vue'
import type { POICategory, POIResult } from '@/services/poiSearchAPI'

export interface EditingSlot {
  day: number
  slotIndex: number
}

export interface EditingData {
  // 基础字段
  time: string
  title: string
  activity: string
  type: string
  category: string
  duration: number | string | null
  cost: number | null
  location: string
  coordinates: { lat: number; lng: number } | null
  
  // details 对象中的字段
  nameChinese: string
  nameEnglish: string
  rating: number | null
  transportation: string
  openingHours: string
  pricingDetail: string
  bookingInfo: string
  visitTips: string
  outfitSuggestions: string
  culturalTips: string
  accessibility: string
  scenicIntro: string
  highlights: string
  notes: string
  
  // 其他字段
  bookingLinks: Array<{ name: string; url: string }>
  transportModes: string[]
}

export interface SearchLocation {
  name: string
  address?: string
  coordinates?: { lat: number; lng: number }
}

export interface SearchContext {
  day: number
  slotIndex: number
  slot: any
}

export interface PreviewMediaItem {
  type: 'image' | 'video'
  src: string
  poster?: string
  meta?: Record<string, any>
}

export function useItineraryModals() {
  // 编辑
  const editModalVisible = ref(false)
  const editingSlot = ref<EditingSlot | null>(null)
  const editingData = ref<EditingData>({
    // 基础字段
    time: '',
    title: '',
    activity: '',
    type: 'attraction',
    category: 'attraction',
    duration: null,
    cost: null,
    location: '',
    coordinates: null,
    
    // details 对象中的字段
    nameChinese: '',
    nameEnglish: '',
    rating: null,
    transportation: '',
    openingHours: '',
    pricingDetail: '',
    bookingInfo: '',
    visitTips: '',
    outfitSuggestions: '',
    culturalTips: '',
    accessibility: '',
    scenicIntro: '',
    highlights: '',
    notes: '',
    
    // 其他字段
    bookingLinks: [],
    transportModes: [],
  })

  // POI 搜索
  const searchModalVisible = ref(false)
  const searching = ref(false)
  const searchResults = ref<POIResult[]>([])
  const selectedSearchCategory = ref<POICategory>('restaurant')
  const hasSearched = ref(false)
  const searchLocation = ref<SearchLocation>({ name: '' })
  const currentSearchContext = ref<SearchContext | null>(null)

  const durationLabelKey = computed(() => {
    if (selectedSearchCategory.value === 'ev_charging') return 'travelDetail.experienceDay.chargingDuration'
    if (selectedSearchCategory.value === 'accommodation') return 'travelDetail.experienceDay.stayDuration'
    return 'travelDetail.experienceDay.estimatedStay'
  })

  // 图片预览
  const previewVisible = ref(false)
  const previewMedia = ref<PreviewMediaItem[]>([])
  const previewCurrentIndex = ref(0)
  const currentPreviewDay = ref<number | null>(null)
  const currentPreviewSlotIndex = ref<number | null>(null)
  const currentPreviewSlot = ref<any>(null)

  return {
    // 编辑
    editModalVisible,
    editingSlot,
    editingData,
    // 搜索
    searchModalVisible,
    searching,
    searchResults,
    selectedSearchCategory,
    hasSearched,
    searchLocation,
    currentSearchContext,
    durationLabelKey,
    // 图片预览
    previewVisible,
    previewMedia,
    previewCurrentIndex,
    currentPreviewDay,
    currentPreviewSlotIndex,
    currentPreviewSlot,
  }
}

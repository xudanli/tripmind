<template>
  <div class="hero-section inspiration-hero">
    <div class="hero-cover">
      <img :src="heroCoverImage" :alt="heroTitle" />
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-top">
            <span class="hero-mode-tag">
              <star-outlined class="tag-icon" />
              {{ heroModeLabel }}
            </span>
            <a-tag v-if="journeyStatusLabel" color="gold" class="status-tag">
              {{ journeyStatusLabel }}
            </a-tag>
            <a-button 
              v-if="canEdit && backendItineraryId"
              type="text" 
              size="small" 
              class="edit-button"
              @click="showEditModal = true"
            >
              <template #icon>
                <edit-outlined />
              </template>
              {{ t('travelDetail.edit') || '编辑' }}
            </a-button>
          </div>

          <h1 class="hero-title">{{ heroTitle }}</h1>

          <div class="hero-meta">
            <div
              v-for="(item, index) in heroMetaItems"
              :key="index"
              class="meta-item"
            >
              <component :is="item.icon" class="meta-icon" />
              <span class="meta-text">{{ item.label }}</span>
            </div>
          </div>

          <div v-if="heroChips.length" class="hero-chips">
            <a-tag
              v-for="chip in heroChips"
              :key="chip"
              class="chip"
            >
              {{ chip }}
            </a-tag>
          </div>

          <div v-if="heroCoreInsight" class="hero-insight">
            <bulb-outlined class="insight-icon" />
            <p>{{ heroCoreInsight }}</p>
          </div>

          <p v-if="heroItinerarySummary" class="hero-summary">
            {{ heroItinerarySummary }}
          </p>

          <p v-if="heroSupportingText" class="hero-supporting-text">
            {{ heroSupportingText }}
          </p>

          <p v-if="heroJourneyBackground" class="hero-background">
            {{ heroJourneyBackground }}
          </p>
        </div>

      </div>
    </div>
    
    <!-- 编辑行程信息模态框 -->
    <a-modal
      v-model:open="showEditModal"
      :title="t('travelDetail.editJourneyInfo') || '编辑行程信息'"
      :width="600"
      @ok="handleSaveJourneyInfo"
      @cancel="handleCancelEdit"
      :ok-text="t('common.confirm') || '确定'"
      :cancel-text="t('common.cancel') || '取消'"
      :confirm-loading="saving"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item :label="t('travelDetail.destination') || '目的地'">
          <a-input
            v-model:value="editForm.destination"
            :placeholder="t('travelDetail.destinationPlaceholder') || '请输入目的地'"
          />
        </a-form-item>
        
        <a-form-item :label="t('travelDetail.startDate') || '开始日期'">
          <a-date-picker
            v-model:value="editForm.startDate"
            style="width: 100%"
            format="YYYY-MM-DD"
            :placeholder="t('travelDetail.startDatePlaceholder') || '选择开始日期'"
          />
        </a-form-item>
        
        <a-form-item :label="t('travelDetail.days') || '行程天数'">
          <a-input-number
            v-model:value="editForm.days"
            :min="1"
            :max="30"
            style="width: 100%"
            :placeholder="t('travelDetail.daysPlaceholder') || '请输入行程天数'"
          />
        </a-form-item>
        
        <a-form-item :label="t('travelDetail.summary') || '行程摘要'">
          <a-textarea
            v-model:value="editForm.summary"
            :rows="4"
            :placeholder="t('travelDetail.summaryPlaceholder') || '请输入行程摘要'"
          />
        </a-form-item>
        
        <a-form-item :label="t('travelDetail.totalCost') || '总费用'">
          <a-input-number
            v-model:value="editForm.totalCost"
            :min="0"
            :precision="2"
            style="width: 100%"
            :placeholder="t('travelDetail.totalCostPlaceholder') || '请输入总费用'"
          >
            <template #addonBefore>{{ currencySymbol }}</template>
          </a-input-number>
        </a-form-item>
        
        <a-form-item :label="t('travelDetail.status') || '状态'">
          <a-select
            v-model:value="editForm.status"
            :placeholder="t('travelDetail.statusPlaceholder') || '选择状态'"
          >
            <a-select-option value="draft">{{ t('travelDetail.statusDraft') || '草稿' }}</a-select-option>
            <a-select-option value="published">{{ t('travelDetail.statusPublished') || '已发布' }}</a-select-option>
            <a-select-option value="archived">{{ t('travelDetail.statusArchived') || '已归档' }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Travel } from '@/stores/travelList'
import {
  BulbOutlined,
  CompassOutlined,
  CrownOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ScheduleOutlined,
  SmileOutlined,
  StarOutlined
} from '@ant-design/icons-vue'
import { reverseGeocodeDetail } from '@/utils/geocode'
import { updateItinerary, type UpdateItineraryRequest } from '@/services/itineraryAPI'
// 不再使用 travelListStore，数据从后端接口获取
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { getCurrencyForDestination } from '@/utils/currency'

interface Props {
  travel: Travel | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
}>()
const { t, locale } = useI18n()

const translate = (key: string, fallback: string, params?: Record<string, any>) => {
  const result = t(key, params)
  return result && `${result}` !== key ? result : fallback
}

const travelData = computed(() => props.travel?.data ?? {})

const itineraryData = computed(() => {
  const data: any = travelData.value
  if (!data) return null

  if (data.days && Array.isArray(data.days) && data.days.length > 0) {
    return data
  }

  if (data.plannerItinerary?.days && Array.isArray(data.plannerItinerary.days)) {
    return data.plannerItinerary
  }

  if (data.itineraryData?.days && Array.isArray(data.itineraryData.days)) {
    return data.itineraryData
  }

  return null
})

const heroTitle = computed(() => {
  const data: any = travelData.value
  return (
    data?.title ||
    itineraryData.value?.title ||
    props.travel?.title ||
    translate('travelDetail.experienceDay.defaultInspirationTitle', '灵感旅程')
  )
})

const extractDestination = (travelValue: Travel | null, data: any) => {
  const candidate =
    travelValue?.location ||
    data?.selectedLocation ||
    itineraryData.value?.destination ||
    data?.location ||
    data?.destination ||
    ''

  if (candidate && typeof candidate === 'string' && candidate.trim()) {
    const country =
      data?.currentCountry ||
      itineraryData.value?.country ||
      data?.locationCountries?.[candidate]

    if (country && !candidate.includes(country) && !candidate.includes('·') && !candidate.includes(',')) {
      return `${candidate} · ${country}`
    }
    return candidate
  }

  if (itineraryData.value?.days?.length) {
    const firstDay = itineraryData.value.days[0]
    const firstSlot = firstDay?.timeSlots?.[0]
    const slotLocation =
      firstSlot?.details?.address?.chinese ||
      firstSlot?.details?.address?.english ||
      firstSlot?.location

    if (slotLocation && typeof slotLocation === 'string') {
      const match = slotLocation.match(/([^·,，]+?)(?:·|,|，|$)/)
      if (match?.[1]) return match[1].trim()
    }
  }

  return ''
}

const heroDestination = ref('')

const sanitizeAdministrativeLabel = (value?: string | null) => {
  if (!value) return ''
  const cleaned = value.replace(/[()\[\]{}（）]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  const firstLevel = cleaned.split(/[·•|]/).map(part => part.trim()).filter(Boolean)
  const primary = firstLevel.length ? firstLevel[0] : cleaned
  const slashSplit = primary.split('/').map(part => part.trim()).filter(Boolean)
  return slashSplit.length ? slashSplit[0] : primary
}

const normalizeCoordinate = (candidate: any) => {
  if (!candidate || typeof candidate !== 'object') return null
  const lat = Number(candidate.lat ?? candidate.latitude ?? candidate.latDeg ?? candidate.latLng?.[0])
  const lng = Number(candidate.lng ?? candidate.lon ?? candidate.longitude ?? candidate.long ?? candidate.latLng?.[1])
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng }
  }
  return null
}

const extractPrimaryCoordinate = (): { lat: number; lng: number } | null => {
  const data: any = travelData.value
  const travelValue = props.travel as any
  const itinerary = itineraryData.value as any

  const candidates: any[] = [
    travelValue?.coordinates,
    travelValue?.geo,
    travelValue?.destination?.coordinates,
    data?.coordinates,
    data?.destinationCoordinates,
    data?.locationCoordinates,
    data?.geo,
    data?.geolocation,
  ]

  for (const candidate of candidates) {
    const coord = normalizeCoordinate(candidate)
    if (coord) return coord
  }

  const traverseSlots = (slots: any[]): { lat: number; lng: number } | null => {
    for (const slot of slots) {
      if (!slot || typeof slot !== 'object') continue
      const direct = normalizeCoordinate(slot.coordinates)
      if (direct) return direct
      const nested = normalizeCoordinate(slot.location?.coordinates)
      if (nested) return nested
      const detailCoord = normalizeCoordinate(slot.details?.coordinates)
      if (detailCoord) return detailCoord
    }
    return null
  }

  if (itinerary?.days && Array.isArray(itinerary.days)) {
    for (const day of itinerary.days) {
      const coord = traverseSlots(Array.isArray(day?.timeSlots) ? day.timeSlots : [])
      if (coord) return coord
    }
  }

  return null
}

watchEffect((onCleanup) => {
  let cancelled = false
  onCleanup(() => {
    cancelled = true
  })

  const data: any = travelData.value
  const itinerary = itineraryData.value
  const fallback = extractDestination(props.travel ?? null, data)
  heroDestination.value = fallback

  const coords = extractPrimaryCoordinate()
  if (!coords) return

  const language = locale?.value || 'zh-CN'
  const fallbackCountryCandidates = [
    data?.currentCountry,
    itinerary?.country,
    props.travel?.country,
  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)

  ;(async () => {
    const detail = await reverseGeocodeDetail(coords.lat, coords.lng, language)
    if (cancelled || !detail) return

    const uniqueParts = new Set<string>()

    const pushPart = (value?: string | null) => {
      const sanitized = sanitizeAdministrativeLabel(value)
      if (sanitized) {
        uniqueParts.add(sanitized)
      }
    }

    if (detail.country) {
      pushPart(detail.country)
    } else if (fallbackCountryCandidates.length) {
      pushPart(fallbackCountryCandidates[0])
    }

    pushPart(detail.state)
    pushPart(detail.city)

    const display = Array.from(uniqueParts).filter(Boolean).join(' · ')
    if (display) {
      heroDestination.value = display
    }
  })()
})

// 移除封面图片逻辑，灵感模式不再使用封面
const heroCoverImage = computed(() => {
  // 返回默认占位图或透明背景
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwMCIgaGVpZ2h0PSI0NTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idHJhbnNwYXJlbnQiLz48L3N2Zz4='
})

const preferredLocaleKeys = computed(() => {
  const current = (locale.value || 'zh-CN').toLowerCase()
  const keys = new Set<string>()
  const push = (value?: string) => {
    if (!value) return
    const normalized = value.trim().toLowerCase()
    if (normalized) keys.add(normalized)
  }

  push(current)
  if (current.includes('-')) {
    push(current.split('-')[0])
  }
  if (current === 'zh-cn') push('zh')
  if (current === 'en-us') push('en')

  // 常见兜底
  push('zh-cn')
  push('en-us')
  push('zh')
  push('en')

  return Array.from(keys)
})

const findSafetyNotice = (data: any): string => {
  const notices = data?.safetyNotices
  if (notices && typeof notices === 'object') {
    for (const key of preferredLocaleKeys.value) {
      const value = notices[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
  }

  if (typeof data?.safetyNotice === 'string' && data.safetyNotice.trim()) {
    return data.safetyNotice.trim()
  }

  return ''
}

// 行程摘要：planner 模式显示摘要，灵感模式不显示
const heroItinerarySummary = computed(() => {
  const mode = props.travel?.mode
  if (mode === 'planner') {
  const data: any = travelData.value
    return (
      data?.summary ||
      itineraryData.value?.summary ||
      props.travel?.description ||
      ''
    )
    }
  return ''
})

// 移除核心洞察等文本内容
const heroCoreInsight = computed(() => {
  return ''
})

// 移除支持文本
const heroSupportingText = computed(() => {
  return ''
})

// 移除旅程背景文本
const heroJourneyBackground = computed(() => {
  return ''
})

// 根据实际的活动天数计算，优先使用 itineraryData.days 的长度
const dayCount = computed(() => {
  // 优先使用 itineraryData.days 的实际长度（实际有活动的天数）
  if (itineraryData.value?.days && Array.isArray(itineraryData.value.days) && itineraryData.value.days.length > 0) {
    // 过滤掉没有活动的天数（timeSlots 为空或长度为 0）
    const daysWithActivities = itineraryData.value.days.filter((day: any) => {
      const timeSlots = day.timeSlots || day.activities || []
      return timeSlots.length > 0
    })
    
    // 如果有活动的天数 > 0，使用实际有活动的天数
    if (daysWithActivities.length > 0) {
      return daysWithActivities.length
    }
    
    // 如果所有天数都没有活动，但天数数组存在，返回天数数组长度
    return itineraryData.value.days.length
  }
  
  // 如果没有 itineraryData.days，回退到 travel.duration
  return props.travel?.duration || 0
})

const heroModeLabel = computed(() => {
  const mode = props.travel?.mode
  if (mode === 'planner') {
    return translate('travelDetail.inspirationHero.plannerModeLabel', '智能规划行程')
  }
  return translate('travelDetail.inspirationHero.modeLabel', 'AI 灵感行程')
})

const journeyStatusLabel = computed(() => {
  if (travelData.value?.statusLabel) return travelData.value.statusLabel
  if (props.travel?.status === 'completed') {
    return translate('travelList.status.completed', '已完成')
  }
  if (itineraryData.value) return translate('travelDetail.inspirationHero.generatedLabel', 'AI 已生成')
  return ''
})

const travelPersonaName = computed(() => {
  const data: any = travelData.value
  return (
    data?.persona?.displayName ||
    data?.persona?.name ||
    data?.aiPersona ||
    data?.travelStyle ||
    ''
  )
})

const travelMood = computed(() => {
  const data: any = travelData.value
  if (Array.isArray(data?.moodKeywords) && data.moodKeywords.length) {
    return data.moodKeywords[0]
  }
  return data?.mood || data?.journeyMood || ''
})

// 编辑相关 - 不再使用本地 store
const showEditModal = ref(false)
const saving = ref(false)
const backendItineraryId = computed(() => {
  return props.travel?.data?.backendItineraryId || null
})

const canEdit = computed(() => {
  // 只有有 backendItineraryId 的行程才能编辑
  return !!backendItineraryId.value
})

// 获取当前行程信息用于编辑表单
const getCurrentJourneyInfo = () => {
  const travel = props.travel
  const data: any = travelData.value
  const itinerary = itineraryData.value as any
  
  return {
    destination: travel?.destination || 
                 data?.destination || 
                 itinerary?.destination || 
                 heroDestination.value || 
                 '',
    startDate: travel?.startDate || 
               data?.startDate || 
               itinerary?.startDate || 
               null,
    days: (() => {
      // 优先使用实际有活动的天数
      if (itinerary?.days && Array.isArray(itinerary.days) && itinerary.days.length > 0) {
        const daysWithActivities = itinerary.days.filter((day: any) => {
          const timeSlots = day.timeSlots || day.activities || []
          return timeSlots.length > 0
        })
        if (daysWithActivities.length > 0) {
          return daysWithActivities.length
        }
        return itinerary.days.length
      }
      // 回退到 dayCount（已经计算了实际活动天数）
      return dayCount.value || travel?.duration || itinerary?.duration || 0
    })(),
    summary: travel?.description || 
             data?.summary || 
             itinerary?.summary || 
             heroItinerarySummary.value || 
             '',
    totalCost: travel?.budget || 
               data?.totalCost || 
               itinerary?.totalCost || 
               (totalCost.value ? parseFloat(totalCost.value.replace(/[^\d.]/g, '')) : 0) || 
               0,
    status: data?.status || travel?.status || 'draft'
  }
}

const editForm = ref({
  destination: '',
  startDate: null as Dayjs | null,
  days: 0,
  summary: '',
  totalCost: 0,
  status: 'draft' as 'draft' | 'published' | 'archived'
})

// 获取货币符号
const currencySymbol = computed(() => {
  // 可以根据目的地获取货币符号，这里简化处理
  return '¥'
})

// 初始化编辑表单
const initEditForm = () => {
  const info = getCurrentJourneyInfo()
  console.log('[InspirationHero] 初始化编辑表单，当前行程信息:', {
    destination: info.destination,
    days: info.days,
    dayCount: dayCount.value,
    travelDuration: props.travel?.duration,
    itineraryDuration: itineraryData.value?.duration,
    itineraryDaysLength: itineraryData.value?.days?.length,
    travelDataDuration: travelData.value?.duration
  })
  editForm.value = {
    destination: info.destination,
    startDate: info.startDate ? dayjs(info.startDate) : null,
    days: info.days,
    summary: info.summary,
    totalCost: info.totalCost,
    status: info.status as 'draft' | 'published' | 'archived'
  }
  console.log('[InspirationHero] 编辑表单初始化完成:', {
    days: editForm.value.days,
    destination: editForm.value.destination
  })
}

// 保存行程信息
const handleSaveJourneyInfo = async () => {
  if (!backendItineraryId.value) {
    message.error(t('travelDetail.noBackendItineraryId') || '无法保存：缺少行程ID')
    return
  }
  
  saving.value = true
  try {
    const updateData: UpdateItineraryRequest = {}
    
    // 只添加有变化的字段
    const currentInfo = getCurrentJourneyInfo()
    
    if (editForm.value.destination && editForm.value.destination !== currentInfo.destination) {
      updateData.destination = editForm.value.destination
    }
    
    if (editForm.value.startDate) {
      const dateStr = editForm.value.startDate.format('YYYY-MM-DD')
      if (dateStr !== currentInfo.startDate) {
        updateData.startDate = dateStr
      }
    }
    
    if (editForm.value.days && editForm.value.days !== currentInfo.days) {
      updateData.days = editForm.value.days
    }
    
    if (editForm.value.summary !== currentInfo.summary) {
      updateData.summary = editForm.value.summary
    }
    
    if (editForm.value.totalCost !== currentInfo.totalCost) {
      updateData.totalCost = editForm.value.totalCost
    }
    
    if (editForm.value.status !== currentInfo.status) {
      updateData.status = editForm.value.status
    }
    
    // 如果没有需要更新的字段，直接关闭
    if (Object.keys(updateData).length === 0) {
      message.info(t('travelDetail.noChanges') || '没有需要保存的更改')
      showEditModal.value = false
      return
    }
    
    console.log('[InspirationHero] 更新行程信息:', {
      journeyId: backendItineraryId.value,
      updateData
    })
    
    const updated = await updateItinerary(backendItineraryId.value, updateData)
    
    console.log('[InspirationHero] 后端返回的更新数据:', {
      id: updated.id,
      destination: updated.destination,
      startDate: updated.startDate,
      daysCount: updated.daysCount,
      summary: updated.summary,
      totalCost: updated.totalCost,
      status: updated.status
    })
    
    // 不再更新本地 store，直接通知父组件从后端重新加载数据
    console.log('[InspirationHero] 后端更新成功，通知父组件从后端重新加载数据')
    
    // 等待一下确保后端数据已保存
    await nextTick()
    
    // 通知父组件刷新 travel 数据（从后端重新加载）
    emit('refresh')
    
    console.log('[InspirationHero] 已触发刷新事件，父组件将从后端重新加载数据')
    
    message.success(t('travelDetail.journeyInfoUpdated') || '行程信息已更新')
    showEditModal.value = false
  } catch (error: any) {
    console.error('[InspirationHero] 更新行程信息失败:', error)
    message.error(error.message || (t('travelDetail.journeyInfoUpdateFailed') || '更新行程信息失败'))
  } finally {
    saving.value = false
  }
}

// 取消编辑
const handleCancelEdit = () => {
  showEditModal.value = false
}

// 监听模态框打开，初始化表单
watch(showEditModal, (open) => {
  if (open) {
    initEditForm()
  }
})

// 获取总费用（planner 模式显示）
const totalCost = computed(() => {
  const mode = props.travel?.mode
  if (mode !== 'planner') return null
  
  const data: any = travelData.value
  // 优先级：data.totalCost > itineraryData.totalCost > travel.budget
  const cost = data?.totalCost || 
               itineraryData.value?.totalCost || 
               props.travel?.budget || 
               0
  
  if (cost <= 0) return null
  
  // 根据目的地获取货币
  const destination = props.travel?.location || 
                      props.travel?.destination || 
                      data?.destination || 
                      itineraryData.value?.destination || 
                      ''
  
  const currency = destination ? getCurrencyForDestination(destination) : getCurrencyForDestination('中国')
  
  // 格式化货币显示
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cost)
})

const heroMetaItems = computed(() => {
  const items: Array<{ icon: any; label: string }> = []

  if (heroDestination.value) {
    items.push({
      icon: EnvironmentOutlined,
      label: heroDestination.value
    })
  }

  if (dayCount.value) {
    const durationText = t('travelDetail.inspirationHero.durationLabel', { days: dayCount.value })
    const normalizedDuration =
      durationText && !`${durationText}`.includes('travelDetail.inspirationHero.durationLabel')
        ? durationText
        : `${dayCount.value} ${translate('travelDetail.inspirationHero.dayUnit', '天')}`

    items.push({
      icon: ScheduleOutlined,
      label: normalizedDuration
    })
  }

  // planner 模式显示总费用
  if (totalCost.value) {
    items.push({
      icon: DollarOutlined,
      label: totalCost.value
    })
  }

  if (travelPersonaName.value) {
    items.push({
      icon: CrownOutlined,
      label: travelPersonaName.value
    })
  }

  if (travelMood.value) {
    items.push({
      icon: SmileOutlined,
      label: travelMood.value
    })
  }

  return items
})

const collectChips = () => {
  const chips = new Set<string>()
  const data: any = travelData.value

  if (Array.isArray(data?.themes)) {
    data.themes.forEach((item: string) => {
      if (item && typeof item === 'string') chips.add(item)
    })
  }

  if (Array.isArray(data?.highlights)) {
    data.highlights.forEach((item: string) => {
      if (item && typeof item === 'string') chips.add(item)
    })
  }

  if (Array.isArray(data?.moodKeywords)) {
    data.moodKeywords.forEach((item: string) => {
      if (item && typeof item === 'string') chips.add(item)
    })
  }

  if (itineraryData.value?.days?.length) {
    itineraryData.value.days.slice(0, 3).forEach((day: any) => {
      if (day?.theme && typeof day.theme === 'string') chips.add(day.theme)
    })
  }

  return Array.from(chips).filter(Boolean).slice(0, 4)
}

const heroChips = computed(() => collectChips())

</script>

<style scoped>
.hero-section {
  margin-bottom: 24px;
}

.hero-cover {
  position: relative;
  display: grid;
  border-radius: 16px;
  overflow: hidden;
  min-height: 360px;
  background: #111827;
}

.hero-cover img {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.85);
}

.hero-overlay {
  grid-area: 1 / 1;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 64, 175, 0.75));
  padding: 32px;
  color: #fff;
  gap: 24px;
}

.hero-content {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-button {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.9);
}

.edit-button:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

.hero-mode-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 13px;
  letter-spacing: 0.02em;
}

.tag-icon {
  font-size: 16px;
}

.status-tag {
  border-radius: 999px;
  background: rgba(255, 215, 0, 0.18);
  border: none;
  color: #ffe58f;
  font-weight: 500;
}

.hero-title {
  margin: 0;
  font-size: 36px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-top: 4px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
}

.meta-icon {
  font-size: 16px;
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.hero-insight {
  display: flex;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
}

.insight-icon {
  font-size: 20px;
  color: #ffe58f;
  margin-top: 2px;
}

.hero-summary {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  margin-top: 8px;
}

.hero-supporting-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
}

.hero-background {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
}

@media (max-width: 991px) {
  .hero-overlay {
    padding: 24px;
  }

  .hero-cover {
    min-height: 420px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-side {
    display: none;
  }
}

@media (max-width: 576px) {
  .hero-overlay {
    padding: 20px;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-meta {
    gap: 10px 16px;
  }
}
</style>


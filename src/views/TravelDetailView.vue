<template>
  <div class="container" :class="{ 'inspiration-container': travel?.mode === 'inspiration' || travel?.mode === 'classic' }">
    <!-- 加载状态或数据不存在 -->
    <div v-if="travel === null || travel === undefined" class="loading-container">
      <a-spin size="large" />
      <p>加载中...</p>
    </div>
    
    <!-- 正常内容 -->
    <template v-else>
    <!-- 根据模式切换Hero组件 -->
    <!-- 所有模式统一显示返回按钮 -->
    <div class="header">
      <a-button @click="router.back()" class="back-button">
        <template #icon>
          <arrow-left-outlined />
        </template>
        {{ t('travelDetail.backToJourney') }}
      </a-button>
    </div>
    <!-- Hero 区域：所有模式统一显示 -->
    <InspirationHero
      v-if="travel?.mode"
      :travel="travel"
      @refresh="handleTravelRefresh"
    />

    <!-- 主要内容区域：所有模式统一显示 -->
    <div 
      v-if="travel?.mode"
      class="main-content"
      :class="{
        'inspiration-mode': travel?.mode === 'inspiration' || travel?.mode === 'classic',
        'planner-mode': travel?.mode === 'planner',
        'seeker-mode': travel?.mode === 'seeker'
      }"
    >
      <div
        class="content-layout"
          :class="{
          'with-sidebar': shouldShowSidebar,
          'inspiration-layout': travel?.mode === 'inspiration' || travel?.mode === 'classic'
        }"
      >
        <section class="primary-panel">
          <!-- 所有模式统一显示：体验日 -->
          <ExperienceDay :travel="travel" @update="handleTravelUpdate" @refresh="handleTravelRefresh" />
        </section>

        <!-- 右侧面板 -->
        <aside
          v-if="shouldShowSidebar"
          class="sidebar-panel"
          :class="{ 'sidebar-after-hero': travel?.mode === 'inspiration' || travel?.mode === 'classic' }"
        >
          <!-- 人格画像与旅程设计（仅灵感模式和经典模式显示） -->
          <PersonaJourneySidebar 
            v-if="travel?.mode === 'inspiration' || travel?.mode === 'classic'"
            class="sidebar-block"
          />

          <!-- 多目的地签证分析（已隐藏） -->
          <!-- <MultiDestinationVisaAnalysis 
            :analysis="multiDestinationVisaAnalysis"
            class="sidebar-block"
            :show-for-single-country="true"
          /> -->

          <!-- 调试信息（开发环境，已隐藏） -->
          <!-- <a-card v-if="isDev" class="sidebar-block" title="🔍 签证信息调试">
            <div style="font-size: 12px; line-height: 1.6;">
              <p><strong>travel.value:</strong> {{ travel ? '存在' : '不存在' }}</p>
              <p><strong>travel.location:</strong> {{ travel?.location || '无' }}</p>
              <p><strong>travel.destination:</strong> {{ travel?.destination || '无' }}</p>
              <p><strong>目的地国家代码:</strong> {{ destinationCountry || '未获取' }}</p>
              <p><strong>目的地名称:</strong> {{ destinationName || '未获取' }}</p>
              <p><strong>签证信息:</strong> {{ visaInfo ? '已获取' : '未获取' }}</p>
              <p v-if="visaInfo"><strong>签证类型:</strong> {{ visaInfo.visaType }}</p>
              <p v-if="visaInfo"><strong>适用对象:</strong> {{ visaInfo.applicableTo }}</p>
              <p v-if="visaInfo"><strong>目的地国家:</strong> {{ visaInfo.destinationCountry }}</p>
              <p v-if="visaInfo"><strong>目的地名称:</strong> {{ visaInfo.destinationName }}</p>
              <p v-if="multiDestinationVisaAnalysis"><strong>多目的地国家:</strong> {{ multiDestinationVisaAnalysis.allCountries.join('、') }}</p>
              <p><strong>显示条件:</strong> visaInfo={{ !!visaInfo }}, destinationCountry={{ !!destinationCountry }}</p>
            </div>
          </a-card> -->

          <!-- 签证指引（单目的地详细签证信息） -->
          <VisaGuide 
            v-if="visaInfo && destinationCountry"
            class="sidebar-block"
            :visa-info="visaInfo"
            :destination-country="destinationCountry"
            :destination-name="destinationName"
          />

          <!-- 即使没有 visaInfo，也显示一个提示 -->
          <a-card v-if="destinationCountry && !visaInfo" class="sidebar-block" title="✈️ 签证指引">
            <a-alert
              type="info"
              show-icon
              message="需要设置个人信息以获取签证信息"
              :description="getVisaInfoHint()"
            />
            <div style="margin-top: 12px; font-size: 12px; color: #666;">
              <p><strong>目的地：</strong>{{ destinationName || destinationCountry }}</p>
              <p style="margin-top: 8px;"><strong>提示：</strong></p>
              <ul style="margin: 4px 0 0 0; padding-left: 20px;">
                <li>请前往个人设置页面设置您的国籍信息</li>
                <li>如果您持有永久居民身份，也可以设置永久居民身份信息</li>
                <li>设置完成后，系统将根据您的身份提供准确的签证信息</li>
              </ul>
            </div>
          </a-card>

          <!-- 天气信息 -->
          <WeatherCard
            :destination-id="destinationId"
            :destination-name="destinationName || travel?.destination || travel?.location"
            class="sidebar-block"
          />

          <TravelSidebar 
            v-if="travel?.id"
            class="sidebar-block"
            :travel-id="travel.id"
            :mode="travel.mode || 'default'"
            :initial-spent="travel.spent || 0"
            :initial-total="travel.budget || 0"
          />
          <a-card v-else class="sidebar-block" title="⚠️ 数据加载中">
            <a-alert type="warning" message="旅行数据未加载，请刷新页面" />
          </a-card>
        </aside>
      </div>
    </div>

    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { VisaInfo } from '@/config/visa'
import { useRouter, useRoute } from 'vue-router'
import { useTravelListStore, type Travel } from '@/stores/travelList'
import { useTravelStore } from '@/stores/travel'
import { useI18n } from 'vue-i18n'
// 只保留灵感模式相关组件
import ExperienceDay from '@/components/TravelDetail/ExperienceDay.vue'
import TravelSidebar from '@/components/TravelDetail/TravelSidebar.vue'
import VisaGuide from '@/components/TravelDetail/VisaGuide.vue'
import WeatherCard from '@/components/TravelDetail/WeatherCard.vue'
import InspirationHero from '@/components/TravelDetail/InspirationHero.vue'
import PersonaJourneySidebar from '@/components/TravelDetail/PersonaJourneySidebar.vue'
import MultiDestinationVisaAnalysis from '@/components/TravelDetail/MultiDestinationVisaAnalysis.vue'
import { getUserNationalityCode, getUserPermanentResidencyCode } from '@/config/userProfile'
import { getVisaInfo, analyzeMultiDestinationVisa, extractAllDestinationCountries } from '@/config/visa'
import { PRESET_COUNTRIES } from '@/constants/countries'

const { t } = useI18n()
import {
  ArrowLeftOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const travelListStore = useTravelListStore()
const travelStore = useTravelStore()

const travel = ref<Travel | null>(null)
const shouldShowSidebar = computed(() => {
  // 对灵感模式、经典模式和 planner 模式显示侧边栏
  const shouldShow = Boolean(travel.value && (travel.value.mode === 'inspiration' || travel.value.mode === 'classic' || travel.value.mode === 'planner'))
  console.log('🔍 [TravelDetailView] shouldShowSidebar:', {
    hasTravel: !!travel.value,
    mode: travel.value?.mode,
    shouldShow
  })
  return shouldShow
})

// 开发环境标识
const isDev = !import.meta.env.PROD

// 从目的地字符串提取国家代码（统一的提取函数）
const extractCountryCodeFromDestination = (destStr: string): string | null => {
  if (!destStr) return null
  
  // 处理特殊分隔符格式（如："埃及・开罗・阿斯旺・卢克索・红海"）
  // 先尝试从第一个分隔符前提取（通常是国家名）
  const separators = ['・', '·', '|', '|', '/', '-', '→', '→']
  let primaryText = destStr
  for (const sep of separators) {
    if (destStr.includes(sep)) {
      primaryText = destStr.split(sep)[0].trim()
      break
    }
  }
  
  const destLower = destStr.toLowerCase()
  const primaryLower = primaryText.toLowerCase()
  
  // 国家别名映射（地名、常见英文名称等）
  const countryAliases: Record<string, string[]> = {
    'US': ['alaska', '阿拉斯加', 'fairbanks', '费尔班克斯', 'usa', 'united states', '美国', 'america'],
    'JP': ['japan', '日本'],
    'KR': ['korea', 'south korea', '韩国'],
    'TH': ['thailand', '泰国'],
    'SG': ['singapore', '新加坡'],
    'MY': ['malaysia', '马来西亚'],
    'ID': ['indonesia', '印尼'],
    'PH': ['philippines', '菲律宾'],
    'VN': ['vietnam', '越南'],
    'AU': ['australia', '澳大利亚'],
    'CA': ['canada', '加拿大'],
    'NZ': ['new zealand', '新西兰'],
    'GB': ['united kingdom', 'uk', '英国', 'britain'],
    'FR': ['france', '法国'],
    'DE': ['germany', '德国'],
    'IT': ['italy', '意大利'],
    'ES': ['spain', '西班牙'],
    'FI': ['finland', '芬兰'],
    'IS': ['iceland', '冰岛', 'reykjavik', '雷克雅未克'],
    'EG': ['egypt', '埃及', 'cairo', '开罗', 'aswan', '阿斯旺', 'luxor', '卢克索', '红海', 'red sea'],
    'TW': ['taiwan', '台湾'],
    'HK': ['hong kong', '香港'],
    'MO': ['macau', 'macao', '澳门']
  }
  
  // 遍历PRESET_COUNTRIES，匹配国家名称或代码
  for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
    // 1. 优先匹配第一个分隔符前的文本（通常是国家名）
    if (primaryLower.includes(country.name.toLowerCase())) {
      console.log(`✅ extractCountryCodeFromDestination: 从主文本 "${primaryText}" 匹配到国家 "${country.name}" (${code})`)
      return code
    }
    
    // 2. 匹配完整字符串中的国家名称（中文）
    if (destLower.includes(country.name.toLowerCase())) {
      console.log(`✅ extractCountryCodeFromDestination: 从完整文本匹配到国家 "${country.name}" (${code})`)
      return code
    }
    
    // 3. 匹配国家代码
    if (destLower.includes(code.toLowerCase()) || primaryLower.includes(code.toLowerCase())) {
      console.log(`✅ extractCountryCodeFromDestination: 匹配到国家代码 ${code}`)
      return code
    }
    
    // 4. 匹配别名（优先检查主文本）
    const aliases = countryAliases[code] || []
    if (aliases.some(alias => primaryLower.includes(alias.toLowerCase()))) {
      console.log(`✅ extractCountryCodeFromDestination: 从主文本别名匹配到 ${code}`)
      return code
    }
    if (aliases.some(alias => destLower.includes(alias.toLowerCase()))) {
      console.log(`✅ extractCountryCodeFromDestination: 从完整文本别名匹配到 ${code}`)
      return code
    }
  }
  
  console.log(`⚠️ extractCountryCodeFromDestination: 未能从 "${destStr}" 提取国家代码`)
  return null
}

// 提取目的地国家代码
const destinationCountry = computed(() => {
  if (!travel.value) {
    console.log('⚠️ TravelDetailView destinationCountry: travel.value 为空')
    return null
  }
  
  // 尝试从不同数据源提取目的地
  const data = travel.value.data as any
  
  console.log('🔍 TravelDetailView 提取目的地国家代码:', {
    location: travel.value.location,
    destination: travel.value.destination,
    hasData: !!data,
    itineraryDestination: data?.itineraryData?.destination,
    hasDays: !!data?.days
  })
  
  // 0. 优先使用多目的地分析结果（如果已识别出国家）
  const multiAnalysis = multiDestinationVisaAnalysis.value
  if (multiAnalysis && multiAnalysis.allCountries.length > 0) {
    const firstCountry = multiAnalysis.allCountries[0]
    console.log('✅ 从多目的地分析结果获取国家代码:', firstCountry)
    return firstCountry
  }
  
  // 1. 从 location 字段提取（优先级最高，因为可能被用户或AI更新）
  if (travel.value.location) {
    const countryCode = extractCountryCodeFromDestination(travel.value.location)
    if (countryCode) {
      console.log('✅ 从 location 字段提取到国家代码:', countryCode)
      return countryCode
    }
  }
  
  // 2. 从 destination 字段提取
  if (travel.value.destination) {
    const countryCode = extractCountryCodeFromDestination(travel.value.destination)
    if (countryCode) {
      console.log('✅ 从 destination 字段提取到国家代码:', countryCode)
      return countryCode
    }
  }
  
  // 3. 从 itineraryData 中提取
  if (data?.itineraryData?.destination) {
    const countryCode = extractCountryCodeFromDestination(data.itineraryData.destination)
    if (countryCode) {
      console.log('✅ 从 itineraryData.destination 提取到国家代码:', countryCode)
      return countryCode
    }
  }
  
  // 4. 从 days 数组中的 locations 提取
  if (data?.days && Array.isArray(data.days)) {
    for (const day of data.days) {
      if (day.location) {
        const countryCode = extractCountryCodeFromDestination(day.location)
        if (countryCode) {
          console.log('✅ 从 days[].location 提取到国家代码:', countryCode)
          return countryCode
      }
    }
  }
  }
  
  // 5. 尝试使用 extractAllDestinationCountries 作为最后手段
  try {
    const allCountries = extractAllDestinationCountries({
      location: travel.value.location,
      destination: travel.value.destination,
      days: data?.days,
      itineraryData: data?.itineraryData
    })
    if (allCountries.length > 0) {
      console.log('✅ 从 extractAllDestinationCountries 获取国家代码:', allCountries[0])
      return allCountries[0]
    }
  } catch (e) {
    console.warn('⚠️ extractAllDestinationCountries 调用失败:', e)
  }
  
  // 这是正常情况，某些旅程可能没有明确的国家信息
  // 只在开发环境显示详细信息
  if (import.meta.env.DEV) {
    console.log('ℹ️ TravelDetailView 未能提取到目的地国家代码（这可能是正常的，如果旅程数据中没有明确的国家信息）')
  }
  return null
})

// 获取目的地名称
const destinationName = computed(() => {
  if (!destinationCountry.value) return ''
  const country = PRESET_COUNTRIES[destinationCountry.value as keyof typeof PRESET_COUNTRIES]
  return country?.name || ''
})

// 获取目的地ID（用于天气接口）
// 注意：天气接口需要目的地ID（UUID），如果travel数据中没有存储目的地ID，这里返回null
// 未来可能需要通过目的地名称查询后端获取目的地ID
const destinationId = computed(() => {
  if (!travel.value) {
    console.log('[TravelDetailView] destinationId computed: travel.value 为空')
    return null
  }
  
  // 尝试从不同数据源获取目的地ID
  const data = travel.value.data as any
  
  // 1. 从 data.backendDestinationId 获取（如果后端返回了目的地ID）
  if (data?.backendDestinationId) {
    console.log('[TravelDetailView] destinationId computed: 从 backendDestinationId 获取:', data.backendDestinationId)
    return data.backendDestinationId
  }
  
  // 2. 从 data.destinationId 获取
  if (data?.destinationId) {
    console.log('[TravelDetailView] destinationId computed: 从 destinationId 获取:', data.destinationId)
    return data.destinationId
  }
  
  // 3. 暂时返回null，等后端提供通过目的地名称查询ID的接口后再实现
  // TODO: 实现通过目的地名称查询目的地ID的逻辑
  console.log('[TravelDetailView] destinationId computed: 未找到目的地ID', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    destination: travel.value.destination || travel.value.location,
    hasBackendDestinationId: !!data?.backendDestinationId,
    hasDestinationId: !!data?.destinationId
  })
  return null
})

// 分析多目的地签证需求
const multiDestinationVisaAnalysis = computed(() => {
  if (!travel.value) return null
  
  const data = travel.value.data as any
  const allCountries = extractAllDestinationCountries({
    location: travel.value.location,
    destination: travel.value.destination,
    days: data?.days,
    itineraryData: data?.itineraryData
  })
  
  if (allCountries.length === 0) return null
  
  const nationalityCode = getUserNationalityCode()
  const permanentResidencyCode = getUserPermanentResidencyCode()
  
  return analyzeMultiDestinationVisa(allCountries, nationalityCode || null, permanentResidencyCode || null)
})

// 获取签证信息（支持单目的地和多目的地，支持异步）
const visaInfo = ref<VisaInfo | null>(null)
const visaInfoLoading = ref(false)

// 加载签证信息
const loadVisaInfo = async () => {
  const countryCode = destinationCountry.value
  if (!countryCode) {
    console.log('⚠️ TravelDetailView 签证信息：无法获取目的地国家代码')
    visaInfo.value = null
    return
  }
  
  // 如果有多目的地分析结果，优先使用多目的地分析
  const multiAnalysis = multiDestinationVisaAnalysis.value
  if (multiAnalysis && multiAnalysis.allCountries.length > 1) {
    console.log('🌍 TravelDetailView 检测到多目的地行程:', multiAnalysis.allCountries)
    console.log('📋 多目的地签证分析结果:', multiAnalysis)
    
    // 如果有申根区国家，返回申根签证信息
    if (multiAnalysis.requiredVisas.length > 0) {
      const schengenVisa = multiAnalysis.requiredVisas.find(v => v.name.includes('申根'))
      if (schengenVisa && schengenVisa.visaInfo && schengenVisa.visaInfo.length > 0) {
        visaInfo.value = schengenVisa.visaInfo[0]
        return
      }
      // 否则返回第一个需要的签证信息
      if (multiAnalysis.requiredVisas[0]?.visaInfo && multiAnalysis.requiredVisas[0].visaInfo.length > 0) {
        visaInfo.value = multiAnalysis.requiredVisas[0].visaInfo[0]
        return
      }
    }
  }
  
  const nationalityCode = getUserNationalityCode()
  const permanentResidencyCode = getUserPermanentResidencyCode()
  
  console.log('🔍 TravelDetailView 签证信息查询:', {
    destinationCountry: countryCode,
    nationalityCode: nationalityCode || '未设置',
    permanentResidencyCode: permanentResidencyCode || '未设置',
    travelLocation: travel.value?.location,
    travelDestination: travel.value?.destination
  })
  
  visaInfoLoading.value = true
  try {
  // 即使没有国籍信息，也尝试查询（可能数据库中有默认数据）
    const visaInfos = await getVisaInfo(countryCode, nationalityCode || null, permanentResidencyCode || null)
    console.log('📋 TravelDetailView 查询到的签证信息数量:', visaInfos.length, visaInfos)
  
  if (visaInfos.length === 0) {
      console.warn('⚠️ TravelDetailView 未找到签证信息，可能原因：', {
        destinationCountry: countryCode,
        nationalityCode: nationalityCode || '未设置',
        permanentResidencyCode: permanentResidencyCode || '未设置',
        hint: '请检查签证数据库（src/config/visa.ts）中是否有该国家的签证信息'
      })
      visaInfo.value = null
      return
  }
  
    // 返回第一个签证信息（通常是主要的），getVisaInfo 已经校验过数据
    const firstVisaInfo = visaInfos[0]
    
    // 再次校验确保数据有效
    if (!firstVisaInfo || !firstVisaInfo.destinationCountry || !firstVisaInfo.visaType) {
      console.warn('⚠️ TravelDetailView 签证信息校验失败:', firstVisaInfo)
      visaInfo.value = null
      return
    }
    
    console.log('✅ TravelDetailView 签证信息验证通过:', {
      destinationCountry: firstVisaInfo.destinationCountry,
      destinationName: firstVisaInfo.destinationName,
      visaType: firstVisaInfo.visaType,
      applicableTo: firstVisaInfo.applicableTo
    })
    
    visaInfo.value = firstVisaInfo
  } catch (error) {
    console.error('❌ TravelDetailView 获取签证信息失败:', error)
    visaInfo.value = null
  } finally {
    visaInfoLoading.value = false
  }
}

// 监听目的地国家变化，重新加载签证信息
watch([destinationCountry, multiDestinationVisaAnalysis], () => {
  loadVisaInfo()
}, { immediate: true })


// 从后端加载行程详情并获取位置信息
const loadItineraryFromBackend = async (backendItineraryId: string) => {
  try {
    console.log('[TravelDetailView] 从后端加载行程详情:', backendItineraryId)
    const { getItineraryDetail, batchGetActivities } = await import('@/services/itineraryAPI')
    const { enrichItineraryWithLocationInfo } = await import('@/services/itineraryAPI')
    
    // 1. 获取后端行程详情
    const backendItinerary = await getItineraryDetail(backendItineraryId)
    console.log('[TravelDetailView] 后端行程详情获取成功:', {
      id: backendItinerary.id,
      destination: backendItinerary.destination,
      destinationId: backendItinerary.destinationId, // 检查是否包含 destinationId
      hasDestinationId: !!backendItinerary.destinationId,
      daysCount: backendItinerary.daysCount,
      allKeys: Object.keys(backendItinerary) // 查看所有返回的字段
    })
    
    // 1.1. 如果后端没有返回 destinationId，通过目的地名称查找或创建
    let finalDestinationId = backendItinerary.destinationId
    if (!finalDestinationId && backendItinerary.destination) {
      console.log('[TravelDetailView] 后端未返回 destinationId，通过目的地名称查找或创建:', backendItinerary.destination)
      try {
        const { findOrCreateDestination } = await import('@/services/externalAPI')
        const destination = await findOrCreateDestination(backendItinerary.destination)
        if (destination) {
          finalDestinationId = destination.id
          console.log('[TravelDetailView] 成功获取 destinationId:', {
            destinationId: finalDestinationId,
            destinationName: backendItinerary.destination
          })
        } else {
          console.warn('[TravelDetailView] 查找或创建目的地失败，无法获取 destinationId')
        }
      } catch (error: any) {
        console.warn('[TravelDetailView] 查找或创建目的地失败:', error.message)
      }
    }
    
    // 2. 批量获取活动详情（包含完整的 details 字段）
    let activitiesMap: { [dayId: string]: any[] } = {}
    try {
      // 提取所有 dayIds
      const dayIds = backendItinerary.days.map(day => day.id).filter(Boolean) as string[]
      console.log('[TravelDetailView] 准备批量获取活动详情，dayIds:', dayIds)
      
      if (dayIds.length > 0) {
        const activitiesResponse = await batchGetActivities(backendItineraryId, { dayIds })
        activitiesMap = activitiesResponse.activities || {}
        console.log('[TravelDetailView] 批量获取活动详情成功:', {
          dayCount: Object.keys(activitiesMap).length,
          totalCount: activitiesResponse.totalCount
        })
      } else {
        // 如果没有 dayIds，获取整个行程的所有活动
        const activitiesResponse = await batchGetActivities(backendItineraryId)
        activitiesMap = activitiesResponse.activities || {}
        console.log('[TravelDetailView] 批量获取活动详情成功（全部）:', {
          dayCount: Object.keys(activitiesMap).length,
          totalCount: activitiesResponse.totalCount
        })
      }
    } catch (activitiesError: any) {
      console.warn('[TravelDetailView] 批量获取活动详情失败，使用基础活动数据:', activitiesError.message)
      // 如果批量获取失败，继续使用基础数据
    }
    
    // 3. 将后端数据转换为前端格式，并合并活动详情
    console.log('[TravelDetailView] 开始转换数据格式，backendItinerary.days 数量:', backendItinerary.days.length)
    console.log('[TravelDetailView] activitiesMap keys:', Object.keys(activitiesMap))
    
    // 如果 backendItinerary.days 为空，但批量活动接口返回了数据，从批量活动数据构建 days
    let days: any[] = []
    
    if (backendItinerary.days && backendItinerary.days.length > 0) {
      // 情况1: 有 days 数据，正常处理
      days = backendItinerary.days.map((day, dayIndex) => {
      // 获取该天的详细活动数据（如果有）
      let detailedActivities: any[] = []
      if (day.id && activitiesMap[day.id]) {
        detailedActivities = activitiesMap[day.id]
        console.log(`[TravelDetailView] Day ${day.day} (id: ${day.id}) 找到 ${detailedActivities.length} 个详细活动`)
      } else {
        // 如果没有 day.id，尝试从所有活动中查找（按时间匹配）
        // 这种情况通常发生在批量获取整个行程时，活动可能按其他方式组织
        const allActivities = Object.values(activitiesMap).flat()
        console.log(`[TravelDetailView] Day ${day.day} 没有 id，尝试从所有活动中匹配，allActivities: ${allActivities.length}, day.activities: ${day.activities.length}`)
        // 如果活动数量匹配，可能是按顺序返回的
        if (allActivities.length > 0 && day.activities.length > 0) {
          // 尝试通过时间和标题匹配
          detailedActivities = allActivities.filter(act => {
            return day.activities.some(dayAct => 
              dayAct.time === act.time && dayAct.title === act.title
            )
          })
          console.log(`[TravelDetailView] Day ${day.day} 匹配到 ${detailedActivities.length} 个活动`)
        }
      }
      
      // 创建活动映射，用于合并详情
      // 优先使用 id 匹配，如果没有 id 则使用时间和标题匹配
      const activityMap = new Map()
      detailedActivities.forEach(activity => {
        if (activity.id) {
          activityMap.set(activity.id, activity)
        } else {
          // 使用时间和标题作为 key
          activityMap.set(`${activity.time}-${activity.title}`, activity)
        }
      })
      
      return {
      day: day.day,
      date: day.date,
        timeSlots: day.activities.map((activity) => {
          // 查找是否有详细的活动数据
          let detailedActivity = null
          if (activity.id) {
            detailedActivity = activityMap.get(activity.id)
          }
          if (!detailedActivity) {
            // 如果没有 id 或通过 id 找不到，尝试通过时间和标题匹配
            detailedActivity = activityMap.get(`${activity.time}-${activity.title}`)
          }
          
          // 合并详细的 details 数据
          let mergedDetails = activity.details || {}
          if (detailedActivity?.details && detailedActivity.details !== null) {
            // 如果批量接口返回了 details，合并它们
            mergedDetails = {
              ...mergedDetails,
              ...detailedActivity.details
            }
          } else if (!mergedDetails || Object.keys(mergedDetails).length === 0) {
            // 如果没有任何 details，创建基础结构
            mergedDetails = {
              notes: activity.notes || '',
              description: activity.notes || ''
            }
          }
          
          return {
        time: activity.time,
        title: activity.title,
        activity: activity.title,
        type: activity.type,
        coordinates: activity.location,
        notes: activity.notes || '',
            details: mergedDetails,
            cost: typeof activity.cost === 'number' ? activity.cost : (typeof activity.cost === 'string' ? parseFloat(activity.cost) || 0 : 0),
            duration: typeof activity.duration === 'number' ? activity.duration : (typeof activity.duration === 'string' ? parseInt(activity.duration) || 60 : 60)
          }
        })
      }
    })
    } else if (Object.keys(activitiesMap).length > 0) {
      // 情况2: backendItinerary.days 为空，但从批量活动接口获取到了数据
      // 从 activitiesMap 构建 days 结构
      console.log('[TravelDetailView] backendItinerary.days 为空，从批量活动数据构建 days')
      
      const dayIds = Object.keys(activitiesMap)
      days = dayIds.map((dayId, index) => {
        const activities = activitiesMap[dayId] || []
        console.log(`[TravelDetailView] 构建 Day ${index + 1} (dayId: ${dayId}), 活动数量: ${activities.length}`)
        
        // 计算日期（从 startDate 开始）
        const startDate = backendItinerary.startDate 
          ? new Date(backendItinerary.startDate)
          : new Date()
        const dayDate = new Date(startDate)
        dayDate.setDate(dayDate.getDate() + index)
        
        return {
          day: index + 1,
          date: dayDate.toISOString().split('T')[0], // YYYY-MM-DD
          timeSlots: activities.map((activity) => {
            return {
              time: activity.time,
              title: activity.title,
              activity: activity.title,
              type: activity.type,
              coordinates: activity.location || {},
              notes: activity.notes || '',
              details: activity.details || {
          notes: activity.notes || '',
          description: activity.notes || ''
        },
        cost: typeof activity.cost === 'number' ? activity.cost : (typeof activity.cost === 'string' ? parseFloat(activity.cost) || 0 : 0),
        duration: typeof activity.duration === 'number' ? activity.duration : (typeof activity.duration === 'string' ? parseInt(activity.duration) || 60 : 60)
            }
          })
        }
      })
      
      console.log('[TravelDetailView] 从批量活动数据构建的 days:', {
        daysCount: days.length,
        totalActivities: days.reduce((sum, d) => sum + d.timeSlots.length, 0)
      })
    } else {
      // 情况3: 既没有 days 数据，也没有批量活动数据
      console.warn('[TravelDetailView] 既没有 backendItinerary.days，也没有批量活动数据')
      days = []
    }
    
    // 去重：按 day 和 id 去重，优先保留有 id 的
    const dayMap = new Map<string | number, any>()
    days.forEach((day: any) => {
      const key = day.day || day.id
      if (key) {
        const existing = dayMap.get(key)
        if (!existing || (day.id && !existing.id)) {
          dayMap.set(key, day)
        }
      }
    })
    
    // 按 day 排序
    const uniqueDays = Array.from(dayMap.values()).sort((a: any, b: any) => {
      const dayA = a.day || 0
      const dayB = b.day || 0
      return dayA - dayB
    })
    
    console.log('[TravelDetailView] 合并活动详情后的 days 数据（已去重）:', {
      daysCount: uniqueDays.length,
      originalCount: days.length,
      firstDay: uniqueDays[0] ? {
        day: uniqueDays[0].day,
        date: uniqueDays[0].date,
        timeSlotsCount: uniqueDays[0].timeSlots?.length || 0,
        firstSlot: uniqueDays[0].timeSlots?.[0] ? {
          time: uniqueDays[0].timeSlots[0].time,
          title: uniqueDays[0].timeSlots[0].title,
          hasDetails: !!uniqueDays[0].timeSlots[0].details
        } : null
      } : null
    })
    
    // 使用去重后的 days
    days = uniqueDays
    
    const frontendData = {
      title: travel.value?.title || `${backendItinerary.destination}之旅`,
      destination: backendItinerary.destination,
      days,
      totalCost: backendItinerary.totalCost || 0,
      summary: backendItinerary.summary || '',
      // 计算实际有活动的天数
      duration: (() => {
        // 优先使用实际有活动的天数
        const daysWithActivities = days.filter((day: any) => {
          const timeSlots = day.timeSlots || day.activities || []
          return timeSlots.length > 0
        })
        return daysWithActivities.length > 0 ? daysWithActivities.length : (backendItinerary.daysCount || days.length)
      })(),
      budget: backendItinerary.totalCost || 0
    }
    
    console.log('[TravelDetailView] 转换为前端格式成功:', {
      daysCount: frontendData.days.length,
      totalCost: frontendData.totalCost,
      firstDayTimeSlots: frontendData.days[0]?.timeSlots?.length || 0
    })
    
    // 3. 检查是否需要获取位置信息
    // 如果 batchGetActivities 已经返回了完整的 details（包含位置信息），则跳过 enrichItineraryWithLocationInfo
    const hasLocationInfo = frontendData.days.some(day => 
      day.timeSlots.some(slot => {
        const details = slot.details
        return details && (
          details.tripAdvisorId || 
          details.location || 
          details.coordinates ||
          (details.pricing && details.pricing.detail)
        )
      })
    )
    
    let enrichedData = frontendData
    if (!hasLocationInfo && frontendData.days.length > 0 && frontendData.days[0].timeSlots.length > 0) {
      // 只有当前端数据中没有位置信息时，才调用 enrichItineraryWithLocationInfo
      console.log('[TravelDetailView] 批量接口未返回完整位置信息，开始获取位置信息...')
      try {
        enrichedData = await enrichItineraryWithLocationInfo(
      frontendData,
      backendItinerary.destination,
      (message) => {
        console.log('[TravelDetailView] 位置信息获取进度:', message)
      }
    )
        console.log('[TravelDetailView] 位置信息获取完成:', {
          daysCount: enrichedData.days.length,
          firstDayTimeSlots: enrichedData.days[0]?.timeSlots?.length || 0
        })
      } catch (enrichError: any) {
        console.warn('[TravelDetailView] 位置信息获取失败，使用原始数据:', enrichError.message)
        // 如果获取位置信息失败，使用原始数据
        enrichedData = frontendData
      }
    } else {
      console.log('[TravelDetailView] 批量接口已返回完整位置信息，跳过 enrichItineraryWithLocationInfo')
    }
    
    // 确保 enrichedData.days 有数据，如果没有则使用原始的 days
    if (!enrichedData.days || enrichedData.days.length === 0) {
      console.warn('[TravelDetailView] enrichedData.days 为空，使用原始 days 数据')
      enrichedData.days = days
    }
    
    console.log('[TravelDetailView] 准备更新 travel 数据:', {
      enrichedDaysCount: enrichedData.days.length,
      firstDayTimeSlots: enrichedData.days[0]?.timeSlots?.length || 0
    })
    
    // 4. 更新 travel 数据（只更新 itineraryData，保留其他本地数据如 personaProfile、journeyDesign 等）
    if (travel.value) {
      const updatedData = {
        ...travel.value.data,
        backendItineraryId: backendItineraryId,
        // 保存 destinationId（优先使用后端返回的，如果没有则使用查找或创建的）
        destinationId: finalDestinationId || travel.value.data?.destinationId,
        backendDestinationId: finalDestinationId || travel.value.data?.backendDestinationId,
        // 只更新 itineraryData，不更新 data.days，这样 ExperienceDay 会优先读取 itineraryData（后端数据）
        itineraryData: {
          days: enrichedData.days, // 使用合并了活动详情的 days
          destination: enrichedData.destination,
          title: travel.value.title || `${backendItinerary.destination}之旅`,
          totalCost: enrichedData.totalCost,
          summary: backendItinerary.summary || '',
          duration: enrichedData.duration,
          budget: enrichedData.budget,
          preferences: backendItinerary.preferences || {}
        },
        // 同时更新顶层字段，用于兼容性
        destination: enrichedData.destination,
        title: travel.value.title || `${backendItinerary.destination}之旅`,
        totalCost: enrichedData.totalCost,
        summary: backendItinerary.summary || ''
      }
      
      console.log('[TravelDetailView] 保存 destinationId:', {
        destinationId: finalDestinationId,
        hasDestinationId: !!finalDestinationId,
        source: backendItinerary.destinationId ? 'backend' : (finalDestinationId ? 'find-or-create' : 'none'),
        destination: backendItinerary.destination
      })
      
      console.log('[TravelDetailView] 更新后的 itineraryData:', {
        hasItineraryData: !!updatedData.itineraryData,
        itineraryDataDaysCount: updatedData.itineraryData?.days?.length || 0,
        firstDayTimeSlots: updatedData.itineraryData?.days?.[0]?.timeSlots?.length || 0
      })
      
      // 直接更新 travel.value，不使用 store（因为只使用后端数据）
      if (travel.value) {
        // 计算实际有活动的天数
        const calculateDaysCount = () => {
          if (backendItinerary.days && Array.isArray(backendItinerary.days) && backendItinerary.days.length > 0) {
            const daysWithActivities = backendItinerary.days.filter((day: any) => {
              const activities = day.activities || []
              return activities.length > 0
            })
            return daysWithActivities.length > 0 ? daysWithActivities.length : backendItinerary.days.length
          }
          return backendItinerary.daysCount || 0
        }
        const daysCount = calculateDaysCount()
      const updates: any = {
          // 更新顶层字段，确保与后端数据同步
          destination: backendItinerary.destination,
          location: backendItinerary.destination,
          description: backendItinerary.summary || travel.value.description,
          duration: daysCount,
          budget: backendItinerary.totalCost || travel.value.budget,
          startDate: backendItinerary.startDate,
          status: backendItinerary.status === 'published' ? 'active' : (backendItinerary.status === 'archived' ? 'completed' : 'draft'),
          updatedAt: backendItinerary.updatedAt || new Date().toISOString(),
        data: updatedData
      }
      if (backendItinerary.mode) {
        updates.mode = backendItinerary.mode
      }
        travel.value = {
          ...travel.value,
          ...updates
        }
      }
      console.log('[TravelDetailView] 行程数据已更新，只使用后端数据（itineraryData）:', {
        hasTravel: !!travel.value,
        hasData: !!travel.value?.data,
        hasItineraryData: !!travel.value?.data?.itineraryData,
        itineraryDataDaysCount: travel.value?.data?.itineraryData?.days?.length || 0,
        firstDayTimeSlots: travel.value?.data?.itineraryData?.days?.[0]?.timeSlots?.length || 0
      })
    }
  } catch (error: any) {
    console.error('[TravelDetailView] 从后端加载行程详情失败:', error)
    message.error('加载行程详情失败，请刷新页面重试')
  }
}

  // 加载旅程数据 - 只从后端接口加载，不使用本地数据
onMounted(async () => {
  const id = route.params.id as string
  console.log('[TravelDetailView] mounted, 直接从后端加载行程数据，id:', id)
  
  // 直接使用 id 作为 backendItineraryId 从后端加载
  try {
    const { getItineraryDetail } = await import('@/services/itineraryAPI')
    const backendItinerary = await getItineraryDetail(id)
    
    console.log('[TravelDetailView] 从后端获取到行程数据:', {
      id: backendItinerary.id,
      destination: backendItinerary.destination,
      daysCount: backendItinerary.daysCount,
      mode: backendItinerary.mode
    })
    
    // 将后端数据转换为 Travel 格式
    const daysCount = backendItinerary.daysCount || (backendItinerary.days?.length || 0)
    const title = `${backendItinerary.destination}之旅`
    const mode = backendItinerary.mode || 'planner'
    
    const newTravel: Travel = {
      id: backendItinerary.id,
      title: title,
      location: backendItinerary.destination,
      description: backendItinerary.summary || `精心安排的${daysCount}天${backendItinerary.destination}之旅`,
      mode: mode as 'planner' | 'seeker' | 'inspiration',
      status: backendItinerary.status === 'published' ? 'active' : (backendItinerary.status === 'archived' ? 'completed' : 'draft'),
      createdAt: backendItinerary.createdAt || new Date().toISOString(),
      updatedAt: backendItinerary.updatedAt || new Date().toISOString(),
      startDate: backendItinerary.startDate,
      duration: daysCount,
      participants: 1,
      budget: backendItinerary.totalCost || 0,
      destination: backendItinerary.destination,
      data: {
        backendItineraryId: backendItinerary.id,
        destinationId: backendItinerary.destinationId,
        backendDestinationId: backendItinerary.destinationId,
        days: Array.isArray(backendItinerary.days) ? backendItinerary.days : [],
        destination: backendItinerary.destination,
        title: title,
        totalCost: backendItinerary.totalCost || 0,
        summary: backendItinerary.summary || '',
        startDate: backendItinerary.startDate,
        status: backendItinerary.status,
        itineraryData: {
          days: Array.isArray(backendItinerary.days) ? backendItinerary.days : [],
          destination: backendItinerary.destination,
          title: title,
          totalCost: backendItinerary.totalCost || 0,
          duration: daysCount,
          budget: backendItinerary.totalCost || 0,
          preferences: backendItinerary.preferences || {}
        }
      }
    }
    
    // 设置 travel.value（不添加到 travelList，因为只使用后端数据）
    travel.value = newTravel
    
    console.log('[TravelDetailView] ✅ 从后端加载行程数据成功，准备加载完整详情')
    
    // 从后端加载完整数据（包括活动详情）
    await loadItineraryFromBackend(backendItinerary.id)
    
  } catch (loadError: any) {
    console.error('[TravelDetailView] ❌ 从后端加载行程详情失败:', {
      error: loadError.message,
      errorStack: loadError.stack,
      id
    })
    message.error(`加载行程详情失败: ${loadError.message || '未知错误'}，请刷新页面重试`)
    // 设置 travel 为 null 以显示错误状态
    travel.value = null
    // 可以选择返回列表页
    setTimeout(() => {
      router.push('/travel-list')
    }, 2000)
    return
  }
  
  if (!travel.value) {
    console.error('[TravelDetailView] ❌ 最终未找到 travel 数据，id:', id)
    message.error('未找到行程数据，请返回列表页')
    return
  }
  
  if (!travel.value.id) {
    console.error('[TravelDetailView] ❌ travel 数据缺少 id 字段')
  }
  
  // 修复Inspiration和Classic模式的滚动问题
  const fixScroll = () => {
    if (travel.value?.mode === 'inspiration' || travel.value?.mode === 'classic') {
      // 强制设置body和html的滚动属性
      const body = document.body
      const html = document.documentElement
      
      // 移除所有可能阻止滚动的样式
      body.style.overflow = 'auto'
      body.style.overflowY = 'auto'
      body.style.height = 'auto'
      body.style.minHeight = '100vh'
      body.style.maxHeight = 'none'
      body.style.position = 'relative'
      
      html.style.overflow = 'auto'
      html.style.overflowY = 'auto'
      html.style.height = 'auto'
      html.style.minHeight = '100vh'
      html.style.maxHeight = 'none'
      
      // 确保容器也可以滚动
      const container = document.querySelector('.container.inspiration-container')
      if (container) {
        const containerEl = container as HTMLElement
        containerEl.style.overflowY = 'visible'
        containerEl.style.height = 'auto'
        containerEl.style.minHeight = '100vh'
        containerEl.style.position = 'relative'
      }
      
      // 确保#app可以滚动
      const app = document.getElementById('app')
      if (app) {
        app.style.overflowY = 'auto'
        app.style.height = 'auto'
        app.style.minHeight = '100vh'
        app.style.position = 'relative'
      }
      
      // 确保main-content可以滚动（桌面端）
      if (window.innerWidth > 991) {
        const mainContent = document.querySelector('.main-content.inspiration-mode')
        if (mainContent) {
          const mainEl = mainContent as HTMLElement
          mainEl.style.overflow = 'visible'
          mainEl.style.overflowY = 'visible'
          mainEl.style.overflowX = 'hidden'
          mainEl.style.height = 'auto'
          mainEl.style.minHeight = '200vh'
          mainEl.style.maxHeight = 'none'
        }
      }
      
      // 强制启用页面滚动 - 添加滚动事件监听
      const enableScroll = () => {
        // 允许所有滚动事件
        document.body.style.overscrollBehavior = 'auto'
        document.body.style.overscrollBehaviorY = 'auto'
        html.style.overscrollBehavior = 'auto'
        html.style.overscrollBehaviorY = 'auto'
        
        // 确保可以滚动 - 添加滚动监听器
        const handleWheel = (e: WheelEvent) => {
          // 允许滚动事件正常传播
          e.stopPropagation = () => {} // 重写阻止传播
        }
        
        // 移除旧的事件监听器（如果存在）
        document.removeEventListener('wheel', handleWheel as any, { passive: true } as any)
        // 添加新的事件监听器
        document.addEventListener('wheel', handleWheel as any, { passive: true, capture: true } as any)
      }
      enableScroll()
      
      // 确保可以滚动
      console.log('Scroll fix applied:', {
        bodyOverflow: body.style.overflowY,
        htmlOverflow: html.style.overflowY,
        bodyHeight: body.style.height,
        htmlHeight: html.style.height,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      })
      
      // 强制触发重排，确保样式生效
      void document.body.offsetHeight
      void document.documentElement.offsetHeight
    }
  }
  
  // 延迟执行，确保DOM已完全渲染
  setTimeout(() => {
    fixScroll()
    // 强制触发滚动检查
    window.scrollTo(0, 0)
    // 测试滚动
    setTimeout(() => {
      window.scrollTo(0, 1)
      window.scrollTo(0, 0)
    }, 200)
  }, 100)
  
  // 监听travel变化，重新修复滚动
  watch(() => travel.value?.mode, () => {
    setTimeout(() => {
      fixScroll()
      window.scrollTo(0, 0)
    }, 100)
  })
  
  // 处理 ExperienceDay 组件的更新事件
  const handleTravelUpdate = (updatedTravel: Travel) => {
    console.log('[TravelDetailView] 收到 ExperienceDay 更新事件，更新 travel 数据')
    travel.value = updatedTravel
  }

  // 处理行程信息更新后的刷新
  const handleTravelRefresh = async () => {
    if (!travel.value) {
      console.warn('[TravelDetailView] 收到刷新事件，但 travel.value 为空')
      return
    }
    
    // 使用 backendItineraryId 优先，如果没有则使用 id
    const backendItineraryId = travel.value.data?.backendItineraryId || travel.value.id
    
    if (!backendItineraryId) {
      console.error('[TravelDetailView] 收到刷新事件，但无法获取 backendItineraryId')
      message.error('无法刷新：缺少行程 ID')
      return
    }
    
    console.log('[TravelDetailView] 收到刷新事件，从后端重新加载行程数据，ID:', backendItineraryId)
    
    // 直接从后端重新加载数据，不使用本地 store
    try {
      // 先获取最新的后端数据
      const { getItineraryDetail } = await import('@/services/itineraryAPI')
      const backendItinerary = await getItineraryDetail(backendItineraryId)
      
      console.log('[TravelDetailView] 从后端获取到最新数据:', {
        destination: backendItinerary.destination,
        daysCount: backendItinerary.daysCount,
        totalCost: backendItinerary.totalCost,
        summary: backendItinerary.summary,
        status: backendItinerary.status
      })
      
      // 直接更新 travel.value，确保触发响应式更新
      if (travel.value) {
        // 计算实际有活动的天数
        const calculateDaysCount = () => {
          if (backendItinerary.days && Array.isArray(backendItinerary.days) && backendItinerary.days.length > 0) {
            const daysWithActivities = backendItinerary.days.filter((day: any) => {
              const activities = day.activities || []
              return activities.length > 0
            })
            return daysWithActivities.length > 0 ? daysWithActivities.length : backendItinerary.days.length
          }
          return backendItinerary.daysCount || 0
        }
        const daysCount = calculateDaysCount()
        
        // 使用对象替换而不是扩展，确保触发响应式更新
        travel.value = {
          ...travel.value,
          destination: backendItinerary.destination,
          location: backendItinerary.destination,
          description: backendItinerary.summary || travel.value.description,
          duration: daysCount,
          budget: backendItinerary.totalCost || travel.value.budget,
          startDate: backendItinerary.startDate,
          status: backendItinerary.status === 'published' ? 'active' : (backendItinerary.status === 'archived' ? 'completed' : 'draft'),
          updatedAt: backendItinerary.updatedAt || new Date().toISOString(),
          data: {
            ...travel.value.data,
            destination: backendItinerary.destination,
            summary: backendItinerary.summary || travel.value.data?.summary,
            totalCost: backendItinerary.totalCost || travel.value.data?.totalCost,
            startDate: backendItinerary.startDate,
            status: backendItinerary.status,
            itineraryData: {
              ...travel.value.data?.itineraryData,
              destination: backendItinerary.destination,
              summary: backendItinerary.summary || travel.value.data?.itineraryData?.summary,
              totalCost: backendItinerary.totalCost || travel.value.data?.itineraryData?.totalCost,
              duration: daysCount,
              budget: backendItinerary.totalCost || travel.value.data?.itineraryData?.budget,
              // 如果后端返回了 days 数据，先更新（完整数据会在 loadItineraryFromBackend 中更新）
              // 去重：按 day 和 id 去重
              days: Array.isArray(backendItinerary.days) && backendItinerary.days.length > 0
                ? (() => {
                    const dayMap = new Map<string | number, any>()
                    backendItinerary.days.forEach((day: any) => {
                      const key = day.day || day.id
                      if (key) {
                        const existing = dayMap.get(key)
                        if (!existing || (day.id && !existing.id)) {
                          dayMap.set(key, {
                            id: day.id,
                            day: day.day,
                            date: day.date,
                            timeSlots: day.activities || []
                          })
                        }
                      }
                    })
                    return Array.from(dayMap.values()).sort((a: any, b: any) => (a.day || 0) - (b.day || 0))
                  })()
                : travel.value.data?.itineraryData?.days
            }
          }
        }
        
        // 等待响应式更新完成
        await nextTick()
        
        console.log('[TravelDetailView] travel.value 已更新:', {
          destination: travel.value.destination,
          duration: travel.value.duration,
          budget: travel.value.budget,
          description: travel.value.description
        })
      }
      
      // 然后加载完整详情（包括活动数据）
      await loadItineraryFromBackend(backendItineraryId)
      
      console.log('[TravelDetailView] 从后端重新加载完成')
    } catch (error: any) {
      console.error('[TravelDetailView] 从后端重新加载失败:', error)
      message.error(`刷新行程数据失败: ${error.message || '未知错误'}，请重试`)
    }
  }
  
  // 监听窗口大小变化，重新修复滚动
  window.addEventListener('resize', () => {
    if (travel.value?.mode === 'inspiration' || travel.value?.mode === 'classic') {
      setTimeout(() => {
        fixScroll()
      }, 100)
    }
  })
  
  // 调试信息：检查模式判断
  if (!travel.value) {
    console.error('❌ 未找到旅程数据，ID:', id)
  } else if (!travel.value.mode) {
    console.warn('⚠️ 旅程数据缺少 mode 字段，使用默认模式')
  } else {
    console.log('✅ 旅程模式:', travel.value.mode)
    if (travel.value.mode === 'inspiration' || travel.value.mode === 'classic') {
      console.log('✅ 这是灵感/经典模式，应该显示 ExperienceDay（已集成封面设计）')
    }
  }
  
  console.log('Should show sidebar for mode:', travel.value?.mode || 'default')
  // planner 和 seeker 模式已移除，不再需要处理相关数据

})


// planner 和 seeker 模式已移除，相关辅助函数已删除

// 获取签证信息提示
const getVisaInfoHint = () => {
  const nationalityCode = getUserNationalityCode()
  const permanentResidencyCode = getUserPermanentResidencyCode()
  
  if (!nationalityCode && !permanentResidencyCode) {
    return '请设置您的国籍或永久居民身份信息，以便获取准确的签证要求。'
  }
  
  if (!nationalityCode) {
    return '已设置永久居民身份，但建议同时设置国籍信息以获得更完整的签证信息。'
  }
  
  if (!permanentResidencyCode) {
    return '已设置国籍信息，如果您持有永久居民身份，建议也设置以获得更优惠的签证政策。'
  }
  
  return '正在查询该目的地的签证信息，请稍候...'
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  position: relative;
  overflow-x: hidden;
}

/* Inspiration模式：确保容器可以滚动 */
.container.inspiration-container {
  overflow-y: visible;
  height: auto;
  min-height: 100vh;
}

/* 桌面端：确保main-content可以滚动 */
@media (min-width: 992px) {
  .main-content.inspiration-mode {
    overflow: visible !important;
    overflow-y: visible !important;
    overflow-x: hidden !important;
    height: auto !important;
    /* 移除固定的min-height，让内容自然决定高度 */
    position: relative;
    max-height: none !important;
  }
  
  .container.inspiration-container {
    /* 移除固定的min-height，让内容自然决定高度 */
    overflow-y: visible !important;
    height: auto !important;
    max-height: none !important;
  }
  
  /* 强制body和html可以滚动 */
  body {
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100vh !important;
    max-height: none !important;
  }
  
  html {
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100vh !important;
    max-height: none !important;
  }
  
  #app {
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100vh !important;
    max-height: none !important;
  }
}

/* 确保body可以滚动 - 通过JavaScript动态设置 */

.header {
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.back-button {
  height: 36px;
}

/* Hero区域 */
.hero-section {
  position: relative;
  overflow: hidden;
}

.hero-cover {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-cover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6));
}

.hero-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 3rem;
  color: white;
  z-index: 10;
}

.hero-welcome {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
}

.welcome-emoji {
  font-size: 1.2rem;
}

.welcome-text {
  font-style: italic;
}

.hero-info {
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-separator {
  color: rgba(255, 255, 255, 0.6);
}

.meta-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.hero-extra {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.hero-extra span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* AI摘要 */
.ai-summary {
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.ai-icon {
  font-size: 1.5rem;
  color: #ffd700;
  flex-shrink: 0;
}

.ai-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
}

/* 操作按钮 */
.hero-actions {
  display: flex;
  gap: 1rem;
}

/* 主要内容 */
.main-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 4vw, 3rem);
  width: 100%;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.main-content.inspiration-mode {
  margin-top: 0;
}

.content-layout {
  display: grid;
  gap: 24px;
  align-items: start;
}

.content-layout.with-sidebar {
  grid-template-columns: minmax(0, 1fr);
}

.content-layout.inspiration-layout {
  gap: 32px;
}

.primary-panel,
.sidebar-panel {
  min-width: 0;
}

.primary-panel > * + * {
  margin-top: 24px;
}

.sidebar-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-self: start;
}

.sidebar-block {
  width: 100%;
}

.sidebar-block:not(:last-child) {
  margin-bottom: 24px;
}

@media (min-width: 992px) {
  .content-layout.with-sidebar {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
  }

  .sidebar-panel {
    position: sticky;
    top: 24px;
  }
}

@media (min-width: 1400px) {
  .main-content {
    max-width: 1800px;
  }

  .content-layout.with-sidebar {
    grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
  }
}

@media (max-width: 991px) {
  .main-content {
    padding: 0 clamp(1rem, 3vw, 2rem);
    max-width: 100%;
  }
  
  .sidebar-panel {
    position: static;
  }
}

/* Layout overrides handled above */

.timeline-card,
.sidebar-card {
  border-radius: 12px;
}

.chat-area {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-messages {
  min-height: 150px;
  max-height: 200px;
  overflow-y: auto;
}

.chat-placeholder {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.file-placeholder {
  text-align: center;
  padding: 1rem;
  color: #999;
}

.file-placeholder p {
  margin: 0.5rem 0;
}

.day-card {
  background: #fafafa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.day-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.day-description {
  color: #666;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.day-activities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.activity-tag {
  margin: 0;
}

.timeline-actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.budget-info {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-content {
    padding: 2rem 1rem;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-extra {
    flex-direction: column;
    gap: 0.5rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .main-content {
    padding: 0 1rem;
  }
}


/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
}

.loading-container p {
  color: #666;
  font-size: 1rem;
}

.mode-not-supported {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
</style>

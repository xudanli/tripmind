<template>
  <div class="container">
    <!-- 骨架屏加载状态 -->
    <ItinerarySkeleton v-if="isLoading" />
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <a-result
        status="error"
        title="加载失败"
        :sub-title="error.message || '加载行程详情失败，请刷新页面重试'"
      >
        <template #extra>
          <a-button type="primary" @click="refresh">重新加载</a-button>
        </template>
      </a-result>
    </div>
    
    <!-- 数据不存在 -->
    <div v-else-if="travel === null || travel === undefined" class="empty-container">
      <a-empty description="行程不存在" />
    </div>
    
    <!-- 正常内容 -->
    <template v-else>
    <!-- 旅行详情头部 -->
    <TravelDetailHeader
      :destination="travel?.destination || travel?.location || ''"
      :destination-name="destinationName || travel?.destination || travel?.location"
      :subtitle="headerSubtitle"
      :background-image="headerBackgroundImage"
      :weather-data="null"
      :practical-info="practicalInfoData"
      :currency-info="currencyInfoText"
      :latest-updates="latestUpdatesHtml"
      @back="router.back()"
    />

    <!-- 主要内容区域：所有模式统一显示 -->
    <div 
      v-if="travel?.mode"
      class="main-content"
      :class="{
        'planner-mode': travel?.mode === 'planner'
      }"
    >
      <div
        class="content-layout"
          :class="{
          'with-sidebar': shouldShowSidebar
        }"
      >
        <section class="primary-panel">
          <ExperienceDay :travel="travel" @update="handleTravelUpdate" @refresh="handleTravelRefresh" />
        </section>

        <!-- 右侧面板 -->
        <aside
          v-if="shouldShowSidebar"
          class="sidebar-panel"
        >
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

          <!-- 天气信息（已禁用） -->
          <!-- <WeatherCard
            :destination-id="destinationId"
            :destination-name="destinationName || travel?.destination || travel?.location"
            class="sidebar-block"
          /> -->

          <!-- 安全提示 -->
          <SafetyNoticeCard
            v-if="travel?.data?.backendItineraryId"
            :journey-id="travel.data.backendItineraryId"
            :destination="travel?.destination || travel?.location"
            :country-code="destinationCountry"
            class="sidebar-block"
          />

          <!-- 货币信息 -->
          <CurrencyInfoCard
            v-if="travel?.data?.itineraryData?.currencyInfo || travel?.data?.itineraryData?.currency"
            :currency-info="travel.data.itineraryData.currencyInfo"
            :currency="travel.data.itineraryData.currency"
            class="sidebar-block"
          />

          <!-- 实用信息 -->
          <PracticalInfoCard
            v-if="hasPracticalInfo"
            :practical-info="practicalInfoForCard"
            class="sidebar-block"
          />

          <!-- 文化红黑榜 -->
          <CulturalGuideCard
            v-if="travel?.data?.backendItineraryId"
            :journey-id="travel.data.backendItineraryId"
            :destination="travel?.destination || travel?.location"
            class="sidebar-block"
          />
        </aside>
      </div>
    </div>

    </template>
    
    <!-- AI旅行助手 -->
    <TravelAssistant 
      v-if="travel?.id || travel?.data?.backendItineraryId"
      :travel-id="travel?.data?.backendItineraryId || travel?.id" 
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { VisaInfo } from '@/config/visa'
import { useRouter, useRoute } from 'vue-router'
import { useTravelListStore, type Travel } from '@/stores/travelList'
import { useTravelStore } from '@/stores/travel'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
// 只保留灵感模式相关组件
import ExperienceDay from '@/components/TravelDetail/ExperienceDay.vue'
import TravelSidebar from '@/components/TravelDetail/TravelSidebar.vue'
import TravelAssistant from '@/components/TravelDetail/TravelAssistant.vue'
import VisaGuide from '@/components/TravelDetail/VisaGuide.vue'
// import WeatherCard from '@/components/TravelDetail/WeatherCard.vue' // 天气接口已禁用
// InspirationHero 和 PersonaJourneySidebar 已删除（inspiration 模式相关）
import MultiDestinationVisaAnalysis from '@/components/TravelDetail/MultiDestinationVisaAnalysis.vue'
import SafetyNoticeCard from '@/components/TravelDetail/SafetyNoticeCard.vue'
import PracticalInfoCard from '@/components/TravelDetail/PracticalInfoCard.vue'
import CurrencyInfoCard from '@/components/TravelDetail/CurrencyInfoCard.vue'
import CulturalGuideCard from '@/components/TravelDetail/CulturalGuideCard.vue'
import TravelDetailHeader from '@/components/TravelDetail/TravelDetailHeader.vue'
import ItinerarySkeleton from '@/components/TravelDetail/ItinerarySkeleton.vue'
import { getUserNationalityCode, getUserPermanentResidencyCode } from '@/config/userProfile'
import { getVisaInfo, analyzeMultiDestinationVisa, extractAllDestinationCountries } from '@/config/visa'
import { PRESET_COUNTRIES } from '@/constants/countries'
// 使用 Composable 管理行程数据
import { useItineraryData } from '@/composables/useItineraryData'

const { t } = useI18n()
import {
  ArrowLeftOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const travelListStore = useTravelListStore()
const travelStore = useTravelStore()

// 使用 Composable 管理行程数据
const itineraryId = ref<string | undefined>(route.params.id as string)
const { itinerary: travel, isLoading, error, loadData, refresh } = useItineraryData(itineraryId)

// 处理 ExperienceDay 组件的更新事件
const handleTravelUpdate = (updatedTravel: Travel) => {
  console.log('[TravelDetailView] 收到 ExperienceDay 更新事件，更新 travel 数据')
  travel.value = updatedTravel
}

// 处理行程信息更新后的刷新 - 使用 composable 的 refresh 方法
const handleTravelRefresh = async () => {
  if (!travel.value) {
    console.warn('[TravelDetailView] 收到刷新事件，但 travel.value 为空')
    return
  }
  
  console.log('[TravelDetailView] 收到刷新事件，使用 composable 刷新数据')
  await refresh()
}
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

// 头部副标题
const headerSubtitle = computed(() => {
  if (!travel.value) return ''
  
  const days = travel.value.duration || travel.value.data?.itineraryData?.days?.length || 0
  const destination = travel.value.destination || travel.value.location || ''
  
  if (days > 0 && destination) {
    return `${destination}的${days}天精彩之旅，探索当地文化、美食与自然风光，体验独特的旅行魅力。`
  }
  
  return travel.value.description || travel.value.data?.itineraryData?.summary || ''
})

// 头部背景图片（可以从行程数据中获取，或使用默认渐变）
const headerBackgroundImage = computed(() => {
  // 可以从 travel.value.data 中获取封面图片
  // 暂时返回 undefined，使用默认渐变背景
  return undefined
})

// 天气数据HTML（用于头部显示）
const weatherDataHtml = computed(() => {
  // 这里可以调用天气API获取数据并格式化为HTML
  // 暂时返回空，后续可以集成天气API
  return null
})

// 实用信息数据
const practicalInfoData = computed(() => {
  if (!travel.value?.data?.itineraryData?.practicalInfo) return undefined
  
  const info = travel.value.data.itineraryData.practicalInfo
  return {
    language: info.language || undefined,
    plugType: info.plugType || undefined,
    emergencyContact: info.emergencyContact || '112' // 默认紧急电话
  }
})

// 实用信息数据（用于 PracticalInfoCard）
const practicalInfoForCard = computed(() => {
  return travel.value?.data?.itineraryData?.practicalInfo
})

// 检查是否有实用信息
const hasPracticalInfo = computed(() => {
  const info = travel.value?.data?.itineraryData?.practicalInfo
  if (!info) {
    if (isDev) {
      console.log('🔍 [PracticalInfoCard] practicalInfo 不存在:', {
        hasTravel: !!travel.value,
        hasData: !!travel.value?.data,
        hasItineraryData: !!travel.value?.data?.itineraryData,
        itineraryDataKeys: travel.value?.data?.itineraryData ? Object.keys(travel.value.data.itineraryData) : []
      })
    }
    return false
  }
  
  // 检查是否至少有一个字段有值
  const hasValue = !!(
    info.weather ||
    info.safety ||
    info.plugType ||
    info.currency ||
    info.culturalTaboos ||
    info.packingList
  )
  
  if (isDev) {
    console.log('🔍 [PracticalInfoCard] practicalInfo 检查:', {
      hasValue,
      practicalInfo: info,
      fields: {
        weather: !!info.weather,
        safety: !!info.safety,
        plugType: !!info.plugType,
        currency: !!info.currency,
        culturalTaboos: !!info.culturalTaboos,
        packingList: !!info.packingList
      }
    })
  }
  
  return hasValue
})

// 货币信息文本
const currencyInfoText = computed(() => {
  const currencyInfo = travel.value?.data?.itineraryData?.currencyInfo
  const currency = travel.value?.data?.itineraryData?.currency
  
  if (currencyInfo) {
    const parts: string[] = []
    if (currencyInfo.code) parts.push(`1 USD ≈ ${currencyInfo.code}`)
    if (currencyInfo.symbol) parts.push(`符号: ${currencyInfo.symbol}`)
    if (currencyInfo.name) parts.push(`名称: ${currencyInfo.name}`)
    return parts.length > 0 ? parts.join('; ') : undefined
  }
  
  if (currency) {
    return `货币: ${currency}`
  }
  
  return undefined
})

// 最新动态HTML
const latestUpdatesHtml = computed(() => {
  // 可以从安全提示或其他数据源获取最新动态
  // 暂时返回空，后续可以集成相关API
  return null
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
  // 计划：当后端提供目的地查询接口时，通过目的地名称查询对应的 destinationId
  // 当前已通过 findOrCreateDestination 实现，但可以进一步优化
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


// 注意：loadItineraryFromBackend 函数已移除，逻辑已迁移到 useItineraryData composable

  // 加载旅程数据 - 使用 composable 管理数据加载
onMounted(async () => {
  const id = route.params.id as string
  console.log('[TravelDetailView] mounted, 准备加载行程数据，id:', id)
  
  // 验证 ID 是否为有效的 UUID 格式
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  
  let backendItineraryId = id
  
  // 如果 ID 不是 UUID 格式，尝试从 store 中查找对应的 travel，获取 backendItineraryId
  if (!isValidUUID) {
    console.log('[TravelDetailView] ID 不是 UUID 格式，尝试从 store 中查找:', id)
    
    // 先尝试从 store 中获取
    const localTravel = travelListStore.getTravel(id)
    if (localTravel?.data?.backendItineraryId) {
      backendItineraryId = localTravel.data.backendItineraryId
      console.log('[TravelDetailView] 从 store 中找到 backendItineraryId:', backendItineraryId)
    } else {
      // 如果 store 中没有，尝试同步
      console.log('[TravelDetailView] store 中没有找到，尝试同步...')
      await travelListStore.syncFromBackend()
      const syncedTravel = travelListStore.getTravel(id)
      if (syncedTravel?.data?.backendItineraryId) {
        backendItineraryId = syncedTravel.data.backendItineraryId
        console.log('[TravelDetailView] 同步后找到 backendItineraryId:', backendItineraryId)
      } else {
        console.error('[TravelDetailView] 无法找到对应的 backendItineraryId，ID:', id)
        message.error('无法加载行程：缺少有效的行程 ID')
        router.back()
        return
      }
    }
  }
  
  // 设置 itineraryId，然后使用 composable 加载数据
  itineraryId.value = backendItineraryId
  await loadData()
  
  // 监听行程修改事件，自动刷新数据
  const handleItineraryUpdated = (event: CustomEvent) => {
    const eventJourneyId = event.detail?.journeyId
    const currentJourneyId = travel.value?.data?.backendItineraryId || travel.value?.id
    
    if (eventJourneyId && eventJourneyId === currentJourneyId) {
      console.log('[TravelDetailView] 收到行程修改事件，刷新数据:', eventJourneyId)
      handleTravelRefresh()
    }
  }
  
  window.addEventListener('itinerary-updated', handleItineraryUpdated as EventListener)
  
  // 清理事件监听器
  onUnmounted(() => {
    window.removeEventListener('itinerary-updated', handleItineraryUpdated as EventListener)
  })
  
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

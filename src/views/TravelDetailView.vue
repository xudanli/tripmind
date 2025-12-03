<template>
  <div class="page-container">
    <Transition name="fade" mode="out-in">
      <ItinerarySkeleton v-if="isLoading" key="loading" />

      <div v-else-if="error" class="state-container error" key="error">
      <a-result
        status="error"
        title="加载失败"
        :sub-title="error.message || '加载行程详情失败，请刷新页面重试'"
      >
        <template #extra>
            <a-button type="primary" @click="handleTravelRefresh">重新加载</a-button>
            <a-button @click="router.back()">返回列表</a-button>
        </template>
      </a-result>
    </div>
    
      <div v-else-if="!travel" class="state-container empty" key="empty">
        <a-result status="404" title="行程不存在" sub-title="该行程可能已被删除或您没有权限访问">
          <template #extra>
            <a-button type="primary" @click="router.push('/travel-list')">返回行程列表</a-button>
          </template>
        </a-result>
    </div>
    
      <div v-else class="content-wrapper" key="content">
    <TravelDetailHeader
          :destination="travel.destination || travel.location || ''"
          :destination-name="destinationName || travel.destination || travel.location"
      :subtitle="headerSubtitle"
          :summary="travelSummary"
      :background-image="headerBackgroundImage"
      :practical-info="practicalInfoData"
      :currency-info="currencyInfoText"
      @back="router.back()"
    />

        <div class="main-layout" :class="{ 'has-sidebar': shouldShowSidebar }">
          
          <main class="primary-column">
            <ExperienceDay 
              :travel="travel" 
              @update="handleTravelUpdate" 
              @refresh="handleTravelRefresh" 
            />
          </main>

          <aside v-if="shouldShowSidebar" class="sidebar-column">
            <div class="sidebar-sticky-wrapper">
              
          <TravelSidebar 
                v-if="travel.id"
                class="widget-card"
            :travel-id="travel.id"
            :mode="travel.mode || 'default'"
            :initial-spent="travel.spent || 0"
            :initial-total="travel.budget || 0"
          />

          <VisaGuide 
            v-if="visaInfo && destinationCountry"
                class="widget-card"
            :visa-info="visaInfo"
            :destination-country="destinationCountry"
            :destination-name="destinationName"
          />
              <a-card v-else-if="destinationCountry && !visaInfo" class="widget-card" title="✈️ 签证指引" size="small">
            <a-alert
              type="info"
              show-icon
                  message="完善信息以获取指引"
                >
                  <template #description>
                    <span style="font-size: 12px">{{ getVisaInfoHint() }}</span>
                  </template>
                </a-alert>
          </a-card>

          <SafetyNoticeCard
                v-if="travel.data?.backendItineraryId"
            :journey-id="travel.data.backendItineraryId"
                :destination="travel.destination || travel.location"
            :country-code="destinationCountry"
                class="widget-card"
              />

              <LocalEssentialsCard
                v-if="travel.data?.backendItineraryId"
                :journey-id="travel.data.backendItineraryId"
                :destination="destinationName || travel.destination || travel.location"
                class="widget-card"
              />

          <PracticalInfoCard
            v-if="hasPracticalInfo"
            :practical-info="practicalInfoForCard"
                class="widget-card"
          />

              <CulturalGuideCard
                v-if="travel.data?.backendItineraryId"
            :journey-id="travel.data.backendItineraryId"
                :destination="travel.destination || travel.location"
                class="widget-card"
          />

              <JourneyWeatherCard
                v-if="travel.data?.backendItineraryId"
            :journey-id="travel.data.backendItineraryId"
                class="widget-card"
              />

              <PackingListCard
                v-if="travel.data?.backendItineraryId"
                :journey-id="travel.data.backendItineraryId"
                class="widget-card"
              />
            </div>
        </aside>
      </div>
    </div>
    </Transition>

    <TravelAssistant 
      v-if="travel?.id || travel?.data?.backendItineraryId"
      :travel-id="travel?.data?.backendItineraryId || travel?.id" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'

// Configs & Constants
import { PRESET_COUNTRIES } from '@/constants/countries'
import { getUserNationalityCode, getUserPermanentResidencyCode } from '@/config/userProfile'
import { getVisaInfo, analyzeMultiDestinationVisa, extractAllDestinationCountries } from '@/config/visa'
import type { VisaInfo } from '@/config/visa'

// Components
import ExperienceDay from '@/components/TravelDetail/ExperienceDay.vue'
import TravelSidebar from '@/components/TravelDetail/TravelSidebar.vue'
import TravelAssistant from '@/components/TravelDetail/TravelAssistant.vue'
import VisaGuide from '@/components/TravelDetail/VisaGuide.vue'
import SafetyNoticeCard from '@/components/TravelDetail/SafetyNoticeCard.vue'
import PracticalInfoCard from '@/components/TravelDetail/PracticalInfoCard.vue'
import LocalEssentialsCard from '@/components/TravelDetail/LocalEssentialsCard.vue'
import CulturalGuideCard from '@/components/TravelDetail/CulturalGuideCard.vue'
import JourneyWeatherCard from '@/components/TravelDetail/JourneyWeatherCard.vue'
import PackingListCard from '@/components/TravelDetail/PackingListCard.vue'
import TravelDetailHeader from '@/components/TravelDetail/TravelDetailHeader.vue'
import ItinerarySkeleton from '@/components/TravelDetail/ItinerarySkeleton.vue'

// Composables & Stores
import { useTravelListStore, type Travel } from '@/stores/travelList'
import { useItineraryData } from '@/composables/useItineraryData'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const travelListStore = useTravelListStore()

// --- Data Fetching ---
const itineraryId = ref<string | undefined>(route.params.id as string)
const { itinerary: travel, isLoading, error, loadData, refresh } = useItineraryData(itineraryId)

// --- Lifecycle & Init ---
onMounted(async () => {
  const id = route.params.id as string
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  
  // 处理非 UUID 的本地 ID 映射
  if (!isValidUUID) {
    let backendId = travelListStore.getTravel(id)?.data?.backendItineraryId
    if (!backendId) {
      await travelListStore.syncFromBackend()
      backendId = travelListStore.getTravel(id)?.data?.backendItineraryId
    }
    
    if (backendId) {
      itineraryId.value = backendId
    } else {
      message.error('无法加载行程：缺少有效的后端 ID')
    }
  }

  // 加载数据
  await loadData()
  
  // 监听全局刷新事件
  window.addEventListener('itinerary-updated', handleGlobalUpdate as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('itinerary-updated', handleGlobalUpdate as EventListener)
})

// --- Event Handlers ---
const handleGlobalUpdate = (event: CustomEvent) => {
  const eventJourneyId = event.detail?.journeyId
  const currentId = travel.value?.data?.backendItineraryId || travel.value?.id
  if (eventJourneyId && eventJourneyId === currentId) {
    handleTravelRefresh()
  }
}

const handleTravelUpdate = (updatedTravel: Travel) => {
  travel.value = updatedTravel
}

const handleTravelRefresh = async () => {
  if (travel.value) await refresh()
}

// --- Computed Properties ---

// 侧边栏显示逻辑
const shouldShowSidebar = computed(() => {
  if (!travel.value) return false
  const mode = travel.value.mode
  return ['inspiration', 'classic', 'planner'].includes(mode || '')
})

// 头部副标题
const headerSubtitle = computed(() => {
  if (!travel.value) return ''
  
  const days = travel.value.duration || travel.value.data?.itineraryData?.days?.length || 0
  const dest = travel.value.destination || travel.value.location || ''
  
  if (days > 0 && dest) {
    return `${dest} ${days}天探索之旅`
  }
  return ''
})

// 行程摘要
const travelSummary = computed(() => {
  if (!travel.value) return ''
  
  // 优先从 itineraryData.summary 获取（后端返回的摘要）
  // 其次从 description 获取（可能包含摘要）
  const summary = travel.value.data?.itineraryData?.summary || 
                  travel.value.description || 
                  ''
  
  // 如果 description 是"X天探索之旅"格式，则不作为摘要显示
  if (summary && summary.includes('天探索之旅')) {
    return ''
  }
  
  return summary
})

const headerBackgroundImage = computed(() => undefined) // 可扩展：从 travel.data 获取封面图

// 实用信息整理
const practicalInfoData = computed(() => {
  const info = travel.value?.data?.itineraryData?.practicalInfo
  return info ? { language: info.language, emergencyContact: info.emergencyContact || '112' } : undefined
})

const practicalInfoForCard = computed(() => travel.value?.data?.itineraryData?.practicalInfo)

const hasPracticalInfo = computed(() => {
  const info = practicalInfoForCard.value
  return !!(info && (info.weather || info.safety || info.culturalTaboos || info.packingList))
})

const currencyInfoText = computed(() => {
  const info = travel.value?.data?.itineraryData?.currencyInfo
  const code = travel.value?.data?.itineraryData?.currency
  if (info) {
    const parts = []
    if (info.code) parts.push(`1 USD ≈ ${info.code}`)
    if (info.symbol) parts.push(info.symbol)
    return parts.join(' ')
  }
  return code ? `货币: ${code}` : undefined
})

// --- Logic: Country Extraction ---

// 国家别名映射表 (静态常量，避免重复创建)
const COUNTRY_ALIASES: Record<string, string[]> = {
  'JP': ['japan', '日本'], 'KR': ['korea', 'south korea', '韩国'],
  'US': ['usa', 'united states', '美国'], 'GB': ['uk', 'britain', '英国'],
  'FR': ['france', '法国'], 'TH': ['thailand', '泰国'],
  'CN': ['china', '中国'], 'HK': ['hong kong', '香港'], 'MO': ['macau', '澳门'],
  'TW': ['taiwan', '台湾'], 'SG': ['singapore', '新加坡'], 'MY': ['malaysia', '马来西亚']
}

const extractCountryCodeFromDestination = (destStr?: string): string | null => {
  if (!destStr) return null
  
  // 1. 清洗字符串，取第一个分隔符前的内容
  const separators = /[・·|/\-→]/
  const primaryText = destStr.split(separators)[0].trim().toLowerCase()
  const fullText = destStr.toLowerCase()

  // 2. 遍历预设国家
  for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
    const nameLower = country.name.toLowerCase()
    
    // 匹配代码或全名
    if (primaryText === code.toLowerCase() || fullText.includes(nameLower)) return code
    
    // 匹配别名
    const aliases = COUNTRY_ALIASES[code] || []
    if (aliases.some(a => fullText.includes(a.toLowerCase()))) return code
  }
    return null
  }
  
const destinationCountry = computed(() => {
  if (!travel.value) return null

  // 0. 优先：多目的地分析
  if (multiDestinationVisaAnalysis.value?.allCountries?.length) {
    return multiDestinationVisaAnalysis.value.allCountries[0]
  }

  // 1. 字段回退策略
  const candidates = [
    travel.value.location,
    travel.value.destination,
    (travel.value.data as any)?.itineraryData?.destination
  ]

  for (const candidate of candidates) {
    const code = extractCountryCodeFromDestination(candidate)
    if (code) return code
  }

  return null
})

const destinationName = computed(() => {
  if (!destinationCountry.value) return ''
  return PRESET_COUNTRIES[destinationCountry.value as keyof typeof PRESET_COUNTRIES]?.name || ''
})

// --- Logic: Visa & Analysis ---

const multiDestinationVisaAnalysis = computed(() => {
  if (!travel.value) return null
  
  const allCountries = extractAllDestinationCountries({
    location: travel.value.location,
    destination: travel.value.destination,
    days: (travel.value.data as any)?.days,
    itineraryData: (travel.value.data as any)?.itineraryData
  })
  
  if (!allCountries.length) return null
  
  return analyzeMultiDestinationVisa(
    allCountries, 
    getUserNationalityCode() || null, 
    getUserPermanentResidencyCode() || null
  )
})

const visaInfo = ref<VisaInfo | null>(null)

const loadVisaInfo = async () => {
  const countryCode = destinationCountry.value
  if (!countryCode) return

  // 多目的地申根逻辑处理
  const multi = multiDestinationVisaAnalysis.value
  if (multi && multi.requiredVisas.length > 0) {
    const schengen = multi.requiredVisas.find(v => v.name.includes('申根'))
    if (schengen?.visaInfo?.[0]) {
      visaInfo.value = schengen.visaInfo[0]
        return
    }
  }

  // 单目的地查询
  try {
    const results = await getVisaInfo(
      countryCode, 
      getUserNationalityCode() || null, 
      getUserPermanentResidencyCode() || null
    )
    visaInfo.value = results?.[0] || null
  } catch (e) {
    console.error('Visa fetch failed', e)
      visaInfo.value = null
  }
}

watch([destinationCountry, multiDestinationVisaAnalysis], loadVisaInfo, { immediate: true })

const getVisaInfoHint = () => {
  const nat = getUserNationalityCode()
  if (!nat) return '请在个人设置中完善国籍信息，以便获取准确签证要求。'
  return '正在查询签证信息...'
}
</script>

<style scoped>
/* 全局布局策略：
  使用标准的 Flex/Grid 布局，依靠 overflow-y: auto 实现自然滚动。
  避免使用 JS 强行修改 body 样式。
*/

.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  /* 关键：防止 margin 塌陷导致的滚动条问题 */
  display: flex;
  flex-direction: column; 
}

/* 状态容器 (Loading/Error/Empty) */
.state-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* 内容区域 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 主栅格布局 */
.main-layout {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 桌面端布局 */
@media (min-width: 1024px) {
  .main-layout.has-sidebar {
    flex-direction: row;
    align-items: flex-start; /* 关键：允许侧边栏高度不同 */
  }

  .primary-column {
    flex: 1;
    min-width: 0; /* 防止内容溢出 */
  }

  .sidebar-column {
    width: 360px;
    flex-shrink: 0;
  }

  /* 侧边栏 Sticky 效果 */
  .sidebar-sticky-wrapper {
    position: sticky;
    top: 24px; /* 距离顶部间距 */
  display: flex;
  flex-direction: column;
    gap: 20px;
  }
}

/* 移动端适配 */
@media (max-width: 1023px) {
  .main-layout {
    padding: 16px;
  }
  
  .sidebar-column {
    width: 100%;
  }

  .sidebar-sticky-wrapper {
  display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

/* 通用小部件样式 */
.widget-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease;
}

.widget-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <div class="container">
    <!-- 头部导航 -->
    <div class="header">
      <a-button
        @click="router.back()"
        class="back-button"
      >
        <template #icon>
          <arrow-left-outlined />
        </template>
        {{ t('common.back') }}
      </a-button>
      <div class="header-title">
        <bulb-outlined class="header-icon" />
        <h2 class="title">{{ t('inspiration.title') }}</h2>
      </div>
      
      <!-- 国家和语言显示 -->
      <div class="settings-badge">
        <a-tag color="processing">{{ currentCountryDisplay }}</a-tag>
        <a-tag color="cyan">{{ currentLanguageDisplay }}</a-tag>
      </div>
      
      <!-- 目录页链接 -->
      <a-button
        @click="router.push('/inspiration/catalog')"
        class="catalog-button"
        type="default"
      >
        <template #icon>
          <unordered-list-outlined />
        </template>
        浏览目录
      </a-button>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <a-card class="inspiration-card">
        <div class="inspiration-content">
          <div class="input-section">
            <h3>{{ t('inspiration.prompt') }}</h3>
            <p>{{ t('inspiration.description') }}</p>
            
            <div class="input-container">
              <a-textarea
                v-model:value="inspirationInput"
                :placeholder="t('inspiration.placeholder')"
                :auto-size="{ minRows: 3, maxRows: 10 }"
                class="inspiration-input"
                @keydown.enter.ctrl="handleSubmit"
              />
            </div>

            <a-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleSubmit"
              class="submit-button"
              :disabled="!inspirationInput.trim()"
            >
              {{ loading ? t('common.loading') : t('inspiration.generate') }}
            </a-button>
          </div>

          <!-- 本地灵感库建议（当未生成结果时显示，但不显示在问卷模式下，也不显示在加载中） -->
          <div v-if="!inspirationResult && !travelStore.loading && localSuggestions.length" style="margin-top: 1rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <a-divider style="flex:1;margin:0 8px 0 0;">本地灵感库建议</a-divider>
              <a-button type="link" @click="randomizeSuggestions" style="padding:0;">换一批</a-button>
            </div>
            <div class="locations-grid">
              <div
                v-for="(s, idx) in localSuggestions"
                :key="idx"
                class="location-option"
                @click="useSuggestion(s.name)"
                :title="s.country"
              >
                {{ s.name }}
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <a-alert
            v-if="error"
            :message="error"
            type="error"
            show-icon
            closable
            @close="travelStore.setError(null)"
            style="margin: 1rem 0"
          />

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-section" style="text-align: center; padding: 3rem;">
            <a-spin size="large" />
            <p style="margin-top: 1rem; color: #666;">正在分析你的心理画像并生成推荐目的地...</p>
          </div>

          <!-- 灵感卡片结果 -->
          <div v-else-if="inspirationResult" class="result-section">
            <a-divider style="height: 8px; background-color: #f0f0f0;" />
            
            <div class="inspiration-result">
              <div class="result-header">
                <a-avatar size="large" style="background-color: #667eea">✨</a-avatar>
                <div class="result-title">
                  <h4>{{ inspirationResult.title }}</h4>
                  <p class="result-subtitle">{{ inspirationResult.subtitle }}</p>
                </div>
              </div>

              <div class="result-details">
                <a-row :gutter="[16, 16]">
                  <!-- 如果有推荐目的地列表且没有明确目的地，显示推荐列表 -->
                  <a-col v-if="shouldShowRecommendedDestinations" :xs="24" :sm="24">
                    <div class="detail-item locations-item">
                      <div class="detail-icon">📍</div>
                      <div class="detail-content locations-wrapper">
                        <span class="detail-label">{{ t('home.inspiration.recommendedLocations') }}</span>
                        <div class="locations-grid">
                          <div 
                            v-for="(loc, index) in inspirationResult.locations" 
                            :key="index" 
                            class="location-option"
                            :class="{ 'selected': selectedLocation === loc }"
                            @click="selectedLocation = loc"
                          >
                            {{ formatLocationLabel(loc) }}
                          </div>
                        </div>
                        <p v-if="isCandidateResult" class="candidate-hint">
                          {{ t('home.inspiration.chooseDestinationHint') }}
                        </p>
                        <div v-if="isCandidateResult" class="candidate-actions">
                          <a-button
                            type="primary"
                            size="middle"
                            :disabled="!selectedLocation"
                            @click="handleGenerateFullItinerary"
                          >
                            {{ t('home.inspiration.generateDetailedItinerary') }}
                          </a-button>
                        </div>
                      </div>
                    </div>
                  </a-col>
                  
                  <!-- 如果有明确目的地，显示单个目的地 -->
                  <a-col v-else-if="hasSpecificDestination || (inspirationResult.location && (!inspirationResult.locations || inspirationResult.locations.length === 0))" :xs="24" :sm="8">
                    <div class="detail-item">
                      <div class="detail-icon">📍</div>
                      <div class="detail-content">
                        <span class="detail-label">{{ t('home.inspiration.recommendedLocation') }}</span>
                        <span class="detail-value">{{ inspirationResult.destination || inspirationResult.location }}</span>
                      </div>
                    </div>
                  </a-col>
                  
                  <a-col :xs="24" :sm="8">
                    <div class="detail-item">
                      <div class="detail-icon">⏰</div>
                      <div class="detail-content">
                        <span class="detail-label">{{ t('home.inspiration.recommendedDuration') }}</span>
                        <span class="detail-value">{{ displayDuration }}</span>
                      </div>
                    </div>
                  </a-col>
                  <a-col :xs="24" :sm="8">
                    <div class="detail-item">
                      <div class="detail-icon">💰</div>
                      <div class="detail-content">
                        <span class="detail-label">{{ t('home.inspiration.budgetRange') }}</span>
                        <span class="detail-value">{{ displayBudget }}</span>
                      </div>
                    </div>
                  </a-col>
                </a-row>
              </div>

              <div class="result-highlights">
                <h5>🎯 {{ t('home.inspiration.experienceHighlights') }}</h5>
                <div v-if="displayHighlights.length > 0" class="highlights-grid">
                  <div 
                    v-for="(highlight, index) in displayHighlights" 
                    :key="index" 
                    class="highlight-card"
                  >
                    <div class="highlight-number">{{ index + 1 }}</div>
                      <div class="highlight-icon">
                        {{ getHighlightIcon(typeof highlight === 'string' ? highlight : highlight.title) }}
                      </div>
                    <div class="highlight-content">
                      <div class="highlight-title">
                        {{ typeof highlight === 'string' ? highlight : highlight.title }}
                      </div>
                      <div v-if="typeof highlight === 'object' && highlight.description" class="highlight-description">
                        {{ highlight.description }}
                      </div>
                      <div v-if="typeof highlight === 'object' && highlight.feeling" class="highlight-feeling">
                        💫 {{ highlight.feeling }}
                      </div>
                    </div>
                    <div class="highlight-gradient"></div>
                  </div>
                </div>
                <div v-else class="highlights-empty">
                  <div class="empty-highlight-icon">🤖</div>
                  <p class="empty-highlight-text">{{ t('home.inspiration.emptyHighlights') || '请输入你的旅行灵感,让我为你创造独特的旅程体验。' }}</p>
                </div>
              </div>

              <!-- 如果已选择目的地，显示推荐理由和判断思路 -->
              <div v-if="selectedLocation && currentLocationDetail" class="recommendation-reasoning">
                <a-divider style="margin: 1.5rem 0;" />
                <div class="reasoning-content">
                  <div class="reasoning-header">
                    <h5>💡 AI 推荐理由</h5>
                  </div>
                  <div class="reasoning-text" v-if="currentLocationDetail.reason">
                    <p>{{ currentLocationDetail.reason }}</p>
                  </div>
                  <div class="reasoning-header" style="margin-top: 1rem;" v-if="currentLocationDetail.reasoning">
                    <h5>🔍 AI 判断思路</h5>
                  </div>
                  <div class="reasoning-text" v-if="currentLocationDetail.reasoning">
                    <p>{{ currentLocationDetail.reasoning }}</p>
                  </div>
                </div>
              </div>

              <div class="ai-message">
                <div class="ai-avatar-wrapper">
                  <a-avatar size="large" class="ai-avatar">🤖</a-avatar>
                  <div class="ai-pulse"></div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <h5>{{ t('home.inspiration.aiTravelPartnerSays') }}</h5>
                    <span class="ai-badge">AI 智能助手</span>
                  </div>
                  <div class="message-text" v-if="displayAiMessage">
                    <span class="quote-mark">"</span>
                    <p>"{{ displayAiMessage }}"</p>
                    <span class="quote-mark">"</span>
                  </div>
                  <div class="message-text" v-else>
                    <span class="quote-mark">"</span>
                    <p>"请输入你的旅行灵感，让我为你创造独特的旅程体验。"</p>
                    <span class="quote-mark">"</span>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="action-buttons">
                <a-button
                  type="primary"
                  size="large"
                  @click="createTravel"
                  class="convert-button"
                  :loading="generatingFullItinerary"
                  :disabled="!canCreateJourney"
                >
                  {{ t('home.inspiration.createJourney') }} ✈️
                </a-button>
                <a-button
                  size="large"
                  @click="exploreMore"
                  class="explore-button"
                >
                  {{ t('home.inspiration.viewMoreInspiration') }} ✨
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'
import { message } from 'ant-design-vue'
import { PRESET_COUNTRIES } from '@/config/location'
import { getUserProfileOrDefault, type UserProfileConfig } from '@/config/userProfile'
// removed MirrorLake integration

const { t, locale } = useI18n()
import {
  ArrowLeftOutlined,
  BulbOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

const inspirationInput = ref('')
const loading = computed(() => travelStore.loading)
const generatingFullItinerary = ref(false)
const error = computed(() => travelStore.error)
const inspirationResult = computed(() => {
  const data = travelStore.inspirationData
  // 只在开发环境且有数据时输出详细信息
  if (import.meta.env.DEV) {
    if (data) {
  console.log('🔄 inspirationResult computed 触发，数据:', {
        hasData: true,
    locationsCount: data?.locations?.length || 0,
        title: data?.title,
        hasFullItinerary: data?.hasFullItinerary
  })
    } else {
      // 空数据是正常状态（用户还未生成灵感），只在开发环境静默记录
      console.debug('ℹ️ inspirationResult: 暂无数据（用户还未生成灵感）')
    }
  }
  return data
})
const selectedLocation = computed<string | null>({
  get: () => travelStore.inspirationSelectedDestination || null,
  set: (value) => {
    travelStore.inspirationSelectedDestination = value || null
  }
})
// 本地灵感库建议（默认取前 12 个）
const localSuggestions = ref<Array<{ name: string; country: string }>>([])

const loadLocalSuggestions = async () => {
  try {
    const list = await travelStore.getLocalInspirationDestinations()
    localSuggestions.value = shuffle(list).slice(0, 12)
  } catch (e) {
    // 静默失败
  }
}

loadLocalSuggestions()

const useSuggestion = (name: string) => {
  inspirationInput.value = name
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const randomizeSuggestions = () => {
  localSuggestions.value = shuffle(localSuggestions.value)
}

// 响应式用户配置，用于显示
const userProfileForDisplay = ref<UserProfileConfig>(getUserProfileOrDefault())

// 更新用户配置显示（用于在保存后立即更新）
const updateUserProfileDisplay = () => {
  userProfileForDisplay.value = getUserProfileOrDefault()
}

// 监听 storage 事件（跨标签页同步，以及同一标签页内的更新）
if (typeof window !== 'undefined') {
  // 监听 storage 事件（跨标签页）
  window.addEventListener('storage', (e) => {
    if (e.key === 'user_profile') {
      updateUserProfileDisplay()
    }
  })
  
  // 监听自定义事件（同一标签页内的更新）
  window.addEventListener('userProfileUpdated', () => {
    updateUserProfileDisplay()
  })
}

// 组件挂载时更新
onMounted(() => {
  updateUserProfileDisplay()
})

// 获取当前国家和语言显示（优先显示国籍，如果未设置则显示所在国家）
const currentCountryDisplay = computed(() => {
  const profile = userProfileForDisplay.value
  
  // 优先显示国籍
  if (profile.nationality?.countryCode) {
    const nationalityCountry = PRESET_COUNTRIES[profile.nationality.countryCode as keyof typeof PRESET_COUNTRIES]
    if (nationalityCountry) {
      const flagDisplay = nationalityCountry.flag && nationalityCountry.flag.trim() 
        ? `${nationalityCountry.flag} ` 
        : ''
      return `${flagDisplay}${nationalityCountry.name}`
    }
    return `🌍 ${profile.nationality.country}`
  }
  
  // 如果国籍未设置，显示所在国家
  if (profile.location?.countryCode) {
    const locationCountry = PRESET_COUNTRIES[profile.location.countryCode as keyof typeof PRESET_COUNTRIES]
    if (locationCountry) {
      const flagDisplay = locationCountry.flag && locationCountry.flag.trim() 
        ? `${locationCountry.flag} ` 
        : ''
      return `${flagDisplay}${locationCountry.name}`
    }
    return `🌍 ${profile.location.country}`
  }
  
  return '● 未设置'
})

const currentLanguageDisplay = computed(() => {
  return locale.value === 'zh-CN' ? '🇨🇳 中文' : '🇺🇸 English'
})

// 计算当前选中目的地的详细信息
const currentLocationDetail = computed(() => {
  if (!inspirationResult.value || !selectedLocation.value) {
    return null
  }
  
  console.log('当前选中地点:', selectedLocation.value)
  console.log('locationDetails:', inspirationResult.value.locationDetails)
  
  // 如果有locationDetails，返回选中目的地的详细信息
  if (inspirationResult.value.locationDetails && inspirationResult.value.locationDetails[selectedLocation.value]) {
    const detail = inspirationResult.value.locationDetails[selectedLocation.value]
    console.log('找到该地点的详细信息:', detail)
    return detail
  }
  
  console.log('未找到该地点的详细信息')
  return null
})

// 计算显示的数据（优先使用选中目的地的详细信息）
const displayDuration = computed(() => {
  return currentLocationDetail.value?.duration || inspirationResult.value?.duration || '待定'
})

const displayBudget = computed(() => {
  return currentLocationDetail.value?.budget || inspirationResult.value?.budget || '待定'
})

const displayHighlights = computed(() => {
  return currentLocationDetail.value?.highlights || inspirationResult.value?.highlights || []
})

const displayAiMessage = computed(() => {
  return currentLocationDetail.value?.aiMessage || inspirationResult.value?.aiMessage || ''
})

const hasFullInspiration = computed(() => {
  return Boolean(inspirationResult.value && inspirationResult.value.hasFullItinerary)
})

const isCandidateResult = computed(() => {
  const data = inspirationResult.value
  if (!data) return false
  if (data.hasFullItinerary) return false
  return data.generationMode === 'candidates'
})

const canCreateJourney = computed(() => {
  const data = inspirationResult.value
  if (!data) return false
  if (generatingFullItinerary.value || loading.value) return false
  if (data.hasFullItinerary) {
    return Array.isArray(data.days) && data.days.length > 0
  }
  // 候选模式：需要选择目的地后才能点击，点击会自动生成详细行程
  // 如果有明确目的地（destination 或 location 字段存在，且没有推荐列表），也允许创建
  if (hasSpecificDestination.value) {
    return true
  }
  // 否则需要用户选择目的地
  return Boolean(selectedLocation.value)
})


// 判断是否有明确目的地（不显示推荐目的地列表）
const hasSpecificDestination = computed(() => {
  if (!inspirationResult.value) return false
  // 如果有完整行程，说明已有明确目的地
  if (inspirationResult.value.hasFullItinerary || inspirationResult.value.days) {
    return true
  }
  // 如果有明确的 destination 字段，且不是推荐列表
  if (inspirationResult.value.destination && 
      (!inspirationResult.value.locations || inspirationResult.value.locations.length === 0)) {
    return true
  }
  // 在输入模式下，如果 location 存在且 locations 不存在，说明是单一明确目的地
  if (inspirationResult.value.location && 
      (!inspirationResult.value.locations || inspirationResult.value.locations.length === 0)) {
    return true
  }
  return false
})

// 判断是否应该显示推荐目的地列表
const shouldShowRecommendedDestinations = computed(() => {
  if (!inspirationResult.value) return false
  // 如果有明确目的地，不显示推荐列表
  if (hasSpecificDestination.value) return false
  // 只有在有推荐列表且数量 > 0 时才显示
  return inspirationResult.value.locations && inspirationResult.value.locations.length > 0
})

// 显示地点（附加国家）
function formatLocationLabel(loc: string): string {
  const country = inspirationResult.value?.locationCountries?.[loc]
  return country ? `${loc}（${country}）` : loc
}

// 根据关键词获取合适的图标
const getHighlightIcon = (highlight: string) => {
  const text = highlight.toLowerCase()
  if (text.includes('雪') || text.includes('滑雪') || text.includes('snow')) return '❄️'
  if (text.includes('攀') || text.includes('climb')) return '⛰️'
  if (text.includes('潜') || text.includes('dive') || text.includes('水')) return '🤿'
  if (text.includes('飞行') || text.includes('fly') || text.includes('跳')) return '✈️'
  if (text.includes('摄影') || text.includes('photo')) return '📸'
  if (text.includes('文化') || text.includes('culture') || text.includes('传统')) return '🏛️'
  if (text.includes('美食') || text.includes('food') || text.includes('食')) return '🍜'
  if (text.includes('海滩') || text.includes('beach') || text.includes('海')) return '🏖️'
  if (text.includes('温泉') || text.includes('spa')) return '♨️'
  if (text.includes('夜') || text.includes('night') || text.includes('星空')) return '🌌'
  return '✨'
}


const handleSubmit = async () => {
  if (!inspirationInput.value.trim()) return
  
  console.log('提交灵感输入:', inspirationInput.value)
  try {
    // 生成灵感
    await travelStore.generateInspiration(inspirationInput.value)
    
    // 初始化选中的目的地
    if (travelStore.inspirationData?.locations && travelStore.inspirationData.locations.length > 0) {
      // 如果有推荐列表，选择第一个
      selectedLocation.value = travelStore.inspirationData.locations[0]
    } else if (travelStore.inspirationData?.destination || travelStore.inspirationData?.location) {
      // 如果有明确目的地但没有推荐列表，自动设置选中目的地
      selectedLocation.value = travelStore.inspirationData.destination || travelStore.inspirationData.location || null
      console.log('自动设置选中目的地（明确目的地）:', selectedLocation.value)
    }
    
    // 数据已在 travelStore.inspirationData 中
    if (isCandidateResult.value) {
      message.success(t('home.inspiration.candidatesReady'))
    } else {
      message.success('灵感生成成功！')
    }
  } catch (err) {
    console.error('生成灵感失败:', err)
    message.error('生成灵感失败，请重试')
  }
}

const handleGenerateFullItinerary = async () => {
  if (!selectedLocation.value) {
    message.warning(t('home.inspiration.selectLocationFirst'))
    return false
  }

  generatingFullItinerary.value = true
  try {
    await travelStore.generateInspirationForDestination(selectedLocation.value)
    message.success('详细行程已生成！')
    return true
  } catch (error) {
    console.error('生成详细行程失败:', error)
    message.error('生成详细行程失败，请稍后重试')
    return false
  } finally {
    generatingFullItinerary.value = false
  }
}

// 创建 Travel 并跳转到详情页
const createTravel = async () => {
  let data = travelStore.inspirationData
  if (!data) {
    message.error('数据未生成')
    return
  }
  
  // 如果有明确目的地但 selectedLocation 未设置，自动设置
  if (!selectedLocation.value && hasSpecificDestination.value) {
    const dest = data.destination || data.location
    if (dest) {
      selectedLocation.value = dest
      console.log('创建旅程时自动设置选中目的地:', dest)
    }
  }
  
  if (!data.hasFullItinerary) {
    // 如果没有选中目的地，尝试使用明确目的地
    const targetLocation = selectedLocation.value || data.destination || data.location
    if (!targetLocation) {
      message.warning(t('home.inspiration.selectLocationFirst'))
      return
    }
    
    // 确保 selectedLocation 已设置
    if (!selectedLocation.value && targetLocation) {
      selectedLocation.value = targetLocation
    }
    
    const success = await handleGenerateFullItinerary()
    if (!success) return
    data = travelStore.inspirationData
    if (!data?.hasFullItinerary) {
      message.warning(t('home.inspiration.detailedJourneyRequired'))
      return
    }
  }
  
  // 如果有多个目的地，检查是否已选择
  if (data.locations && data.locations.length > 0) {
    if (!selectedLocation.value) {
      message.warning(t('home.inspiration.selectLocationFirst'))
      return
    }
  }
  
  // 生成动态配置文件
  let inspirationConfig = null
  try {
    const { generateInspirationConfig } = await import('@/utils/generateInspirationConfig')
    inspirationConfig = generateInspirationConfig(data)
    console.log('✅ 生成动态配置成功:', inspirationConfig)
  } catch (error) {
    console.error('❌ 生成动态配置失败:', error)
    // 即使配置生成失败，也继续创建旅程
  }
  
  // 创建 Travel 并保存到列表
  // 将选中的地点和配置文件保存到 data 中
  // 注意：需要保留完整的活动信息（title、type、activity等），以便详情页正确显示
  const travelDataWithSelection: any = {
    ...data,
    selectedLocation: selectedLocation.value, // 保存用户选择的地点
    inspirationConfig, // 保存动态生成的配置
    // 移除封面图片
    coverImage: undefined,
    // 保留完整的 days 数据，包括所有必要的字段（title、type、activity等）
    // 只清理 details 中的文本描述，但保留图片和必要的结构
    days: data.days?.map((day: any) => ({
      day: day.day,
      date: day.date,
      timeSlots: day.timeSlots?.map((slot: any) => ({
        time: slot.time,
        coordinates: slot.coordinates,
        // 保留必要的字段，确保详情页能正确显示
        title: slot.title || slot.activity || slot.details?.title || '',
        activity: slot.activity || slot.title || slot.details?.title || '',
        type: slot.type || slot.details?.type || 'attraction',
        duration: slot.duration || slot.details?.duration || 60,
        cost: slot.cost || slot.details?.cost || 0,
        // 保留 details 结构，但只保留图片数据（不保留文本描述）
        details: slot.details ? {
          images: slot.details.images,
          photos: slot.details.photos,
          // 保留其他可能需要的结构字段（但不包含文本描述）
          name: slot.details.name,
          address: slot.details.address,
          rating: slot.details.rating,
          pricing: slot.details.pricing,
          transportation: slot.details.transportation,
          openingHours: slot.details.openingHours
        } : undefined
      })) || []
    })) || []
  }
  
  // 确保使用补齐后的天数（如果days数组存在，使用其长度；否则使用duration字段）
  const actualDuration = data.days && Array.isArray(data.days) 
    ? data.days.length 
    : (parseInt(data.duration) || (data.days?.length || 5))
  
  console.log('📊 创建旅程 - 天数信息:', {
    durationField: data.duration,
    daysArrayLength: data.days?.length,
    actualDuration: actualDuration
  })
  
  // 步骤1: 保存到后端数据库（与 Planner 模式相同）
  let backendItineraryId: string | undefined
  let backendItinerary: any = undefined
  try {
    const { convertFrontendDataToCreateRequest, createItinerary } = await import('@/services/itineraryAPI')
    
    // 将灵感模式数据转换为与 Planner 模式相同的格式
    const frontendItineraryData = {
      days: data.days?.map(day => ({
        day: day.day,
        date: day.date,
        timeSlots: day.timeSlots?.map(slot => ({
          time: slot.time,
          coordinates: slot.coordinates || { lat: 0, lng: 0 },
          // 转换为 activities 需要的字段
          // 注意：灵感模式可能没有 title，但必须填充（可以为空字符串）
          title: slot.details?.title || slot.title || slot.activity || '活动',  // 确保至少有默认值
          type: (slot.details?.type || slot.type || 'attraction') as 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean',
          duration: slot.details?.duration || slot.duration || 60,
          cost: slot.details?.cost || slot.cost || 0,
          details: {
            notes: '',  // 灵感模式不保存文本描述
            description: '',
            // 但可以保留图片
            images: slot.details?.images,
            photos: slot.details?.photos
          }
        })).filter(slot => slot.coordinates) || []  // 只保留有坐标的slot
      })) || [],
      totalCost: 0,  // 灵感模式可能没有成本信息
      summary: ''  // 灵感模式不保存文本摘要
    }
    
    // 转换为后端请求格式（与 Planner 模式使用相同的转换函数）
    const destination = selectedLocation.value || data.location || data.destination || '待定'
    
    // 确保 startDate 是有效的 ISO 8601 格式（YYYY-MM-DD）
    let startDate = data.days?.[0]?.date
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      // 如果日期格式不正确，使用今天的日期
      startDate = new Date().toISOString().split('T')[0]
      console.warn('⚠️ [Inspiration] 日期格式不正确，使用今天日期:', startDate)
    }
    
    // 确保 days 数组不为空
    const days = frontendItineraryData.days && frontendItineraryData.days.length > 0
      ? frontendItineraryData.days
      : [{
          day: 1,
          date: startDate,
          timeSlots: []
        }]
    
    // 使用前端数据格式创建行程（使用 from-frontend-data 接口）
    const { createJourneyFromFrontendData } = await import('@/services/itineraryAPI')
    const createRequest = {
      itineraryData: {
      destination,
        duration: days.length,
        days: days.map((day: any) => ({
          day: day.day || 1,
          date: day.date || startDate,
          timeSlots: day.timeSlots || []
        })),
        totalCost: frontendItineraryData.totalCost || 0,
        summary: frontendItineraryData.summary || '',
        title: '灵感之旅',
        preferences: undefined
      },
      startDate
    }
    
    console.log('📤 [Inspiration] 创建行程请求数据:', {
      destination: createRequest.itineraryData.destination,
      daysCount: createRequest.itineraryData.days.length,
      startDate: createRequest.startDate
    })
    
    // 调用创建行程接口（使用 from-frontend-data）
    backendItinerary = await createJourneyFromFrontendData(createRequest)
    backendItineraryId = backendItinerary.id
    console.log('✅ [Inspiration] 行程已保存到后端', {
      id: backendItineraryId,
      destination: backendItinerary.destination,
      mode: backendItinerary.mode
    })
    message.success('行程已保存到数据库')
  } catch (err: any) {
    console.error('❌ [Inspiration] 保存到后端失败', {
      error: err.message,
      stack: err.stack
    })
    message.warning('保存到数据库失败，将使用临时数据。错误：' + (err.message || '未知错误'))
    // 保存到后端失败不影响整体流程，继续创建临时 Travel 对象用于显示
  }
  
  // 步骤2: 创建 Travel 对象用于立即显示（最终数据从后端获取）
  // 将后端行程ID保存到 data 中
  const travelDataWithBackendId: any = {
    ...travelDataWithSelection,
    backendItineraryId: backendItineraryId  // 保存后端行程ID
  }
  
  // 使用后端返回的 mode（如果存在），否则使用默认值
  const travelMode = backendItinerary?.mode || 'inspiration'
  
  const newTravel = travelListStore.createTravel({
    title: data.title || '灵感之旅',
    location: selectedLocation.value || data.location || '待定',
    description: '', // 灵感模式不保存文本描述
    mode: travelMode as 'planner' | 'seeker' | 'inspiration',
    status: 'active',
    duration: actualDuration,
    participants: 1,
    budget: 0,
    coverImage: undefined, // 不保存封面图片
    data: travelDataWithBackendId // 保存详细的灵感数据（包含后端行程ID）
  })
  
  console.log('✅ [Inspiration] Travel 创建成功', {
    id: newTravel.id,
    title: newTravel.title,
    mode: newTravel.mode,
    backendItineraryId: backendItineraryId
  })
  
  message.success('旅程创建成功！')
  
  // 跳转到旅行详情页
  router.push(`/travel/${newTravel.id}`)
}

const convertToItinerary = () => {
  console.log('转换为详细行程')
  // 将灵感数据转换为行程规划
  if (inspirationResult.value) {
    travelStore.setPlannerData({
      destination: inspirationResult.value.location,
      duration: parseInt(inspirationResult.value.duration),
      budget: inspirationResult.value.budget.toLowerCase(),
      preferences: [],
      travelStyle: 'moderate'
    })
    router.push('/planner')
  }
}

const exploreMore = () => {
  console.log('探索更多灵感')
  inspirationInput.value = ''
  travelStore.setInspirationData(null)
}
</script>

<style scoped>
/* Inspiration 页面样式 */
.container {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* 头部导航 */
.header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.back-button {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  margin-right: 1rem;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.catalog-button {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  margin-left: 1rem;
}

.catalog-button:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.header-title {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-icon {
  font-size: 2rem;
  color: white;
  margin-right: 1rem;
}

.title {
  color: white !important;
  margin: 0 !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.settings-badge {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 主要内容 */
.main-content {
  max-width: 1000px;
  margin: 0 auto;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-right: 8px;
}

.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.inspiration-card {
  border-radius: 20px !important;
  border: none !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  margin-bottom: 1rem;
}

.inspiration-content {
  padding: 2rem;
}

/* 输入区域 */
.input-section {
  text-align: center;
  margin-bottom: 2rem;
}

.input-section h3 {
  color: #333 !important;
  margin-bottom: 0.5rem !important;
  font-size: 1.5rem !important;
}

.input-section p {
  color: #666 !important;
  margin-bottom: 1.5rem !important;
}

.input-container {
  margin-bottom: 1.5rem;
}

.inspiration-input {
  border-radius: 12px !important;
  border: 2px solid #e8e8e8 !important;
  font-size: 1rem !important;
  resize: none !important;
}

.inspiration-input:focus {
  border-color: #11998e !important;
  box-shadow: 0 0 0 2px rgba(17, 153, 142, 0.2) !important;
}

.submit-button {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3) !important;
}

.submit-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(17, 153, 142, 0.4) !important;
}

.submit-button:disabled {
  background: #d9d9d9 !important;
  box-shadow: none !important;
  transform: none !important;
}

/* 结果区域 */
.result-section {
  margin-top: 2rem;
}

.inspiration-result {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e0e6ff;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.result-title h4 {
  color: #333 !important;
  margin-bottom: 0.25rem !important;
  font-size: 1.25rem !important;
}

.result-subtitle {
  color: #666 !important;
  margin: 0 !important;
  font-size: 0.9rem;
}

.result-details {
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.detail-icon {
  font-size: 1.25rem;
}

.detail-content {
  display: flex;
  flex-direction: column;
}

.detail-label {
  color: #666 !important;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.detail-value {
  color: #333 !important;
  font-weight: 600;
  font-size: 0.9rem;
}

.result-highlights {
  margin-bottom: 1.5rem;
}

.result-highlights h5 {
  color: #333 !important;
  margin-bottom: 1rem !important;
  font-size: 1.1rem !important;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.highlights-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: 12px;
  text-align: center;
  min-height: 200px;
}

.empty-highlight-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-highlight-text {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.6;
  max-width: 400px;
  margin: 0;
}

.highlight-card {
  position: relative;
  padding: 20px;
  background: linear-gradient(135deg, #f8e8ff 0%, #f0d5ff 100%);
  border-radius: 12px;
  border: 1px solid #e8b8ff;
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: 140px;
  display: flex;
  flex-direction: column;
}

.highlight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(148, 53, 255, 0.25);
  border-color: #d48aff;
}

.highlight-number {
  position: absolute;
  top: 8px;
  left: 12px;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.75rem;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
}

.highlight-content {
  margin-top: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.highlight-icon {
  font-size: 2rem;
  text-align: center;
  animation: float 3s ease-in-out infinite;
}

.highlight-title {
  color: #4a148c !important;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 8px;
}

.highlight-description {
  color: #6a0080 !important;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 6px;
  opacity: 0.9;
}

.highlight-feeling {
  color: #8e24aa !important;
  font-size: 0.8rem;
  text-align: center;
  font-style: italic;
  padding: 4px 8px;
  background: rgba(168, 85, 247, 0.1);
  border-radius: 6px;
  margin-top: 4px;
}

.highlight-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(to top, rgba(168, 85, 247, 0.1), transparent);
  pointer-events: none;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.ai-message {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef3ff 0%, #f8e5ff 100%);
  border-radius: 16px;
  border: 2px solid #e9a8ff;
  box-shadow: 0 4px 12px rgba(233, 168, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.ai-message::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a855f7, #c084fc, #d8b4fe);
}

.ai-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.ai-avatar {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%) !important;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3) !important;
  border: 3px solid white;
}

.ai-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  border: 2px solid #a855f7;
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.message-content h5 {
  color: #6b21a8 !important;
  margin: 0 !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
}

.ai-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #7c3aed;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #c084fc;
}

.message-text {
  position: relative;
  padding: 12px 0;
}

.quote-mark {
  position: absolute;
  font-size: 3rem;
  color: #c084fc;
  opacity: 0.2;
  font-family: Georgia, serif;
}

.quote-mark:first-of-type {
  top: -8px;
  left: -8px;
}

.quote-mark:last-of-type {
  bottom: -20px;
  right: -8px;
}

.message-content p {
  color: #581c87 !important;
  margin: 0 !important;
  font-style: italic;
  font-size: 1rem;
  line-height: 1.6;
  position: relative;
  padding: 0 16px;
}

/* AI 推荐理由和判断思路 */
.recommendation-reasoning {
  margin-top: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.reasoning-content {
  color: #1e40af;
}

.reasoning-header h5 {
  color: #1e40af !important;
  margin: 0 0 0.75rem 0 !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reasoning-text {
  margin-bottom: 1rem;
}

.reasoning-text p {
  color: #1e40af !important;
  margin: 0 !important;
  font-size: 0.95rem !important;
  line-height: 1.7 !important;
  font-style: normal !important;
  padding: 0 !important;
}

.reasoning-text:last-child {
  margin-bottom: 0;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.convert-button {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-weight: 600 !important;
}

.convert-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(17, 153, 142, 0.4) !important;
}

.explore-button {
  background: rgba(17, 153, 142, 0.1) !important;
  border: 2px solid #11998e !important;
  color: #11998e !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-weight: 600 !important;
}

.explore-button:hover {
  background: #11998e !important;
  color: white !important;
  transform: translateY(-2px) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .back-button {
    margin-right: 0;
    margin-bottom: 1rem;
  }

  .header-title {
    width: 100%;
  }

  .title {
    font-size: 1.5rem !important;
  }

  .inspiration-content {
    padding: 1rem;
  }

  .result-header {
    flex-direction: column;
    text-align: center;
  }

  .ai-message {
    flex-direction: column;
    text-align: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .convert-button,
  .explore-button {
    width: 100%;
  }

  .highlights-grid {
    grid-template-columns: 1fr;
  }

  .ai-message {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .message-text {
    padding: 8px 0;
  }

  .quote-mark {
    font-size: 2rem;
  }

  .quote-mark:first-of-type {
    top: -4px;
    left: -4px;
  }

  .quote-mark:last-of-type {
    bottom: -12px;
    right: -4px;
  }
}

/* 多个目的地选项样式 */
.locations-item {
  width: 100% !important;
  padding: 1rem !important;
}

.locations-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.locations-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.locations-grid::-webkit-scrollbar {
  height: 6px;
}

.locations-grid::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

.locations-grid::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.locations-grid::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

.location-option {
  padding: 12px 20px;
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
}

.location-option:hover {
  border-color: #11998e;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.2);
}

.location-option.selected {
  border-color: #11998e;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3);
}

.location-option.selected:hover {
  background: linear-gradient(135deg, #0d7a71 0%, #2dd46a 100%);
}

.candidate-hint {
  margin-top: 0.75rem;
  color: #595959;
  font-size: 0.9rem;
}

.candidate-actions {
  margin-top: 0.75rem;
  display: flex;
  justify-content: flex-start;
}

.candidate-actions .ant-btn {
  min-width: 200px;
}
</style>

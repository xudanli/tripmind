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
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <a-card class="inspiration-card">
        <div class="inspiration-content">
          <!-- 模式切换 -->
          <div class="mode-switch" style="margin-bottom: 1.5rem;">
            <a-radio-group v-model:value="mode" size="large">
              <a-radio-button value="input">
                <span>💬 文字输入</span>
              </a-radio-button>
              <a-radio-button value="questionnaire">
                <span>📋 人格问卷</span>
              </a-radio-button>
            </a-radio-group>
          </div>

          <!-- 问卷模式 -->
          <div v-if="mode === 'questionnaire'" class="questionnaire-section">
            <PersonalityQuestionnaire @submit="handleQuestionnaireSubmit" />
          </div>

          <!-- 输入模式 -->
          <div v-else class="input-section">
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
              <!-- 动态AI提示 -->
              <div v-if="aiHint" class="ai-hint-section">
                <div class="ai-hint-header">
                  <span class="hint-icon">💡</span>
                  <span class="hint-title">{{ t('inspiration.hint.title') }}：</span>
                </div>
                <div class="ai-hint-content">
                  <div v-for="(hint, index) in formattedAiHints" :key="index" class="ai-hint-item">
                    {{ hint }}
                  </div>
                </div>
              </div>
              
              <!-- 静态提示（当没有AI提示时显示） -->
              <div v-else class="input-hints">
                <a-space direction="vertical" size="small">
                  <span class="hint">{{ t('inspiration.tips.title') }}：</span>
                  <span v-for="(example, index) in inspirationExamples" :key="index" class="hint">• {{ example }}</span>
                </a-space>
              </div>
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

          <!-- 本地灵感库建议（当未生成结果时显示） -->
          <div v-if="!inspirationResult && localSuggestions.length" style="margin-top: 1rem;">
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

          <!-- 灵感卡片结果 -->
          <div v-if="inspirationResult" class="result-section">
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
                  <!-- 如果有多 destination -->
                  <a-col v-if="inspirationResult.locations && inspirationResult.locations.length > 0" :xs="24" :sm="24">
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
                      </div>
                    </div>
                  </a-col>
                  
                  <!-- 单个目的地（兼容旧数据） -->
                  <a-col v-else :xs="24" :sm="8">
                    <div class="detail-item">
                      <div class="detail-icon">📍</div>
                      <div class="detail-content">
                        <span class="detail-label">{{ t('home.inspiration.recommendedLocation') }}</span>
                        <span class="detail-value">{{ inspirationResult.location }}</span>
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
                <div class="highlights-grid">
                  <div 
                    v-for="(highlight, index) in displayHighlights" 
                    :key="index" 
                    class="highlight-card"
                  >
                    <div class="highlight-number">{{ index + 1 }}</div>
                    <div class="highlight-content">
                      <div class="highlight-icon">
                        {{ getHighlightIcon(typeof highlight === 'string' ? highlight : highlight.title) }}
                      </div>
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
                  <div class="message-text">
                    <span class="quote-mark">"</span>
                    <p>"{{ displayAiMessage }}"</p>
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'
import { message } from 'ant-design-vue'
import { getUserLocation, PRESET_COUNTRIES } from '@/config/location'
import PersonalityQuestionnaire, { type PersonalityProfile } from '@/components/Inspiration/PersonalityQuestionnaire.vue'
// removed MirrorLake integration

const { t, locale } = useI18n()
import {
  ArrowLeftOutlined,
  BulbOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

// 模式切换：questionnaire（问卷模式）或 input（输入模式）
const mode = ref<'questionnaire' | 'input'>('input')

const inspirationInput = ref('')
const loading = computed(() => travelStore.loading)
const error = computed(() => travelStore.error)
const inspirationResult = computed(() => travelStore.inspirationData)
const selectedLocation = ref<string>('')
const aiHint = ref('')
const hintLoading = ref(false)
const debounceTimer = ref<NodeJS.Timeout | null>(null)

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

// 获取当前国家和语言显示
const currentCountryDisplay = computed(() => {
  const userLocation = getUserLocation()
  if (!userLocation) {
    return '🌍 未设置'
  }
  const countryInfo = PRESET_COUNTRIES[userLocation.countryCode as keyof typeof PRESET_COUNTRIES]
  if (countryInfo) {
    return `${countryInfo.flag} ${countryInfo.name}`
  }
  return `🌍 ${userLocation.country}`
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

const inspirationExamples = computed(() => {
  const result = t('inspiration.tips.examples')
  console.log('inspirationExamples result:', result, 'Type:', typeof result, 'IsArray:', Array.isArray(result))
  // 确保返回数组
  if (Array.isArray(result)) {
    return result
  }
  // 如果不是数组，返回空数组
  console.warn('inspiration.tips.examples is not an array, returning empty array')
  return []
})

// 格式化AI提示
const formattedAiHints = computed(() => {
  if (!aiHint.value) return []
  
  // 按行分割，过滤空行
  return aiHint.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
})

// 监听输入变化，生成AI提示
watch(inspirationInput, async (newValue) => {
  // 清除之前的定时器
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  // 如果输入为空，清除AI提示
  if (!newValue.trim()) {
    aiHint.value = ''
    return
  }
  
  // 如果输入少于5个字符，不生成提示
  if (newValue.trim().length < 5) {
    aiHint.value = ''
    return
  }
  
  // 防抖处理，500ms后调用
  debounceTimer.value = setTimeout(async () => {
    try {
      hintLoading.value = true
      const { generateInspirationHint } = await import('@/services/deepseekAPI')
      const currentLanguage = locale.value || 'zh-CN'
      const hint = await generateInspirationHint(newValue, currentLanguage as string)
      
      if (hint) {
        aiHint.value = hint
      }
    } catch (error) {
      console.error('生成AI提示失败:', error)
    } finally {
      hintLoading.value = false
    }
  }, 800)
})

const handleQuestionnaireSubmit = async (profile: PersonalityProfile) => {
  console.log('问卷提交:', profile)
  console.log('当前选中地点:', selectedLocation.value)
  
  // 详细调试信息
  const storeMethods = {
    hasGenerateInspiration: typeof travelStore.generateInspiration === 'function',
    hasGeneratePsychologicalJourney: typeof travelStore.generatePsychologicalJourney === 'function',
    storeKeys: Object.keys(travelStore).filter(k => k.startsWith('generate')),
    fullStoreKeys: Object.keys(travelStore)
  }
  console.log('travelStore 方法检查:', storeMethods)
  
  // 尝试直接访问函数
  if (!travelStore.generatePsychologicalJourney) {
    console.error('❌ generatePsychologicalJourney 函数不存在于 travelStore')
    console.error('可用的方法:', storeMethods.storeKeys)
    message.error('心理旅程生成功能暂时不可用，请刷新页面后重试')
    return
  }
  
  if (typeof travelStore.generatePsychologicalJourney !== 'function') {
    console.error('❌ generatePsychologicalJourney 不是函数类型:', typeof travelStore.generatePsychologicalJourney)
    message.error('心理旅程生成功能暂时不可用，请刷新页面后重试')
    return
  }
  
  try {
    console.log('✅ 开始调用 generatePsychologicalJourney...')
    console.log('📍 用户选择的目的地:', selectedLocation.value)
    // 传递用户选择的目的地
    await travelStore.generatePsychologicalJourney(profile, selectedLocation.value)
    console.log('✅ generatePsychologicalJourney 调用完成')
    
    // 如果生成成功，跳转到详情页
    if (travelStore.inspirationData) {
      createTravel()
    }
  } catch (error: any) {
    console.error('❌ 生成心理旅程失败:', error)
    message.error(error.message || '生成心理旅程失败，请重试')
  }
}

const handleSubmit = async () => {
  if (!inspirationInput.value.trim()) return
  
  console.log('提交灵感输入:', inspirationInput.value)
  try {
    // 生成灵感
    await travelStore.generateInspiration(inspirationInput.value)
    
    // 初始化选中的目的地（优先选择第一个）
    if (travelStore.inspirationData?.locations && travelStore.inspirationData.locations.length > 0) {
      selectedLocation.value = travelStore.inspirationData.locations[0]
    }
    
    // 数据已在 travelStore.inspirationData 中
    message.success('灵感生成成功！')
  } catch (err) {
    console.error('生成灵感失败:', err)
    message.error('生成灵感失败，请重试')
  }
}

// 创建 Travel 并跳转到详情页
const createTravel = async () => {
  const data = travelStore.inspirationData
  if (!data) {
    message.error('数据未生成')
    return
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
  const travelDataWithSelection = {
    ...data,
    selectedLocation: selectedLocation.value, // 保存用户选择的地点
    inspirationConfig // 保存动态生成的配置
  }
  
  const newTravel = travelListStore.createTravel({
    title: data.title || '灵感之旅',
    location: selectedLocation.value || data.location || '待定',
    description: data.subtitle || data.aiMessage || '基于你的灵感创造的旅程',
    mode: 'inspiration',
    status: 'active',
    duration: parseInt(data.duration) || 5,
    participants: 1,
    budget: 0,
    data: travelDataWithSelection // 保存详细的灵感数据（包含选中的地点和配置）
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

.input-hints {
  margin-top: 1rem;
  text-align: left;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #11998e;
}

.hint {
  color: #666 !important;
  font-size: 0.9rem;
}

/* AI提示区域 */
.ai-hint-section {
  margin-top: 1rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border-left: 4px solid #11998e;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-hint-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.hint-icon {
  font-size: 1.1rem;
}

.hint-title {
  color: #11998e;
  font-weight: 600;
  font-size: 0.9rem;
}

.ai-hint-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ai-hint-item {
  color: #333;
  font-size: 0.9rem;
  line-height: 1.6;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.ai-hint-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(4px);
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
</style>

<script setup lang="ts">
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useI18nStore } from './stores/i18n'
import { useUserStore } from './stores/user'
import { UserOutlined, GlobalOutlined } from '@ant-design/icons-vue'
import { PRESET_COUNTRIES } from '@/config/location'
import { 
  getUserProfile, 
  setUserProfile, 
  getUserProfileOrDefault,
  validateUserProfile,
  SUPPORTED_LANGUAGES,
  type UserProfileConfig,
  type TransportationPreference
} from '@/config/userProfile'
import { getAllCurrencies, type CurrencyInfo } from '@/utils/currency'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { API_CONFIG } from '@/config/api'
import { getUserPreferences, updateUserPreferences } from '@/services/userPreferencesAPI'

const i18nStore = useI18nStore()
const userStore = useUserStore()
const { t } = useI18n()

// 用户个人信息设置
const userProfileModalVisible = ref(false)
const selectedInterfaceLanguage = ref<string>('zh-CN')
const selectedNationality = ref<string>('') // 国籍（用于判断签证需求）
const selectedLocation = ref<string>('') // 我所在国家（用于推荐目的地）
const selectedPermanentResidency = ref<string>('') // 永久居民身份
const selectedHeldVisas = ref<string[]>([]) // 已持有的签证
const selectedProficientLanguages = ref<string[]>(['zh-CN']) // 精通的语言列表
const selectedTransportMode = ref<TransportationPreference>('public_transit_and_walking') // 交通方式偏好
const selectedCurrency = ref<string>('CNY') // 货币偏好
const selectedLLMProvider = ref<'deepseek' | 'openai'>('deepseek')
const selectedLLMModel = ref<string>(API_CONFIG.OPENAI_DEFAULT_MODEL)
const userProfile = ref<UserProfileConfig | null>(null)
const syncingPreferences = ref(false)
const savingPreferences = ref(false)

const route = useRoute()
const router = useRouter()



// 货币选项
const currencyOptions = computed(() => {
  const currencies = getAllCurrencies()
  return currencies.map(currency => ({
    label: `${currency.symbol} ${currency.name} (${currency.code})`,
    value: currency.code
  }))
})

const openAIModelOptions = [
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'o1-mini', value: 'o1-mini' },
  { label: 'o1-preview', value: 'o1-preview' }
]

// 响应式用户配置，用于显示（保存后会更新）
const reactiveUserProfile = ref<UserProfileConfig>(getUserProfileOrDefault())

const countryOptions = computed(() => {
  return Object.values(PRESET_COUNTRIES).map(country => ({
    label: `${country.flag} ${country.name}`,
    value: country.code
  }))
})



const applyUserProfile = (profile: UserProfileConfig) => {
  setUserProfile(profile)
  userProfile.value = profile
  reactiveUserProfile.value = { ...profile }
}

const mergeProfileWithDefaults = (raw?: any): UserProfileConfig => {
  const defaults = getUserProfileOrDefault()
  if (!raw || typeof raw !== 'object') {
    return defaults
  }

  const merged: UserProfileConfig = {
    ...defaults,
    ...raw,
    nationality: raw.nationality ?? defaults.nationality,
    location: raw.location ?? defaults.location,
    permanentResidency: raw.permanentResidency ?? defaults.permanentResidency,
    heldVisas: Array.isArray(raw.heldVisas) ? raw.heldVisas : defaults.heldVisas,
    proficientLanguages: Array.isArray(raw.proficientLanguages) && raw.proficientLanguages.length > 0
      ? raw.proficientLanguages
      : defaults.proficientLanguages,
  }

  if (!merged.preferredTransportMode) {
    merged.preferredTransportMode = defaults.preferredTransportMode
  }

  if (!merged.preferredCurrency) {
    merged.preferredCurrency = defaults.preferredCurrency
  }

  if (!merged.interfaceLanguage) {
    merged.interfaceLanguage = defaults.interfaceLanguage
  }

  if (!validateUserProfile(merged)) {
    return defaults
  }

  return merged
}

const syncPreferencesFromServer = async () => {
  syncingPreferences.value = true
  try {
    const { preferences } = await getUserPreferences()
    const merged = mergeProfileWithDefaults(preferences)
    applyUserProfile(merged)

    if (merged.interfaceLanguage) {
      selectedInterfaceLanguage.value = merged.interfaceLanguage
      i18nStore.setLocale(merged.interfaceLanguage)
    }
  } catch (error) {
    console.warn('[UserPreferences] 无法从服务器同步偏好，将使用本地缓存。', error)
  } finally {
    syncingPreferences.value = false
  }
}


// 打开用户个人信息设置
const handleUserProfileClick = () => {
  userProfileModalVisible.value = true
  const profile = getUserProfileOrDefault()
  userProfile.value = profile
  
  // 加载当前设置
  selectedInterfaceLanguage.value = profile.interfaceLanguage || i18nStore.currentLocale
  selectedNationality.value = profile.nationality?.countryCode || ''
  selectedLocation.value = profile.location?.countryCode || ''
  selectedPermanentResidency.value = profile.permanentResidency?.countryCode || ''
  selectedHeldVisas.value = profile.heldVisas || []
  selectedProficientLanguages.value = profile.proficientLanguages || ['zh-CN']
  selectedTransportMode.value = profile.preferredTransportMode || 'public_transit_and_walking'
  selectedCurrency.value = profile.preferredCurrency || 'CNY'
  selectedLLMProvider.value = profile.preferredLLMProvider || 'deepseek'
  selectedLLMModel.value = profile.preferredLLMModel || API_CONFIG.OPENAI_DEFAULT_MODEL
  loadEventbriteStatus()
}

// 保存用户个人信息
const handleUserProfileSave = async () => {
  if (savingPreferences.value) return
  savingPreferences.value = true
  // 1. 保存界面语言
  if (selectedInterfaceLanguage.value) {
    i18nStore.setLocale(selectedInterfaceLanguage.value)
  }
  
  // 2. 保存个人信息
  const newProfile: UserProfileConfig = {
    nationality: selectedNationality.value 
      ? {
          country: PRESET_COUNTRIES[selectedNationality.value]?.name || '',
          countryCode: selectedNationality.value
        }
      : null,
    location: selectedLocation.value
      ? {
          country: PRESET_COUNTRIES[selectedLocation.value]?.name || '',
          countryCode: selectedLocation.value
        }
      : null,
    permanentResidency: selectedPermanentResidency.value
      ? {
          country: PRESET_COUNTRIES[selectedPermanentResidency.value]?.name || '',
          countryCode: selectedPermanentResidency.value
        }
      : null,
    heldVisas: selectedHeldVisas.value || [],
    proficientLanguages: selectedProficientLanguages.value.length > 0 ? selectedProficientLanguages.value : ['zh-CN'],
    preferredTransportMode: selectedTransportMode.value,
    preferredCurrency: selectedCurrency.value || 'CNY',
    preferredLLMProvider: selectedLLMProvider.value,
    preferredLLMModel: selectedLLMProvider.value === 'openai'
      ? (selectedLLMModel.value || API_CONFIG.OPENAI_DEFAULT_MODEL)
      : '',
    interfaceLanguage: selectedInterfaceLanguage.value || i18nStore.currentLocale
  }
  
  applyUserProfile(newProfile)

  try {
    try {
      await updateUserPreferences(newProfile)
    } catch (error) {
      console.error('[UserPreferences] 同步服务器失败：', error)
      message.warning('设置已在本地保存，但同步服务器失败，请稍后重试。')
      userProfileModalVisible.value = false
      return
    }

    // 触发自定义事件，通知其他组件更新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('userProfileUpdated'))
    }
    
    userProfileModalVisible.value = false
    
    // 使用 toast 提示保存成功
    message.success('设置已保存')
  } finally {
    savingPreferences.value = false
  }
}

// 用户个人信息显示
const userProfileDisplay = computed(() => {
  const parts: string[] = []
  
  // 显示当前界面语言
  const currentLang = i18nStore.currentLocale === 'zh-CN' ? '中文' : 'English'
  parts.push(`🌐 ${currentLang}`)
  
  // 优先显示用户国籍（如果已设置）- 这是用户身份标识
  const profile = reactiveUserProfile.value
  
  if (profile.nationality?.countryCode) {
    const nationalityCountry = PRESET_COUNTRIES[profile.nationality.countryCode]
    if (nationalityCountry) {
      // 如果国旗存在且不为空，显示国旗+名称，否则只显示名称
      const flagDisplay = nationalityCountry.flag && nationalityCountry.flag.trim() 
        ? `${nationalityCountry.flag} ` 
        : ''
      parts.push(`${flagDisplay}${nationalityCountry.name}`)
    }
  }
  
  // 其次显示用户所在国家（如果已设置且与国籍不同）
  if (profile.location?.countryCode) {
    const locationCountry = PRESET_COUNTRIES[profile.location.countryCode]
    if (locationCountry) {
      // 如果所在国家与国籍不同，才显示所在国家
      if (!profile.nationality?.countryCode || profile.location.countryCode !== profile.nationality.countryCode) {
        parts.push(`📍 ${locationCountry.name}`)
      }
    }
  }
  
  return parts.length > 0 ? parts.join(' · ') : '个人偏好'
})

// 语言切换相关
const languageSwitchTooltip = computed(() => {
  const currentLang = i18nStore.currentLocale === 'zh-CN' ? '中文' : 'English'
  const nextLang = i18nStore.currentLocale === 'zh-CN' ? 'English' : '中文'
  return `${currentLang} · 点击切换到 ${nextLang}`
})

const handleLanguageSwitch = () => {
  const nextLang = i18nStore.currentLocale === 'zh-CN' ? 'en-US' : 'zh-CN'
  i18nStore.setLocale(nextLang)
  message.success(nextLang === 'zh-CN' ? '已切换到中文' : 'Switched to English')
}


onMounted(() => {
  // 加载保存的语言设置
  i18nStore.loadLocale()
  // 加载用户个人信息
  const profile = getUserProfileOrDefault()
  applyUserProfile(profile)
  selectedInterfaceLanguage.value = profile.interfaceLanguage || i18nStore.currentLocale
  syncPreferencesFromServer()
})
</script>

<template>
  <div id="app">
    <!-- 用户个人信息设置按钮（个人中心）- 仅登录时显示 -->
    <a-float-button 
      v-if="userStore.isLoggedIn"
      :key="`user-btn-${reactiveUserProfile.nationality?.countryCode || 'none'}-${reactiveUserProfile.location?.countryCode || 'none'}`"
      :style="{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }"
      type="primary"
      @click="handleUserProfileClick"
      :tooltip="userProfileDisplay"
    >
      <template #icon>
        <user-outlined />
      </template>
    </a-float-button>
    
    <!-- 语言切换按钮 - 未登录时显示 -->
    <a-float-button 
      v-if="!userStore.isLoggedIn"
      :style="{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }"
      type="default"
      @click="handleLanguageSwitch"
      :tooltip="languageSwitchTooltip"
    >
      <template #icon>
        <global-outlined />
      </template>
    </a-float-button>
    
    <!-- 用户个人信息设置对话框（个人偏好） -->
    <a-modal
      v-model:open="userProfileModalVisible"
      title="个人偏好"
      ok-text="保存"
      cancel-text="取消"
      width="700px"
      :body-style="{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }"
      :confirm-loading="savingPreferences"
      @ok="handleUserProfileSave"
    >
      <div class="profile-modal-content">
        <!-- 1. 语言与显示设置 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">🌐</span>
              语言与显示设置
            </span>
          </template>
          <div class="section-content">
            <!-- 界面语言 -->
            <div class="form-item">
              <label class="form-label">界面语言</label>
              <a-select
                v-model:value="selectedInterfaceLanguage"
                placeholder="请选择界面显示语言"
                style="width: 100%"
              >
                <a-select-option value="zh-CN">中文</a-select-option>
                <a-select-option value="en-US">English</a-select-option>
              </a-select>
              <div class="form-hint">选择应用界面显示的语言</div>
            </div>
          </div>
        </a-card>

        <!-- 2. 身份信息 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">🏳️</span>
              身份信息
            </span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">
                <span>我的国籍</span>
                <span class="form-label-subtitle">（用于判断签证需求）</span>
              </label>
        <a-select
                v-model:value="selectedNationality"
                placeholder="请选择您的护照国籍（可选）"
          style="width: 100%"
                allow-clear
        >
          <a-select-option 
            v-for="option in countryOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
              <div class="form-hint">
                💡 您的护照国籍，用于判断前往目的地是否需要签证
                <br/>
                <span class="hint-example">例如：选择中国国籍后，系统会判断前往各目的地是否需要签证，并在旅行详情页提供签证指引</span>
              </div>
        </div>
      </div>
        </a-card>
    
        <!-- 3. 地理信息 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">📍</span>
              地理信息
            </span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">
                <span>我所在国家</span>
                <span class="form-label-subtitle">（用于推荐目的地）</span>
          </label>
          <a-select
                v-model:value="selectedLocation"
                placeholder="请选择您所在的国家/地区（可选）"
            style="width: 100%"
            allow-clear
          >
            <a-select-option 
              v-for="option in countryOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
              <div class="form-hint">
                💡 您当前所在的国家/地区，用于在未指定目的地时优先推荐该国家或附近地区的目的地
                <br/>
                <span class="hint-example">例如：选择美国后，系统会优先推荐美国国内或周边地区的目的地</span>
          </div>
        </div>
          </div>
        </a-card>
        
        <!-- 3.1 永久居民身份 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">🪪</span>
              永久居民身份
            </span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">
                <span>永久居民身份</span>
                <span class="form-label-subtitle">（如绿卡、永久居留权等）</span>
              </label>
              <a-select
                v-model:value="selectedPermanentResidency"
                placeholder="请选择您的永久居民身份国家（可选）"
                style="width: 100%"
                allow-clear
              >
                <a-select-option 
                  v-for="option in countryOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
              <div class="form-hint">
                💡 如果您持有永久居民身份（如美国绿卡、加拿大永久居留权等），选择后系统会在推荐目的地和签证建议时考虑此因素
                <br/>
                <span class="hint-example">例如：持有美国绿卡后，前往某些国家可能享受签证便利或豁免</span>
              </div>
            </div>
          </div>
        </a-card>
        
        <!-- 3.2 已持有的签证 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">🎫</span>
              已持有的签证
            </span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">
                <span>已持有的有效签证</span>
                <span class="form-label-subtitle">（可多选）</span>
              </label>
              <a-select
                v-model:value="selectedHeldVisas"
                mode="multiple"
                placeholder="请选择您已持有的有效签证国家（可选）"
                style="width: 100%"
                allow-clear
              >
                <a-select-option 
                  v-for="option in countryOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
              <div class="form-hint">
                💡 如果您已持有某些国家的有效签证，选择后系统会在推荐目的地时给予最高优先级
                <br/>
                <span class="hint-example">例如：已持有申根签证后，前往申根区国家时系统会优先推荐，因为无需再申请签证</span>
              </div>
            </div>
          </div>
        </a-card>
        
        <!-- 1.1 精通语言 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">🗣️</span>
              精通语言
            </span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">
                <span>我精通的语言</span>
                <span class="form-label-subtitle">（可多选）</span>
              </label>
              <a-select
                v-model:value="selectedProficientLanguages"
                mode="multiple"
                placeholder="请选择您精通的语言（至少选择一种）"
                style="width: 100%"
              >
                <a-select-option 
                  v-for="lang in SUPPORTED_LANGUAGES" 
                  :key="lang.code" 
                  :value="lang.code"
                >
                  {{ lang.name }} ({{ lang.nativeName }})
                </a-select-option>
              </a-select>
              <div class="form-hint">
                💡 您精通的语言，系统会根据您的语言偏好调整显示格式和内容
                <br/>
                <span class="hint-example">例如：精通日语后，系统在显示日本目的地信息时会优先使用日语名称</span>
              </div>
            </div>
          </div>
        </a-card>
        
        <!-- 4. 货币偏好 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">💵</span>
              货币偏好
            </span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">
                <span>偏好货币</span>
                <span class="form-label-subtitle">（用于显示费用和价格）</span>
              </label>
              <a-select
                v-model:value="selectedCurrency"
                placeholder="请选择您的偏好货币"
                style="width: 100%"
              >
                <a-select-option 
                  v-for="option in currencyOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
              <div class="form-hint">
                💡 系统会根据您的货币偏好显示费用和价格信息
                <br/>
                <span class="hint-example">例如：选择美元后，行程中的费用信息会以美元显示</span>
              </div>
            </div>
          </div>
        </a-card>

        <!-- 4.1 AI 助手设置 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">🤖</span>
              AI 助手设置
            </span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">首选大模型提供商</label>
              <a-radio-group v-model:value="selectedLLMProvider" style="width: 100%">
                <a-radio 
                  value="deepseek" 
                  style="display: block; margin-bottom: 12px; padding: 12px; border: 1px solid #e8e8e8; border-radius: 6px;"
                >
                  <div style="font-weight: 500; margin-bottom: 4px;">DeepSeek 智能体</div>
                  <div style="font-size: 12px; color: #888;">默认模型，响应速度快，适合中文旅行场景</div>
                </a-radio>
                <a-radio 
                  value="openai" 
                  style="display: block; padding: 12px; border: 1px solid #e8e8e8; border-radius: 6px;"
                >
                  <div style="font-weight: 500; margin-bottom: 4px;">OpenAI (GPT)</div>
                  <div style="font-size: 12px; color: #888;">使用 OpenAI 最新模型，适合需要更强创意与推理的场景</div>
                </a-radio>
              </a-radio-group>
              <div class="form-hint">
                💡 可在此选择行程生成与灵感模式使用的默认 AI 提供商，随时可在个人偏好中切换。
              </div>
            </div>
            <div v-if="selectedLLMProvider === 'openai'" class="form-item">
              <label class="form-label">OpenAI 模型</label>
              <a-select
                v-model:value="selectedLLMModel"
                placeholder="请选择默认使用的 OpenAI 模型"
                style="width: 100%"
              >
                <a-select-option 
                  v-for="option in openAIModelOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
              <div class="form-hint">
                💡 默认使用 {{ API_CONFIG.OPENAI_DEFAULT_MODEL }}，如需自定义高级模型，请在环境变量中配置或在此处选择。
              </div>
            </div>
          </div>
        </a-card>
        
        <!-- 5. 交通方式偏好 -->
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title">
              <span class="section-icon">🚌</span>
              交通方式偏好
            </span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">
                <span>默认交通方式</span>
                <span class="form-label-subtitle">（用于生成行程时推荐交通方式）</span>
              </label>
              <a-radio-group v-model:value="selectedTransportMode" style="width: 100%">
                <a-radio value="public_transit_and_walking" style="display: block; margin-bottom: 12px; padding: 12px; border: 1px solid #e8e8e8; border-radius: 6px;">
                  <div style="font-weight: 500; margin-bottom: 4px;">🚌 公共交通 + 短距离步行</div>
                  <div style="font-size: 12px; color: #888;">优先使用地铁、公交、轻轨等公共交通工具，配合短距离步行</div>
                </a-radio>
                <a-radio value="driving_and_walking" style="display: block; padding: 12px; border: 1px solid #e8e8e8; border-radius: 6px;">
                  <div style="font-weight: 500; margin-bottom: 4px;">🚗 驾车 + 短距离步行</div>
                  <div style="font-size: 12px; color: #888;">优先使用自驾或租车，配合短距离步行到达目的地</div>
                </a-radio>
              </a-radio-group>
              <div class="form-hint">
                💡 系统会根据您的偏好，在生成行程时推荐相应的交通方式
                <br/>
                <span class="hint-example">例如：选择"公共交通+步行"后，生成的行程会优先推荐地铁、公交等公共交通工具</span>
              </div>
            </div>
          </div>
        </a-card>
        
        <!-- 信息用途说明 -->
        <div class="info-footer">
          <div class="info-box">
          💡 这些信息将用于：
            <ul class="info-list">
              <li>判断签证需求并提供签证指引</li>
              <li>在未指定目的地时，优先推荐您所在国家或附近地区的目的地</li>
              <li>考虑永久居民身份和已持有签证，提供更精准的推荐</li>
              <li>根据您的语言偏好调整内容显示格式</li>
              <li>根据货币偏好显示费用和价格信息</li>
              <li>根据交通方式偏好生成个性化的行程</li>
          </ul>
          </div>
        </div>
      </div>
    </a-modal>
    
    <RouterView :key="i18nStore.currentLocale" />
  </div>
</template>

<style scoped>
#app {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
}

/* 个人中心模态框样式 */
.profile-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-section-card {
  margin-bottom: 0 !important;
  border-radius: 8px;
}

.profile-section-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  padding: 14px 20px;
  min-height: auto;
}

.profile-section-card :deep(.ant-card-body) {
  padding: 20px;
}

.profile-section-card :deep(.ant-card-head-title) {
  padding: 0;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
}

.section-icon {
  font-size: 18px;
  margin-right: 8px;
  line-height: 1;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 0;
}

.form-label-subtitle {
  margin-left: 6px;
  font-size: 12px;
  font-weight: normal;
  color: #86868b;
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #86868b;
  line-height: 1.6;
}

.hint-item {
  color: #666;
}

.hint-example {
  color: #999;
  font-size: 11px;
}

.info-footer {
  margin-top: 8px;
}

.info-box {
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.info-list {
  margin: 8px 0 0 20px;
  padding: 0;
  list-style: disc;
}

.info-list li {
  margin: 4px 0;
}

.integration-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.integration-info {
  flex: 1;
}

.integration-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.integration-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.integration-status-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.integration-details {
  font-size: 13px;
  color: #444;
  line-height: 1.5;
}

.integration-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
  align-items: flex-end;
}
</style>

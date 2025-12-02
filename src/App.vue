<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue'
import { RouterView } from 'vue-router'
import { useI18nStore } from './stores/i18n'
import { useUserStore } from './stores/user'
import { UserOutlined, GlobalOutlined } from '@ant-design/icons-vue'
import { PRESET_COUNTRIES } from '@/config/location'
import { 
  getUserProfileOrDefault,
  setUserProfile,
  validateUserProfile,
  SUPPORTED_LANGUAGES,
  type UserProfileConfig,
  type TransportationPreference
} from '@/config/userProfile'
import { getAllCurrencies } from '@/utils/currency'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { getUserPreferences, updateUserPreferences } from '@/services/userPreferencesAPI'

const i18nStore = useI18nStore()
const userStore = useUserStore()
const { t } = useI18n()

// --- 状态管理 ---
const userProfileModalVisible = ref(false)
const syncingPreferences = ref(false)
const savingPreferences = ref(false)

// 使用 reactive 合并表单状态，使结构更清晰
const formState = reactive({
  interfaceLanguage: 'zh-CN',
  nationality: undefined as string | undefined,
  location: undefined as string | undefined,
  permanentResidency: undefined as string | undefined,
  heldVisas: [] as string[],
  proficientLanguages: ['zh-CN'] as string[],
  transportMode: 'public_transit_and_walking' as TransportationPreference,
  currency: 'CNY'
})

// 当前生效的用户配置（用于 FloatButton 显示）
const currentUserProfile = ref<UserProfileConfig>(getUserProfileOrDefault())

// --- 计算属性 ---

// 货币选项
const currencyOptions = computed(() => {
  return getAllCurrencies().map(currency => ({
    label: `${currency.symbol} ${currency.name} (${currency.code})`,
    value: currency.code
  }))
})

// 国家选项
const countryOptions = computed(() => {
  return Object.values(PRESET_COUNTRIES).map(country => ({
    label: `${country.flag} ${country.name}`,
    value: country.code
  }))
})

// 悬浮按钮 Tooltip 内容
const userProfileTooltip = computed(() => {
  const parts: string[] = []
  
  // 语言
  const isZh = i18nStore.currentLocale === 'zh-CN'
  parts.push(`🌐 ${isZh ? t('userProfile.languageSwitch.chinese') : t('userProfile.languageSwitch.english')}`)
  
  // 国籍
  const profile = currentUserProfile.value
  if (profile.nationality?.countryCode) {
    const country = PRESET_COUNTRIES[profile.nationality.countryCode]
    if (country) {
      parts.push(`${country.flag || ''} ${country.name}`)
    }
  }
  
  // 所在地 (如果与国籍不同)
  if (profile.location?.countryCode && profile.location.countryCode !== profile.nationality?.countryCode) {
    const country = PRESET_COUNTRIES[profile.location.countryCode]
    if (country) {
      parts.push(`📍 ${country.name}`)
    }
  }
  
  return parts.length > 0 ? parts.join(' · ') : t('userProfile.defaultTooltip')
})

const languageSwitchTooltip = computed(() => {
  const isZh = i18nStore.currentLocale === 'zh-CN'
  const current = isZh ? t('userProfile.languageSwitch.chinese') : t('userProfile.languageSwitch.english')
  const next = isZh ? t('userProfile.languageSwitch.english') : t('userProfile.languageSwitch.chinese')
  return `${current} · ${t('userProfile.languageSwitch.switchTo')} ${next}`
})

// --- 核心逻辑方法 ---

/**
 * 将 UserProfileConfig 映射到表单状态
 */
const mapProfileToForm = (profile: UserProfileConfig) => {
  formState.interfaceLanguage = profile.interfaceLanguage || i18nStore.currentLocale
  formState.nationality = profile.nationality?.countryCode
  formState.location = profile.location?.countryCode
  formState.permanentResidency = profile.permanentResidency?.countryCode
  formState.heldVisas = profile.heldVisas || []
  formState.proficientLanguages = profile.proficientLanguages?.length ? profile.proficientLanguages : ['zh-CN']
  formState.transportMode = profile.preferredTransportMode || 'public_transit_and_walking'
  formState.currency = profile.preferredCurrency || 'CNY'
}

/**
 * 将表单状态转换为 UserProfileConfig
 */
const mapFormToProfile = (): UserProfileConfig => {
  const getCountryObj = (code?: string) => code ? { country: PRESET_COUNTRIES[code]?.name || '', countryCode: code } : null

  return {
    interfaceLanguage: formState.interfaceLanguage,
    nationality: getCountryObj(formState.nationality),
    location: getCountryObj(formState.location),
    permanentResidency: getCountryObj(formState.permanentResidency),
    heldVisas: formState.heldVisas,
    proficientLanguages: formState.proficientLanguages.length > 0 ? formState.proficientLanguages : ['zh-CN'],
    preferredTransportMode: formState.transportMode,
    preferredCurrency: formState.currency
  }
}

/**
 * 应用配置并更新本地存储及响应式状态
 */
const applyUserProfile = (profile: UserProfileConfig) => {
  setUserProfile(profile)
  currentUserProfile.value = { ...profile } // 更新显示状态
  
  // 如果语言改变，立即应用
  if (profile.interfaceLanguage && profile.interfaceLanguage !== i18nStore.currentLocale) {
    i18nStore.setLocale(profile.interfaceLanguage)
  }
}

/**
 * 与默认配置合并（处理服务端返回的部分数据）
 */
const mergeProfileWithDefaults = (raw?: Partial<UserProfileConfig>): UserProfileConfig => {
  const defaults = getUserProfileOrDefault()
  if (!raw) return defaults

  const merged: UserProfileConfig = {
    ...defaults,
    ...raw,
    // 确保数组不为空
    heldVisas: Array.isArray(raw.heldVisas) ? raw.heldVisas : defaults.heldVisas,
    proficientLanguages: Array.isArray(raw.proficientLanguages) && raw.proficientLanguages.length > 0
      ? raw.proficientLanguages
      : defaults.proficientLanguages,
  }
  
  // 再次校验完整性
  return validateUserProfile(merged) ? merged : defaults
}

// --- 事件处理 ---

const syncPreferencesFromServer = async () => {
  syncingPreferences.value = true
  try {
    const { preferences } = await getUserPreferences()
    const merged = mergeProfileWithDefaults(preferences)
    applyUserProfile(merged)
    // 同步完成后更新表单数据的初始状态（如果模态框是开着的，但这通常在 mounted 运行）
    mapProfileToForm(merged)
  } catch (error) {
    console.warn('[UserPreferences] 无法从服务器同步偏好，将使用本地缓存。', error)
  } finally {
    syncingPreferences.value = false
  }
}

const handleUserProfileClick = () => {
  // 每次打开时重新读取当前最新的 Profile
  const current = getUserProfileOrDefault()
  mapProfileToForm(current)
  userProfileModalVisible.value = true
  // 注意：原代码中的 loadEventbriteStatus() 未定义，已移除
}

const handleUserProfileSave = async () => {
  if (savingPreferences.value) return
  savingPreferences.value = true

  const newProfile = mapFormToProfile()
  
  // 先乐观更新本地
  applyUserProfile(newProfile)

  try {
    await updateUserPreferences(newProfile)
    
    // 触发全局事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('userProfileUpdated'))
    }
    
    message.success(t('userProfile.saveSuccess'))
    userProfileModalVisible.value = false
  } catch (error) {
    console.error('[UserPreferences] 同步服务器失败：', error)
    message.warning(t('userProfile.saveLocalOnly'))
    // 即使失败，本地已经更新，依然关闭弹窗
    userProfileModalVisible.value = false
  } finally {
    savingPreferences.value = false
  }
}

const handleLanguageSwitch = () => {
  const nextLang = i18nStore.currentLocale === 'zh-CN' ? 'en-US' : 'zh-CN'
  i18nStore.setLocale(nextLang)
  message.success(nextLang === 'zh-CN' ? t('userProfile.languageSwitch.switchedToChinese') : t('userProfile.languageSwitch.switchedToEnglish'))
}

// --- 生命周期 ---
onMounted(() => {
  i18nStore.loadLocale()
  const profile = getUserProfileOrDefault()
  applyUserProfile(profile)
  
  if (userStore.isLoggedIn) {
    syncPreferencesFromServer()
  }
})
</script>

<template>
  <div id="app">
    <a-float-button 
      v-if="userStore.isLoggedIn"
      :key="`user-btn-${currentUserProfile.nationality?.countryCode || 'none'}`"
      class="fixed-btn"
      type="primary"
      @click="handleUserProfileClick"
      :tooltip="userProfileTooltip"
    >
      <template #icon><user-outlined /></template>
    </a-float-button>
    
    <a-float-button 
      v-else
      class="fixed-btn"
      type="default"
      @click="handleLanguageSwitch"
      :tooltip="languageSwitchTooltip"
    >
      <template #icon><global-outlined /></template>
    </a-float-button>
    
    <a-modal
      v-model:open="userProfileModalVisible"
      :title="t('userProfile.title')"
      :ok-text="t('userProfile.save')"
      :cancel-text="t('userProfile.cancel')"
      width="700px"
      class="profile-modal"
      :confirm-loading="savingPreferences"
      @ok="handleUserProfileSave"
    >
      <div class="profile-modal-content">
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title"><span class="section-icon">🌐</span>{{ t('userProfile.languageAndDisplay.title') }}</span>
          </template>
          <div class="form-item">
            <label class="form-label">{{ t('userProfile.languageAndDisplay.interfaceLanguage') }}</label>
            <a-select v-model:value="formState.interfaceLanguage" style="width: 100%">
              <a-select-option value="zh-CN">{{ t('userProfile.languageAndDisplay.chinese') }}</a-select-option>
              <a-select-option value="en-US">{{ t('userProfile.languageAndDisplay.english') }}</a-select-option>
            </a-select>
            <div class="form-hint">{{ t('userProfile.languageAndDisplay.interfaceLanguageHint') }}</div>
          </div>
        </a-card>

        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title"><span class="section-icon">🏳️</span>{{ t('userProfile.identity.title') }}</span>
          </template>
          <div class="form-item">
            <label class="form-label">
              <span>{{ t('userProfile.identity.nationality') }}</span>
              <span class="form-label-subtitle">{{ t('userProfile.identity.nationalitySubtitle') }}</span>
            </label>
            <a-select
              v-model:value="formState.nationality"
              :placeholder="t('userProfile.identity.nationalityPlaceholder')"
              :options="countryOptions"
              style="width: 100%"
              allow-clear
              show-search
              option-filter-prop="label"
            />
            <div class="form-hint">
              {{ t('userProfile.identity.nationalityHint') }} <br/>
              <span class="hint-example">{{ t('userProfile.identity.nationalityExample') }}</span>
            </div>
          </div>
        </a-card>
    
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title"><span class="section-icon">📍</span>{{ t('userProfile.location.title') }}</span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">
                <span>{{ t('userProfile.location.currentLocation') }}</span>
                <span class="form-label-subtitle">{{ t('userProfile.location.currentLocationSubtitle') }}</span>
              </label>
              <a-select
                v-model:value="formState.location"
                :placeholder="t('userProfile.location.currentLocationPlaceholder')"
                :options="countryOptions"
                style="width: 100%"
                allow-clear
                show-search
                option-filter-prop="label"
              />
              <div class="form-hint">
                {{ t('userProfile.location.currentLocationHint') }} <br/>
                <span class="hint-example">{{ t('userProfile.location.currentLocationExample') }}</span>
              </div>
            </div>

            <div class="form-item">
              <label class="form-label">
                <span>{{ t('userProfile.permanentResidency.label') }}</span>
                <span class="form-label-subtitle">{{ t('userProfile.permanentResidency.subtitle') }}</span>
              </label>
              <a-select
                v-model:value="formState.permanentResidency"
                :placeholder="t('userProfile.permanentResidency.placeholder')"
                :options="countryOptions"
                style="width: 100%"
                allow-clear
                show-search
                option-filter-prop="label"
              />
              <div class="form-hint">
                {{ t('userProfile.permanentResidency.hint') }} <br/>
                <span class="hint-example">{{ t('userProfile.permanentResidency.example') }}</span>
              </div>
            </div>

            <div class="form-item">
              <label class="form-label">
                <span>{{ t('userProfile.heldVisas.label') }}</span>
                <span class="form-label-subtitle">{{ t('userProfile.heldVisas.subtitle') }}</span>
              </label>
              <a-select
                v-model:value="formState.heldVisas"
                mode="multiple"
                :placeholder="t('userProfile.heldVisas.placeholder')"
                :options="countryOptions"
                style="width: 100%"
                allow-clear
                show-search
                option-filter-prop="label"
              />
              <div class="form-hint">
                {{ t('userProfile.heldVisas.hint') }} <br/>
                <span class="hint-example">{{ t('userProfile.heldVisas.example') }}</span>
              </div>
            </div>
          </div>
        </a-card>
        
        <a-card class="profile-section-card" :bordered="true">
          <template #title>
            <span class="section-title"><span class="section-icon">⚙️</span>{{ t('userProfile.preferences.title') || '偏好设置' }}</span>
          </template>
          <div class="section-content">
            <div class="form-item">
              <label class="form-label">{{ t('userProfile.languages.label') }}</label>
              <a-select
                v-model:value="formState.proficientLanguages"
                mode="multiple"
                :placeholder="t('userProfile.languages.placeholder')"
                style="width: 100%"
              >
                <a-select-option v-for="lang in SUPPORTED_LANGUAGES" :key="lang.code" :value="lang.code">
                  {{ lang.name }} ({{ lang.nativeName }})
                </a-select-option>
              </a-select>
            </div>

            <div class="form-item">
              <label class="form-label">{{ t('userProfile.currency.label') }}</label>
              <a-select
                v-model:value="formState.currency"
                :placeholder="t('userProfile.currency.placeholder')"
                :options="currencyOptions"
                style="width: 100%"
                show-search
                option-filter-prop="label"
              />
            </div>

            <div class="form-item">
              <label class="form-label">{{ t('userProfile.transportation.label') }}</label>
              <a-radio-group v-model:value="formState.transportMode" style="width: 100%">
                <a-radio value="public_transit_and_walking" class="transport-radio">
                  <div class="radio-title">{{ t('userProfile.transportation.publicTransit.label') }}</div>
                  <div class="radio-desc">{{ t('userProfile.transportation.publicTransit.description') }}</div>
                </a-radio>
                <a-radio value="driving_and_walking" class="transport-radio">
                  <div class="radio-title">{{ t('userProfile.transportation.driving.label') }}</div>
                  <div class="radio-desc">{{ t('userProfile.transportation.driving.description') }}</div>
                </a-radio>
              </a-radio-group>
            </div>
          </div>
        </a-card>
        
        <div class="info-footer">
          <div class="info-box">
            {{ t('userProfile.infoFooter.title') }}
            <ul class="info-list">
              <li v-for="i in 6" :key="i">{{ t(`userProfile.infoFooter.items.${i-1}`) }}</li>
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

.fixed-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.profile-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 覆盖 Ant Design Card 样式 */
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
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
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

.hint-example {
  color: #999;
  font-size: 11px;
}

/* 交通方式单选框样式优化 */
.transport-radio {
  display: block;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  transition: all 0.3s;
}

.transport-radio:last-child {
  margin-bottom: 0;
}

.transport-radio:hover, :deep(.ant-radio-wrapper-checked.transport-radio) {
  border-color: #1677ff;
  background-color: #f0f7ff;
}

.radio-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.radio-desc {
  font-size: 12px;
  color: #888;
}

/* 底部说明样式 */
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

/* Modal 滚动条优化 */
.profile-modal :deep(.ant-modal-body) {
  padding: 24px;
  max-height: 70vh; /* 使用 vh 适应不同屏幕 */
  overflow-y: auto;
}
</style>
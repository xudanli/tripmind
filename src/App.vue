<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RouterView } from 'vue-router'
import { useI18nStore } from './stores/i18n'
import { GlobalOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons-vue'
import { getUserLocation, setUserLocation, PRESET_COUNTRIES, type LocationConfig } from '@/config/location'
import { 
  getUserProfile, 
  setUserProfile, 
  getUserProfileOrDefault,
  SUPPORTED_LANGUAGES,
  type UserProfileConfig 
} from '@/config/userProfile'
import { Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const i18nStore = useI18nStore()
const { t } = useI18n()

const userLocation = ref<LocationConfig | null>(null)
const modalVisible = ref(false)
const selectedCountry = ref<string>('')

// 用户个人信息设置
const userProfileModalVisible = ref(false)
const selectedNationality = ref<string>('')
const selectedLanguages = ref<string[]>([])
const userProfile = ref<UserProfileConfig | null>(null)

const handleLanguageChange = () => {
  const current = i18nStore.currentLocale
  const newLang = current === 'zh-CN' ? 'en-US' : 'zh-CN'
  console.log('当前语言:', current, '切换到:', newLang)
  
  // 使用 nextTick 确保 UI 更新
  i18nStore.setLocale(newLang)
  
  console.log('设置后 currentLocale:', i18nStore.currentLocale)
}

const handleLocationClick = () => {
  modalVisible.value = true
  selectedCountry.value = userLocation.value?.countryCode || ''
}

const handleCountryChange = async () => {
  if (!selectedCountry.value) {
    Modal.error({ title: '提示', content: '请选择一个国家/地区' })
    return
  }
  
  const countryInfo = PRESET_COUNTRIES[selectedCountry.value as keyof typeof PRESET_COUNTRIES]
  if (countryInfo) {
    const newLocation: LocationConfig = {
      country: countryInfo.name,
      countryCode: countryInfo.code
    }
    setUserLocation(newLocation)
    userLocation.value = newLocation
    modalVisible.value = false
    Modal.success({ 
      title: '设置成功', 
      content: `您的国家/地区已设置为：${countryInfo.flag} ${countryInfo.name}` 
    })
  }
}

const locationDisplay = computed(() => {
  if (!userLocation.value) return '设置地点'
  const countryInfo = PRESET_COUNTRIES[userLocation.value.countryCode as keyof typeof PRESET_COUNTRIES]
  if (countryInfo) {
    return `${countryInfo.flag} ${countryInfo.name}`
  }
  return userLocation.value.country
})

const countryOptions = computed(() => {
  return Object.values(PRESET_COUNTRIES).map(country => ({
    label: `${country.flag} ${country.name}`,
    value: country.code
  }))
})

// 语言选项
const languageOptions = computed(() => {
  return SUPPORTED_LANGUAGES.map(lang => ({
    label: `${lang.name} (${lang.nativeName})`,
    value: lang.code
  }))
})

// 打开用户个人信息设置
const handleUserProfileClick = () => {
  userProfileModalVisible.value = true
  const profile = getUserProfileOrDefault()
  userProfile.value = profile
  selectedNationality.value = profile.nationality?.countryCode || ''
  selectedLanguages.value = [...profile.proficientLanguages]
}

// 保存用户个人信息
const handleUserProfileSave = () => {
  const newProfile: UserProfileConfig = {
    nationality: selectedNationality.value 
      ? {
          country: PRESET_COUNTRIES[selectedNationality.value]?.name || '',
          countryCode: selectedNationality.value
        }
      : null,
    proficientLanguages: selectedLanguages.value.length > 0 
      ? selectedLanguages.value 
      : ['zh-CN'] // 至少保留一个语言
  }
  
  setUserProfile(newProfile)
  userProfile.value = newProfile
  userProfileModalVisible.value = false
  
  Modal.success({ 
    title: '设置成功', 
    content: '您的个人信息已保存' 
  })
}

// 用户个人信息显示
const userProfileDisplay = computed(() => {
  const profile = getUserProfile()
  if (!profile) return '设置个人信息'
  
  const parts: string[] = []
  if (profile.nationality) {
    const countryInfo = PRESET_COUNTRIES[profile.nationality.countryCode]
    if (countryInfo) {
      parts.push(countryInfo.flag)
    }
  }
  if (profile.proficientLanguages.length > 0) {
    const langNames = profile.proficientLanguages.map(code => {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)
      return lang?.name || code
    })
    parts.push(langNames.join(', '))
  }
  
  return parts.length > 0 ? parts.join(' · ') : '设置个人信息'
})

onMounted(() => {
  // 加载保存的语言设置
  i18nStore.loadLocale()
  // 加载保存的位置设置
  userLocation.value = getUserLocation()
  // 加载用户个人信息
  userProfile.value = getUserProfileOrDefault()
})
</script>

<template>
  <div id="app">
    <!-- 语言切换按钮 -->
    <a-float-button 
      :style="{ position: 'fixed', top: '20px', right: '100px', zIndex: 1000 }"
      type="default"
      @click="handleLanguageChange"
      :tooltip="i18nStore.currentLocale === 'zh-CN' ? 'Switch to English' : '切换到中文'"
    >
      <template #icon>
        <global-outlined />
      </template>
    </a-float-button>
    
    <!-- 国家设置按钮 -->
    <a-float-button 
      :style="{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }"
      type="primary"
      @click="handleLocationClick"
      :tooltip="locationDisplay"
    >
      <template #icon>
        <environment-outlined />
      </template>
    </a-float-button>
    
    <!-- 用户个人信息设置按钮 -->
    <a-float-button 
      :style="{ position: 'fixed', top: '80px', right: '20px', zIndex: 1000 }"
      type="default"
      @click="handleUserProfileClick"
      :tooltip="userProfileDisplay"
    >
      <template #icon>
        <user-outlined />
      </template>
    </a-float-button>
    
    <!-- 国家设置对话框 -->
    <a-modal
      v-model:open="modalVisible"
      title="选择您的国家/地区"
      ok-text="确认"
      cancel-text="取消"
      @ok="handleCountryChange"
    >
      <div style="padding: 20px 0;">
        <a-select
          v-model:value="selectedCountry"
          placeholder="请选择国家/地区"
          style="width: 100%"
          size="large"
        >
          <a-select-option 
            v-for="option in countryOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
        
        <div style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 14px; color: #666;">
          💡 设置后，AI会优先推荐您本国/本地的旅行目的地
        </div>
      </div>
    </a-modal>
    
    <!-- 用户个人信息设置对话框 -->
    <a-modal
      v-model:open="userProfileModalVisible"
      title="设置个人信息"
      ok-text="保存"
      cancel-text="取消"
      width="600px"
      @ok="handleUserProfileSave"
    >
      <div style="padding: 20px 0;">
        <!-- 国籍选择 -->
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #1d1d1f;">
            我的国籍
          </label>
          <a-select
            v-model:value="selectedNationality"
            placeholder="请选择您的国籍（可选）"
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
          <div style="margin-top: 8px; font-size: 12px; color: #86868b;">
            选择您的国籍，用于优化推荐和显示格式
          </div>
        </div>
        
        <!-- 精通语言选择 -->
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #1d1d1f;">
            我精通的语言
          </label>
          <a-select
            v-model:value="selectedLanguages"
            placeholder="请选择您精通的语言（可多选）"
            style="width: 100%"
            mode="multiple"
            :max-tag-count="3"
          >
            <a-select-option 
              v-for="option in languageOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
          <div style="margin-top: 8px; font-size: 12px; color: #86868b;">
            选择您精通的语言，用于优化内容和推荐
          </div>
        </div>
        
        <div style="padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 14px; color: #666;">
          💡 这些信息将用于：
          <ul style="margin: 8px 0 0 20px; padding: 0;">
            <li>优化货币和格式显示</li>
            <li>提供更符合您文化的推荐</li>
            <li>调整内容和翻译优先顺序</li>
          </ul>
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
</style>

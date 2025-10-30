<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RouterView } from 'vue-router'
import { useI18nStore } from './stores/i18n'
import { GlobalOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import { getUserLocation, setUserLocation, PRESET_COUNTRIES, type LocationConfig } from '@/config/location'
import { Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const i18nStore = useI18nStore()
const { t } = useI18n()

const userLocation = ref<LocationConfig | null>(null)
const modalVisible = ref(false)
const selectedCountry = ref<string>('')

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

onMounted(() => {
  // 加载保存的语言设置
  i18nStore.loadLocale()
  // 加载保存的位置设置
  userLocation.value = getUserLocation()
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

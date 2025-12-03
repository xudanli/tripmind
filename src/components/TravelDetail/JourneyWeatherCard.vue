<template>
  <a-card 
    :bordered="false" 
    class="journey-weather-card"
    :loading="loading"
  >
    <template #title>
      <span class="weather-card-title">
        <span class="weather-icon">🌤️</span>
        {{ t('travelDetail.weather.title') || '行程天气' }}
      </span>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="weather-loading">
      <a-spin size="small" />
      <span class="loading-text">{{ t('travelDetail.weather.loading') || '加载中...' }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="weather-error">
      <a-alert
        type="warning"
        :message="error"
        show-icon
        :closable="false"
      />
      <a-button 
        v-if="journeyId" 
        type="link" 
        size="small" 
        @click="loadWeather"
        style="margin-top: 8px"
      >
        {{ t('travelDetail.weather.retry') || '重试' }}
      </a-button>
    </div>

    <!-- 天气信息 -->
    <div v-else-if="weatherData" class="weather-content">
      <!-- 目的地和日期信息 -->
      <div class="weather-header">
        <div class="destination-name">
          <span class="location-icon">📍</span>
          {{ weatherData.destination }}
        </div>
        <div class="date-range">
          {{ formatDateRange(weatherData.startDate, weatherData.endDate) }}
        </div>
        <div class="weather-type-badge" :class="weatherTypeClass">
          {{ weatherTypeText }}
        </div>
      </div>

      <!-- 当前天气/平均温度 -->
      <div class="weather-section">
        <div class="section-title">
          <span class="section-icon">🌡️</span>
          {{ weatherData.weatherInfo.type === 'realtime' ? (t('travelDetail.weather.currentWeather') || '当前天气') : (t('travelDetail.weather.averageTemperature') || '平均温度') }}
        </div>
        <div class="section-content">
          {{ weatherData.weatherInfo.currentWeather }}
        </div>
      </div>

      <!-- 天气预报/典型天气 -->
      <div class="weather-section">
        <div class="section-title">
          <span class="section-icon">📅</span>
          {{ weatherData.weatherInfo.type === 'realtime' ? (t('travelDetail.weather.forecast') || '天气预报') : (t('travelDetail.weather.typicalWeather') || '典型天气') }}
        </div>
        <div class="section-content">
          {{ weatherData.weatherInfo.forecast }}
        </div>
      </div>

      <!-- 历史气候特有信息 -->
      <template v-if="weatherData.weatherInfo.type === 'historical'">
        <div v-if="weatherData.weatherInfo.averageTemperature" class="weather-section">
          <div class="section-title">
            <span class="section-icon">🌡️</span>
            {{ t('travelDetail.weather.averageTemperature') || '平均温度' }}
          </div>
          <div class="section-content">
            {{ weatherData.weatherInfo.averageTemperature }}
          </div>
        </div>

        <div v-if="weatherData.weatherInfo.rainfall" class="weather-section">
          <div class="section-title">
            <span class="section-icon">🌧️</span>
            {{ t('travelDetail.weather.rainfall') || '降雨信息' }}
          </div>
          <div class="section-content">
            {{ weatherData.weatherInfo.rainfall }}
          </div>
        </div>

        <div v-if="weatherData.weatherInfo.clothingSuggestions" class="weather-section">
          <div class="section-title">
            <span class="section-icon">👕</span>
            {{ t('travelDetail.weather.clothingSuggestions') || '穿衣建议' }}
          </div>
          <div class="section-content">
            {{ weatherData.weatherInfo.clothingSuggestions }}
          </div>
        </div>

        <div v-if="weatherData.weatherInfo.safetyAdvice" class="weather-section">
          <div class="section-title">
            <span class="section-icon">⚠️</span>
            {{ t('travelDetail.weather.safetyAdvice') || '安全建议' }}
          </div>
          <div class="section-content">
            {{ weatherData.weatherInfo.safetyAdvice }}
          </div>
        </div>
      </template>

      <!-- 安全警示 -->
      <div v-if="weatherData.weatherInfo.safetyAlerts" class="weather-section weather-alert">
        <div class="section-title">
          <span class="section-icon">⚠️</span>
          {{ t('travelDetail.weather.safetyAlerts') || '安全警示' }}
        </div>
        <div class="section-content alert-content">
          {{ weatherData.weatherInfo.safetyAlerts }}
        </div>
      </div>

      <!-- 打包建议 -->
      <div v-if="weatherData.weatherInfo.packingSuggestions" class="weather-section">
        <div class="section-title">
          <span class="section-icon">🎒</span>
          {{ t('travelDetail.weather.packingSuggestions') || '打包建议' }}
        </div>
        <div class="section-content">
          {{ weatherData.weatherInfo.packingSuggestions }}
        </div>
      </div>

      <!-- 旅行建议 -->
      <div v-if="weatherData.weatherInfo.travelTips" class="weather-section">
        <div class="section-title">
          <span class="section-icon">💡</span>
          {{ t('travelDetail.weather.travelTips') || '旅行建议' }}
        </div>
        <div class="section-content">
          {{ weatherData.weatherInfo.travelTips }}
        </div>
      </div>

      <!-- 缓存和生成时间信息 -->
      <div v-if="weatherData.fromCache || weatherData.generatedAt" class="weather-footer">
        <div v-if="weatherData.fromCache" class="cache-badge">
          {{ t('travelDetail.weather.fromCache') || '来自缓存' }}
        </div>
        <div v-if="weatherData.generatedAt" class="generated-time">
          {{ t('travelDetail.weather.generatedAt') || '生成时间' }}: {{ formatDateTime(weatherData.generatedAt) }}
        </div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="weather-empty">
      <a-empty
        :description="journeyId ? (t('travelDetail.weather.unavailable') || '天气信息暂不可用') : (t('travelDetail.weather.noJourneyId') || '需要行程ID才能获取天气信息')"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
      />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Empty } from 'ant-design-vue'
import { getJourneyWeather, type GetJourneyWeatherResponse } from '@/services/itineraryAPI'
import { getCurrentLanguage } from '@/utils/i18n'

interface Props {
  journeyId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  journeyId: null
})

const { t } = useI18n()

const loading = ref(false)
const weatherData = ref<GetJourneyWeatherResponse | null>(null)
const error = ref<string | null>(null)

// 天气类型样式类
const weatherTypeClass = computed(() => {
  if (!weatherData.value) return ''
  return weatherData.value.weatherInfo.type === 'realtime' ? 'type-realtime' : 'type-historical'
})

// 天气类型文本
const weatherTypeText = computed(() => {
  if (!weatherData.value) return ''
  return weatherData.value.weatherInfo.type === 'realtime' 
    ? (t('travelDetail.weather.realtime') || '实时天气')
    : (t('travelDetail.weather.historical') || '历史气候')
})

// 格式化日期范围
const formatDateRange = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const formatDate = (date: Date) => {
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}月${day}日`
    }
    return `${formatDate(start)} - ${formatDate(end)}`
  } catch {
    return `${startDate} - ${endDate}`
  }
}

// 格式化日期时间
const formatDateTime = (dateTimeStr: string): string => {
  try {
    const date = new Date(dateTimeStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}`
  } catch {
    return dateTimeStr
  }
}

// 加载天气信息
const loadWeather = async () => {
  if (!props.journeyId) {
    console.log('[JourneyWeatherCard] journeyId 为空，跳过加载')
    error.value = null
    weatherData.value = null
    return
  }

  console.log('[JourneyWeatherCard] 开始加载行程天气信息, journeyId:', props.journeyId)
  loading.value = true
  error.value = null

  try {
    const lang = getCurrentLanguage()
    const data = await getJourneyWeather(props.journeyId, lang)
    console.log('[JourneyWeatherCard] 天气数据获取结果:', {
      hasData: !!data,
      type: data.weatherInfo.type,
      destination: data.destination
    })
    
    if (data) {
      weatherData.value = data
      error.value = null
      console.log('[JourneyWeatherCard] ✅ 天气信息加载成功')
    } else {
      console.warn('[JourneyWeatherCard] ⚠️ 天气数据为空')
      error.value = t('travelDetail.weather.unavailable') || '天气信息暂不可用'
      weatherData.value = null
    }
  } catch (err: any) {
    console.error('[JourneyWeatherCard] ❌ 加载天气信息失败:', {
      error: err.message,
      stack: err.stack,
      journeyId: props.journeyId
    })
    
    // 根据错误类型显示不同的错误信息
    if (err.message?.includes('404') || err.message?.includes('不存在')) {
      error.value = t('travelDetail.weather.journeyNotFound') || '行程不存在'
    } else if (err.message?.includes('400') || err.message?.includes('天数')) {
      error.value = t('travelDetail.weather.noDaysInfo') || '行程没有天数信息，无法获取天气信息'
    } else {
      error.value = t('travelDetail.weather.error') || `获取天气信息失败: ${err.message || '未知错误'}`
    }
    weatherData.value = null
  } finally {
    loading.value = false
  }
}

// 监听行程ID变化
watch(() => props.journeyId, (newId, oldId) => {
  console.log('[JourneyWeatherCard] journeyId 变化:', {
    oldId,
    newId,
    hasNewId: !!newId
  })
  if (newId) {
    console.log('[JourneyWeatherCard] journeyId 有值，调用 loadWeather')
    loadWeather()
  } else {
    console.log('[JourneyWeatherCard] journeyId 为空，清空天气数据')
    weatherData.value = null
    error.value = null
  }
}, { immediate: true })

// 组件挂载时加载
onMounted(() => {
  console.log('[JourneyWeatherCard] onMounted, journeyId:', props.journeyId)
  if (props.journeyId) {
    console.log('[JourneyWeatherCard] 组件挂载时有 journeyId，调用 loadWeather')
    loadWeather()
  } else {
    console.log('[JourneyWeatherCard] 组件挂载时没有 journeyId，等待 watch 触发')
  }
})
</script>

<style scoped>
.journey-weather-card {
  border: 1px solid #f0f0f0;
  box-shadow: none;
  border-radius: 8px;
}

.weather-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.weather-icon {
  font-size: 18px;
}

.weather-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  justify-content: center;
}

.loading-text {
  color: #666;
  font-size: 14px;
}

.weather-error {
  padding: 12px 0;
}

.weather-content {
  padding: 4px 0;
}

.weather-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.destination-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.location-icon {
  font-size: 16px;
}

.date-range {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.weather-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-realtime {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.type-historical {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.weather-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.weather-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.section-icon {
  font-size: 16px;
}

.section-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.weather-alert {
  background: #fff7e6;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ffd591;
}

.alert-content {
  color: #d46b08;
  font-weight: 500;
}

.weather-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.cache-badge {
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 4px;
  color: #666;
}

.generated-time {
  color: #999;
}

.weather-empty {
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .weather-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .weather-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>


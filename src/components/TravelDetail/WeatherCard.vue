<template>
  <a-card 
    v-if="shouldShow"
    :bordered="false" 
    class="weather-card sidebar-block"
    :loading="loading"
  >
    <template #title>
      <span class="weather-card-title">
        <span class="weather-icon">🌤️</span>
        {{ t('travelDetail.experienceDay.weather.title') || '天气信息' }}
      </span>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="weather-loading">
      <a-spin size="small" />
      <span class="loading-text">{{ t('travelDetail.experienceDay.weather.loading') || '加载中...' }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="weather-error">
      <a-alert
        type="info"
        :message="error"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 天气信息 -->
    <div v-else-if="weather" class="weather-content">
      <!-- 当前天气 -->
      <div class="weather-current">
        <div class="weather-main">
          <div class="weather-temp">
            <span class="temp-value">{{ weather.temperature }}</span>
            <span class="temp-unit">°C</span>
          </div>
          <div class="weather-condition">{{ weather.condition }}</div>
        </div>
        <div v-if="weather.humidity !== undefined || weather.windSpeed !== undefined" class="weather-details">
          <div v-if="weather.humidity !== undefined" class="weather-detail-item">
            <span class="detail-label">{{ t('travelDetail.experienceDay.weather.humidity') || '湿度' }}:</span>
            <span class="detail-value">{{ weather.humidity }}%</span>
          </div>
          <div v-if="weather.windSpeed !== undefined" class="weather-detail-item">
            <span class="detail-label">{{ t('travelDetail.experienceDay.weather.windSpeed') || '风速' }}:</span>
            <span class="detail-value">{{ weather.windSpeed }} km/h</span>
          </div>
        </div>
      </div>

      <!-- 天气预报 -->
      <div v-if="weather.forecast && weather.forecast.length > 0" class="weather-forecast">
        <div class="forecast-title">{{ t('travelDetail.experienceDay.weather.forecast') || '天气预报' }}</div>
        <div class="forecast-list">
          <div
            v-for="(item, index) in weather.forecast"
            :key="index"
            class="forecast-item"
          >
            <div class="forecast-date">{{ formatDate(item.date) }}</div>
            <div class="forecast-temp">{{ item.temperature }}°C</div>
            <div class="forecast-condition">{{ item.condition }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="weather-empty">
      <a-empty
        :description="props.destinationId ? (t('travelDetail.experienceDay.weather.unavailable') || '天气信息暂不可用') : '需要目的地ID才能获取天气信息'"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
      />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Empty } from 'ant-design-vue'
import { getDestinationWeather, type DestinationWeather } from '@/services/externalAPI'

interface Props {
  destinationId?: string | null
  destinationName?: string
}

const props = withDefaults(defineProps<Props>(), {
  destinationId: null,
  destinationName: ''
})

const { t } = useI18n()

const loading = ref(false)
const weather = ref<DestinationWeather | null>(null)
const error = ref<string | null>(null)

// 是否应该显示组件（始终显示，即使没有目的地ID也显示提示）
const shouldShow = computed(() => {
  return true // 始终显示，即使没有 destinationId 也显示提示信息
})

// 格式化日期
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[date.getDay()]
    return `${month}/${day} ${weekday}`
  } catch {
    return dateStr
  }
}

// 加载天气信息
const loadWeather = async () => {
  console.log('[WeatherCard] loadWeather 被调用, destinationId:', props.destinationId)
  
  if (!props.destinationId) {
    console.log('[WeatherCard] destinationId 为空，跳过加载')
    error.value = null
    weather.value = null
    return
  }

  console.log('[WeatherCard] 开始加载天气信息, destinationId:', props.destinationId)
  loading.value = true
  error.value = null

  try {
    const weatherData = await getDestinationWeather(props.destinationId)
    console.log('[WeatherCard] 天气数据获取结果:', {
      hasData: !!weatherData,
      temperature: weatherData?.temperature,
      condition: weatherData?.condition
    })
    
    if (weatherData) {
      weather.value = weatherData
      error.value = null
      console.log('[WeatherCard] ✅ 天气信息加载成功')
    } else {
      console.warn('[WeatherCard] ⚠️ 天气数据为空')
      error.value = t('travelDetail.experienceDay.weather.unavailable') || '天气信息暂不可用'
      weather.value = null
    }
  } catch (err: any) {
    console.error('[WeatherCard] ❌ 加载天气信息失败:', {
      error: err.message,
      stack: err.stack,
      destinationId: props.destinationId
    })
    error.value = t('travelDetail.experienceDay.weather.error') || '获取天气信息失败'
    weather.value = null
  } finally {
    loading.value = false
  }
}

// 监听目的地ID变化
watch(() => props.destinationId, (newId, oldId) => {
  console.log('[WeatherCard] destinationId 变化:', {
    oldId,
    newId,
    hasNewId: !!newId
  })
  if (newId) {
    console.log('[WeatherCard] destinationId 有值，调用 loadWeather')
    loadWeather()
  } else {
    console.log('[WeatherCard] destinationId 为空，清空天气数据')
    weather.value = null
    error.value = null
  }
}, { immediate: true })

// 组件挂载时加载
onMounted(() => {
  console.log('[WeatherCard] onMounted, destinationId:', props.destinationId)
  if (props.destinationId) {
    console.log('[WeatherCard] 组件挂载时有 destinationId，调用 loadWeather')
    loadWeather()
  } else {
    console.log('[WeatherCard] 组件挂载时没有 destinationId，等待 watch 触发')
  }
})
</script>

<style scoped>
.weather-card {
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

.weather-current {
  margin-bottom: 16px;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.weather-temp {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.temp-value {
  font-size: 32px;
  font-weight: 600;
  color: #1890ff;
  line-height: 1;
}

.temp-unit {
  font-size: 18px;
  color: #666;
  font-weight: 400;
}

.weather-condition {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.weather-details {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.weather-detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.detail-label {
  color: #666;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.weather-forecast {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.forecast-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forecast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 14px;
}

.forecast-date {
  color: #666;
  flex: 1;
}

.forecast-temp {
  color: #1890ff;
  font-weight: 500;
  margin: 0 12px;
  min-width: 50px;
  text-align: right;
}

.forecast-condition {
  color: #333;
  min-width: 60px;
  text-align: right;
}

.weather-empty {
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .weather-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .forecast-item {
    flex-wrap: wrap;
  }

  .forecast-temp,
  .forecast-condition {
    margin-top: 4px;
  }
}
</style>


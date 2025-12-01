/**
 * 目的地实用信息卡片组件
 * 显示语言、汇率、时区、插座类型和紧急电话等信息
 */

<template>
  <a-card 
    class="local-essentials-card" 
    :title="cardTitle"
    :loading="loading"
  >
    <template #extra>
      <a-tag v-if="fromCache" color="blue" size="small">
        {{ t('travelDetail.localEssentials.fromCache') || '缓存' }}
      </a-tag>
      <a-button 
        v-if="!loading && !localEssentials"
        type="link" 
        size="small"
        @click="loadEssentials"
      >
        {{ t('travelDetail.localEssentials.load') || '加载' }}
      </a-button>
    </template>

    <div v-if="loading && !localEssentials" class="loading-state">
      <a-spin :spinning="true" />
      <span style="margin-left: 8px;">
        {{ t('travelDetail.localEssentials.loading') || '正在加载实用信息...' }}
      </span>
    </div>

    <div v-else-if="error" class="error-state">
      <a-alert
        type="warning"
        :message="t('travelDetail.localEssentials.loadError') || '加载失败'"
        :description="error"
        show-icon
      />
      <a-button 
        type="link" 
        size="small"
        @click="loadEssentials"
        style="margin-top: 8px;"
      >
        {{ t('travelDetail.localEssentials.retry') || '重试' }}
      </a-button>
    </div>

    <div v-else-if="localEssentials" class="local-essentials-content">
      <div class="essentials-list">
        <div v-if="localEssentials.language" class="info-item">
          <div class="info-label">
            <span class="info-icon">🗣️</span>
            <strong>{{ t('travelDetail.localEssentials.language') || '语言' }}</strong>
          </div>
          <div class="info-text">{{ localEssentials.language }}</div>
        </div>

        <div v-if="localEssentials.currencyRate" class="info-item">
          <div class="info-label">
            <span class="info-icon">💰</span>
            <strong>{{ t('travelDetail.localEssentials.currencyRate') || '汇率' }}</strong>
          </div>
          <div class="info-text">{{ localEssentials.currencyRate }}</div>
        </div>

        <div v-if="localEssentials.timeZone" class="info-item">
          <div class="info-label">
            <span class="info-icon">🕐</span>
            <strong>{{ t('travelDetail.localEssentials.timeZone') || '时区' }}</strong>
          </div>
          <div class="info-text">{{ localEssentials.timeZone }}</div>
        </div>

        <div v-if="localEssentials.powerOutlet" class="info-item">
          <div class="info-label">
            <span class="info-icon">🔌</span>
            <strong>{{ t('travelDetail.localEssentials.powerOutlet') || '插座类型' }}</strong>
          </div>
          <div class="info-text">{{ localEssentials.powerOutlet }}</div>
        </div>

        <div v-if="localEssentials.emergencyNumber" class="info-item">
          <div class="info-label">
            <span class="info-icon">🚨</span>
            <strong>{{ t('travelDetail.localEssentials.emergencyNumber') || '紧急电话' }}</strong>
          </div>
          <div class="info-text">{{ localEssentials.emergencyNumber }}</div>
        </div>
      </div>
      
      <div v-if="generatedAt" class="essentials-meta">
        <span class="meta-text">
          {{ t('travelDetail.localEssentials.generatedAt') || '生成时间' }}: 
          {{ formatDate(generatedAt) }}
        </span>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <a-empty 
        :description="t('travelDetail.localEssentials.empty') || '暂无实用信息'"
        :image="false"
      />
      <a-button 
        type="link" 
        size="small"
        @click="loadEssentials"
        style="margin-top: 8px;"
      >
        {{ t('travelDetail.localEssentials.load') || '加载' }}
      </a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { getLocalEssentials, type GetLocalEssentialsResponse } from '@/services/itineraryAPI'
import dayjs from 'dayjs'

interface Props {
  journeyId: string
  destination?: string
}

const props = defineProps<Props>()

const { t } = useI18n()

const localEssentials = ref<GetLocalEssentialsResponse['localEssentials'] | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const fromCache = ref(false)
const generatedAt = ref<string | null>(null)

const cardTitle = computed(() => {
  return props.destination 
    ? `🌍 ${props.destination}${t('travelDetail.localEssentials.title') || '实用信息'}`
    : `🌍 ${t('travelDetail.localEssentials.title') || '实用信息'}`
})

/**
 * 格式化日期
 */
const formatDate = (dateString: string): string => {
  try {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm')
  } catch {
    return dateString
  }
}

/**
 * 加载目的地实用信息
 */
const loadEssentials = async () => {
  if (!props.journeyId) {
    error.value = t('travelDetail.localEssentials.noJourneyId') || '缺少行程ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await getLocalEssentials(props.journeyId)
    
    localEssentials.value = result.localEssentials
    fromCache.value = result.fromCache || false
    generatedAt.value = result.generatedAt || null

    console.log('[LocalEssentialsCard] 加载成功:', {
      journeyId: props.journeyId,
      destination: result.destination,
      fromCache: fromCache.value
    })
  } catch (err: any) {
    console.error('[LocalEssentialsCard] 加载失败:', err)
    error.value = err.message || t('travelDetail.localEssentials.loadError') || '加载失败'
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

// 监听 journeyId 变化，自动加载
watch(
  () => props.journeyId,
  (newId) => {
    if (newId && !localEssentials.value) {
      loadEssentials()
    }
  },
  { immediate: true }
)

// 组件挂载时加载
onMounted(() => {
  if (props.journeyId && !localEssentials.value) {
    loadEssentials()
  }
})
</script>

<style scoped>
.local-essentials-card {
  margin-bottom: 0;
}

.loading-state,
.error-state,
.empty-state {
  padding: 16px;
  text-align: center;
}

.local-essentials-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.essentials-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1d1d1f;
}

.info-icon {
  font-size: 16px;
}

.info-text {
  font-size: 13px;
  line-height: 1.6;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
}

.essentials-meta {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
  text-align: right;
}

.meta-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>


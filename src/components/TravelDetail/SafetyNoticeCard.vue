<template>
  <a-card class="safety-notice-card" :bordered="false">
    <!-- 安全提示内容 -->
    <div v-if="safetyNoticeText" class="safety-notice-content">
      <a-collapse v-model:activeKey="activeKeys" :bordered="false" ghost>
        <a-collapse-panel key="notice" :show-arrow="false">
          <template #header>
            <div class="notice-header">
              <span class="notice-header-text">🛡️ {{ t('travelDetail.safetyNotice.title') || '安全提示' }}</span>
              <a-button 
                type="link" 
                size="small" 
                :loading="generating"
                @click.stop="handleRefresh"
                class="refresh-btn"
              >
                {{ t('travelDetail.safetyNotice.refresh') || '刷新' }}
              </a-button>
            </div>
          </template>
          <div class="notice-text">{{ safetyNoticeText }}</div>
        </a-collapse-panel>
      </a-collapse>
    </div>
    
    <!-- 无安全提示时显示生成按钮 -->
    <div v-else class="safety-notice-empty">
      <a-empty 
        :description="t('travelDetail.safetyNotice.noNotice') || '暂无安全提示'"
        :image="false"
      >
        <template #description>
          <span>{{ t('travelDetail.safetyNotice.noNotice') || '暂无安全提示' }}</span>
        </template>
      </a-empty>
      <a-button 
        type="primary" 
        :loading="generating"
        @click="handleGenerate"
        block
      >
        {{ t('travelDetail.safetyNotice.generate') || '生成安全提示' }}
      </a-button>
    </div>
    
    <!-- 通用旅行安全通知列表 -->
    <a-divider v-if="alerts.length > 0" />
    <div v-if="alerts.length > 0" class="travel-alerts">
      <div class="alerts-header">
        <span class="alerts-title">{{ t('travelDetail.safetyNotice.alerts') || '旅行安全通知' }}</span>
        <a-button 
          type="link" 
          size="small" 
          :loading="loadingAlerts"
          @click="loadAlerts"
        >
          {{ t('travelDetail.safetyNotice.refreshAlerts') || '刷新' }}
        </a-button>
      </div>
      <div class="alerts-list">
        <a-alert
          v-for="alert in alerts"
          :key="alert.id"
          :type="getAlertType(alert.severity)"
          :message="alert.title"
          :description="alert.content"
          show-icon
          style="margin-bottom: 12px;"
        >
          <template #icon>
            <span v-if="alert.severity === 'critical'">🚨</span>
            <span v-else-if="alert.severity === 'high'">⚠️</span>
            <span v-else-if="alert.severity === 'medium'">ℹ️</span>
            <span v-else>📢</span>
          </template>
        </a-alert>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { getSafetyNotice, generateSafetyNotice } from '@/services/itineraryAPI'
import { getTravelAlerts, type TravelAlert } from '@/services/externalAPI'
import { getUserNationalityCode } from '@/config/userProfile'

const { t } = useI18n()

interface Props {
  journeyId?: string
  destination?: string
  countryCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  journeyId: '',
  destination: '',
  countryCode: ''
})

const safetyNoticeText = ref<string>('')
const generating = ref(false)
const loadingAlerts = ref(false)
const alerts = ref<TravelAlert[]>([])
const activeKeys = ref<string[]>(['notice']) // 默认展开

// 获取安全提示
const loadSafetyNotice = async () => {
  if (!props.journeyId) {
    return
  }

  try {
    const safetyData = await getSafetyNotice(props.journeyId)
    if (safetyData.noticeText && !safetyData.noticeText.includes('暂无安全提示')) {
      safetyNoticeText.value = safetyData.noticeText
    } else {
      safetyNoticeText.value = ''
    }
  } catch (error: any) {
    console.warn('[SafetyNoticeCard] 获取安全提示失败:', error.message)
    safetyNoticeText.value = ''
  }
}

// 生成安全提示
const handleGenerate = async () => {
  if (!props.journeyId) {
    message.warning('无法生成：缺少行程 ID')
    return
  }

  generating.value = true
  try {
    // 获取用户国籍
    const userNationality = getUserNationalityCode()
    
    const safetyData = await generateSafetyNotice(props.journeyId, {
      lang: 'zh-CN',
      forceRefresh: false,
      userNationality: userNationality || undefined
    })
    
    if (safetyData.noticeText) {
      safetyNoticeText.value = safetyData.noticeText
      message.success('安全提示已生成')
    } else {
      message.warning('生成安全提示失败：未返回内容')
    }
  } catch (error: any) {
    console.error('[SafetyNoticeCard] 生成安全提示失败:', error)
    message.error(`生成安全提示失败: ${error.message || '未知错误'}`)
  } finally {
    generating.value = false
  }
}

// 刷新安全提示
const handleRefresh = async () => {
  if (!props.journeyId) {
    message.warning('无法刷新：缺少行程 ID')
    return
  }

  generating.value = true
  try {
    // 获取用户国籍
    const userNationality = getUserNationalityCode()
    
    const safetyData = await generateSafetyNotice(props.journeyId, {
      lang: 'zh-CN',
      forceRefresh: true,
      userNationality: userNationality || undefined
    })
    
    if (safetyData.noticeText) {
      safetyNoticeText.value = safetyData.noticeText
      message.success('安全提示已刷新')
    } else {
      message.warning('刷新安全提示失败：未返回内容')
    }
  } catch (error: any) {
    console.error('[SafetyNoticeCard] 刷新安全提示失败:', error)
    message.error(`刷新安全提示失败: ${error.message || '未知错误'}`)
  } finally {
    generating.value = false
  }
}

// 获取通用旅行安全通知
const loadAlerts = async () => {
  loadingAlerts.value = true
  try {
    const result = await getTravelAlerts({
      destination: props.destination,
      countryCode: props.countryCode,
      status: 'active',
      limit: 10
    })
    alerts.value = result.data || []
  } catch (error: any) {
    console.warn('[SafetyNoticeCard] 获取旅行安全通知失败:', error.message)
    alerts.value = []
  } finally {
    loadingAlerts.value = false
  }
}

// 根据严重程度获取 Alert 类型
const getAlertType = (severity: string): 'error' | 'warning' | 'info' | 'success' => {
  switch (severity) {
    case 'critical':
      return 'error'
    case 'high':
      return 'warning'
    case 'medium':
      return 'info'
    default:
      return 'success'
  }
}

// 监听 journeyId 变化，重新加载
watch(() => props.journeyId, (newId) => {
  if (newId) {
    loadSafetyNotice()
  }
}, { immediate: true })

// 监听目的地变化，重新加载通知
watch([() => props.destination, () => props.countryCode], () => {
  if (props.destination || props.countryCode) {
    loadAlerts()
  }
}, { immediate: true })

onMounted(() => {
  if (props.journeyId) {
    loadSafetyNotice()
  }
  if (props.destination || props.countryCode) {
    loadAlerts()
  }
})
</script>

<style scoped>
.safety-notice-card {
  width: 100%;
}

.safety-notice-content {
  margin-bottom: 16px;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 8px;
}

.notice-header-text {
  font-weight: 500;
  color: #333;
}

.refresh-btn {
  padding: 0;
  height: auto;
  font-size: 12px;
}

.notice-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
  padding-top: 8px;
}

:deep(.ant-collapse-header) {
  padding: 8px 0 !important;
}

:deep(.ant-collapse-content-box) {
  padding: 0 !important;
}

.safety-notice-empty {
  text-align: center;
  padding: 20px 0;
}

.travel-alerts {
  margin-top: 16px;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.alerts-title {
  font-weight: 600;
  font-size: 14px;
}

.alerts-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>


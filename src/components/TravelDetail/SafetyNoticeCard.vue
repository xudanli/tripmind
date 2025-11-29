<template>
  <!-- 只有在有数据时才显示整个卡片 -->
  <a-card v-if="hasAlerts" class="safety-notice-card" :bordered="false">
    <!-- 通用旅行安全通知列表 -->
    <div class="travel-alerts">
      <div class="alerts-header">
        <span class="alerts-title">🛡️ {{ t('travelDetail.safetyNotice.alerts') || '旅行安全通知' }}</span>
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
          :closable="false"
          style="margin-bottom: 12px; cursor: pointer;"
          @click="handleAlertClick(alert.id)"
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

  <!-- 安全提示详情模态框（放在卡片外部，确保即使卡片隐藏也能显示） -->
  <a-modal
    v-model:open="showAlertDetailModal"
    :title="selectedAlert?.title || '安全提示详情'"
    :width="600"
    :footer="null"
  >
    <div v-if="selectedAlert" class="alert-detail">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="严重程度">
          <a-tag :color="getSeverityColor(selectedAlert.severity)">
            {{ getSeverityText(selectedAlert.severity) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(selectedAlert.status)">
            {{ getStatusText(selectedAlert.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="目的地" v-if="selectedAlert.destination">
          {{ selectedAlert.destination }}
        </a-descriptions-item>
        <a-descriptions-item label="国家代码" v-if="selectedAlert.countryCode">
          {{ selectedAlert.countryCode }}
        </a-descriptions-item>
        <a-descriptions-item label="生效开始日期">
          {{ formatDate(selectedAlert.startDate) }}
        </a-descriptions-item>
        <a-descriptions-item label="生效结束日期" v-if="selectedAlert.endDate">
          {{ formatDate(selectedAlert.endDate) }}
        </a-descriptions-item>
        <a-descriptions-item label="内容">
          <div class="alert-content">{{ selectedAlert.content }}</div>
        </a-descriptions-item>
      </a-descriptions>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { getTravelAlerts, getAlertById, type TravelAlert } from '@/services/externalAPI'

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

const loadingAlerts = ref(false)
const alerts = ref<TravelAlert[]>([])
const showAlertDetailModal = ref(false)
const selectedAlert = ref<TravelAlert | null>(null)

// 判断是否有数据需要显示（只有在加载完成且没有数据时不显示）
const hasAlerts = computed(() => {
  // 如果正在加载，显示组件（避免闪烁）
  if (loadingAlerts.value) {
    return true
  }
  // 加载完成后，只有在有数据时才显示
  return alerts.value.length > 0
})

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

// 点击 alert 时获取详情
const handleAlertClick = async (alertId: string) => {
  try {
    const alertDetail = await getAlertById(alertId)
    selectedAlert.value = alertDetail
    showAlertDetailModal.value = true
  } catch (error: any) {
    console.error('[SafetyNoticeCard] 获取安全提示详情失败:', error)
    message.error(`获取安全提示详情失败: ${error.message || '未知错误'}`)
  }
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) {
    return dateStr
  }
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取严重程度颜色
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'red'
    case 'high':
      return 'orange'
    case 'medium':
      return 'blue'
    default:
      return 'green'
  }
}

// 获取严重程度文本
const getSeverityText = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return '严重'
    case 'high':
      return '高'
    case 'medium':
      return '中等'
    default:
      return '低'
  }
}

// 获取状态颜色
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'green'
    case 'expired':
      return 'default'
    case 'archived':
      return 'gray'
    default:
      return 'default'
  }
}

// 获取状态文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'active':
      return '生效中'
    case 'expired':
      return '已过期'
    case 'archived':
      return '已归档'
    default:
      return status
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

// 监听目的地变化，重新加载通知
watch([() => props.destination, () => props.countryCode], () => {
  if (props.destination || props.countryCode) {
    loadAlerts()
  }
}, { immediate: true })

onMounted(() => {
  if (props.destination || props.countryCode) {
    loadAlerts()
  }
})
</script>

<style scoped>
.safety-notice-card {
  width: 100%;
}

.travel-alerts {
  margin-top: 0;
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

.alerts-empty {
  text-align: center;
  padding: 20px 0;
}

.alerts-list {
  max-height: 400px;
  overflow-y: auto;
}

.alert-detail {
  margin-top: 16px;
}

.alert-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
}
</style>


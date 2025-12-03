<template>
  <a-card 
    :bordered="false" 
    class="packing-list-card"
    :loading="loading"
  >
    <template #title>
      <span class="card-title">
        <span class="card-icon">🎒</span>
        {{ t('travelDetail.packingList.title') || '智能打包清单' }}
      </span>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="small" />
      <span class="loading-text">{{ t('travelDetail.packingList.loading') || '正在生成智能打包清单...' }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
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
        @click="loadPackingList"
        style="margin-top: 8px"
      >
        {{ t('travelDetail.packingList.retry') || '重试' }}
      </a-button>
    </div>

    <!-- 打包清单内容 -->
    <div v-else-if="packingListData" class="packing-content">
      <!-- 目的地和日期信息 -->
      <div class="packing-header">
        <div class="destination-name">
          <span class="location-icon">📍</span>
          {{ packingListData.destination }}
        </div>
        <div class="date-range">
          {{ formatDateRange(packingListData.startDate, packingListData.endDate) }}
        </div>
        <div class="item-count-badge">
          {{ packingListData.packingList.length }} {{ t('travelDetail.packingList.items') || '项' }}
        </div>
      </div>

      <!-- 打包清单列表 -->
      <div class="packing-list">
        <div
          v-for="(item, index) in packingListData.packingList"
          :key="index"
          class="packing-item"
        >
          <div class="item-number">{{ index + 1 }}</div>
          <div class="item-content">
            <div class="item-name">
              <span class="item-icon">📦</span>
              {{ item.item }}
            </div>
            <div class="item-reason">
              <span class="reason-icon">👉</span>
              {{ item.reason }}
            </div>
          </div>
        </div>
      </div>

      <!-- 缓存和生成时间信息 -->
      <div v-if="packingListData.fromCache || packingListData.generatedAt" class="packing-footer">
        <div v-if="packingListData.fromCache" class="cache-badge">
          {{ t('travelDetail.packingList.fromCache') || '来自缓存' }}
        </div>
        <div v-if="packingListData.generatedAt" class="generated-time">
          {{ t('travelDetail.packingList.generatedAt') || '生成时间' }}: {{ formatDateTime(packingListData.generatedAt) }}
        </div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="empty-container">
      <a-empty
        :description="journeyId ? (t('travelDetail.packingList.unavailable') || '打包清单暂不可用') : (t('travelDetail.packingList.noJourneyId') || '需要行程ID才能生成打包清单')"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
      />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Empty } from 'ant-design-vue'
import { getPackingList, type GetPackingListResponse } from '@/services/itineraryAPI'
import { getCurrentLanguage } from '@/utils/i18n'

interface Props {
  journeyId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  journeyId: null
})

const { t } = useI18n()

const loading = ref(false)
const packingListData = ref<GetPackingListResponse | null>(null)
const error = ref<string | null>(null)

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

// 加载打包清单
const loadPackingList = async () => {
  if (!props.journeyId) {
    console.log('[PackingListCard] journeyId 为空，跳过加载')
    error.value = null
    packingListData.value = null
    return
  }

  console.log('[PackingListCard] 开始加载智能打包清单, journeyId:', props.journeyId)
  loading.value = true
  error.value = null

  try {
    const lang = getCurrentLanguage()
    const data = await getPackingList(props.journeyId, lang)
    console.log('[PackingListCard] 打包清单获取结果:', {
      hasData: !!data,
      itemCount: data.packingList.length,
      destination: data.destination
    })
    
    if (data) {
      packingListData.value = data
      error.value = null
      console.log('[PackingListCard] ✅ 打包清单加载成功')
    } else {
      console.warn('[PackingListCard] ⚠️ 打包清单数据为空')
      error.value = t('travelDetail.packingList.unavailable') || '打包清单暂不可用'
      packingListData.value = null
    }
  } catch (err: any) {
    console.error('[PackingListCard] ❌ 加载打包清单失败:', {
      error: err.message,
      stack: err.stack,
      journeyId: props.journeyId
    })
    
    // 根据错误类型显示不同的错误信息
    if (err.message?.includes('404') || err.message?.includes('不存在')) {
      error.value = t('travelDetail.packingList.journeyNotFound') || '行程不存在'
    } else if (err.message?.includes('400') || err.message?.includes('天数')) {
      error.value = t('travelDetail.packingList.noDaysInfo') || '行程没有天数信息，无法生成打包清单'
    } else {
      error.value = t('travelDetail.packingList.error') || `获取打包清单失败: ${err.message || '未知错误'}`
    }
    packingListData.value = null
  } finally {
    loading.value = false
  }
}

// 监听行程ID变化
watch(() => props.journeyId, (newId, oldId) => {
  console.log('[PackingListCard] journeyId 变化:', {
    oldId,
    newId,
    hasNewId: !!newId
  })
  if (newId) {
    console.log('[PackingListCard] journeyId 有值，调用 loadPackingList')
    loadPackingList()
  } else {
    console.log('[PackingListCard] journeyId 为空，清空打包清单数据')
    packingListData.value = null
    error.value = null
  }
}, { immediate: true })

// 组件挂载时加载
onMounted(() => {
  console.log('[PackingListCard] onMounted, journeyId:', props.journeyId)
  if (props.journeyId) {
    console.log('[PackingListCard] 组件挂载时有 journeyId，调用 loadPackingList')
    loadPackingList()
  } else {
    console.log('[PackingListCard] 组件挂载时没有 journeyId，等待 watch 触发')
  }
})
</script>

<style scoped>
.packing-list-card {
  border: 1px solid #f0f0f0;
  box-shadow: none;
  border-radius: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.card-icon {
  font-size: 18px;
}

.loading-container {
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

.error-container {
  padding: 12px 0;
}

.packing-content {
  padding: 4px 0;
}

.packing-header {
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

.item-count-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.packing-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.packing-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.packing-item:hover {
  background: #f5f5f5;
  border-color: #d9d9d9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.item-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.item-icon {
  font-size: 16px;
}

.item-reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.reason-icon {
  flex-shrink: 0;
  font-size: 14px;
  margin-top: 2px;
}

.packing-footer {
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

.empty-container {
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .packing-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .packing-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .packing-item {
    flex-direction: column;
    gap: 8px;
  }

  .item-number {
    align-self: flex-start;
  }
}
</style>


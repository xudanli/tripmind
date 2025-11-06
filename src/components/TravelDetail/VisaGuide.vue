<template>
  <a-card v-if="visaInfo" class="visa-guide-card" :bordered="false">
    <template #title>
      <span style="display: flex; align-items: center; gap: 8px;">
        <span>✈️</span>
        <span>签证指引</span>
      </span>
    </template>
    
    <div class="visa-content">
      <div class="visa-status" :class="visaStatusClass">
        <div class="status-icon">
          <check-circle-outlined v-if="isVisaFree" />
          <exclamation-circle-outlined v-else />
        </div>
        <div class="status-text">
          <div class="status-title">{{ visaStatusTitle }}</div>
          <div class="status-detail">{{ visaInfo.description || getDefaultDescription() }}</div>
        </div>
      </div>
      
      <div v-if="visaInfo.duration" class="visa-duration">
        <span class="duration-label">停留期限：</span>
        <span class="duration-value">{{ visaInfo.duration }}天</span>
      </div>
      
      <!-- 免签情况 -->
      <div v-if="visaInfo.visaType === 'visa-free'" class="visa-actions">
        <a-alert
          type="success"
          show-icon
          message="✅ 免签入境"
          :description="`恭喜！您前往${visaInfo.destinationName}无需提前申请签证，可以直接入境。${visaInfo.duration ? `停留期限：${visaInfo.duration}天。` : ''}`"
        >
        </a-alert>
        <div class="action-tips">
          <p><strong>出行建议：</strong></p>
          <ul>
            <li>确保护照有效期至少6个月以上</li>
            <li>准备往返机票或前往下一目的地的机票</li>
            <li>准备足够的旅行资金证明</li>
            <li>建议购买旅行保险</li>
          </ul>
        </div>
      </div>
      
      <!-- 需要提前申请签证 -->
      <div v-else-if="visaInfo.visaType === 'visa-required'" class="visa-actions">
        <a-alert
          type="warning"
          show-icon
          :message="`${visaInfo.destinationName}对${visaInfo.applicableTo}需要提前申请签证`"
          :description="`建议提前${getRecommendedDays()}天申请签证，以确保出行顺利。`"
        >
        </a-alert>
        <div v-if="visaInfo.applicationUrl" class="visa-application-link">
          <a-button 
            type="primary" 
            :href="visaInfo.applicationUrl" 
            target="_blank"
            rel="noopener noreferrer"
            class="application-btn"
          >
            <span>🔗</span> {{ t('travelDetail.visaGuideActions.applyVisa') || '申请签证' }}
          </a-button>
        </div>
        <div class="action-tips">
          <p><strong>申请建议：</strong></p>
          <ul>
            <li>提前准备所需材料（护照、照片、申请表等）</li>
            <li>预约使领馆或签证中心</li>
            <li>预留充足的审核时间</li>
            <li>关注签证政策变化</li>
          </ul>
        </div>
      </div>
      
      <!-- 电子签证 -->
      <div v-else-if="visaInfo.visaType === 'e-visa'" class="visa-actions">
        <a-alert
          type="info"
          show-icon
          message="💻 电子签证（e-Visa）"
          :description="`您可以在线申请电子签证，通常处理时间较快。建议提前申请以确保出行顺利。`"
        >
        </a-alert>
        <div v-if="visaInfo.applicationUrl" class="visa-application-link">
          <a-button 
            type="primary" 
            :href="visaInfo.applicationUrl" 
            target="_blank"
            rel="noopener noreferrer"
            class="application-btn"
          >
            <span>🔗</span> {{ t('travelDetail.visaGuideActions.applyEvisa') || '在线申请电子签证' }}
          </a-button>
        </div>
        <div class="action-tips">
          <p><strong>申请建议：</strong></p>
          <ul>
            <li>访问目的地官方电子签证网站</li>
            <li>在线填写申请表并上传所需材料</li>
            <li>支付签证费用</li>
            <li>等待审核通过后打印电子签证</li>
          </ul>
        </div>
      </div>
      
      <!-- 落地签 -->
      <div v-else-if="visaInfo.visaType === 'visa-on-arrival'" class="visa-actions">
        <a-alert
          type="success"
          show-icon
          message="🛬 落地签"
          :description="`您可以在抵达目的地后办理落地签，但建议提前确认所需材料和费用。`"
        >
        </a-alert>
        <div class="action-tips">
          <p><strong>出行建议：</strong></p>
          <ul>
            <li>提前准备护照照片</li>
            <li>准备足够的现金支付签证费</li>
            <li>确认所需材料清单</li>
            <li>预留足够的办理时间</li>
          </ul>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { VisaInfo } from '@/config/visa'

const { t } = useI18n()

interface Props {
  visaInfo: VisaInfo | null
  destinationCountry?: string
  destinationName?: string
}

const props = withDefaults(defineProps<Props>(), {
  visaInfo: null,
  destinationCountry: '',
  destinationName: ''
})

const isVisaFree = computed(() => {
  return props.visaInfo?.visaType === 'visa-free'
})

const visaStatusClass = computed(() => {
  if (isVisaFree.value) return 'visa-free'
  if (props.visaInfo?.visaType === 'visa-on-arrival' || props.visaInfo?.visaType === 'e-visa') {
    return 'visa-convenient'
  }
  return 'visa-required'
})

const visaStatusTitle = computed(() => {
  if (!props.visaInfo) return ''
  
  const typeMap: Record<string, string> = {
    'visa-free': '✅ 免签入境',
    'visa-on-arrival': '🛬 落地签',
    'e-visa': '💻 电子签证',
    'visa-required': '⚠️ 需要提前申请签证',
    'permanent-resident-benefit': '🪪 永久居民便利政策'
  }
  
  return typeMap[props.visaInfo.visaType] || '签证信息'
})

const getDefaultDescription = () => {
  if (!props.visaInfo) return ''
  return `${props.visaInfo.destinationName}对${props.visaInfo.applicableTo}${props.visaInfo.visaType === 'visa-free' ? '免签入境' : '需要签证'}`
}

const getRecommendedDays = () => {
  // 根据目的地不同，建议不同的提前天数
  const countryMap: Record<string, number> = {
    'US': 30,
    'GB': 20,
    'CA': 25,
    'AU': 20,
    'NZ': 20,
    'JP': 10,
    'KR': 10,
    'SG': 10,
    'FR': 15,
    'DE': 15,
    'IT': 15,
    'ES': 15
  }
  
  return countryMap[props.destinationCountry] || 15
}
</script>

<style scoped>
.visa-guide-card {
  margin-bottom: 24px;
}

.visa-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.visa-status {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f5f5f5;
}

.visa-status.visa-free {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.visa-status.visa-convenient {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.visa-status.visa-required {
  background: #fff7e6;
  border: 1px solid #ffd591;
}

.status-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.visa-status.visa-free .status-icon {
  color: #52c41a;
}

.visa-status.visa-convenient .status-icon {
  color: #1890ff;
}

.visa-status.visa-required .status-icon {
  color: #fa8c16;
}

.status-text {
  flex: 1;
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.visa-duration {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 14px;
}

.duration-label {
  color: #666;
}

.duration-value {
  font-weight: 600;
  color: #1890ff;
}

.visa-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-tips {
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
}

.action-tips p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.action-tips ul {
  margin: 0;
  padding-left: 20px;
}

.action-tips li {
  margin: 4px 0;
  color: #666;
}

.visa-application-link {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.application-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
</style>


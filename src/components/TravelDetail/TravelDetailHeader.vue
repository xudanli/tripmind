<template>
  <div class="travel-detail-header">
    <!-- 背景图片 -->
    <div class="header-background" :style="backgroundStyle">
      <div class="header-overlay"></div>
    </div>
    
    <!-- 返回按钮 -->
    <div class="header-actions">
      <a-button @click="$emit('back')" class="back-button" type="text">
        <template #icon>
          <arrow-left-outlined />
        </template>
        {{ t('travelDetail.backToJourney') }}
      </a-button>
    </div>
    
    <!-- 头部内容 -->
    <div class="header-content">
      <h1 class="destination-title">{{ destinationName || destination }}</h1>
      <p class="destination-subtitle" v-if="subtitle">{{ subtitle }}</p>
      <p class="destination-summary" v-if="summary">{{ summary }}</p>
    </div>
    
    <!-- 信息卡片区域 -->
    <div class="info-cards-container">
      <div class="info-cards-grid">
        <!-- 天气展望 -->
        <div class="info-card" v-if="weatherData">
          <div class="info-card-header">
            <span class="info-card-icon">🌤️</span>
            <h3 class="info-card-title">天气展望</h3>
          </div>
          <div class="info-card-content">
            <div v-html="weatherData"></div>
          </div>
        </div>
        
        <!-- 目的地实用信息 -->
        <div class="info-card" v-if="practicalInfo">
          <div class="info-card-header">
            <span class="info-card-icon">ℹ️</span>
            <h3 class="info-card-title">目的地实用信息</h3>
          </div>
          <div class="info-card-content">
            <!-- 语言 -->
            <div class="info-item" v-if="practicalInfo.language">
              <div class="info-item-header">
                <span class="info-item-icon">A</span>
                <span class="info-item-label">语言</span>
              </div>
              <div class="info-item-value">{{ practicalInfo.language }}</div>
            </div>
            
            <!-- 电源插座 -->
            <div class="info-item" v-if="practicalInfo.plugType">
              <div class="info-item-header">
                <span class="info-item-icon">⚡</span>
                <span class="info-item-label">电源插座</span>
              </div>
              <div class="info-item-value">{{ practicalInfo.plugType }}</div>
            </div>
            
            <!-- 参考汇率 -->
            <div class="info-item" v-if="currencyInfo">
              <div class="info-item-header">
                <span class="info-item-icon">💰</span>
                <span class="info-item-label">参考汇率</span>
              </div>
              <div class="info-item-value">{{ currencyInfo }}</div>
            </div>
            
            <!-- 紧急电话 -->
            <div class="info-item" v-if="practicalInfo.emergencyContact">
              <div class="info-item-header">
                <span class="info-item-icon">📞</span>
                <span class="info-item-label">紧急电话</span>
              </div>
              <div class="info-item-value">{{ practicalInfo.emergencyContact }}</div>
            </div>
          </div>
        </div>
        
        <!-- 最新动态 -->
        <div class="info-card" v-if="latestUpdates">
          <div class="info-card-header">
            <span class="info-card-icon">📰</span>
            <h3 class="info-card-title">最新动态</h3>
          </div>
          <div class="info-card-content">
            <div v-html="latestUpdates"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

interface Props {
  destination: string
  destinationName?: string
  subtitle?: string
  summary?: string
  backgroundImage?: string
  weatherData?: string
  practicalInfo?: {
    language?: string
    plugType?: string
    emergencyContact?: string
    [key: string]: any
  }
  currencyInfo?: string
  latestUpdates?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  back: []
}>()

const { t } = useI18n()

const backgroundStyle = computed(() => {
  if (props.backgroundImage) {
    return {
      backgroundImage: `url(${props.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
})
</script>

<style scoped>
.travel-detail-header {
  position: relative;
  width: 100%;
  min-height: 400px;
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
  backdrop-filter: blur(2px);
}

.header-actions {
  position: relative;
  z-index: 10;
  padding: 1.5rem 2rem;
}

.back-button {
  color: #ffffff;
  font-size: 14px;
  height: 40px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    color: #ffffff;
  }
}

.header-content {
  position: relative;
  z-index: 10;
  padding: 2rem 2rem 3rem;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.destination-title {
  margin: 0 0 1rem 0;
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.2;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.destination-subtitle {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  max-width: 800px;
}

.destination-summary {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  max-width: 900px;
  font-weight: 400;
}

.info-cards-container {
  position: relative;
  z-index: 10;
  padding: 0 2rem 2rem;
}

.info-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.info-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.info-card-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.info-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
}

.info-card-content {
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
}

.info-item {
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.info-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(30, 125, 186, 0.1);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #1E7DBA;
}

.info-item-label {
  font-weight: 600;
  color: #64748b;
  font-size: 13px;
}

.info-item-value {
  color: #0f172a;
  font-size: 14px;
  line-height: 1.6;
  padding-left: 32px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .destination-title {
    font-size: 2rem;
  }
  
  .destination-subtitle {
    font-size: 1rem;
  }
  
  .destination-summary {
    font-size: 0.9rem;
    line-height: 1.6;
  }
  
  .info-cards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .header-content {
    padding: 1.5rem 1.5rem 2rem;
  }
  
  .info-cards-container {
    padding: 0 1.5rem 1.5rem;
  }
}
</style>


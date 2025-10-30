<template>
  <div class="hero-section planner-hero">
    <div class="hero-cover">
      <img :src="coverImage || defaultCoverImage" :alt="title || '旅行计划'" />
      <div class="hero-content">
        <!-- 目标与进度 -->
        <div class="planner-info">
          <div class="info-section">
            <h1 class="hero-title">{{ title || '智能旅行计划' }}</h1>
            <div class="hero-meta">
              <a-tag :color="getStatusColor(status)" size="large">
                {{ statusLabel || '规划中' }}
              </a-tag>
              <span class="meta-separator">·</span>
              <span class="meta-text">{{ duration || 0 }}天</span>
              <span class="meta-separator">·</span>
              <span class="meta-text">{{ participants || 1 }}人</span>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="progress-section">
            <div class="progress-item">
              <span class="progress-label">{{ t('travelDetail.plannerHero.completionLabel') }}</span>
              <a-progress :percent="completionPercent || 0" :status="completionPercent === 100 ? 'success' : 'active'" />
            </div>
          </div>

          <!-- AI优化建议 -->
          <div class="ai-suggestion" v-if="aiSuggestion">
            <bulb-outlined class="ai-icon" />
            <div class="ai-content">
              <strong>{{ t('travelDetail.plannerHero.aiSuggestionLabel') }}</strong>
              <span>{{ aiSuggestion }}</span>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="hero-actions">
          <a-button type="primary" size="large" @click="handleEditPlan">
            <template #icon><edit-outlined /></template>
            {{ t('travelDetail.plannerHero.editPlan') }}
          </a-button>
          <a-button size="large" @click="handleOptimizePath">
            <template #icon><thunderbolt-outlined /></template>
            {{ t('travelDetail.plannerHero.aiOptimizePath') }}
          </a-button>
          <a-button size="large" @click="handleExportPdf">
            <template #icon><download-outlined /></template>
            {{ t('travelDetail.plannerHero.exportPdf') }}
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import { message } from 'ant-design-vue'
import { 
  BulbOutlined, 
  EditOutlined, 
  ThunderboltOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()
const travelStore = useTravelStore()

interface Props {
  title?: string
  coverImage?: string
  status?: string
  statusLabel?: string
  duration?: number
  participants?: number
  completionPercent?: number
  aiSuggestion?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  coverImage: '',
  status: 'draft',
  statusLabel: '规划中',
  duration: 0,
  participants: 1,
  completionPercent: 0,
  aiSuggestion: ''
})

// 从 AI 生成的行程数据中获取动态内容
const plannerItinerary = computed(() => travelStore.plannerItinerary)

// 动态标题
const dynamicTitle = computed(() => {
  if (plannerItinerary.value?.title) {
    return plannerItinerary.value.title
  }
  return props.title || '智能旅行计划'
})

// 动态封面图片
const defaultCoverImage = computed(() => {
  // 可以根据目的地生成默认封面
  const destination = plannerItinerary.value?.destination || ''
  if (destination) {
    // 这里可以集成图片 API 根据目的地生成封面
    return `https://source.unsplash.com/800x400/?${encodeURIComponent(destination)}`
  }
  return 'https://source.unsplash.com/800x400/?travel'
})

// 动态状态
const dynamicStatus = computed(() => {
  if (plannerItinerary.value) {
    return 'active'
  }
  return props.status || 'draft'
})

// 动态状态标签
const dynamicStatusLabel = computed(() => {
  if (plannerItinerary.value) {
    return 'AI 已生成'
  }
  return props.statusLabel || '规划中'
})

// 动态时长
const dynamicDuration = computed(() => {
  if (plannerItinerary.value?.duration) {
    return plannerItinerary.value.duration
  }
  return props.duration || 0
})

// 动态完成度
const dynamicCompletionPercent = computed(() => {
  if (plannerItinerary.value) {
    return 100 // AI 已生成完整行程
  }
  return props.completionPercent || 0
})

// 动态 AI 建议
const dynamicAiSuggestion = computed(() => {
  if (plannerItinerary.value?.aiInsights?.optimizationSuggestions?.length) {
    return plannerItinerary.value.aiInsights.optimizationSuggestions[0]
  }
  return props.aiSuggestion || ''
})

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    draft: 'default',
    active: 'processing',
    completed: 'success'
  }
  return colors[status] || 'default'
}

// 事件处理
const handleEditPlan = () => {
  message.info('编辑功能开发中...')
}

const handleOptimizePath = async () => {
  if (!plannerItinerary.value) {
    message.warning('请先生成行程')
    return
  }
  
  try {
    message.loading('AI 正在优化路线...', 0)
    await travelStore.optimizePlannerItinerary('route')
    message.destroy()
    message.success('路线已优化')
  } catch (error) {
    message.destroy()
    message.error('优化失败，请重试')
  }
}

const handleExportPdf = () => {
  if (!plannerItinerary.value) {
    message.warning('请先生成行程')
    return
  }
  
  message.info('导出功能开发中...')
}
</script>

<style scoped>
.planner-hero {
  margin-bottom: 2rem;
}

.hero-cover {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 400px;
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-content {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}

.planner-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0;
  color: white;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.meta-separator {
  color: rgba(255, 255, 255, 0.6);
}

.meta-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.progress-section {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 8px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

.ai-suggestion {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: start;
  gap: 0.75rem;
}

.ai-icon {
  font-size: 1.25rem;
  color: #fff566;
}

.ai-content {
  flex: 1;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
}

.ai-content strong {
  color: white;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>

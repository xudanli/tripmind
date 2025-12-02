<template>
  <div v-if="open" class="loading-overlay">
    <div class="loading-card">
      <div class="spinner-container">
        <svg class="spinner" viewBox="0 0 50 50">
          <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
        </svg>
      </div>

      <h2 class="title">{{ t('itineraryGeneration.title') || '正在精心策划您的体验' }}</h2>
      
      <p class="subtitle">{{ currentMessage }}</p>

      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
}>()

const { t } = useI18n()

const progress = ref(0)
const timer = ref<any>(null)

// 模拟的加载文案，根据进度切换
const statusMessages = computed(() => [
  t('itineraryGeneration.status1') || '正在解析您的出行偏好...',
  t('itineraryGeneration.status2') || '正在为您寻找最佳景点...',
  t('itineraryGeneration.status3') || '正在规划每日路线...',
  t('itineraryGeneration.status4') || '正在匹配当地特色美食...',
  t('itineraryGeneration.status5') || '正在生成交通建议...',
  t('itineraryGeneration.status6') || '即将完成...'
])

// 计算当前显示的文案
const currentMessage = computed(() => {
  const index = Math.min(
    Math.floor((progress.value / 100) * statusMessages.value.length), 
    statusMessages.value.length - 1
  )
  return statusMessages.value[index]
})

// 开始模拟进度
const startSimulation = () => {
  progress.value = 0
  clearInterval(timer.value)
  
  timer.value = setInterval(() => {
    // 进度条逻辑：
    // 0-80% 比较快，80-95% 变慢，99% 停住等待接口返回
    if (progress.value < 80) {
      progress.value += Math.random() * 5
    } else if (progress.value < 99) {
      progress.value += 0.5
    } else {
      // 卡在 99% 等待父组件关闭
      progress.value = 99
    }
  }, 200)
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    startSimulation()
  } else {
    // 关闭时瞬间填满进度条，给用户完成的感觉
    progress.value = 100
    setTimeout(() => {
      progress.value = 0
      clearInterval(timer.value)
    }, 300)
  }
})

onUnmounted(() => {
  clearInterval(timer.value)
})
</script>

<style scoped>
/* 全屏遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.8); /* 半透明白色背景 */
  backdrop-filter: blur(5px); /* 毛玻璃效果 */
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

/* 居中卡片 */
.loading-card {
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 400px;
  max-width: 90%;
}

/* Spinner 样式 */
.spinner-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 50px;
  height: 50px;
}

.spinner .path {
  stroke: #1890ff; /* Ant Design 蓝色 */
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

/* 文字样式 */
.title {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 14px;
  color: #86868b;
  margin-bottom: 30px;
  min-height: 20px; /* 防止文字切换时高度跳动 */
}

/* 进度条样式 */
.progress-track {
  width: 100%;
  height: 8px;
  background-color: #f5f5f7;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #1890ff; /* 进度条颜色 */
  border-radius: 4px;
  transition: width 0.2s ease;
}

/* 动画定义 */
@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>


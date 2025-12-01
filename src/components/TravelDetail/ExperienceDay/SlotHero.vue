/**
 * SlotHero - Hero 区域组件
 * 显示活动主图、标题、评分、类型标签
 */

<template>
  <div ref="heroContainer" class="time-slot__hero-banner">
    <!-- 懒加载：只有当元素进入视口时才加载图片 -->
    <template v-if="shouldLoad">
      <!-- 图片（作为背景，填满整个区域） -->
      <a-image
        v-if="cover"
        class="time-slot__hero-image"
        :src="cover"
        :alt="slotTitle"
        :preview="false"
        :img-style="heroImageStyle"
        loading="lazy"
        @click="$emit('preview')"
        @error="$emit('image-error')"
      >
        <template #placeholder>
          <a-skeleton-image :style="heroImageSkeletonStyle" />
        </template>
      </a-image>
      <div v-else-if="loading" class="time-slot__hero-image-loading">
        <a-skeleton-image :style="heroImageSkeletonStyle" />
      </div>
      <div v-else class="time-slot__hero-image-placeholder"></div>
    </template>
    <!-- 未进入视口时显示占位符 -->
    <div v-else class="time-slot__hero-image-placeholder"></div>
    
    <!-- 暗化遮罩 -->
    <div class="time-slot__hero-overlay"></div>
    
    <!-- 图片下方：活动模式 -->
    <div class="time-slot__hero-mode" v-if="hasCategory">
      <span class="time-slot__hero-mode-text">
        {{ categoryText }}
      </span>
    </div>
    
    <!-- 左下角：活动名称 -->
    <div class="time-slot__hero-title-area">
      <h3 class="time-slot__hero-title">
        {{ slotTitle }}
      </h3>
      <div class="time-slot__hero-subtitle" v-if="slotSubtitle">
        {{ slotSubtitle }}
      </div>
    </div>

    <!-- 右上角：评分 -->
    <div class="time-slot__hero-rating" v-if="rating">
      <span class="time-slot__hero-rating-icon">⭐</span>
      <span class="time-slot__hero-rating-value">{{ ratingDisplay }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TimeSlot } from './types'
import { useSlotFormatting } from '@/composables/useSlotFormatting'
import { useLazyLoad } from '@/composables/useLazyLoad'

interface Props {
  slot: TimeSlot
  cover?: string | null
  loading?: boolean
  currency?: any
}

const props = defineProps<Props>()

defineEmits<{
  preview: []
  'image-error': []
  'search-image': [] // 当需要搜索图片时触发
}>()

const { formatCategory } = useSlotFormatting(props.slot, props.currency)

// 懒加载：只有当元素进入视口时才加载
const heroContainer = ref<HTMLElement | null>(null)
const { shouldLoad } = useLazyLoad(heroContainer, {
  rootMargin: '100px', // 提前 100px 开始加载
  threshold: 0.1, // 10% 可见时触发
  once: true, // 只触发一次
})

// 监听 shouldLoad，当元素进入视口且没有 cover 时，触发图片搜索
watch(shouldLoad, (isVisible) => {
  if (isVisible && !props.cover && !props.loading) {
    // 触发图片搜索事件，由父组件处理 API 调用
    // 这样可以避免在子组件中直接调用 API，保持组件职责单一
    // emit('search-image')
  }
}, { immediate: true })

// 计算属性
const slotTitle = computed(() => {
  return props.slot.title || 
         props.slot.details?.name?.chinese || 
         props.slot.activity || 
         ''
})

const slotSubtitle = computed(() => {
  return props.slot.details?.name?.english || null
})

const hasCategory = computed(() => {
  return !!(props.slot.category || props.slot.type)
})

const categoryText = computed(() => {
  return formatCategory(props.slot.category || props.slot.type)
})

const rating = computed(() => {
  const ratingValue = props.slot.details?.rating
  if (typeof ratingValue === 'number') {
    return ratingValue
  }
  if (ratingValue && typeof ratingValue === 'object') {
    return ratingValue.score || ratingValue.value
  }
  return null
})

const ratingDisplay = computed(() => {
  const value = rating.value
  return value ? value.toFixed(1) : ''
})

// 样式
const heroImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  display: 'block',
}

const heroImageSkeletonStyle = {
  width: '100%',
  height: '100%',
}
</script>

<style scoped>
.time-slot__hero-banner {
  position: relative;
  width: 100%;
  height: 260px;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 16px;
}

.time-slot__hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.time-slot__hero-image-loading,
.time-slot__hero-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-slot__hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

.time-slot__hero-mode {
  position: absolute;
  bottom: 60px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
}

.time-slot__hero-title-area {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 80px;
  z-index: 1;
}

.time-slot__hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  line-height: 1.3;
}

.time-slot__hero-subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.time-slot__hero-rating {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.time-slot__hero-rating-icon {
  font-size: 16px;
}

.time-slot__hero-rating-value {
  font-size: 14px;
}
</style>


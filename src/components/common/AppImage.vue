<template>
  <div class="app-image-wrapper" :class="{ 'has-error': hasError, 'is-loading': isLoading }">
    <!-- 图片加载中 -->
    <div v-if="isLoading && !hasError" class="image-loading">
      <a-spin size="small" />
    </div>
    
    <!-- 图片正常显示 -->
    <img
      v-if="src && !hasError && !isLoading"
      :src="src"
      :alt="alt"
      class="app-image"
      loading="lazy"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- 占位符（无图片或加载失败） -->
    <div v-if="hasError || !src" class="image-placeholder">
      <CameraOutlined class="placeholder-icon" />
      <span class="placeholder-text">{{ placeholderText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CameraOutlined } from '@ant-design/icons-vue'

interface Props {
  src?: string | null
  alt?: string
  placeholderText?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  placeholderText: '暂无图片'
})

const isLoading = ref(true)
const hasError = ref(false)

// 监听 src 变化，重置状态
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    isLoading.value = true
    hasError.value = false
  } else {
    isLoading.value = false
    hasError.value = true
  }
}, { immediate: true })

const handleLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const handleError = () => {
  isLoading.value = false
  hasError.value = true
}
</script>

<style scoped>
.app-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
  padding: 20px;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
  color: #999;
}

.app-image-wrapper.has-error {
  background-color: #fafafa;
}

.app-image-wrapper.is-loading {
  background-color: #f0f0f0;
}
</style>


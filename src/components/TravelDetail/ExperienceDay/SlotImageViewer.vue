<template>
  <div class="slot-image-viewer">
    <a-image
      v-if="cover"
      class="slot-image-viewer__image"
      :src="cover"
      :alt="alt"
      :preview="false"
      :style="imageContainerStyle"
      :img-style="imageInnerStyle"
      loading="lazy"
      @click="$emit('preview')"
      @error="handleImageError"
    >
      <template #placeholder>
        <a-skeleton-image :style="imageSkeletonStyle" />
      </template>
    </a-image>
    <div
      v-else-if="loading"
      class="slot-image-viewer__loading"
      :style="imageContainerStyle"
    >
      <a-skeleton-image :style="imageSkeletonStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  cover?: string | null
  alt?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cover: null,
  alt: '',
  loading: false,
})

const emit = defineEmits(['preview', 'image-error'])

const IMAGE_HEIGHT = 260

const imageContainerStyle = {
  height: `${IMAGE_HEIGHT}px`,
  borderRadius: '20px',
  overflow: 'hidden',
}

const imageInnerStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  display: 'block',
  borderRadius: '20px',
}

const imageSkeletonStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '20px',
}

const handleImageError = () => {
  emit('image-error')
}
</script>

<style scoped>
.slot-image-viewer {
  width: 100%;
}

.slot-image-viewer__image {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  background: #f8fafc;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.12);
  cursor: zoom-in;
}

.slot-image-viewer__image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.slot-image-viewer__image:hover :deep(img) {
  transform: scale(1.03);
}

.slot-image-viewer__image :deep(.ant-image-mask) {
  border-radius: 20px;
}

.slot-image-viewer__loading {
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
  cursor: progress;
}

.slot-image-viewer__loading :deep(.ant-skeleton-image) {
  width: 100%;
  height: 100%;
}
</style>


<template>
  <Teleport to="body">
    <transition name="lightbox-fade">
      <div v-if="visible" class="lightbox-backdrop" @click.self="handleClose">
        <div class="lightbox">
      <header class="lightbox__header">
        <a-button
          type="text"
          class="lightbox__icon-btn"
          :title="t('travelDetail.experienceDay.setAsCover')"
          @click.stop="$emit('set-cover')"
        >
          <pushpin-outlined />
        </a-button>
        <span class="lightbox__counter">
          {{ totalCount ? currentIndex + 1 : 0 }} / {{ totalCount }}
        </span>
        <a-button type="text" class="lightbox__icon-btn" @click="handleClose">
          <close-outlined />
        </a-button>
      </header>

      <div class="lightbox__stage">
        <button
          class="lightbox__nav lightbox__nav--prev"
          @click="prevMedia"
          :disabled="totalCount <= 1"
          aria-label="Previous media"
        >
          <left-outlined />
        </button>

        <div
          class="lightbox__image-wrapper"
          :class="{ 'lightbox__image-wrapper--video': isVideo }"
          role="button"
          tabindex="0"
          @click="handleStageClick"
          @keydown.enter.prevent="handleStageKey"
          @keydown.space.prevent="handleStageKey"
        >
          <template v-if="currentMedia">
            <video
              v-if="currentMedia.type === 'video'"
              :poster="currentMedia.poster"
              controls
              playsinline
              preload="metadata"
            >
              <source :src="currentMedia.src" type="video/mp4" />
              {{ t('travelDetail.experienceDay.videoNotSupported') || '当前环境不支持视频播放' }}
            </video>
            <img
              v-else
              :src="currentMedia.src"
              :alt="`Media ${currentIndex + 1}`"
              loading="lazy"
            />
          </template>
          <a-empty v-else description="" />
        </div>

        <button
          class="lightbox__nav lightbox__nav--next"
          @click="nextMedia"
          :disabled="totalCount <= 1"
          aria-label="Next media"
        >
          <right-outlined />
        </button>
      </div>

      <footer class="lightbox__footer">
        <a-button
          type="primary"
          shape="round"
          size="large"
          class="lightbox__set-cover"
          :disabled="isVideo"
          @click="$emit('set-cover')"
        >
          <pushpin-outlined />
          {{ t('travelDetail.experienceDay.setAsCover') }}
        </a-button>
      </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CloseOutlined, LeftOutlined, RightOutlined, PushpinOutlined } from '@ant-design/icons-vue'
import type { PreviewMediaItem } from './useItineraryModals'

interface ImagePreviewModalProps {
  open: boolean
  media: PreviewMediaItem[]
  index: number
}

const props = defineProps<ImagePreviewModalProps>()
const emit = defineEmits(['update:open', 'update:index', 'set-cover'])
const { t } = useI18n()

const visible = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const totalCount = computed(() => props.media.length)
const currentIndex = computed(() => {
  if (!totalCount.value) return 0
  return Math.min(Math.max(props.index, 0), totalCount.value - 1)
})
const currentMedia = computed<PreviewMediaItem | null>(() => {
  if (!totalCount.value) return null
  return props.media[currentIndex.value] ?? null
})
const isVideo = computed(() => currentMedia.value?.type === 'video')

watch(
  () => props.index,
  value => {
    if (!totalCount.value) {
      emit('update:index', 0)
      return
    }
    if (value < 0 || value >= totalCount.value) {
      emit('update:index', 0)
    }
  }
)

watch(
  () => props.media,
  () => {
    if (!totalCount.value) {
      emit('update:index', 0)
    } else if (currentIndex.value >= totalCount.value) {
      emit('update:index', totalCount.value - 1)
    }
  },
  { deep: true }
)

const prevMedia = () => {
  if (totalCount.value <= 1) return
  const next = currentIndex.value === 0 ? totalCount.value - 1 : currentIndex.value - 1
  emit('update:index', next)
}

const nextMedia = () => {
  if (totalCount.value <= 1) return
  const next = currentIndex.value === totalCount.value - 1 ? 0 : currentIndex.value + 1
  emit('update:index', next)
}

const handleStageClick = () => {
  if (isVideo.value) return
  nextMedia()
}

const handleStageKey = () => {
  if (isVideo.value) return
  nextMedia()
}

const handleClose = () => {
  emit('update:open', false)
}
</script>

<style scoped>
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.2s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
}

.lightbox {
  width: 100%;
  min-height: 100vh;
  padding: 40px 64px 48px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 32px;
  box-sizing: border-box;
}

.lightbox__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  color: #0f172a;
}

.lightbox__icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.lightbox__counter {
  font-weight: 600;
  letter-spacing: 0.08em;
}

.lightbox__stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.lightbox__image-wrapper {
  width: min(72vw, 1160px);
  height: min(620px, 70vh);
  border-radius: 32px;
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
  cursor: pointer;
}

.lightbox__image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lightbox__image-wrapper video {
  width: 100%;
  height: 100%;
  background: #000;
  object-fit: contain;
}

.lightbox__image-wrapper--video {
  cursor: default;
}

.lightbox__nav {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: rgba(15, 23, 42, 0.1);
  color: #0f172a;
  font-size: 22px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, color 0.2s ease;
}

.lightbox__nav:hover {
  background: rgba(37, 99, 235, 0.9);
  color: #ffffff;
}

.lightbox__nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.lightbox__footer {
  display: flex;
  justify-content: center;
}

.lightbox__set-cover {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.lightbox__set-cover[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .lightbox {
    padding: 24px;
    gap: 24px;
  }

  .lightbox__image-wrapper {
    width: 90vw;
    height: min(640px, 60vh);
    border-radius: 22px;
  }

  .lightbox__nav {
    width: 52px;
    height: 52px;
  }
}
</style>

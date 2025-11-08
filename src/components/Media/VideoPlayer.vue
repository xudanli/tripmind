<template>
  <div class="video-player">
    <div
      class="video-wrapper"
      :class="{ clickable: !controls }"
      :style="wrapperStyle"
      @click="controls ? undefined : openModal()"
    >
      <video
        ref="videoRef"
        class="video-element"
        :poster="poster"
        :muted="muted"
        :controls="controls"
        playsinline
        preload="metadata"
      >
        <source :src="source" type="video/mp4" />
      </video>
      <a-button
        v-if="showPlayOverlay"
        class="play-overlay"
        type="primary"
        shape="circle"
        size="large"
        @click="openModal"
      >
        ▶
      </a-button>
    </div>
    <a-modal
      v-model:open="modalVisible"
      :title="title || '活动视频预览'"
      width="70%"
      centered
      destroy-on-close
      @after-open="handleModalOpen"
      @after-close="handleModalClose"
    >
      <div class="modal-video-wrapper">
        <video
          ref="modalVideoRef"
          class="modal-video"
          controls
          playsinline
          :muted="false"
          :poster="poster"
        >
          <source :src="source" type="video/mp4" />
        </video>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

interface Props {
  source: string
  poster?: string
  muted?: boolean
  controls?: boolean
  autoPlayOnVisible?: boolean
  aspectRatio?: number
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  poster: '',
  muted: true,
  controls: true,
  autoPlayOnVisible: true,
  aspectRatio: 16 / 9,
  title: ''
})

const videoRef = ref<HTMLVideoElement | null>(null)
const modalVideoRef = ref<HTMLVideoElement | null>(null)
const modalVisible = ref(false)
let observer: IntersectionObserver | null = null

const showPlayOverlay = computed(() => !props.controls)

const wrapperStyle = computed(() => ({
  paddingBottom: `${100 / props.aspectRatio}%`
}))

const canAutoPlay = () => props.autoPlayOnVisible && props.muted

function setupObserver() {
  if (!canAutoPlay() || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = videoRef.value
        if (!video) return
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      })
    },
    { threshold: 0.6 }
  )
  if (videoRef.value) {
    observer.observe(videoRef.value)
  }
}

function cleanupObserver() {
  if (observer && videoRef.value) {
    observer.unobserve(videoRef.value)
  }
  observer = null
}

const openModal = () => {
  modalVisible.value = true
}

const handleModalOpen = () => {
  const video = modalVideoRef.value
  if (video) {
    video.currentTime = 0
    video.play().catch(() => {})
  }
}

const handleModalClose = () => {
  const video = modalVideoRef.value
  if (video) {
    video.pause()
  }
}

onMounted(() => {
  setupObserver()
})

onBeforeUnmount(() => {
  cleanupObserver()
})

watch(
  () => props.source,
  () => {
    cleanupObserver()
    setupObserver()
  }
)
</script>

<style scoped>
.video-player {
  width: 100%;
  position: relative;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #000;
}

.video-wrapper.clickable {
  cursor: pointer;
}

.video-element {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.modal-video-wrapper {
  width: 100%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.modal-video {
  width: 100%;
  height: auto;
  display: block;
  background: #000;
}
</style>


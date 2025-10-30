<template>
  <div class="hero-section seeker-hero">
    <div class="hero-cover">
      <img :src="coverImage" :alt="title" />
      <div class="hero-content">
        <!-- 氛围与情绪 -->
        <div class="seeker-info">
          <div class="info-section">
            <h1 class="hero-title">{{ title }}</h1>
            <div class="mood-tags">
              <a-tag color="pink">放松</a-tag>
              <a-tag color="purple">治愈</a-tag>
              <a-tag color="cyan">慢节奏</a-tag>
            </div>
          </div>

          <!-- AI陪伴消息 -->
          <div class="ai-companion">
            <heart-outlined class="ai-icon" />
            <div class="ai-content">
              <p>"{{ t('travelDetail.seekerHero.aiMessage') }}"</p>
            </div>
          </div>

          <!-- 心情记录入口 -->
          <div class="mood-tracker" v-if="showMoodTracker">
            <span class="tracker-label">{{ t('travelDetail.seekerHero.currentMood') }}</span>
            <a-space>
              <a-button type="link" size="small">😌 {{ t('travelDetail.seekerHero.moods.relaxed') }}</a-button>
              <a-button type="link" size="small">🥰 {{ t('travelDetail.seekerHero.moods.happy') }}</a-button>
              <a-button type="link" size="small">😊 {{ t('travelDetail.seekerHero.moods.calm') }}</a-button>
            </a-space>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="hero-actions">
          <a-button type="primary" size="large" class="gentle-button">
            <template #icon><edit-outlined /></template>
            {{ t('travelDetail.seekerHero.recordMood') }}
          </a-button>
          <a-button size="large" class="gentle-button">
            <template #icon><pause-outlined /></template>
            {{ t('travelDetail.seekerHero.pausePlan') }}
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { 
  HeartOutlined, 
  EditOutlined,
  PauseOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()

interface Props {
  title: string
  coverImage: string
  showMoodTracker?: boolean
}

withDefaults(defineProps<Props>(), {
  showMoodTracker: true
})
</script>

<style scoped>
.seeker-hero {
  margin-bottom: 2rem;
}

.hero-cover {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  height: 450px;
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(2px);
}

.hero-content {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.85), rgba(245, 87, 108, 0.85));
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  backdrop-filter: blur(10px);
}

.seeker-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 300;
  margin: 0;
  color: white;
  letter-spacing: 1px;
}

.mood-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ai-companion {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(15px);
  padding: 1.5rem;
  border-radius: 16px;
  display: flex;
  align-items: start;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.ai-icon {
  font-size: 1.5rem;
  color: #ff69b4;
  margin-top: 0.25rem;
}

.ai-content {
  flex: 1;
  color: rgba(255, 255, 255, 0.98);
  font-size: 1.1rem;
  line-height: 1.8;
  font-style: italic;
}

.mood-tracker {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tracker-label {
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  font-weight: 500;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

.gentle-button {
  border-radius: 25px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9) !important;
  border: none !important;
  font-weight: 500;
}

.gentle-button:hover {
  background: rgba(255, 255, 255, 1) !important;
  transform: translateY(-2px);
  transition: all 0.3s ease;
}
</style>

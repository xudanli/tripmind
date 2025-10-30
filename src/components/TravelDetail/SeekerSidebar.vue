<template>
  <a-space direction="vertical" size="large" style="width: 100%">
    <!-- AI陪伴对话 -->
    <a-card :title="t('travelDetail.seekerSidebar.aiCompanion')" class="sidebar-card seeker-card" :bordered="false">
      <div class="ai-chat">
        <div class="ai-message">
          <heart-outlined class="ai-icon" />
          <p>"今天阳光很柔，我帮你留出一个下午的空白，好吗？"</p>
        </div>
        <a-input 
          :placeholder="t('travelDetail.seekerSidebar.chatPlaceholder')"
          v-model:value="chatInput"
          @pressEnter="sendMessage"
          size="large"
          class="chat-input"
        />
      </div>
    </a-card>

    <!-- 心情曲线 -->
    <a-card :title="t('travelDetail.seekerSidebar.moodRecord')" class="sidebar-card seeker-card" :bordered="false">
      <div class="mood-chart">
        <div class="mood-points">
          <div v-for="point in moodPoints" :key="point.day" class="mood-point">
            <div class="point-value" :style="{ height: point.value + '%' }"></div>
            <span class="point-day">{{ point.day }}</span>
          </div>
        </div>
        <div class="mood-legend">
          <span>{{ t('travelDetail.seekerSidebar.moodChart.relaxed') }}</span>
          <span>{{ t('travelDetail.seekerSidebar.moodChart.happy') }}</span>
          <span>{{ t('travelDetail.seekerSidebar.moodChart.calm') }}</span>
        </div>
      </div>
    </a-card>

    <!-- 推荐放松 -->
    <a-card :title="t('travelDetail.seekerSidebar.recommendations')" class="sidebar-card seeker-card" :bordered="false">
      <div class="recommendations">
        <a-card size="small" class="recommendation-item">
          <div class="rec-content">
            <span class="rec-emoji">🌊</span>
            <div class="rec-info">
              <div class="rec-title">海边漫步</div>
              <div class="rec-desc">慢走30分钟，放松心情</div>
            </div>
          </div>
        </a-card>
        <a-card size="small" class="recommendation-item">
          <div class="rec-content">
            <span class="rec-emoji">☕</span>
            <div class="rec-info">
              <div class="rec-title">咖啡休息</div>
              <div class="rec-desc">品尝当地特色咖啡</div>
            </div>
          </div>
        </a-card>
      </div>
    </a-card>
  </a-space>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  HeartOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()

const chatInput = ref('')

const sendMessage = () => {
  console.log('发送消息:', chatInput.value)
  chatInput.value = ''
}

const moodPoints = ref([
  { day: 'Day 1', value: 60 },
  { day: 'Day 2', value: 80 },
  { day: 'Day 3', value: 75 },
  { day: 'Today', value: 85 }
])
</script>

<style scoped>
.seeker-card {
  background: linear-gradient(135deg, rgba(255, 240, 245, 0.3), rgba(255, 228, 225, 0.3));
  border: 1px solid rgba(255, 182, 193, 0.3);
}

.ai-chat {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ai-message {
  background: rgba(255, 182, 193, 0.1);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: start;
  gap: 0.75rem;
}

.ai-icon {
  color: #ff69b4;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.ai-message p {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-style: italic;
}

.chat-input {
  border-radius: 20px;
}

.mood-chart {
  padding: 1rem 0;
}

.mood-points {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 100px;
  margin-bottom: 1rem;
}

.mood-point {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.point-value {
  width: 30px;
  background: linear-gradient(to top, #ff69b4, #ffb6c1);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.point-day {
  font-size: 0.75rem;
  color: #999;
}

.mood-legend {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recommendation-item {
  background: rgba(255, 240, 245, 0.5);
  border: 1px solid rgba(255, 182, 193, 0.3);
  border-radius: 8px;
}

.rec-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rec-emoji {
  font-size: 1.5rem;
}

.rec-info {
  flex: 1;
}

.rec-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.rec-desc {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}
</style>

<template>
  <div class="seeker-mood-notes">
    <a-timeline>
      <a-timeline-item v-for="(day, index) in moodDays" :key="day.date" color="pink">
        <template #dot>
          <heart-outlined :style="{ fontSize: '16px', color: '#ff69b4' }" />
        </template>
        <div class="mood-card">
          <div class="mood-header">
            <div class="mood-info">
              <h3 class="mood-title">{{ day.period }}</h3>
              <span class="mood-date">{{ day.date }}</span>
            </div>
            <a-tag :color="day.moodColor">{{ day.mood }}</a-tag>
          </div>
          
          <!-- 描述 -->
          <p class="mood-description" v-if="day.description">
            {{ day.description }}
          </p>
          
          <!-- 感受标签 -->
          <div class="feeling-tags" v-if="day.feelings && day.feelings.length">
            <a-tag 
              v-for="feeling in day.feelings" 
              :key="feeling"
              color="pink"
              class="feeling-tag"
            >
              {{ feeling }}
            </a-tag>
          </div>
        </div>
      </a-timeline-item>
    </a-timeline>
    
    <a-button type="dashed" block style="margin-top: 1rem" size="large" class="gentle-button">
      <template #icon>
        <plus-outlined />
      </template>
      {{ t('travelDetail.seekerMoodNotes.recordMood') }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { 
  HeartOutlined,
  PlusOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()

interface MoodDay {
  date: string
  period: string
  mood: string
  moodColor: string
  description?: string
  feelings?: string[]
}

interface Props {
  moodDays?: MoodDay[]
}

const props = withDefaults(defineProps<Props>(), {
  moodDays: () => [
    {
      date: 'Day 1 - Morning',
      period: '上午',
      mood: '放松',
      moodColor: 'pink',
      description: '阳光洒在海面上，第一次感受到这里的宁静。',
      feelings: ['平静', '放松', '好奇']
    },
    {
      date: 'Day 1 - Afternoon',
      period: '下午',
      mood: '开心',
      moodColor: 'orange',
      description: '和当地人聊天，发现了很多有趣的故事。',
      feelings: ['愉悦', '感动']
    },
    {
      date: 'Day 2 - Morning',
      period: '上午',
      mood: '平静',
      moodColor: 'cyan',
      description: '慢慢地走过小巷，不急着去哪里。',
      feelings: ['安然', '惬意']
    }
  ]
})
</script>

<style scoped>
.seeker-mood-notes {
  padding: 0.5rem 0;
}

.mood-card {
  background: linear-gradient(135deg, rgba(255, 240, 245, 0.6), rgba(255, 228, 225, 0.6));
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(255, 182, 193, 0.3);
}

.mood-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.mood-info {
  flex: 1;
}

.mood-title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  color: #666;
}

.mood-date {
  color: #999;
  font-size: 0.85rem;
}

.mood-description {
  color: #595959;
  font-size: 0.9rem;
  margin: 0.5rem 0 0.75rem 0;
  line-height: 1.6;
  font-style: italic;
}

.feeling-tags {
  margin-top: 0.5rem;
}

.feeling-tag {
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: 12px;
}

.gentle-button {
  border-radius: 20px;
  border-color: #ff69b4;
  color: #ff69b4;
  background: rgba(255, 105, 180, 0.05);
}

.gentle-button:hover {
  border-color: #ff1493;
  color: #ff1493;
  background: rgba(255, 105, 180, 0.1);
  transform: translateY(-1px);
  transition: all 0.3s ease;
}
</style>

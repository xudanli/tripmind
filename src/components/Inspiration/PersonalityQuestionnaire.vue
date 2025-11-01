<template>
  <div class="personality-questionnaire">
    <div class="questionnaire-header">
      <h2>人格识别问卷</h2>
      <p>帮助我们了解你的旅行心理需求</p>
    </div>
    
    <a-form :model="formData" layout="vertical" class="questionnaire-form">
      <!-- M 动机 -->
      <div class="variable-section">
        <h3 class="variable-title">
          <span class="variable-label">M</span>
          <span class="variable-name">动机 (Motivation)</span>
        </h3>
        
        <a-form-item label="Q1: 这次旅行最主要的原因是？" required>
          <a-radio-group v-model:value="formData.motivation">
            <a-radio value="逃离">① 逃离</a-radio>
            <a-radio value="探索">② 探索</a-radio>
            <a-radio value="救赎">③ 救赎</a-radio>
            <a-radio value="重逢">④ 重逢</a-radio>
            <a-radio value="重启">⑤ 重启</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="Q2: 你希望旅程结束后得到什么？" required>
          <a-radio-group v-model:value="formData.motivation_detail">
            <a-radio value="平静">① 平静</a-radio>
            <a-radio value="灵感">② 灵感</a-radio>
            <a-radio value="力量">③ 力量</a-radio>
            <a-radio value="理解">④ 理解</a-radio>
            <a-radio value="勇气">⑤ 勇气</a-radio>
          </a-radio-group>
        </a-form-item>
      </div>
      
      <!-- E 情绪 -->
      <div class="variable-section">
        <h3 class="variable-title">
          <span class="variable-label">E</span>
          <span class="variable-name">情绪 (Emotion)</span>
        </h3>
        
        <a-form-item label="Q3: 你最近最常出现的情绪？" required>
          <a-radio-group v-model:value="formData.dominant_emotion">
            <a-radio value="倦怠">① 倦怠</a-radio>
            <a-radio value="焦虑">② 焦虑</a-radio>
            <a-radio value="兴奋">③ 兴奋</a-radio>
            <a-radio value="孤独">④ 孤独</a-radio>
            <a-radio value="好奇">⑤ 好奇</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="Q4: 你想让旅程带来的主要情绪？" required>
          <a-radio-group v-model:value="formData.desired_emotion">
            <a-radio value="释放">① 释放</a-radio>
            <a-radio value="治愈">② 治愈</a-radio>
            <a-radio value="燃烧">③ 燃烧</a-radio>
            <a-radio value="温柔">④ 温柔</a-radio>
            <a-radio value="惊喜">⑤ 惊喜</a-radio>
          </a-radio-group>
        </a-form-item>
      </div>
      
      <!-- R 节奏 -->
      <div class="variable-section">
        <h3 class="variable-title">
          <span class="variable-label">R</span>
          <span class="variable-name">节奏 (Rhythm)</span>
        </h3>
        
        <a-form-item label="Q5: 你更喜欢哪种旅程节奏？" required>
          <a-radio-group v-model:value="formData.travel_rhythm">
            <a-radio value="快节奏探索">① 快节奏探索</a-radio>
            <a-radio value="中速流动">② 中速流动</a-radio>
            <a-radio value="慢速沉浸">③ 慢速沉浸</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="Q6: 一天理想的活动结构？" required>
          <a-radio-group v-model:value="formData.activity_density">
            <a-radio value="紧凑多样">① 紧凑多样</a-radio>
            <a-radio value="适度安排">② 适度安排</a-radio>
            <a-radio value="留白自由">③ 留白自由</a-radio>
          </a-radio-group>
        </a-form-item>
      </div>
      
      <!-- S 社交 -->
      <div class="variable-section">
        <h3 class="variable-title">
          <span class="variable-label">S</span>
          <span class="variable-name">社交 (Social)</span>
        </h3>
        
        <a-form-item label="Q7: 你希望与谁同行？" required>
          <a-radio-group v-model:value="formData.social_preference">
            <a-radio value="独行">① 独行</a-radio>
            <a-radio value="一两位挚友">② 一两位挚友</a-radio>
            <a-radio value="一小群陌生人">③ 一小群陌生人</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="Q8: 与人互动的重要性？(1-5 分)" required>
          <a-slider
            v-model:value="formData.social_intensity"
            :min="1"
            :max="5"
            :marks="{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }"
          />
        </a-form-item>
      </div>
      
      <!-- N 需求 -->
      <div class="variable-section">
        <h3 class="variable-title">
          <span class="variable-label">N</span>
          <span class="variable-name">需求 (Need)</span>
        </h3>
        
        <a-form-item label="Q9: 你更关注哪一层体验？" required>
          <a-radio-group v-model:value="formData.cognitive_need">
            <a-radio value="感官">① 感官</a-radio>
            <a-radio value="意义">② 意义</a-radio>
            <a-radio value="行动">③ 行动</a-radio>
            <a-radio value="转化">④ 转化</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="Q10: 对旅程后的延续期待？" required>
          <a-radio-group v-model:value="formData.post_journey_goal">
            <a-radio value="短暂回忆">① 短暂回忆</a-radio>
            <a-radio value="长期影响">② 长期影响</a-radio>
            <a-radio value="生活改变">③ 生活改变</a-radio>
          </a-radio-group>
        </a-form-item>
      </div>
      
      <a-form-item class="submit-section">
        <a-button
          type="primary"
          size="large"
          @click="handleSubmit"
          :disabled="!isFormValid"
          block
        >
          生成心理旅程
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { defineEmits } from 'vue'

export interface PersonalityProfile {
  motivation: string
  motivation_detail: string
  dominant_emotion: string
  desired_emotion: string
  travel_rhythm: string
  activity_density: string
  social_preference: string
  social_intensity: number
  cognitive_need: string
  post_journey_goal: string
}

const formData = ref<PersonalityProfile>({
  motivation: '',
  motivation_detail: '',
  dominant_emotion: '',
  desired_emotion: '',
  travel_rhythm: '',
  activity_density: '',
  social_preference: '',
  social_intensity: 3,
  cognitive_need: '',
  post_journey_goal: ''
})

const emit = defineEmits<{
  submit: [profile: PersonalityProfile]
}>()

const isFormValid = computed(() => {
  return formData.value.motivation !== '' &&
         formData.value.motivation_detail !== '' &&
         formData.value.dominant_emotion !== '' &&
         formData.value.desired_emotion !== '' &&
         formData.value.travel_rhythm !== '' &&
         formData.value.activity_density !== '' &&
         formData.value.social_preference !== '' &&
         formData.value.cognitive_need !== '' &&
         formData.value.post_journey_goal !== ''
})

const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit', { ...formData.value })
  }
}
</script>

<style scoped>
.personality-questionnaire {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  border-radius: 1rem;
}

.questionnaire-header {
  text-align: center;
  margin-bottom: 2rem;
}

.questionnaire-header h2 {
  font-size: 2rem;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.questionnaire-header p {
  color: #666;
  font-size: 1rem;
}

.variable-section {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border-left: 4px solid #4CAF50;
}

.variable-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: #1a1a1a;
}

.variable-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #4CAF50;
  color: #fff;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1rem;
}

.variable-name {
  font-weight: 600;
}

.submit-section {
  margin-top: 2rem;
}

:deep(.ant-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

:deep(.ant-radio-wrapper) {
  font-size: 1rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

:deep(.ant-radio-wrapper:hover) {
  background: rgba(76, 175, 80, 0.1);
}
</style>


<template>
  <div class="personality-questionnaire">
    <div class="questionnaire-header">
      <h2>人格识别问卷</h2>
      <p>帮助我们了解你的旅行心理需求</p>
    </div>
    
    <!-- 问卷内容 -->
    <a-form :model="formData" layout="vertical" class="questionnaire-form">
      <a-card class="step-card">
        <!-- M 动机 -->
        <div v-show="currentStep === 0" class="step-content">
          <div class="variable-section">
            <h3 class="variable-title">动机 (Motivation)</h3>
            
            <a-form-item label="Q1: 这次旅行最主要的原因是？" required>
              <a-radio-group v-model:value="formData.motivation">
                <a-radio value="逃离">逃离</a-radio>
                <a-radio value="探索">探索</a-radio>
                <a-radio value="救赎">救赎</a-radio>
                <a-radio value="重逢">重逢</a-radio>
                <a-radio value="重启">重启</a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item label="Q2: 你希望旅程结束后得到什么？" required>
              <a-radio-group v-model:value="formData.motivation_detail">
                <a-radio value="平静">平静</a-radio>
                <a-radio value="灵感">灵感</a-radio>
                <a-radio value="力量">力量</a-radio>
                <a-radio value="理解">理解</a-radio>
                <a-radio value="勇气">勇气</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>
        
        <!-- E 情绪 -->
        <div v-show="currentStep === 1" class="step-content">
          <div class="variable-section">
            <h3 class="variable-title">情绪 (Emotion)</h3>
            
            <a-form-item label="Q3: 你最近最常出现的情绪？" required>
              <a-radio-group v-model:value="formData.dominant_emotion">
                <a-radio value="倦怠">倦怠</a-radio>
                <a-radio value="焦虑">焦虑</a-radio>
                <a-radio value="兴奋">兴奋</a-radio>
                <a-radio value="孤独">孤独</a-radio>
                <a-radio value="好奇">好奇</a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item label="Q4: 你想让旅程带来的主要情绪？" required>
              <a-radio-group v-model:value="formData.desired_emotion">
                <a-radio value="释放">释放</a-radio>
                <a-radio value="治愈">治愈</a-radio>
                <a-radio value="燃烧">燃烧</a-radio>
                <a-radio value="温柔">温柔</a-radio>
                <a-radio value="惊喜">惊喜</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>
        
        <!-- R 节奏 -->
        <div v-show="currentStep === 2" class="step-content">
          <div class="variable-section">
            <h3 class="variable-title">节奏 (Rhythm)</h3>
            
            <a-form-item label="Q5: 你更喜欢哪种旅程节奏？" required>
              <a-radio-group v-model:value="formData.travel_rhythm">
                <a-radio value="快节奏探索">快节奏探索</a-radio>
                <a-radio value="中速流动">中速流动</a-radio>
                <a-radio value="慢速沉浸">慢速沉浸</a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item label="Q6: 一天理想的活动结构？" required>
              <a-radio-group v-model:value="formData.activity_density">
                <a-radio value="紧凑多样">紧凑多样</a-radio>
                <a-radio value="适度安排">适度安排</a-radio>
                <a-radio value="留白自由">留白自由</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>
        
        <!-- S 社交 -->
        <div v-show="currentStep === 3" class="step-content">
          <div class="variable-section">
            <h3 class="variable-title">社交 (Social)</h3>
            
            <a-form-item label="Q7: 你希望与谁同行？" required>
              <a-radio-group v-model:value="formData.social_preference">
                <a-radio value="独行">独行</a-radio>
                <a-radio value="一两位挚友">一两位挚友</a-radio>
                <a-radio value="一小群陌生人">一小群陌生人</a-radio>
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
        </div>
        
        <!-- N 需求 -->
        <div v-show="currentStep === 4" class="step-content">
          <div class="variable-section">
            <h3 class="variable-title">需求 (Need)</h3>
            
            <a-form-item label="Q9: 你更关注哪一层体验？" required>
              <a-radio-group v-model:value="formData.cognitive_need">
                <a-radio value="感官">感官</a-radio>
                <a-radio value="意义">意义</a-radio>
                <a-radio value="行动">行动</a-radio>
                <a-radio value="转化">转化</a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item label="Q10: 对旅程后的延续期待？" required>
              <a-radio-group v-model:value="formData.post_journey_goal">
                <a-radio value="短暂回忆">短暂回忆</a-radio>
                <a-radio value="长期影响">长期影响</a-radio>
                <a-radio value="生活改变">生活改变</a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item label="Q11: 你对美食体验的偏好？" required>
              <a-radio-group v-model:value="formData.food_preference">
                <a-radio value="深度美食探索">深度美食探索</a-radio>
                <a-radio value="当地特色体验">当地特色体验</a-radio>
                <a-radio value="偶尔尝试">偶尔尝试</a-radio>
                <a-radio value="简单便捷">简单便捷</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="step-actions">
          <a-button 
            v-if="currentStep > 0"
            size="large"
            @click="goPrev"
          >
            上一步
          </a-button>
          <a-button
            v-if="currentStep < steps.length - 1"
            type="primary"
            size="large"
            @click="goNext"
            :disabled="!isCurrentStepValid"
          >
            下一步
          </a-button>
          <a-button
            v-if="currentStep === steps.length - 1"
            type="primary"
            size="large"
            @click="handleSubmit"
            :disabled="!isFormValid"
          >
            生成推荐目的地
          </a-button>
        </div>
      </a-card>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { defineEmits } from 'vue'
import { message } from 'ant-design-vue'

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
  food_preference: string
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
  post_journey_goal: '',
  food_preference: ''
})

const currentStep = ref(0)

const steps = [
  { title: '动机', icon: '🎯', key: 'motivation' },
  { title: '情绪', icon: '💭', key: 'emotion' },
  { title: '节奏', icon: '⏱️', key: 'rhythm' },
  { title: '社交', icon: '👥', key: 'social' },
  { title: '需求', icon: '✨', key: 'need' }
]

const emit = defineEmits<{
  submit: [profile: PersonalityProfile]
}>()

// 检查当前步骤是否有效
const isCurrentStepValid = computed(() => {
  switch (currentStep.value) {
    case 0: // M 动机
      return formData.value.motivation !== '' && formData.value.motivation_detail !== ''
    case 1: // E 情绪
      return formData.value.dominant_emotion !== '' && formData.value.desired_emotion !== ''
    case 2: // R 节奏
      return formData.value.travel_rhythm !== '' && formData.value.activity_density !== ''
    case 3: // S 社交
      return formData.value.social_preference !== '' && formData.value.social_intensity > 0
    case 4: // N 需求
      return formData.value.cognitive_need !== '' && formData.value.post_journey_goal !== '' && formData.value.food_preference !== ''
    default:
      return false
  }
})

// 检查整个表单是否有效
const isFormValid = computed(() => {
  return formData.value.motivation !== '' &&
         formData.value.motivation_detail !== '' &&
         formData.value.dominant_emotion !== '' &&
         formData.value.desired_emotion !== '' &&
         formData.value.travel_rhythm !== '' &&
         formData.value.activity_density !== '' &&
         formData.value.social_preference !== '' &&
         formData.value.cognitive_need !== '' &&
         formData.value.post_journey_goal !== '' &&
         formData.value.food_preference !== ''
})

const goNext = () => {
  if (isCurrentStepValid.value) {
    if (currentStep.value < steps.length - 1) {
      currentStep.value++
    }
  } else {
    message.warning('请完成当前步骤的所有问题')
  }
}

const goPrev = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit', { ...formData.value })
  } else {
    message.error('请完成所有问题')
  }
}
</script>

<style scoped>
.personality-questionnaire {
  max-width: 900px;
  margin: 0 auto;
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

.questionnaire-form {
  margin-top: 2rem;
}

.step-card {
  min-height: 400px;
}

.step-content {
  min-height: 300px;
  padding: 1rem 0;
}

.variable-section {
  padding: 1.5rem;
}

.variable-title {
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: #1a1a1a;
  font-weight: 600;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e8e8e8;
}

:deep(.ant-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

:deep(.ant-slider) {
  margin: 1rem 0;
}

:deep(.ant-card-body) {
  padding: 2rem;
}
</style>

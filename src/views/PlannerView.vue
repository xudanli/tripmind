<template>
  <div class="container">
    <!-- 头部导航 -->
    <div class="header">
      <a-button 
        @click="router.back()"
        class="back-button"
      >
        <template #icon>
          <arrow-left-outlined />
        </template>
        {{ t('common.back') }}
      </a-button>
      <div class="header-title">
        <rocket-outlined class="header-icon" />
        <h2 class="title">{{ t('planner.title') }}</h2>
      </div>
    </div>

    <!-- 进度条区域 -->
    <div class="progress-section">
      <a-progress 
        :percent="(currentStep / (steps.length - 1)) * 100" 
        :show-info="false"
        stroke-color="#667eea"
      />
      <div class="step-indicators">
        <div 
          v-for="(step, index) in steps" 
          :key="index" 
          :class="['step-indicator', { active: index <= currentStep }]"
        >
          <div class="step-icon">{{ step.icon }}</div>
          <span class="step-text">{{ step.title }}</span>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- AI 演示组件 -->
      <PlannerDemo v-if="currentStep === 0" />
      
      <a-card class="form-card" v-else>
        <div class="step-content">
          <!-- 目的地选择 -->
          <div v-if="currentStep === 0">
            <h3>{{ t('planner.step1.title') }}</h3>
            <p>{{ t('planner.step1.description') }}</p>
            <a-form-item
              :rules="[{ required: true, message: t('planner.step1.rules') }]"
            >
              <a-input
                :value="formData.destination"
                @update:value="(value) => travelStore.setPlannerData({ destination: value })"
                size="large"
                :placeholder="t('planner.step1.placeholder')"
              >
                <template #prefix>
                  <environment-outlined />
                </template>
              </a-input>
            </a-form-item>
          </div>

          <!-- 时间选择 -->
          <div v-if="currentStep === 1">
            <h3>{{ t('planner.step2.title') }}</h3>
            <p>{{ t('planner.step2.description') }}</p>
            <a-form-item
              :rules="[{ required: true, message: t('planner.step2.selectPlaceholder') }]"
            >
              <a-select 
                :value="formData.duration"
                @update:value="(value) => travelStore.setPlannerData({ duration: value })"
                size="large" 
                :placeholder="t('planner.step2.selectPlaceholder')"
              >
                <a-select-option 
                  v-for="days in durationOptions" 
                  :key="days" 
                  :value="days"
                >
                  {{ days }} {{ t('planner.days') }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <!-- 预算选择 -->
          <div v-if="currentStep === 2">
            <h3>{{ t('planner.step4.title') }}</h3>
            <p>{{ t('planner.step4.description') }}</p>
            <a-form-item
              :rules="[{ required: true, message: t('planner.step4.rules') }]"
            >
              <a-select 
                :value="formData.budget"
                @update:value="(value) => travelStore.setPlannerData({ budget: value })"
                size="large" 
                :placeholder="t('planner.step4.placeholder')"
              >
                <a-select-option 
                  v-for="option in budgetOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  <div>
                    <div>{{ option.label }}</div>
                    <span class="text-secondary" style="font-size: 12px">
                      {{ option.description }}
                    </span>
                  </div>
                </a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <!-- 偏好选择 -->
          <div v-if="currentStep === 3">
            <h3>{{ t('planner.step5.title') }}</h3>
            <p>{{ t('planner.step5.description') }}</p>
            <a-form-item
              :rules="[{ required: true, message: '请至少选择一项偏好' }]"
            >
              <a-select
                :value="formData.preferences"
                @update:value="(value) => travelStore.setPlannerData({ preferences: value })"
                mode="multiple"
                size="large"
                :placeholder="t('planner.step5.placeholder')"
                style="width: 100%"
              >
                <a-select-option 
                  v-for="option in preferenceOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  <a-space>
                    <span>{{ option.icon }}</span>
                    <span>{{ option.label }}</span>
                  </a-space>
                </a-select-option>
              </a-select>
            </a-form-item>
            
            <a-divider />
            
            <h4>{{ t('planner.step6.title') }}</h4>
            <a-form-item
              :rules="[{ required: true, message: t('planner.step6.rules') }]"
            >
              <a-select 
                :value="formData.travelStyle"
                @update:value="(value) => travelStore.setPlannerData({ travelStyle: value })"
                size="large" 
                :placeholder="t('planner.step6.placeholder')"
              >
                <a-select-option 
                  v-for="option in travelStyleOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  <div>
                    <div>{{ option.label }}</div>
                    <span class="text-secondary" style="font-size: 12px">
                      {{ option.description }}
                    </span>
                  </div>
                </a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <!-- 完成页面 -->
          <div v-if="currentStep === 4">
            <h3>{{ t('planner.completeTitle') }}</h3>
            
            <!-- 错误提示 -->
            <a-alert
              v-if="error"
              :message="error"
              type="error"
              show-icon
              closable
              @close="travelStore.setError(null)"
              style="margin-bottom: 1rem"
            />
            
            <!-- 加载状态 -->
            <a-alert
              v-else-if="loading"
              message="AI 正在为你生成专属行程"
              description="基于你的需求，我们的 AI 旅行策划师正在为你制定详细的行程安排..."
              type="info"
              show-icon
              style="margin-bottom: 1rem"
            />
            
            <!-- 完成状态 -->
            <a-alert
              v-else
              :message="t('planner.ready')"
              :description="t('planner.readyDescription')"
              type="success"
              show-icon
              style="margin-bottom: 2rem"
            />
            
            <a-card class="summary-card">
              <h4>{{ t('planner.summaryTitle') }}</h4>
              <a-space direction="vertical" style="width: 100%">
                <div><strong>目的地：</strong> {{ formData.destination || '待选择' }}</div>
                <div><strong>时长：</strong> {{ formData.duration || 0 }} 天</div>
                <div><strong>预算：</strong> {{ getBudgetLabel(formData.budget) || '待选择' }}</div>
                <div><strong>偏好：</strong> 
                  <a-tag 
                    v-for="pref in formData.preferences" 
                    :key="pref" 
                    color="blue"
                  >
                    {{ getPreferenceIcon(pref) }} {{ getPreferenceLabel(pref) }}
                  </a-tag>
                  <span v-if="!formData.preferences.length" class="text-muted">待选择</span>
                </div>
                <div><strong>节奏：</strong> {{ getTravelStyleLabel(formData.travelStyle) || '待选择' }}</div>
              </a-space>
            </a-card>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <a-button v-if="currentStep > 0" size="large" @click="handlePrev">
            {{ t('common.prev') }}
          </a-button>
          <a-button 
            v-if="currentStep < steps.length - 1"
            type="primary" 
            size="large" 
            @click="handleNext"
            class="next-button"
            :disabled="!canProceed"
          >
            {{ t('common.next') }}
          </a-button>
          <a-button 
            v-else
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleSubmit"
            class="submit-button"
          >
            {{ loading ? t('common.loading') : t('planner.submit') }}
          </a-button>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'

const { t } = useI18n()
import PlannerDemo from '@/components/TravelDetail/PlannerDemo.vue'
import { 
  ArrowLeftOutlined, 
  RocketOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  HeartOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

const currentStep = ref(0)
const formData = computed(() => travelStore.plannerData)
const loading = computed(() => travelStore.loading)
const error = computed(() => travelStore.error)

const steps = computed(() => [
  { title: t('planner.step1.label'), icon: '✈️' },
  { title: t('planner.step2.label'), icon: '📅' },
  { title: t('planner.step3.label'), icon: '👥' },
  { title: t('planner.step4.label'), icon: '💰' },
  { title: t('common.confirm'), icon: '🎉' }
])

// 动态选项 - 从 AI 生成或配置中获取
const durationOptions = computed(() => {
  // 可以根据目的地和预算动态调整天数选项
  const baseOptions = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30]
  return baseOptions
})

const budgetOptions = computed(() => {
  // 根据目的地动态调整预算选项
  const destination = formData.value.destination
  if (destination) {
    // 可以根据目的地消费水平调整预算范围
    return [
      { value: 'economy', label: t('planner.budgetRanges.economy'), description: t('planner.budgetRanges.economyDesc') },
      { value: 'comfort', label: t('planner.budgetRanges.comfort'), description: t('planner.budgetRanges.comfortDesc') },
      { value: 'luxury', label: t('planner.budgetRanges.luxury'), description: t('planner.budgetRanges.luxuryDesc') }
    ]
  }
  return []
})

const preferenceOptions = computed(() => {
  // 根据目的地特色动态调整偏好选项
  const destination = formData.value.destination
  const baseOptions = [
    { value: 'culture', label: t('planner.preferences.culture'), icon: '🏛️' },
    { value: 'food', label: t('planner.preferences.food'), icon: '🍜' },
    { value: 'nature', label: t('planner.preferences.nature'), icon: '🌲' },
    { value: 'shopping', label: t('planner.preferences.shopping'), icon: '🛍️' },
    { value: 'adventure', label: t('planner.preferences.adventure'), icon: '🏔️' },
    { value: 'relaxation', label: t('planner.preferences.leisure'), icon: '🏖️' }
  ]
  
  // 可以根据目的地特色调整推荐偏好
  return baseOptions
})

const travelStyleOptions = computed(() => {
  // 根据目的地和偏好动态调整旅行节奏选项
  return [
    { value: 'fast', label: t('planner.travelRythm.fast'), description: t('planner.travelRythm.fastDesc') },
    { value: 'moderate', label: t('planner.travelRythm.moderate'), description: t('planner.travelRythm.moderateDesc') },
    { value: 'slow', label: t('planner.travelRythm.slow'), description: t('planner.travelRythm.slowDesc') }
  ]
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return formData.value.destination
    case 1: return formData.value.duration
    case 2: return formData.value.budget
    case 3: return formData.value.preferences.length > 0 && formData.value.travelStyle
    default: return true
  }
})

const handleNext = () => {
  console.log('handleNext called, currentStep:', currentStep.value, 'steps.length:', steps.value.length)
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
    console.log('Moved to step:', currentStep.value)
  } else {
    console.log('Already at last step')
  }
}

const handlePrev = () => {
  console.log('handlePrev called, currentStep:', currentStep.value)
  if (currentStep.value > 0) {
    currentStep.value--
    console.log('Moved to step:', currentStep.value)
  } else {
    console.log('Already at first step')
  }
}

const handleSubmit = async () => {
  console.log('提交规划请求:', formData.value)
  try {
    // 生成行程
    await travelStore.generateItinerary('planner')
    
    // 从 travelStore 获取生成的行程数据
    const itineraryData = travelStore.itineraryData
    if (!itineraryData) {
      throw new Error('行程生成失败')
    }
    
    // 创建 Travel 并保存到列表
    const newTravel = travelListStore.createTravel({
      title: `${formData.value.destination}之旅`,
      location: formData.value.destination,
      description: `精心安排的${formData.value.duration}天${formData.value.destination}之旅`,
      mode: 'planner',
      status: 'active',
      duration: formData.value.duration,
      participants: 1,
      budget: 0,
      data: itineraryData // 保存详细的行程数据
    })
    
    message.success('行程生成成功！')
    
    // 跳转到旅行详情页
    router.push(`/travel/${newTravel.id}`)
  } catch (err) {
    console.error('生成行程失败:', err)
    message.error('生成行程失败，请重试')
  }
}

const getBudgetLabel = (value: string) => {
  return budgetOptions.value.find(b => b.value === value)?.label || value || ''
}

const getPreferenceLabel = (value: string) => {
  return preferenceOptions.value.find(p => p.value === value)?.label || value || ''
}

const getPreferenceIcon = (value: string) => {
  return preferenceOptions.value.find(p => p.value === value)?.icon || '📍'
}

const getTravelStyleLabel = (value: string) => {
  return travelStyleOptions.value.find(t => t.value === value)?.label || value || ''
}
</script>

<style scoped>
/* Planner 页面样式 */
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

/* 头部导航 */
.header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.back-button {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  margin-right: 1rem;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.header-title {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-icon {
  font-size: 2rem;
  color: white;
  margin-right: 1rem;
}

.title {
  color: white !important;
  margin: 0 !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 进度条区域 */
.progress-section {
  max-width: 1200px;
  margin: 0 auto 1rem auto;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.step-indicators {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0 1rem;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.step-indicator.active {
  opacity: 1;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.3rem;
  font-size: 1rem;
  color: white;
}

.step-indicator.active .step-icon {
  background: rgba(255, 255, 255, 0.8);
  color: #667eea;
}

.step-text {
  color: white !important;
  font-size: 0.8rem;
  text-align: center;
}

/* 主要内容 */
.main-content {
  max-width: 800px;
  margin: 0 auto;
}

.form-card {
  border-radius: 20px !important;
  border: none !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
}

.step-content {
  min-height: 400px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.step-content h3 {
  text-align: center;
  margin-bottom: .5rem !important;
}

.step-content p {
  text-align: center;
  margin-bottom: .5rem !important;
}

.step-content h4 {
  text-align: center;
  margin-bottom: 1rem !important;
}

.step-content .ant-form-item {
  margin-bottom: 2rem;
}

.step-content .ant-input,
.step-content .ant-select-selector {
  border-radius: 12px !important;
  border: 2px solid #e8e8e8 !important;
  transition: all 0.3s ease !important;
}

.step-content .ant-input:focus,
.step-content .ant-select-focused .ant-select-selector {
  border-color: #667eea !important;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
}

/* 摘要卡片 */
.summary-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%) !important;
  border: 1px solid #d6e4ff !important;
}

.summary-card .ant-card-body {
  padding: 1.5rem;
}

.summary-card .ant-tag {
  margin: 0.2rem;
  border-radius: 8px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: space-between;
  padding: .5rem;
  border-top: 1px solid #f0f0f0;
}

.next-button,
.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
}

.next-button:hover,
.submit-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
}

.next-button:disabled {
  background: #d9d9d9 !important;
  box-shadow: none !important;
  transform: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .back-button {
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .header-title {
    width: 100%;
  }
  
  .title {
    font-size: 1.5rem !important;
  }
  
  .progress-section {
    padding: 1rem;
  }
  
  .step-indicators {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .step-indicator {
    flex: 1;
    min-width: 80px;
  }
  
  .step-content {
    padding: 1rem;
    min-height: 400px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 1rem;
    padding:.5rem;
  }
  
  .next-button,
  .submit-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .step-content {
    min-height: 350px;
  }
  
  .step-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .step-text {
    font-size: 0.8rem;
  }
}
</style>

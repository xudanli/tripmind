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
        <heart-outlined class="header-icon" />
        <h2 class="title">{{ t('seeker.title') }}</h2>
      </div>
    </div>

    <!-- 进度条区域 -->
    <div class="progress-section">
      <a-progress 
        :percent="(currentStep / (steps.length - 1)) * 100" 
        :show-info="false"
        stroke-color="#f093fb"
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
      <a-card class="form-card">
        <div class="step-content">
          <!-- 心情选择 -->
          <div v-if="currentStep === 0">
            <h3>{{ t('seeker.step1.title') }}</h3>
            <p>{{ t('seeker.step1.description') }}</p>
            <a-row :gutter="[16, 16]">
              <a-col v-for="option in moodOptions" :key="option.value" :xs="24" :sm="12" :lg="8">
                <a-card
                  :class="['option-card', 'seeker-card', { selected: moodData.currentMood === option.value }]"
                  @click="handleOptionSelect('currentMood', option.value)"
                  hoverable
                  :body-style="{ padding: '8px' }"
                >
                  <div class="option-content">
                    <div class="option-emoji">{{ option.emoji }}</div>
                    <h4 class="option-title">{{ option.label }}</h4>
                    <span class="option-description">{{ option.description }}</span>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>

          <!-- 体验选择 -->
          <div v-if="currentStep === 1">
            <h3>{{ t('seeker.step2.title') }}</h3>
            <p>{{ t('seeker.step2.description') }}</p>
            <a-row :gutter="[16, 16]">
              <a-col v-for="option in experienceOptions" :key="option.value" :xs="24" :sm="12" :lg="8">
                <a-card
                  :class="['option-card', 'seeker-card', { selected: moodData.desiredExperience === option.value }]"
                  @click="handleOptionSelect('desiredExperience', option.value)"
                  hoverable
                  :body-style="{ padding: '8px' }"
                >
                  <div class="option-content">
                    <div class="option-emoji">{{ option.emoji }}</div>
                    <h4 class="option-title">{{ option.label }}</h4>
                    <span class="option-description">{{ option.description }}</span>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>

          <!-- 预算选择 -->
          <div v-if="currentStep === 2">
            <h3>{{ t('seeker.step3.title') }}</h3>
            <p>{{ t('seeker.step3.description') }}</p>
            <a-space direction="vertical" size="large" style="width: 100%">
              <a-card
                v-for="option in budgetOptions"
                :key="option.value"
                :class="['budget-card', 'seeker-card', { selected: moodData.budget === option.value }]"
                @click="handleOptionSelect('budget', option.value)"
                hoverable
                :body-style="{ padding: '8px' }"
              >
                <a-space>
                  <a-avatar size="large" style="background-color: #f093fb">
                    {{ option.value === 'flexible' ? '💎' : option.value === 'moderate' ? '⭐' : '💵' }}
                  </a-avatar>
                  <div>
                    <h4 style="margin: 0">{{ option.label }}</h4>
                    <span class="text-secondary">{{ option.description }}</span>
                  </div>
                </a-space>
              </a-card>
            </a-space>
          </div>

          <!-- 时长选择 -->
          <div v-if="currentStep === 3">
            <h3>{{ t('seeker.step4.title') }}</h3>
            <p>{{ t('seeker.step4.description') }}</p>
            <a-row :gutter="[16, 16]">
              <a-col v-for="option in durationOptions" :key="option.value" :xs="24">
                <a-card
                  :class="['duration-card', 'seeker-card', { selected: moodData.duration === option.value }]"
                  @click="handleOptionSelect('duration', option.value)"
                  hoverable
                  :body-style="{ padding: '8px' }"
                >
                  <a-space>
                    <a-avatar size="large" style="background-color: #f5576c">
                      {{ option.value === 'weekend' ? '🏃‍♀️' : option.value === 'week' ? '🚶‍♀️' : '🐌' }}
                    </a-avatar>
                    <div>
                      <h4 style="margin: 0">{{ option.label }}</h4>
                      <span class="text-secondary">{{ option.description }}</span>
                    </div>
                  </a-space>
                </a-card>
              </a-col>
            </a-row>
          </div>

          <!-- 推荐结果 -->
          <div v-if="currentStep === 4">
            <h3>🌸 为你找到"刚刚好的地方"</h3>
            
            <!-- 错误提示 -->
            <a-alert
              v-if="error"
              :message="error"
              type="error"
              show-icon
              closable
              @close="travelStore.setError(null)"
              style="margin-bottom: 2rem"
            />
            
            <!-- 加载状态 -->
            <a-alert
              v-else-if="loading"
              message="AI 正在分析你的心情"
              description="基于你的情感状态和偏好，我们的 AI 旅行心伴正在为你寻找最治愈的目的地..."
              type="info"
              show-icon
              style="margin-bottom:1rem"
            />
            
            <!-- 完成状态 -->
            <a-alert
              v-else
              message="分析完成！"
              description="基于你的心情和偏好，AI 已为你找到最合适的目的地"
              type="success"
              show-icon
              style="margin-bottom: rem"
            />
            
            <a-card class="recommendation-card" v-if="!loading && !error">
              <div class="ai-response">
                <a-avatar size="large" style="background-color: #f093fb">🤗</a-avatar>
                <div class="ai-message">
                  <h4>AI 旅行心伴说：</h4>
                  <p v-html="aiMessage"></p>
                </div>
              </div>
              
              <div class="recommendation-details" v-if="itineraryData">
                <h4>💫 推荐行程：{{ itineraryData.duration }}天·疗愈小旅程</h4>
                <a-space direction="vertical" style="width: 100%">
                  <div 
                    v-for="day in itineraryData.itinerary" 
                    :key="day.day"
                    class="day-plan"
                  >
                    <a-tag color="pink">第{{ day.day }}天</a-tag>
                    <span>{{ day.title }}</span>
                  </div>
                </a-space>
              </div>
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
            v-else-if="!itineraryData"
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleSubmit"
            class="submit-button"
          >
            {{ loading ? t('common.loading') : '获取治愈推荐' }}
          </a-button>
          <a-button 
            v-else
            type="primary" 
            size="large" 
            @click="goToDetail"
            class="submit-button"
          >
            查看详情
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
import { 
  ArrowLeftOutlined, 
  HeartOutlined,
  SunOutlined,
  MoonOutlined,
  CalendarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

const currentStep = ref(0)
const moodData = computed(() => travelStore.moodData)
const loading = computed(() => travelStore.loading)
const error = computed(() => travelStore.error)
const itineraryData = computed(() => travelStore.itineraryData)

// 生成 AI 消息
const aiMessage = computed(() => {
  if (!itineraryData.value) {
    return '"正在为你生成推荐..."'
  }
  
  const destination = itineraryData.value.destination || '未知目的地'
  const summary = itineraryData.value.itinerary?.[0]?.title || '一次放松心情的旅行'
  
  return `"听起来你有点累，我推荐你去能放慢脚步的地方。<br/>🌅 <strong>${destination}</strong> —— 日落时的风会吹走疲惫。<br/>${summary}"`
})

const steps = computed(() => [
  { title: t('seeker.step1.title'), icon: '💭' },
  { title: t('seeker.step2.title'), icon: '🌅' },
  { title: t('seeker.step3.title'), icon: '💰' },
  { title: t('seeker.step4.duration'), icon: '⏰' },
  { title: '推荐', icon: '🌸' }
])

const moodOptions = computed(() => [
  { value: 'calm', label: t('seeker.moods.calm'), emoji: '😌', description: t('seeker.moods.calmDesc') },
  { value: 'active', label: t('seeker.moods.active'), emoji: '⚡', description: t('seeker.moods.activeDesc') },
  { value: 'romantic', label: t('seeker.moods.romantic'), emoji: '💕', description: t('seeker.moods.romanticDesc') },
  { value: 'adventurous', label: t('seeker.moods.adventurous'), emoji: '🗻', description: t('seeker.moods.adventurousDesc') },
  { value: 'cultural', label: t('seeker.moods.cultural'), emoji: '🏛️', description: t('seeker.moods.culturalDesc') }
])

const experienceOptions = computed(() => [
  { value: 'sightseeing', label: t('seeker.experiences.sightseeing'), emoji: '🏛️', description: t('seeker.experiences.sightseeingDesc') },
  { value: 'nature', label: t('seeker.experiences.nature'), emoji: '🌲', description: t('seeker.experiences.natureDesc') },
  { value: 'food', label: t('seeker.experiences.food'), emoji: '🍜', description: t('seeker.experiences.foodDesc') },
  { value: 'shopping', label: t('seeker.experiences.shopping'), emoji: '🛍️', description: t('seeker.experiences.shoppingDesc') },
  { value: 'nightlife', label: t('seeker.experiences.nightlife'), emoji: '🌃', description: t('seeker.experiences.nightlifeDesc') },
  { value: 'adventure', label: t('seeker.experiences.adventure'), emoji: '🏄', description: t('seeker.experiences.adventureDesc') }
])

const budgetOptions = computed(() => [
  { value: 'economy', label: t('seeker.budgetRanges.economy'), description: t('seeker.budgetRanges.economyDesc') },
  { value: 'comfort', label: t('seeker.budgetRanges.comfort'), description: t('seeker.budgetRanges.comfortDesc') },
  { value: 'luxury', label: t('seeker.budgetRanges.luxury'), description: t('seeker.budgetRanges.luxuryDesc') }
])

const durationOptions = computed(() => [
  { value: 'weekend', label: t('seeker.durations.weekend'), description: t('seeker.durations.weekendDesc') },
  { value: 'week', label: t('seeker.durations.week'), description: t('seeker.durations.weekDesc') },
  { value: 'extended', label: t('seeker.durations.extended'), description: t('seeker.durations.extendedDesc') }
])

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return moodData.value.currentMood
    case 1: return moodData.value.desiredExperience
    case 2: return moodData.value.budget
    case 3: return moodData.value.duration
    default: return true
  }
})

const handleNext = () => {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
  }
}

const handlePrev = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleOptionSelect = (key: keyof typeof moodData.value, value: string) => {
  travelStore.setMoodData({ [key]: value })
}

const handleSubmit = async () => {
  console.log('提交心情分析:', moodData.value)
  try {
    // 生成推荐
    await travelStore.generateItinerary('seeker')
    
    // 数据已在 travelStore.itineraryData 中
    message.success('推荐生成成功！')
  } catch (err) {
    console.error('生成推荐失败:', err)
    message.error('生成推荐失败，请重试')
  }
}

// 创建 Travel 并跳转到详情页
const goToDetail = async () => {
  const data = travelStore.itineraryData
  if (!data) {
    message.error('数据未生成')
    return
  }
  
  // 步骤1: 保存到后端数据库（与 Planner 和 Inspiration 模式相同）
  let backendItineraryId: string | undefined
  try {
    const { convertFrontendDataToCreateRequest, createItinerary } = await import('@/services/itineraryAPI')
    
    // 将 Seeker 模式数据转换为与 Planner 模式相同的格式
    // Seeker 模式的数据结构可能来自后端API响应或前端实现
    const backendResponse = (data as any).backendResponse
    
    let frontendItineraryData: any
    
    if (backendResponse) {
      // 如果数据来自后端API，使用后端响应格式
      const days = backendResponse.itinerary?.map((day: any, index: number) => {
        // 计算日期（从今天开始）
        const date = new Date()
        date.setDate(date.getDate() + index)
        const dateStr = date.toISOString().split('T')[0]
        
        return {
          day: day.day || index + 1,
          date: dateStr,
          timeSlots: (day.activities || []).map((activity: any) => ({
            time: activity.time,
            coordinates: activity.location ? { lat: 0, lng: 0 } : { lat: 0, lng: 0 }, // 需要根据location获取坐标
            title: activity.activity || '',
            type: (activity.type || 'attraction') as 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean',
            duration: 120, // 默认2小时，需要根据实际情况调整
            cost: 0, // 需要根据预算计算
            details: {
              notes: activity.notes || '',
              description: '',
              images: [],
              photos: []
            }
          }))
        }
      }) || []
      
      frontendItineraryData = {
        days,
        totalCost: 0, // 需要根据预算和活动计算
        summary: backendResponse.recommendations?.tips || ''
      }
    } else {
      // 如果数据来自前端实现，使用现有的itinerary结构
      const days = (data.itinerary || []).map((day, index) => {
        // 计算日期（从今天开始）
        const date = new Date()
        date.setDate(date.getDate() + index)
        const dateStr = date.toISOString().split('T')[0]
        
        return {
          day: day.day || index + 1,
          date: dateStr,
          timeSlots: (day.activities || []).map((activity) => ({
            time: activity.time,
            coordinates: { lat: 0, lng: 0 }, // 需要根据location获取坐标
            title: activity.activity || '',
            type: (activity.type || 'attraction') as 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean',
            duration: 120, // 默认2小时
            cost: 0, // 需要根据预算计算
            details: {
              notes: '',
              description: '',
              images: [],
              photos: []
            }
          }))
        }
      })
      
      frontendItineraryData = {
        days,
        totalCost: 0,
        summary: data.recommendations?.tips || ''
      }
    }
    
    // 转换为后端请求格式
    const destination = data.destination || '待定'
    
    // 确保 startDate 是有效的 ISO 8601 格式（YYYY-MM-DD）
    let startDate = frontendItineraryData.days[0]?.date
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      startDate = new Date().toISOString().split('T')[0]
      console.warn('⚠️ [Seeker] 日期格式不正确，使用今天日期:', startDate)
    }
    
    // 构建预算映射
    const budgetMap: Record<string, 'low' | 'medium' | 'high'> = {
      economy: 'low',
      comfort: 'medium',
      luxury: 'high'
    }
    
    const preferences = {
      budget: budgetMap[data.budget] || 'medium',
      travelStyle: 'relaxed' as const // Seeker 模式通常是放松型
    }
    
    const createRequest = convertFrontendDataToCreateRequest(
      frontendItineraryData,
      destination,
      startDate,
      preferences,
      'draft',
      'seeker' // 模式标识
    )
    
    // 注意：不要向 createRequest.data 添加额外字段
    // CreateItineraryRequest 的 data 字段只包含 days、totalCost、summary
    // 模式特有字段（seekerConfig）应该保存在本地 Travel.data 中，而不是后端
    
    console.log('📤 [Seeker] 创建行程请求数据:', {
      destination: createRequest.destination,
      daysCount: createRequest.days,
      startDate: createRequest.startDate
    })
    
    // 调用创建行程接口
    const backendItinerary = await createItinerary(createRequest)
    backendItineraryId = backendItinerary.id
    console.log('✅ [Seeker] 行程已保存到后端', {
      id: backendItineraryId,
      destination: backendItinerary.destination,
      mode: backendItinerary.mode
    })
    message.success('行程已保存到数据库')
    
    // 步骤2: 创建 Travel 对象用于立即显示（最终数据从后端获取）
    const travelDataWithBackendId: any = {
      ...data,
      backendItineraryId: backendItineraryId
    }
    
    // 使用后端返回的 mode（如果存在），否则使用默认值
    const travelMode = backendItinerary.mode || 'seeker'
    
    const newTravel = travelListStore.createTravel({
      title: '随心而行的旅程',
      location: data.destination || '待定',
      description: `${t('seeker.title')} - 基于你当前心情的旅行推荐`,
      mode: travelMode as 'planner' | 'seeker' | 'inspiration',
    status: 'active',
    duration: data.duration || 5,
    participants: 1,
    budget: 0,
    data: travelDataWithBackendId // 保存详细的行程数据（包含后端ID）
  })
  
  // 跳转到旅行详情页
  router.push(`/travel/${newTravel.id}`)
  } catch (error: any) {
    console.error('[Seeker] 保存行程到后端失败:', error)
    message.error(`保存行程失败: ${error.message || '未知错误'}`)
  }
}
</script>

<style scoped>
/* Seeker 页面样式 */
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 2rem;
}

/* 头部导航 */
.header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
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
  color: #f093fb;
}

.step-text {
  color: white !important;
  font-size: 0.8rem;
  text-align: center;
}

/* 主要内容 */
.main-content {
  max-width: 1000px;
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

/* 选项卡片 */
.option-card {
  border-radius: 16px !important;
  border: 2px solid #f0f0f0 !important;
  transition: all 0.3s ease !important;
  cursor: pointer;
  height: 100%;
}

.option-card:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 8px 24px rgba(240, 147, 251, 0.3) !important;
  border-color: #f093fb !important;
}

.option-card.selected {
  border-color: #f093fb !important;
  background: linear-gradient(135deg, #fef7ff 0%, #f8e8ff 100%) !important;
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4) !important;
}

/* SeekerView 专用卡片样式 */
.seeker-card {
  /* SeekerView 页面卡片特有的样式 */
}

:deep(.seeker-card .ant-card-body) {
  padding: 8px !important;
}

.option-content {
  text-align: center;
  padding: 0rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-emoji {
  font-size: 1.5rem;
  margin-bottom: 0;
  display: inline-block;
}

.option-title {
  color: #333 !important;
  margin-bottom: 0 !important;
  font-size: 1rem !important;
  font-weight: 600;
}

.option-description {
  color: #666 !important;
  font-size: 0.75rem;
  line-height: 1.2;
  margin-left: 0.5rem;
}

/* 预算卡片 */
.budget-card {
  border-radius: 12px !important;
  border: 2px solid #f0f0f0 !important;
  transition: all 0.3s ease !important;
  cursor: pointer;
  padding: 0rem;
}

.budget-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.2) !important;
  border-color: #f093fb !important;
}

.budget-card.selected {
  border-color: #f093fb !important;
  background: linear-gradient(135deg, #fef7ff 0%, #f8e8ff 100%) !important;
}

/* 时长卡片 */
.duration-card {
  border-radius: 12px !important;
  border: 2px solid #f0f0f0 !important;
  transition: all 0.3s ease !important;
  cursor: pointer;
  padding: 0rem;
}

.duration-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.2) !important;
  border-color: #f093fb !important;
}

.duration-card.selected {
  border-color: #f093fb !important;
  background: linear-gradient(135deg, #fef7ff 0%, #f8e8ff 100%) !important;
}

/* 推荐卡片 */
.recommendation-card {
  background: linear-gradient(135deg, #fff5f8 0%, #ffeef3 100%) !important;
  border: 2px solid #ffb3d1 !important;
  border-radius: 20px !important;
  transition: all 0.3s ease !important;
}

.recommendation-card:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 40px rgba(255, 179, 209, 0.4) !important;
}

/* 推荐卡片内边距 */
:deep(.recommendation-card .ant-card-body) {
  padding: 16px !important;
}

.ai-response {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.ai-message {
  flex: 1;
}

.ai-message h4 {
  text-align: left !important;
  margin-bottom: 0.5rem !important;
}

.ai-message p {
  text-align: left !important;
  margin-bottom: 0.5rem !important;
}

.recommendation-details {
  margin-top: 1rem;
}

.day-plan {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef7ff 0%, #f8e8ff 100%);
  border: 1px solid #f093fb;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);
}

.day-plan:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
  border-color: #f093fb;
}

.day-plan .ant-tag {
  margin: 0;
  border-radius: 8px;
  font-weight: 600;
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
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3) !important;
}

.next-button:hover,
.submit-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(240, 147, 251, 0.4) !important;
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
  
  .option-emoji {
    font-size: 2rem;
  }
  
  .ai-response {
    flex-direction: column;
    text-align: center;
  }
  
  .ai-message h4,
  .ai-message p {
    text-align: center !important;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
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
  
  .option-emoji {
    font-size: 1.5rem;
  }
}
</style>

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

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 单页表单 -->
      <div class="plan-form-container">
        <!-- 横幅标题区域 -->
        <div class="hero-banner">
          <div class="hero-content">
            <span class="hero-icon">✨</span>
            <h1 class="hero-title">{{ t('planner.heroTitle') || 'Plan Your Dream Trip' }}</h1>
            <p class="hero-subtitle">{{ t('planner.heroSubtitle') || 'Tell us what you love, and we\'ll handle the rest.' }}</p>
      </div>
    </div>

        <!-- 表单内容 -->
        <div class="form-content">
          <!-- 目的地输入 -->
          <div class="form-section">
            <label class="form-label">
              <environment-outlined class="label-icon" />
              {{ t('planner.step1.label') || 'Where to?' }}
            </label>
            <div class="destination-input-wrapper">
              <a-input
                :value="formData.destination"
                @update:value="(value) => travelStore.setPlannerData({ destination: value })"
                size="large"
                :placeholder="t('planner.step1.placeholder') || 'e.g., Kyoto, Paris, Cape Town'"
                class="destination-input"
              />
            </div>
          </div>

          <!-- 天数滑块 -->
          <div class="form-section">
            <label class="form-label">
              <calendar-outlined class="label-icon" />
              {{ t('planner.step2.label') || 'Duration (Days)' }}
            </label>
            <div class="duration-slider-wrapper">
              <a-slider
                :value="formData.days || 3"
                @update:value="(value) => travelStore.setPlannerData({ days: value })"
                :min="1"
                :max="30"
                :marks="{ 1: '1', 7: '7', 14: '14', 30: '30' }"
                class="duration-slider"
              />
              <div class="duration-value">{{ formData.days || 3 }}</div>
            </div>
          </div>

          <!-- 旅行者数量 -->
          <div class="form-section">
            <label class="form-label">
              <team-outlined class="label-icon" />
              {{ t('planner.step3.label') || 'Travelers' }}
            </label>
            <div class="travelers-input-wrapper">
              <a-button 
                class="number-btn" 
                @click="decreaseTravelers"
                :disabled="(formData.participants || 1) <= 1"
            >
                <minus-outlined />
              </a-button>
              <a-input-number
                :value="formData.participants || 1"
                @update:value="(value) => travelStore.setPlannerData({ participants: value || 1 })"
                :min="1"
                :max="20"
                class="travelers-input"
              />
              <a-button 
                class="number-btn" 
                @click="increaseTravelers"
                :disabled="(formData.participants || 1) >= 20"
              >
                <plus-outlined />
              </a-button>
                  </div>
          </div>

          <!-- 预算等级 -->
          <div class="form-section">
            <label class="form-label">
              <dollar-outlined class="label-icon" />
              {{ t('planner.step4.label') || 'Budget Level' }}
            </label>
            <div class="budget-buttons">
              <a-button
                v-for="option in budgetButtonOptions"
                :key="option.value"
                :type="formData.preferences?.budget === option.value ? 'primary' : 'default'"
                :class="['budget-btn', { active: formData.preferences?.budget === option.value }]"
                @click="() => travelStore.setPlannerData({ 
                  preferences: { 
                    ...formData.preferences, 
                    budget: option.value 
                  } 
                })"
              >
                {{ option.label }}
              </a-button>
            </div>
          </div>

          <!-- 兴趣选择 -->
          <div class="form-section">
            <label class="form-label">
              <heart-outlined class="label-icon" />
              {{ t('planner.step5.label') || 'Interests' }}
            </label>
            <div class="interests-grid">
              <a-button
                  v-for="option in preferenceOptions" 
                  :key="option.value" 
                :type="(formData.preferences?.interests || []).includes(option.value) ? 'primary' : 'default'"
                :class="['interest-btn', { active: (formData.preferences?.interests || []).includes(option.value) }]"
                @click="toggleInterest(option.value)"
              >
                {{ option.icon }} {{ option.label }}
              </a-button>
                  </div>
          </div>

          <!-- 开始日期（自动设置为今天，隐藏显示） -->
          <div class="form-section" style="display: none;">
            <a-date-picker
              :value="formData.startDate ? dayjs(formData.startDate) : dayjs()"
              @update:value="(value) => travelStore.setPlannerData({ startDate: value ? value.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') })"
                size="large"
              style="width: 100%"
            />
        </div>

          <!-- 生成按钮 -->
          <div class="submit-section">
          <a-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleSubmit"
              class="generate-button"
              :disabled="!canSubmit"
          >
              <template #icon>
                <environment-outlined />
              </template>
              {{ loading ? t('common.loading') : (t('planner.submit') || 'Generate Itinerary') }}
          </a-button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { createItinerary, convertFrontendDataToCreateRequest, updateJourneyFromFrontendData } from '@/services/itineraryAPI'

const { t } = useI18n()
import PlannerDemo from '@/components/TravelDetail/PlannerDemo.vue'
import { 
  ArrowLeftOutlined, 
  RocketOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

const formData = computed(() => travelStore.plannerData)
const loading = computed(() => travelStore.loading)
const error = computed(() => travelStore.error)

// 初始化默认值
onMounted(() => {
  if (!formData.value.startDate) {
    travelStore.setPlannerData({ startDate: dayjs().format('YYYY-MM-DD') })
  }
  if (!formData.value.days) {
    travelStore.setPlannerData({ days: 3 })
  }
  if (!formData.value.participants) {
    travelStore.setPlannerData({ participants: 1 })
  }
})

// 预算按钮选项
const budgetButtonOptions = computed(() => [
  { value: 'low', label: t('planner.budgetRanges.economy') || 'Budget' },
  { value: 'medium', label: t('planner.budgetRanges.comfort') || 'Moderate' },
  { value: 'high', label: t('planner.budgetRanges.luxury') || 'Luxury' }
])

const preferenceOptions = computed(() => {
  const baseOptions = [
    { value: 'culture', label: t('planner.preferences.culture') || 'History & Culture', icon: '🏛️' },
    { value: 'nature', label: t('planner.preferences.nature') || 'Nature & Outdoors', icon: '🌲' },
    { value: 'food', label: t('planner.preferences.food') || 'Food & Dining', icon: '🍜' },
    { value: 'adventure', label: t('planner.preferences.adventure') || 'Adventure & Sports', icon: '🏔️' },
    { value: 'art', label: t('planner.preferences.art') || 'Art & Museums', icon: '🎨' },
    { value: 'shopping', label: t('planner.preferences.shopping') || 'Shopping', icon: '🛍️' },
    { value: 'relaxation', label: t('planner.preferences.leisure') || 'Relaxation & Spa', icon: '🏖️' },
    { value: 'nightlife', label: t('planner.preferences.nightlife') || 'Nightlife', icon: '🌃' },
    { value: 'photography', label: t('planner.preferences.photography') || 'Photography', icon: '📸' },
    { value: 'family', label: t('planner.preferences.family') || 'Family Friendly', icon: '👨‍👩‍👧‍👦' }
  ]
  return baseOptions
})

// 切换兴趣选择
const toggleInterest = (value: string) => {
  const currentInterests = formData.value.preferences?.interests || []
  const newInterests = currentInterests.includes(value)
    ? currentInterests.filter(i => i !== value)
    : [...currentInterests, value]
  
  travelStore.setPlannerData({
    preferences: {
      ...formData.value.preferences,
      interests: newInterests
  }
})
}

// 增加/减少旅行者数量
const increaseTravelers = () => {
  const current = formData.value.participants || 1
  if (current < 20) {
    travelStore.setPlannerData({ participants: current + 1 })
  }
}

const decreaseTravelers = () => {
  const current = formData.value.participants || 1
  if (current > 1) {
    travelStore.setPlannerData({ participants: current - 1 })
  }
}


// 验证是否可以提交
// 注意：根据新文档，destination 是可选的，系统会自动推荐
const canSubmit = computed(() => {
  return formData.value.days &&
         formData.value.days >= 1 && 
         formData.value.days <= 30 &&
         formData.value.startDate &&
         // 至少需要提供目的地、意图信息或偏好兴趣之一
         (formData.value.destination?.trim() || 
          formData.value.preferences?.interests?.length > 0 ||
          formData.value.preferences?.budget)
})

// 移除旧的步骤相关代码，直接使用 handleSubmit
const handleSubmit = async () => {
  if (!canSubmit.value) {
    message.warning('请完成必填项后再提交')
    return
  }

  console.log('📋 [Planner] 提交规划请求:', formData.value)
  
  try {
    console.log('🚀 [Planner] 步骤 1/3: 开始生成行程...')
    // 生成行程
    await travelStore.generateItinerary('planner')
    console.log('✅ [Planner] 步骤 1/3: 行程生成完成')
    
    // 从 travelStore 获取生成的行程数据
    console.log('📊 [Planner] 步骤 2/3: 获取生成的行程数据...')
    const itineraryData = travelStore.itineraryData
    if (!itineraryData) {
      console.error('❌ [Planner] 步骤 2/3: 未获取到行程数据')
      throw new Error('行程生成失败')
    }
    console.log('✅ [Planner] 步骤 2/3: 行程数据获取成功', {
      title: itineraryData.title,
      destination: itineraryData.destination,
      days: itineraryData.days?.length || 0,
      totalCost: itineraryData.totalCost
    })
    
    // 步骤 3/4: 保存行程到后端数据库
    console.log('💾 [Planner] 步骤 3/4: 保存行程到后端数据库...')
    let backendItineraryId: string | undefined
    let backendItinerary: any = undefined
    try {
      // 确保 days 数组不为空
      const days = (itineraryData as any).days && (itineraryData as any).days.length > 0
        ? (itineraryData as any).days
        : [{
            day: 1,
            date: formData.value.startDate || dayjs().format('YYYY-MM-DD'),
            timeSlots: []
          }]
      
      // 使用前端数据格式直接创建完整行程（使用 from-frontend-data 接口）
      const { createJourneyFromFrontendData } = await import('@/services/itineraryAPI')
      const createRequest = {
        itineraryData: {
          destination: formData.value.destination,
          duration: days.length,
          days: days.map((day: any) => ({
            day: day.day || 1,
            date: day.date || formData.value.startDate || dayjs().format('YYYY-MM-DD'),
            timeSlots: day.timeSlots || []
          })),
          totalCost: (itineraryData as any).totalCost || 0,
          summary: (itineraryData as any).summary || '',
          title: `${formData.value.destination}之旅`,
          preferences: formData.value.preferences,
          practicalInfo: (itineraryData as any).practicalInfo
        },
        startDate: formData.value.startDate || dayjs().format('YYYY-MM-DD')
      }
      
      console.log('📤 [Planner] 创建行程请求数据:', {
        destination: createRequest.itineraryData.destination,
        daysCount: createRequest.itineraryData.days.length,
        startDate: createRequest.startDate
      })
      
      // 直接创建完整行程（使用 from-frontend-data 接口）
      const baseJourney = await createJourneyFromFrontendData(createRequest)
      backendItineraryId = baseJourney.id
      console.log('✅ [Planner] 行程已创建，journeyId:', backendItineraryId)
      
      // 处理 preferences：优先使用 itineraryData 中的 preferences，否则使用 formData 中的
      let preferences: string[] | { interests?: string[]; budget?: string; travelStyle?: string } | undefined
      if ((itineraryData as any).preferences) {
        if (Array.isArray((itineraryData as any).preferences)) {
          preferences = (itineraryData as any).preferences
        } else if (typeof (itineraryData as any).preferences === 'object') {
          preferences = (itineraryData as any).preferences
        }
      } else if (formData.value.preferences) {
        preferences = {
          budget: formData.value.preferences.budget,
          interests: formData.value.preferences.interests,
          travelStyle: formData.value.preferences.travelStyle
        }
      }
      
      const updateRequest = {
        itineraryData: {
          destination: itineraryData.destination,
          duration: itineraryData.days?.length || formData.value.days,
          budget: (itineraryData as any).budget || formData.value.preferences?.budget,
          preferences: preferences,
          travelStyle: (itineraryData as any).travelStyle || formData.value.preferences?.travelStyle,
          itinerary: [],
          recommendations: (itineraryData as any).recommendations || {},
          days: (itineraryData as any).days || [],
          totalCost: (itineraryData as any).totalCost || 0,
          summary: (itineraryData as any).summary || '',
          title: (itineraryData as any).title || `${formData.value.destination}之旅`
        },
        startDate: formData.value.startDate || dayjs().format('YYYY-MM-DD')
      }
      
      console.log('📤 [Planner] 从前端数据格式更新行程请求数据:', {
        journeyId: backendItineraryId,
        destination: updateRequest.itineraryData.destination,
        daysCount: updateRequest.itineraryData.days.length
      })
      
      // 调用新接口更新行程
      backendItinerary = await updateJourneyFromFrontendData(backendItineraryId, updateRequest)
      console.log('✅ [Planner] 步骤 3/4: 行程已保存到后端', {
        id: backendItinerary.id,
        destination: backendItinerary.destination,
        daysCount: backendItinerary.daysCount
      })
      message.success('行程已保存到数据库')
    } catch (err: any) {
      console.error('❌ [Planner] 步骤 3/4: 保存到后端失败', {
        error: err.message,
        stack: err.stack
      })
      message.warning('保存到数据库失败，将使用临时数据。错误：' + (err.message || '未知错误'))
    }
    
    // 步骤 4/4: 创建 Travel 对象用于立即显示（最终数据从后端获取）
    console.log('💾 [Planner] 步骤 4/4: 创建 Travel 对象用于显示...')
    
    let newTravel: any = null
    try {
    // 构建存储数据，确保兼容 ExperienceDay 组件的两种数据读取方式
    // 方式1: data.days (直接存储)
    // 方式2: data.itineraryData.days (嵌套存储)
    const travelData: any = {
      // 保存后端行程ID（如果创建成功）
      backendItineraryId: backendItineraryId,
      // 直接存储 days，这样 ExperienceDay 可以直接从 data.days 读取
      days: (itineraryData as any).days || [],
      destination: itineraryData.destination,
      title: (itineraryData as any).title || `${formData.value.destination}之旅`,
      totalCost: (itineraryData as any).totalCost || 0,
      summary: (itineraryData as any).summary || '',
      // 同时存储为 itineraryData 格式，以兼容其他组件
      itineraryData: {
        days: (itineraryData as any).days || [],
        destination: itineraryData.destination,
        title: (itineraryData as any).title || `${formData.value.destination}之旅`,
        totalCost: (itineraryData as any).totalCost || 0,
        summary: (itineraryData as any).summary || '',
        duration: itineraryData.duration,
        budget: itineraryData.budget,
        preferences: itineraryData.preferences,
        travelStyle: itineraryData.travelStyle
      }
    }
    
    // 使用后端返回的 mode（如果存在），否则使用默认值
    const travelMode = backendItinerary?.mode || 'planner'
    
      newTravel = travelListStore.createTravel({
      title: (itineraryData as any).title || `${formData.value.destination}之旅`,
      location: formData.value.destination,
      description: (itineraryData as any).summary || `精心安排的${formData.value.days}天${formData.value.destination}之旅`,
      mode: travelMode as 'planner' | 'seeker' | 'inspiration',
      status: 'active',
      duration: formData.value.days,
      participants: formData.value.participants || 1,
      budget: (itineraryData as any).totalCost || 0,
      data: travelData // 保存详细的行程数据
    })
    console.log('✅ [Planner] 步骤 4/4: Travel 创建成功', {
      id: newTravel.id,
      title: newTravel.title,
      mode: newTravel.mode,
      backendItineraryId: backendItineraryId
    })
    } catch (travelError: any) {
      console.error('❌ [Planner] 步骤 4/4: 创建 Travel 失败', {
        error: travelError.message,
        stack: travelError.stack
      })
      message.warning('创建本地行程失败，但会尝试跳转')
    }
    
    // 确保跳转到详情页
    const targetId = backendItineraryId || (newTravel?.id)
    if (targetId) {
      console.log('🎉 [Planner] 所有步骤完成，准备跳转到详情页', {
        travelId: newTravel?.id,
        backendItineraryId: backendItineraryId,
        targetId: targetId,
        travelTitle: newTravel?.title
      })
      message.success('行程生成成功！')
      
      try {
        if (backendItineraryId) {
          await router.push(`/travel/${backendItineraryId}`)
        } else if (newTravel?.id) {
          await router.push(`/travel/${newTravel.id}`)
        } else {
          throw new Error('无法获取行程 ID')
        }
        console.log('✅ [Planner] 跳转成功')
      } catch (routerError: any) {
        console.error('❌ [Planner] 跳转失败', {
          error: routerError.message,
          travelId: newTravel?.id,
          backendItineraryId: backendItineraryId
        })
        message.error('跳转失败，请手动导航到行程详情页')
      }
    } else {
      console.error('❌ [Planner] 无法跳转：Travel 对象创建失败或没有 ID')
      message.error('行程创建失败，无法跳转到详情页')
    }
  } catch (err) {
    console.error('❌ [Planner] 生成行程失败:', err)
    message.error('生成行程失败，请重试')
  }
}

const getPreferenceLabel = (value: string) => {
  return preferenceOptions.value.find(p => p.value === value)?.label || value || ''
}

const getPreferenceIcon = (value: string) => {
  return preferenceOptions.value.find(p => p.value === value)?.icon || '📍'
}
</script>

<style scoped>
/* 单页表单样式 */
.plan-form-container {
  max-width: 800px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 横幅标题区域 */
.hero-banner {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 48px 32px;
  text-align: center;
  color: white;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.hero-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0;
  color: white;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 16px;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

/* 表单内容 */
.form-content {
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.label-icon {
  font-size: 18px;
  color: #1890ff;
}

/* 目的地输入 */
.destination-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.destination-input {
  flex: 1;
}


/* 天数滑块 */
.duration-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.duration-slider {
  flex: 1;
}

.duration-value {
  min-width: 40px;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
}

/* 旅行者数量 */
.travelers-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.number-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  background: #ffffff;
}

.number-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.travelers-input {
  width: 80px;
  text-align: center;
}

.travelers-input :deep(.ant-input-number-input) {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}

/* 预算按钮组 */
.budget-buttons {
  gap: 12px;
}

.budget-btn {
  flex: 1;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  border: 2px solid #e5e7eb;
  background: #ffffff;
  transition: all 0.3s ease;
  padding: 0 12px;
}

.budget-btn.active {
  border-color: #1890ff;
  background: #1890ff;
  color: white;
}

.budget-btn:hover:not(.active) {
  border-color: #1890ff;
  color: #1890ff;
}

/* 兴趣网格 */
.interests-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.interest-btn {
  height: 48px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  border: 2px solid #e5e7eb;
  background: #ffffff;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-right: 8px;
  margin-bottom: 8px;

}

.interest-btn.active {
  border-color: #1890ff;
  background: #1890ff;
  color: white;
}

.interest-btn:hover:not(.active) {
  border-color: #1890ff;
  color: #1890ff;
}

/* 提交按钮区域 */
.submit-section {
  margin-top: 16px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.generate-button {
  width: 100%;
  height: 56px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
}

.generate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-banner {
    padding: 32px 24px;
  }
  
  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 14px;
  }
  
  .form-content {
    padding: 24px 20px;
    gap: 24px;
  }

  .interests-grid {
    grid-template-columns: 1fr;
  }
  
  .budget-buttons {
    flex-direction: column;
  }
}

/* 容器样式 */
.container {
  min-height: 100vh;
  background: #f5f5f5;
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
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid #e0e0e0 !important;
  color: #333 !important;
  margin-right: 1rem;
  }
  
.back-button:hover {
  background: rgba(255, 255, 255, 1) !important;
  border-color: #1890ff !important;
  color: #1890ff !important;
  }

.header-title {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-icon {
  font-size: 2rem;
  color: #1890ff;
  margin-right: 1rem;
  }
  
.title {
  color: #333 !important;
  margin: 0 !important;
  }
  
/* 主要内容 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

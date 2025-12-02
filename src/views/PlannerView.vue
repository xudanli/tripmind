<template>
  <div class="page-container">
    <div class="header-nav">
      <a-button 
        type="text"
        @click="router.back()"
        class="back-button"
      >
        <template #icon><arrow-left-outlined /></template>
        {{ t('common.back') }}
      </a-button>
    </div>
    <div class="planner-card">
      <div class="hero-section">
        <div class="hero-pattern"></div>
          <div class="hero-content">
          <div class="hero-badge">
            <rocket-outlined /> AI Travel Planner
          </div>
          <h1 class="hero-title">{{ t('planner.heroTitle') || '定制您的完美旅程' }}</h1>
          <p class="hero-subtitle">{{ t('planner.heroSubtitle') || '告诉我们您的喜好，AI 将为您生成专属行程规划。' }}</p>
        </div>
      </div>
      <div class="form-section-wrapper">
        <div class="form-content">
          
          <div class="form-group">
            <label class="group-label">
              <span class="icon-box"><environment-outlined /></span>
              {{ t('planner.step1.label') || '想去哪里？' }}
            </label>
              <a-input
                :value="formData.destination"
              @update:value="(val) => updatePlannerData({ destination: val })"
                size="large"
              :placeholder="t('planner.step1.placeholder') || '例如：京都、巴黎、三亚...'"
              class="custom-input"
              allow-clear
            >
              <template #prefix>
                <search-outlined style="color: #bfbfbf" />
              </template>
            </a-input>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="group-label">
                <span class="icon-box"><calendar-outlined /></span>
                {{ t('planner.step2.label') || '游玩天数' }}
            </label>
              <div class="slider-container">
              <a-slider
                :value="formData.days || 3"
                  @update:value="(val) => updatePlannerData({ days: val })"
                :min="1"
                  :max="15"
                  :tooltip-visible="false"
                  class="custom-slider"
                />
                <span class="slider-value">{{ formData.days || 3 }} {{ t('planner.day') || '天' }}</span>
            </div>
          </div>

            <div class="form-group flex-1">
              <label class="group-label">
                <span class="icon-box"><team-outlined /></span>
                {{ t('planner.step3.label') || '出行人数' }}
            </label>
              <div class="counter-input">
                <button 
                  class="counter-btn" 
                @click="decreaseTravelers"
                :disabled="(formData.participants || 1) <= 1"
            >
                <minus-outlined />
                </button>
                <span class="counter-display">{{ formData.participants || 1 }} {{ t('planner.people') || '人' }}</span>
                <button 
                  class="counter-btn" 
                @click="increaseTravelers"
                :disabled="(formData.participants || 1) >= 20"
              >
                <plus-outlined />
                </button>
              </div>
                  </div>
          </div>

          <div class="form-group">
            <label class="group-label">
              <span class="icon-box"><dollar-outlined /></span>
              {{ t('planner.step4.label') || '预算范围' }}
            </label>
            <div class="budget-grid">
              <div
                v-for="option in budgetButtonOptions"
                :key="option.value"
                class="budget-card"
                :class="{ active: formData.preferences?.budget === option.value }"
                @click="updatePlannerData({ preferences: { ...formData.preferences, budget: option.value } })"
              >
                <div class="budget-icon">{{ option.icon }}</div>
                <div class="budget-info">
                  <span class="budget-label">{{ option.label }}</span>
                  <span class="budget-desc">{{ option.desc }}</span>
                </div>
                <div class="check-mark" v-if="formData.preferences?.budget === option.value">
                  <check-circle-filled />
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="group-label">
              <span class="icon-box"><heart-outlined /></span>
              {{ t('planner.step5.label') || '旅行偏好' }}
              <span class="label-hint">{{ t('planner.multipleSelect') || '（可多选）' }}</span>
            </label>
            <div class="interests-container">
              <button
                  v-for="option in preferenceOptions" 
                  :key="option.value" 
                class="interest-chip"
                :class="{ active: (formData.preferences?.interests || []).includes(option.value) }"
                @click="toggleInterest(option.value)"
              >
                <span class="chip-icon">{{ option.icon }}</span>
                {{ option.label }}
              </button>
                  </div>
          </div>

          <div class="submit-area">
          <a-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleSubmit"
              class="generate-btn"
              :disabled="!canSubmit"
          >
              <template #icon v-if="!loading">
                <thunderbolt-filled />
              </template>
              {{ loading ? (t('planner.generating') || t('common.loading') || 'AI 正在规划中...') : t('planner.submit') || '生成专属行程' }}
          </a-button>
            <p class="submit-hint" v-if="!canSubmit">{{ t('planner.submitHint') || '请至少填写目的地或选择一项兴趣' }}</p>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { 
  ArrowLeftOutlined, 
  RocketOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  HeartOutlined,
  TeamOutlined,
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  CheckCircleFilled,
  ThunderboltFilled
} from '@ant-design/icons-vue'

// --- 类型定义 ---
interface PlannerPreferences {
  interests?: string[]
  budget?: string
  travelStyle?: string
}

interface PlannerData {
  destination?: string
  days?: number
  startDate?: string
  participants?: number
  preferences?: PlannerPreferences
}

const { t } = useI18n()
const router = useRouter()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

const formData = computed<PlannerData>(() => travelStore.plannerData)
const loading = computed(() => travelStore.loading)

// 辅助函数：简化 store 更新调用
const updatePlannerData = (data: Partial<PlannerData>) => {
  travelStore.setPlannerData(data)
}

// 初始化默认值
onMounted(() => {
  if (!formData.value.startDate) updatePlannerData({ startDate: dayjs().format('YYYY-MM-DD') })
  if (!formData.value.days) updatePlannerData({ days: 3 })
  if (!formData.value.participants) updatePlannerData({ participants: 1 })
  if (!formData.value.preferences) updatePlannerData({ preferences: { interests: [], budget: 'medium' } })
})

// --- 选项配置 ---
const budgetButtonOptions = computed(() => [
  { value: 'low', label: t('planner.budget.economy') || '经济实惠', icon: '💰', desc: t('planner.budgetDesc.low') || '注重性价比' },
  { value: 'medium', label: t('planner.budget.comfort') || '舒适标准', icon: '💎', desc: t('planner.budgetDesc.medium') || '平衡体验与价格' },
  { value: 'high', label: t('planner.budget.luxury') || '豪华奢享', icon: '👑', desc: t('planner.budgetDesc.high') || '顶级体验' }
])

const preferenceOptions = computed(() => [
  { value: 'culture', label: t('planner.preferences.culture') || '历史文化', icon: '🏛️' },
  { value: 'nature', label: t('planner.preferences.nature') || '自然风光', icon: '🌲' },
  { value: 'food', label: t('planner.preferences.food') || '地道美食', icon: '🍜' },
  { value: 'adventure', label: t('planner.preferences.adventure') || '户外探险', icon: '🧗' },
  { value: 'art', label: t('planner.preferences.art') || '艺术展览', icon: '🎨' },
  { value: 'shopping', label: t('planner.preferences.shopping') || '购物血拼', icon: '🛍️' },
  { value: 'relaxation', label: t('planner.preferences.leisure') || '休闲度假', icon: '🏖️' },
  { value: 'nightlife', label: t('planner.preferences.nightlife') || '夜生活', icon: '🍸' },
  { value: 'photography', label: t('planner.preferences.photography') || '摄影打卡', icon: '📸' },
  { value: 'family', label: t('planner.preferences.family') || '亲子游', icon: '🧸' }
])

// --- 交互逻辑 ---
const toggleInterest = (value: string) => {
  const currentInterests = formData.value.preferences?.interests || []
  const newInterests = currentInterests.includes(value)
    ? currentInterests.filter(i => i !== value)
    : [...currentInterests, value]
  
  updatePlannerData({
    preferences: {
      ...formData.value.preferences,
      interests: newInterests
  }
})
}

const increaseTravelers = () => {
  const current = formData.value.participants || 1
  if (current < 20) updatePlannerData({ participants: current + 1 })
}

const decreaseTravelers = () => {
  const current = formData.value.participants || 1
  if (current > 1) updatePlannerData({ participants: current - 1 })
}

const canSubmit = computed(() => {
  const hasDest = !!formData.value.destination?.trim()
  const hasInterest = (formData.value.preferences?.interests?.length || 0) > 0
  // 只需要其中一项即可，AI 可以根据兴趣推荐地点，或根据地点推荐行程
  return hasDest || hasInterest
})

// --- 提交逻辑 (保持原有核心业务逻辑，增加健壮性) ---
const handleSubmit = async () => {
  if (!canSubmit.value) return

  try {
    // 1. 调用 Store 生成行程
    await travelStore.generateItinerary('planner')
    const itineraryData = travelStore.itineraryData
    if (!itineraryData) throw new Error('Generation returned empty data')

    // 2. 准备后端所需数据
    const { createJourneyFromFrontendData } = await import('@/services/itineraryAPI')
    
    // 构造请求体
    const days = (itineraryData as any).days?.length > 0 
        ? (itineraryData as any).days
      : [{ day: 1, date: formData.value.startDate, timeSlots: [] }]
      
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
      
    const createRequest = {
        itineraryData: {
          destination: itineraryData.destination,
        duration: itineraryData.days?.length || formData.value.days || days.length,
        days: days.map((day: any) => ({
          day: day.day || 1,
          date: day.date || formData.value.startDate || dayjs().format('YYYY-MM-DD'),
          timeSlots: day.timeSlots || []
        })),
        totalCost: (itineraryData as any).totalCost || 0,
        summary: (itineraryData as any).summary || '',
        title: (itineraryData as any).title || `${formData.value.destination}之旅`,
          budget: (itineraryData as any).budget || formData.value.preferences?.budget,
          preferences: preferences,
          travelStyle: (itineraryData as any).travelStyle || formData.value.preferences?.travelStyle,
        itinerary: [], // 兼容字段
          recommendations: (itineraryData as any).recommendations || {},
        practicalInfo: (itineraryData as any).practicalInfo
        },
        startDate: formData.value.startDate || dayjs().format('YYYY-MM-DD')
      }
      
    // 3. 后端保存 (合并创建)
    let backendItineraryId: string | undefined
    try {
      const backendItinerary = await createJourneyFromFrontendData(createRequest)
      backendItineraryId = backendItinerary.id
      message.success('行程生成成功！')
    } catch (e: any) {
      console.warn('Backend sync failed, using local fallback', e)
      // 不阻断流程，继续在本地显示
    }

    // 4. 前端列表 Store 同步 (用于本地快速显示)
    const newTravel = travelListStore.createTravel({
      title: (itineraryData as any).title || `${formData.value.destination} 之旅`,
      location: formData.value.destination || '未知目的地',
      description: (itineraryData as any).summary,
      mode: 'planner',
      status: 'active',
      duration: formData.value.days,
      participants: formData.value.participants,
      budget: (itineraryData as any).totalCost || 0,
      data: {
        backendItineraryId,
        days: (itineraryData as any).days || [],
        itineraryData: createRequest.itineraryData // 保存完整副本
      }
    })

    // 5. 跳转
    const targetId = backendItineraryId || newTravel.id
    await router.push(`/travel/${targetId}`)
  } catch (err) {
    console.error('Planner Error:', err)
    message.error(t('common.error') || '生成失败，请重试')
  }
}
</script>

<style scoped>
/* 全局容器：浅灰色背景，居中布局 */
.page-container {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.header-nav {
  width: 100%;
  max-width: 1000px;
  margin-bottom: 16px;
}

.back-button {
  color: #64748b;
  font-weight: 500;
}

.back-button:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

/* 主卡片：包含左右/上下两部分 */
.planner-card {
  width: 100%;
  max-width: 1000px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 顶部 Hero 区域 */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 48px 32px;
  overflow: hidden;
}

.hero-pattern {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  opacity: 0.1;
  background-image: radial-gradient(#ffffff 1px, transparent 1px);
  background-size: 20px 20px;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  backdrop-filter: blur(4px);
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 12px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  max-width: 600px;
  margin-inline: auto;
}

/* 表单区域 */
.form-section-wrapper {
  padding: 40px 32px;
}

.form-content {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 表单组通用样式 */
.group-label {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 8px;
  margin-right: 10px;
  font-size: 14px;
}

.label-hint {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 400;
  margin-left: 8px;
}

/* 输入框定制 */
.custom-input :deep(.ant-input) {
  font-size: 16px;
}

.custom-input :deep(.ant-input-prefix) {
  margin-right: 10px;
}

/* Flex 布局行 */
.form-row {
  display: flex;
  gap: 24px;
}

.flex-1 { flex: 1; }

/* 滑块容器 */
.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.custom-slider { flex: 1; margin: 0 6px; }

.slider-value {
  font-weight: 700;
  color: #2563eb;
  min-width: 48px;
  text-align: right;
}

/* 计数器 */
.counter-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.counter-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.counter-btn:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
}

.counter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.counter-display {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

/* 预算网格 */
.budget-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.budget-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 12px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.budget-card:hover { border-color: #93c5fd; }

.budget-card.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.budget-icon { font-size: 24px; margin-bottom: 8px; }

.budget-label { font-weight: 600; font-size: 14px; color: #1e293b; display: block; }

.budget-desc { font-size: 12px; color: #64748b; margin-top: 2px; }

.check-mark {
  position: absolute;
  top: 8px; right: 8px;
  color: #2563eb;
  font-size: 16px;
}

/* 兴趣标签容器 */
.interests-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.interest-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-icon { margin-right: 6px; font-size: 16px; }

.interest-chip:hover { border-color: #93c5fd; color: #2563eb; }

.interest-chip.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

/* 提交区域 */
.submit-area {
  margin-top: 16px;
}

.generate-btn {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.4);
  transition: transform 0.2s;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -4px rgba(37, 99, 235, 0.5);
}

.submit-hint {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  margin-top: 12px;
}

/* 响应式 */
@media (max-width: 640px) {
  .hero-section { padding: 32px 24px; }
  .form-section-wrapper { padding: 24px 20px; }
  .form-row { flex-direction: column; gap: 24px; }
  .interests-container { grid-template-columns: repeat(2, 1fr); }
  .hero-title { font-size: 26px; }
  .budget-grid { grid-template-columns: 1fr; }
}
</style>

<template>
  <div class="container">
    <!-- 头部导航栏 -->
    <div class="header">
      <div class="header-left">
        <h2 class="title">🗺️ {{ t('travelList.title') }}</h2>
      </div>
      <div class="header-right">
        <div v-if="currentUser" class="user-profile">
          <a-avatar :size="40" :src="currentUser.avatarUrl" class="user-avatar">
            {{ (currentUser.nickname || currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase() }}
          </a-avatar>
          <div class="user-text">
            <div class="user-name">{{ currentUser.nickname || currentUser.name || currentUser.email }}</div>
            <div class="user-email">{{ currentUser.email }}</div>
          </div>
        </div>
        <a-button @click="handleLogout" class="logout-btn">
          <template #icon>
            <logout-outlined />
          </template>
          <span>{{ t('travelList.logout') }}</span>
        </a-button>
        <a-button type="primary" @click="showCreateModal" class="new-journey-btn">
          <template #icon>
            <plus-outlined />
          </template>
          {{ t('travelList.newJourney') }}
        </a-button>
      </div>
    </div>

    <!-- 创建旅程模态框 -->
    <a-modal
      v-model:open="createModalVisible"
      :title="null"
      :footer="null"
      width="720px"
      :maskClosable="false"
      class="create-journey-modal"
    >
      <div class="plan-form-container">
        <!-- 横幅标题区域 -->
        <div class="hero-banner">
          <div class="hero-content">
            <h1 class="hero-title">{{ $t('planner.heroTitle') }}</h1>
            <p class="hero-subtitle">{{ $t('planner.heroSubtitle') }}</p>
          </div>
        </div>

        <!-- 表单内容 -->
        <div class="form-content">
          <!-- 目的地输入 -->
          <div class="form-section">
            <div class="form-label-row">
              <label class="form-label">
                <environment-outlined class="label-icon" />
                {{ $t('planner.step1.label') }}
              </label>
              <a 
                v-if="!needInspiration"
                class="inspiration-link" 
                href="javascript:void(0)"
                @click="needInspiration = true"
              >
                {{ $t('planner.needInspiration') }}
              </a>
              <a 
                v-else
                class="inspiration-link" 
                href="javascript:void(0)"
                @click="needInspiration = false"
              >
                {{ $t('planner.haveDestination') }}
              </a>
            </div>
            
            <!-- 普通输入模式 -->
            <div v-if="!needInspiration" class="destination-input-wrapper">
              <a-input
                :value="formData.destination"
                @update:value="(value) => travelStore.setPlannerData({ destination: value })"
                size="large"
                :placeholder="$t('planner.step1.placeholder')"
                class="destination-input"
              />
            </div>
            
            <!-- 推荐模式 -->
            <div v-else class="recommendation-box">
              <div class="recommendation-content">
                <div class="recommendation-icon">
                  <compass-outlined />
                </div>
                <div class="recommendation-text">
                  {{ $t('planner.recommendationHint') }}
                </div>
              </div>
            </div>
          </div>

          <!-- 天数滑块和旅行者数量（一行显示） -->
          <div class="form-section form-section-row">
            <!-- 行程天数 -->
            <div class="form-item-half">
              <label class="form-label">
                <calendar-outlined class="label-icon" />
                {{ $t('planner.step2.label') }}
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
                <div class="duration-value">{{ formData.days || 3 }}{{ $t('common.day') }}</div>
              </div>
            </div>
            <!-- 出行人数 -->
            <div class="form-item-half">
              <label class="form-label">
                <team-outlined class="label-icon" />
                {{ $t('planner.step3.label') }}
              </label>
              <div class="travelers-input-wrapper">
                <a-button 
                  class="number-btn" 
                  @click="decreaseTravelers"
                  :disabled="(formData.participants || 1) <= 1"
                >
                  <minus-outlined />
                </a-button>
                <div class="travelers-display">{{ formData.participants || 1 }}{{ $t('common.people') }}</div>
                <a-button 
                  class="number-btn" 
                  @click="increaseTravelers"
                  :disabled="(formData.participants || 1) >= 20"
                >
                  <plus-outlined />
              </a-button>
            </div>
            </div>
          </div>

          <!-- 预算等级 -->
          <div class="form-section">
            <label class="form-label">
              <dollar-outlined class="label-icon" />
              {{ $t('planner.step4.label') }}
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
              兴趣偏好
            </label>
            <div class="interests-grid">
              <span
                v-for="option in preferenceOptions" 
                :key="option.value" 
                :class="['interest-btn', { active: (formData.preferences?.interests || []).includes(option.value) }]"
                @click="toggleInterest(option.value)"
              >
                {{ option.label }}
              </span>
            </div>
          </div>

          <!-- 额外描述（可选） -->
          <div class="form-section">
            <label class="form-label">
              <bulb-outlined class="label-icon" />
              其他需求（可选）
            </label>
            <a-textarea
              :value="formData.additionalDescription"
              @update:value="(value) => travelStore.setPlannerData({ additionalDescription: value })"
              :placeholder="'例如：希望行程不要太紧张，想要体验当地文化，或者有特殊要求...'"
              :rows="3"
              :maxlength="500"
              show-count
              class="additional-description-input"
            />
          </div>

          <!-- 开始日期 -->
          <div class="form-section">
            <label class="form-label">
              <calendar-outlined class="label-icon" />
              开始日期
            </label>
            <a-date-picker
              :value="formData.startDate ? dayjs(formData.startDate) : dayjs()"
              @update:value="(value) => travelStore.setPlannerData({ startDate: value ? value.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') })"
              size="large"
              style="width: 100%"
              :placeholder="'请选择开始日期'"
              :disabled-date="(current) => current && current < dayjs().startOf('day')"
            />
          </div>

          <!-- 生成按钮 -->
          <div class="submit-section" v-if="!showRecommendedDestinations">
            <a-button 
              type="primary" 
              size="large" 
              :loading="formLoading || loadingDestinations"
              @click="handleSubmit"
              class="generate-button"
              :disabled="!canSubmit"
            >
              <template #icon>
                <environment-outlined />
              </template>
              {{ formLoading || loadingDestinations ? t('common.loading') : '生成旅行计划' }}
              </a-button>
            </div>
        </div>
      </div>
      
      <!-- 推荐目的地列表 -->
      <div v-if="showRecommendedDestinations" class="recommended-destinations-section">
        <h3 class="recommended-destinations-title">为您推荐的目的地</h3>
        <div class="destinations-grid">
          <div 
            v-for="(dest, index) in recommendedDestinations" 
            :key="index"
            class="destination-card"
          >
            <div class="destination-card-image">
              <img 
                :src="getDestinationImage(dest)" 
                :alt="dest.name"
                @error="handleImageError"
              />
              <div class="destination-card-title">{{ dest.name }}</div>
            </div>
            <div class="destination-card-content">
              <p class="destination-description">{{ dest.description }}</p>
              
              <div class="destination-feature">
                <check-circle-outlined class="feature-icon" />
                <span class="feature-text">{{ dest.feature }}</span>
              </div>
              
              <div class="destination-price">
                <dollar-outlined class="price-icon" />
                <span>人均{{ dest.priceRange }}</span>
              </div>
              
              <div class="destination-highlights">
                <div class="highlights-label">亮点：</div>
                <ul class="highlights-list">
                  <li v-for="(highlight, idx) in dest.highlights" :key="idx">{{ highlight }}</li>
                </ul>
              </div>
              
              <a-button 
                type="primary" 
                block
                class="generate-itinerary-btn"
                :loading="selectedDestinationForGeneration === dest.name && formLoading"
                @click="handleGenerateWithDestination(dest.name)"
              >
                生成行程 →
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 空状态：首次登录或无旅程 -->
      <div v-if="travelList.length === 0" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">🗺️</div>
          <h3 class="empty-title">{{ t('travelList.emptyTitle') }}</h3>
          <p class="empty-description">{{ t('travelList.emptyDescription') }}</p>
          <a-button type="primary" size="large" @click="showCreateModal">
            <template #icon>
              <plus-outlined />
            </template>
            {{ t('travelList.createFirst') }}
          </a-button>
        </div>
      </div>

      <!-- 旅行列表 -->
      <div v-else class="travel-list">
        <a-row :gutter="[16, 16]">
          <a-col v-for="travel in travelList" :key="travel.id" :xs="24" :sm="12" :lg="8">
            <div 
              class="travel-card-wrapper"
              @click="handleOpenTravel(travel)"
            >
              <!-- 封面图片区域 -->
              <div class="travel-cover-image">
                <img :src="getCoverImage(travel)" :alt="travel.title" />
                <!-- 状态标签 -->
                <div class="status-badge">
                  <a-tag :color="getStatusColor(travel.status)" size="small">
                    {{ getStatusLabel(travel.status) }}
                  </a-tag>
                </div>
                <!-- 签证状态标签 -->
                <div class="visa-badge" v-if="getVisaStatus(travel)">
                  <a-tag :color="getVisaStatusColor(travel)" size="small">
                    {{ getVisaStatusText(travel) }}
                  </a-tag>
                </div>
                <!-- 悬浮操作按钮 -->
                <div class="cover-actions" @click.stop>
                  <a-button 
                    type="text" 
                    size="small" 
                    @click="handleEdit(travel, $event)"
                    class="cover-action-btn"
                  >
                    <template #icon>
                      <edit-outlined />
                    </template>
                  </a-button>
                  <a-button 
                    type="text" 
                    danger
                    size="small" 
                    @click="handleDelete(travel, $event)"
                    class="cover-action-btn"
                  >
                    <template #icon>
                      <delete-outlined />
                    </template>
                  </a-button>
                </div>
              </div>

              <!-- 内容区域 -->
              <div class="travel-card-body">
                <!-- 标题 -->
                <h3 class="travel-title">{{ travel.title }}</h3>

                <!-- 行程信息 -->
                <div class="travel-info">
                  <div class="info-item">
                    <environment-outlined class="info-icon" />
                    <span class="info-text">{{ travel.location }}</span>
                  </div>
                  <div class="info-item">
                    <calendar-outlined class="info-icon" />
                    <span class="info-text">{{ getDateRange(travel) }} ({{ travel.duration || 1 }}{{ t('travelList.day') }})</span>
                  </div>
                  <div class="info-item">
                    <user-outlined class="info-icon" />
                    <span class="info-text">{{ travel.participants || 1 }}{{ t('travelList.peopleTraveling') }}</span>
                  </div>
                </div>

                <!-- 描述 -->
                <div class="travel-description">
                  <bulb-outlined class="desc-icon" />
                  <p>{{ travel.description || getQuote(travel) }}</p>
                </div>

                <!-- 预算信息 -->
                <div class="travel-budget">
                  <div class="budget-label">{{ t('travelList.budget') }}</div>
                  <div class="budget-amount">
                    <span class="budget-spent">{{ formatBudgetAmount(travel.spent || 0, travel) }}</span>
                    <span class="budget-separator">/</span>
                    <span class="budget-total">{{ formatBudgetAmount(travel.budget || 5000, travel) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore, type Travel } from '@/stores/travelList'
import { useI18n } from 'vue-i18n'
import { Modal, message } from 'ant-design-vue'
import { getVisaInfo, type VisaInfo } from '@/config/visa'
import { getUserNationalityCode } from '@/config/userProfile'
import { PRESET_COUNTRIES } from '@/constants/countries'
import { deleteItinerary, createJourneyFromFrontendData, updateJourneyFromFrontendData } from '@/services/itineraryAPI'
import { detectIntent, recommendDestinations } from '@/services/inspirationBackendAPI'
import { getCurrencyForDestination, formatCurrency } from '@/utils/currency'
import { getDefaultCurrency } from '@/config/currency'
import dayjs from 'dayjs'

const { t } = useI18n()
import {
  PlusOutlined,
  LogoutOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  BulbOutlined,
  CompassOutlined,
  TeamOutlined,
  DollarOutlined,
  HeartOutlined,
  MinusOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

// 获取旅行列表
const travelList = computed(() => travelListStore.travelList)
const currentUser = computed(() => userStore.user)

// 签证信息缓存（key: travelId, value: VisaInfo | null）
const visaInfoCache = ref<Map<string, VisaInfo | null>>(new Map())
const visaInfoLoading = ref<Set<string>>(new Set())

const loading = ref(false)

// 创建模态框相关状态
const createModalVisible = ref(false)
const formLoading = ref(false)
const formData = computed(() => travelStore.plannerData)
const needInspiration = ref(false) // 是否需要灵感推荐

// 推荐目的地相关状态
const showRecommendedDestinations = ref(false)
const recommendedDestinations = ref<any[]>([])
const loadingDestinations = ref(false)
const selectedDestinationForGeneration = ref<string | null>(null)

// 加载单个行程的签证信息
const loadVisaInfoForTravel = async (travel: Travel) => {
  const travelId = travel.id
  const countryCode = extractDestinationCountry(travel)
  
  if (!countryCode) {
    visaInfoCache.value.set(travelId, null)
    return
  }
  
  // 如果正在加载或已缓存，跳过
  if (visaInfoLoading.value.has(travelId) || visaInfoCache.value.has(travelId)) {
    return
  }
  
  const nationalityCode = getUserNationalityCode()
  if (!nationalityCode) {
    visaInfoCache.value.set(travelId, null)
    return
  }
  
  visaInfoLoading.value.add(travelId)
  try {
    const result = await getVisaInfo(countryCode, nationalityCode, null)
    const visaInfo = Array.isArray(result) && result.length > 0 ? result[0] : null
    visaInfoCache.value.set(travelId, visaInfo)
  } catch (error) {
    console.error(`加载行程 ${travelId} 的签证信息失败:`, error)
    visaInfoCache.value.set(travelId, null)
  } finally {
    visaInfoLoading.value.delete(travelId)
  }
}

// 批量加载所有行程的签证信息
const loadAllVisaInfo = async () => {
  const promises = travelList.value.map(travel => loadVisaInfoForTravel(travel))
  await Promise.all(promises)
}

// 组件挂载时从后端同步数据
onMounted(async () => {
  // 总是从后端获取行程列表（不再从本地存储加载）
  loading.value = true
  try {
    if (userStore.isLoggedIn) {
      await travelListStore.syncFromBackend()
    } else {
      // 如果未登录，清空列表
      travelListStore.clearAll()
    }
  } catch (error) {
    console.error('同步行程列表失败:', error)
    message.error('加载行程列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
  
  // 检查是否有待处理的意图
  const pendingIntent = userStore.pendingIntent
  if (pendingIntent && userStore.isLoggedIn) {
    // 根据意图创建旅程
    handleCreateFromIntent(pendingIntent)
    userStore.clearIntent()
  }
  
  // 加载所有行程的签证信息
  await loadAllVisaInfo()
})

// 监听行程列表变化，自动加载新行程的签证信息
watch(travelList, (newList, oldList) => {
  const oldIds = new Set(oldList?.map(t => t.id) || [])
  const newTravels = newList?.filter(t => !oldIds.has(t.id)) || []
  
  if (newTravels.length > 0) {
    newTravels.forEach(travel => loadVisaInfoForTravel(travel))
  }
}, { deep: true })

// 从意图创建旅程
const handleCreateFromIntent = (intent: any) => {
  const modeData = {
    planner: {
      title: '新的旅行计划',
      location: '待定',
      description: '开始规划你的旅程',
      mode: 'planner' as const
    },
  }
  
  const travelData = modeData[intent.mode] || modeData.planner
  travelListStore.createTravel({
    ...travelData,
    status: 'draft' as const
  })
  
  message.success('已为你创建新旅程！')
}

// 创建旅程 - 显示模态框
const showCreateModal = () => {
  // 初始化表单数据
  if (!formData.value.startDate) {
    travelStore.setPlannerData({ startDate: dayjs().format('YYYY-MM-DD') })
  }
  if (!formData.value.days) {
    travelStore.setPlannerData({ days: 3 })
  }
  if (!formData.value.participants) {
    travelStore.setPlannerData({ participants: 1 })
  }
  // 重置推荐模式状态
  needInspiration.value = false
  showRecommendedDestinations.value = false
  recommendedDestinations.value = []
  selectedDestinationForGeneration.value = null
  createModalVisible.value = true
}

// 预算按钮选项
const budgetButtonOptions = computed(() => [
  { value: 'low', label: t('planner.budgetRanges.economy') || 'Budget' },
  { value: 'medium', label: t('planner.budgetRanges.comfort') || 'Moderate' },
  { value: 'high', label: t('planner.budgetRanges.luxury') || 'Luxury' }
])

// 兴趣选项
const preferenceOptions = computed(() => {
  return [
    { value: 'culture', label: '历史文化', icon: '🏛️' },
    { value: 'nature', label: '自然风光', icon: '🌲' },
    { value: 'food', label: '美食探店', icon: '🍜' },
    { value: 'adventure', label: '冒险运动', icon: '🏔️' },
    { value: 'art', label: '艺术博物馆', icon: '🎨' },
    { value: 'shopping', label: '购物血拼', icon: '🛍️' },
    { value: 'relaxation', label: '休闲疗养', icon: '🏖️' },
    { value: 'nightlife', label: '夜生活', icon: '🌃' },
    { value: 'photography', label: '摄影采风', icon: '📸' },
    { value: 'family', label: '亲子游', icon: '👨‍👩‍👧‍👦' }
  ]
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

// 验证是否可以提交（允许没有目的地，因为可以推荐）
const canSubmit = computed(() => {
  return formData.value.days &&
         formData.value.days >= 1 && 
         formData.value.days <= 30 &&
         formData.value.preferences?.budget
})

// 从结构化数据构建自然语言描述
const buildNaturalLanguageDescription = (data: typeof formData.value): string => {
  // 如果用户填写了额外描述，优先使用它，并补充结构化信息
  if (data.additionalDescription && data.additionalDescription.trim().length > 0) {
    const parts: string[] = [data.additionalDescription.trim()]
    
    // 补充关键信息（如果额外描述中没有提到）
    const description = data.additionalDescription.toLowerCase()
    
    if (!description.includes(data.destination?.toLowerCase() || '')) {
      parts.push(`目的地是${data.destination}`)
    }
    
    if (data.days && !description.includes(`${data.days}天`) && !description.includes('天数')) {
      parts.push(`计划${data.days}天`)
    }
    
    if (data.participants && data.participants > 1 && !description.includes('人')) {
      parts.push(`${data.participants}人同行`)
    }
    
    if (data.preferences?.budget) {
      const budgetMap: Record<string, string> = {
        low: '经济型预算',
        medium: '舒适型预算',
        high: '豪华型预算'
      }
      const budgetText = budgetMap[data.preferences.budget] || data.preferences.budget
      if (!description.includes('预算') && !description.includes(budgetText)) {
        parts.push(budgetText)
      }
    }
    
    return parts.join('，') + '。'
  }
  
  // 如果没有额外描述，使用结构化数据构建
  const parts: string[] = []
  
  // 目的地
  if (data.destination) {
    parts.push(`我想去${data.destination}`)
  }
  
  // 天数
  if (data.days) {
    parts.push(`计划${data.days}天`)
  }
  
  // 人数
  if (data.participants && data.participants > 1) {
    parts.push(`${data.participants}人同行`)
  }
  
  // 预算
  if (data.preferences?.budget) {
    const budgetMap: Record<string, string> = {
      low: '经济型预算',
      medium: '舒适型预算',
      high: '豪华型预算'
    }
    parts.push(budgetMap[data.preferences.budget] || data.preferences.budget)
  }
  
  // 兴趣偏好
  if (data.preferences?.interests && data.preferences.interests.length > 0) {
    const interestLabels = data.preferences.interests.map(value => {
      const option = preferenceOptions.value.find(opt => opt.value === value)
      return option?.label || value
    })
    parts.push(`喜欢${interestLabels.join('、')}`)
  }
  
  return parts.join('，') + '。'
}

// 生成占位符图片（SVG数据URI）
const generatePlaceholderImage = (text: string = 'Destination'): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#grad)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="24" fill="white" opacity="0.9">
        ${text}
      </text>
    </svg>
  `.trim()
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

// 获取目的地图片（占位符或实际图片）
const getDestinationImage = (dest: any): string => {
  // 如果有图片URL，使用它
  if (dest.image) return dest.image
  // 否则使用SVG占位符
  return generatePlaceholderImage(dest.name || 'Destination')
}

// 处理图片加载错误
const handleImageError = (event: any) => {
  // 如果已经是占位符，就不再尝试替换
  if (event.target.src && event.target.src.startsWith('data:image/svg+xml')) {
    return
  }
  // 使用SVG占位符替换
  event.target.src = generatePlaceholderImage('Destination')
}

// 调用推荐目的地接口
const loadRecommendedDestinations = async () => {
  loadingDestinations.value = true
  showRecommendedDestinations.value = false
  recommendedDestinations.value = []
  
  try {
    // 构建自然语言描述
    const naturalLanguageInput = buildNaturalLanguageDescription(formData.value)
    console.log('📝 [Planner] 构建的自然语言描述（用于推荐）:', naturalLanguageInput)
    
    // 调用意图识别接口
    let intentData = null
    try {
      intentData = await detectIntent({
        input: naturalLanguageInput,
        language: 'zh-CN',
        interests: formData.value.preferences?.interests,
        budget: formData.value.preferences?.budget,
        days: formData.value.days
      })
    } catch (intentError: any) {
      console.warn('⚠️ [Planner] 意图识别失败，继续推荐:', intentError.message)
    }
    
    // 获取用户信息（用于推荐）
    const { getUserLocationCode, getUserNationalityCode } = await import('@/config/userProfile')
    const userCountry = getUserLocationCode() || undefined
    const userNationality = getUserNationalityCode() || undefined
    
    // 调用推荐目的地接口
    const recommendationResult = await recommendDestinations({
      input: naturalLanguageInput,
      intent: intentData ? {
        intentType: intentData.intentType,
        keywords: intentData.keywords,
        emotionTone: intentData.emotionTone
      } : undefined,
      language: 'zh-CN',
      userCountry,
      userNationality,
      limit: 12
    })
    
    // 处理推荐结果，转换为卡片数据格式
    const destinations = recommendationResult.locations.map((location: string) => {
      const details = recommendationResult.locationDetails?.[location] || {}
      return {
        name: location,
        country: details.country || '',
        description: details.description || `探索${location}的精彩之旅`,
        highlights: details.highlights || [],
        bestSeason: details.bestSeason || '',
        // 根据预算和天数估算价格范围
        priceRange: estimatePriceRange(formData.value.preferences?.budget, formData.value.days),
        // 根据意图和偏好生成特色说明
        feature: generateFeatureText(location, intentData, formData.value)
      }
    })
    
    recommendedDestinations.value = destinations
    showRecommendedDestinations.value = true
    console.log('✅ [Planner] 推荐目的地成功:', destinations.length, '个目的地')
  } catch (error: any) {
    console.error('❌ [Planner] 推荐目的地失败:', error)
    message.error('推荐目的地失败，请重试')
  } finally {
    loadingDestinations.value = false
  }
}

// 估算价格范围（根据预算和天数）
const estimatePriceRange = (budget?: string, days?: number): string => {
  const dayCount = days || 3
  const ranges: Record<string, { min: number; max: number }> = {
    low: { min: 3000, max: 6000 },
    medium: { min: 8000, max: 15000 },
    high: { min: 15000, max: 30000 }
  }
  const range = ranges[budget || 'medium']
  const min = range.min * dayCount
  const max = range.max * dayCount
  return `¥${min.toLocaleString()} - ¥${max.toLocaleString()}`
}

// 生成特色说明文本
const generateFeatureText = (location: string, intent: any, formData: any): string => {
  const parts: string[] = []
  
  if (intent?.intentType) {
    const intentMap: Record<string, string> = {
      photography_exploration: '摄影探索',
      cultural_exchange: '文化交流',
      emotional_healing: '情感疗愈',
      mind_healing: '心灵疗愈',
      extreme_exploration: '极限探索',
      urban_creation: '城市创作'
    }
    parts.push(intentMap[intent.intentType] || intent.intentType)
  }
  
  if (formData.preferences?.interests && formData.preferences.interests.length > 0) {
    const interestLabels = formData.preferences.interests.map((value: string) => {
      const option = preferenceOptions.value.find(opt => opt.value === value)
      return option?.label || value
    })
    parts.push(interestLabels.join('、'))
  }
  
  const budgetMap: Record<string, string> = {
    low: '经济型',
    medium: '舒适型',
    high: '豪华型'
  }
  const budgetText = budgetMap[formData.preferences?.budget || 'medium'] || '舒适型'
  
  const participantText = formData.participants && formData.participants > 1 
    ? `${formData.participants}人` 
    : '单人'
  
  return `${location}完美契合您对"${parts.join('、') || '旅行'}"的兴趣，提供多样化的体验。作为"${budgetText}"预算的${participantText}旅行者，您可以享受${budgetText}的行程安排和${budgetText}服务，确保${formData.days || 3}天内体验到最独特的旅行乐趣。`
}

// 使用选定的目的地生成行程
const handleGenerateWithDestination = async (destination: string) => {
  selectedDestinationForGeneration.value = destination
  
  // 设置目的地
  travelStore.setPlannerData({ destination })
  
  // 隐藏推荐列表
  showRecommendedDestinations.value = false
  
  // 调用生成行程
  await handleSubmit()
  
  selectedDestinationForGeneration.value = null
}

// 提交表单
const handleSubmit = async () => {
  if (!canSubmit.value) {
    message.warning('请完成必填项后再提交')
    return
  }

  // 如果没有目的地，先调用推荐接口
  if (!formData.value.destination || formData.value.destination.trim().length === 0) {
    await loadRecommendedDestinations()
    return
  }

  formLoading.value = true
  try {
    // 步骤1: 从结构化数据构建自然语言描述
    const naturalLanguageInput = buildNaturalLanguageDescription(formData.value)
    console.log('📝 [Planner] 构建的自然语言描述:', naturalLanguageInput)
    
    // 步骤2: 调用意图识别接口
    let intentData = null
    try {
      console.log('🔍 [Planner] 开始调用意图识别接口...')
      intentData = await detectIntent({
        input: naturalLanguageInput,
        language: 'zh-CN',
        interests: formData.value.preferences?.interests,
        budget: formData.value.preferences?.budget,
        days: formData.value.days
      })
      console.log('✅ [Planner] 意图识别成功:', {
        intentType: intentData.intentType,
        keywords: intentData.keywords,
        emotionTone: intentData.emotionTone,
        confidence: intentData.confidence
      })
    } catch (intentError: any) {
      console.warn('⚠️ [Planner] 意图识别失败，继续使用结构化数据:', intentError.message)
      // 意图识别失败不影响主流程，继续生成行程
    }
    
    // 步骤3: 生成行程（传入意图信息作为上下文）
    await travelStore.generateItinerary('planner', intentData)
    const itineraryData = travelStore.itineraryData
    if (!itineraryData) {
      throw new Error('行程生成失败')
    }
    
    // 保存行程到后端
    let backendItineraryId: string | undefined
    try {
      const days = (itineraryData as any).days && (itineraryData as any).days.length > 0
        ? (itineraryData as any).days
        : [{
            day: 1,
            date: formData.value.startDate || dayjs().format('YYYY-MM-DD'),
            timeSlots: []
          }]
      
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
          // 后端期望 preferences 是字符串数组，传递 interests 数组
          preferences: formData.value.preferences?.interests || []
        },
        startDate: formData.value.startDate || dayjs().format('YYYY-MM-DD')
      }
      
      const baseJourney = await createJourneyFromFrontendData(createRequest)
      backendItineraryId = baseJourney.id
      
      if (!backendItineraryId) {
        console.error('[TravelListView] 创建行程后未获取到 backendItineraryId:', baseJourney)
        throw new Error('创建行程失败：未获取到有效的行程ID')
      }
      
      console.log('[TravelListView] 成功创建行程，backendItineraryId:', backendItineraryId)
      
      const updateRequest = {
        itineraryData: {
          destination: itineraryData.destination,
          duration: itineraryData.days?.length || formData.value.days,
          budget: (itineraryData as any).budget || formData.value.preferences?.budget,
          // 后端期望 preferences 是字符串数组，传递 interests 数组
          preferences: Array.isArray((itineraryData as any).preferences) 
            ? (itineraryData as any).preferences 
            : (formData.value.preferences?.interests || []),
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
      
      await updateJourneyFromFrontendData(backendItineraryId, updateRequest)
    } catch (err: any) {
      console.error('保存到后端失败:', err)
      message.warning('保存到数据库失败，将使用临时数据')
    }
    
    // 创建 Travel 对象
    const travelData: any = {
      backendItineraryId: backendItineraryId,
      days: (itineraryData as any).days || [],
      destination: itineraryData.destination,
      title: (itineraryData as any).title || `${formData.value.destination}之旅`,
      totalCost: (itineraryData as any).totalCost || 0,
      summary: (itineraryData as any).summary || '',
      // 保存意图识别信息（如果存在）
      detectedIntent: (itineraryData as any).detectedIntent || null,
      itineraryData: {
        days: (itineraryData as any).days || [],
        destination: itineraryData.destination,
        title: (itineraryData as any).title || `${formData.value.destination}之旅`,
        totalCost: (itineraryData as any).totalCost || 0,
        summary: (itineraryData as any).summary || '',
        duration: itineraryData.duration,
        budget: itineraryData.budget,
        preferences: itineraryData.preferences,
        travelStyle: itineraryData.travelStyle,
        // 保存意图识别信息（如果存在）
        detectedIntent: (itineraryData as any).detectedIntent || null
      }
    }
    
    const newTravel = travelListStore.createTravel({
      title: (itineraryData as any).title || `${formData.value.destination}之旅`,
      location: formData.value.destination,
      description: (itineraryData as any).summary || `精心安排的${formData.value.days}天${formData.value.destination}之旅`,
      mode: 'planner' as const,
      status: 'active',
      duration: formData.value.days,
      participants: formData.value.participants || 1,
      budget: (itineraryData as any).totalCost || 0,
      data: travelData
    })
    
    message.success('行程生成成功！')
    
  // 关闭模态框
  createModalVisible.value = false
  
    // 跳转到详情页
    // 优先使用 backendItineraryId（UUID格式），如果不存在则使用临时ID（TravelDetailView会从store中查找backendItineraryId）
    const targetId = backendItineraryId || newTravel?.id
    console.log('[TravelListView] 准备跳转到详情页:', {
      backendItineraryId,
      newTravelId: newTravel?.id,
      targetId,
      hasBackendId: !!backendItineraryId,
      travelDataBackendId: newTravel?.data?.backendItineraryId
    })
    
    if (targetId) {
      // 如果 backendItineraryId 存在，直接使用它（UUID格式，TravelDetailView可以直接使用）
      // 如果不存在，使用临时ID，TravelDetailView会从store中查找对应的backendItineraryId
      await router.push(`/travel/${targetId}`)
  } else {
      console.error('[TravelListView] 无法跳转：没有有效的行程ID')
      message.warning('行程创建成功，但无法跳转到详情页')
    }
  } catch (err) {
    console.error('生成行程失败:', err)
    message.error('生成行程失败，请重试')
  } finally {
    formLoading.value = false
  }
}

// 打开旅程详情（点击卡片）
const handleOpenTravel = async (travel: Travel) => {
  console.log('打开旅程:', travel)
  console.log('旅程 ID:', travel.id)
  console.log('后端 ID:', travel.data?.backendItineraryId)
  
  // 使用 backendItineraryId 优先，如果没有则使用 id
  const journeyId = travel.data?.backendItineraryId || travel.id
  
  if (!journeyId) {
    console.error('无法打开旅程：缺少 ID')
    message.error('无法打开旅程：缺少行程 ID')
    return
  }
  
  // 跳转到旅行详情页
  console.log('准备跳转到详情页，ID:', journeyId)
  try {
    await router.push(`/travel/${journeyId}`)
    console.log('路由跳转成功')
  } catch (error: any) {
    console.error('路由跳转失败:', error)
    message.error('无法打开旅程详情页，请重试')
  }
}

// 编辑旅程
const handleEdit = (travel: Travel, e: Event) => {
  e.stopPropagation()
  Modal.info({
    title: t('travelList.editJourney'),
    content: t('travelList.editFeatureDeveloping'),
    okText: t('common.confirm')
  })
}

// 编辑封面
const handleEditCover = (travel: Travel, e: Event) => {
  e.stopPropagation()
  Modal.info({
    title: t('travelList.editCover'),
    content: t('travelList.coverEditDeveloping'),
    okText: t('common.confirm')
  })
}

// 删除旅程
const handleDelete = async (travel: Travel, e: Event) => {
  e.stopPropagation()
  
  Modal.confirm({
    title: t('travelList.confirmDelete'),
    content: t('travelList.confirmDeleteContent', { title: travel.title }),
    okText: t('travelList.deleteJourney'),
    okType: 'danger',
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        // 如果行程有后端ID，先调用后端API删除
        const backendId = travel.data?.backendItineraryId || travel.id
        if (userStore.isLoggedIn && backendId) {
          try {
            await deleteItinerary(backendId)
          } catch (error) {
            // 如果后端删除失败，但可能是本地创建的行程，继续从本地删除
            console.warn('后端删除失败，尝试从本地删除:', error)
          }
        }
        
        // 从本地列表移除
        const success = travelListStore.deleteTravel(travel.id)
        if (success) {
          message.success(t('travelList.deleteSuccess'))
          // 刷新列表以确保数据同步
          if (userStore.isLoggedIn) {
            await travelListStore.syncFromBackend()
          }
        } else {
          message.error(t('travelList.deleteFailed'))
        }
      } catch (error: any) {
        console.error('删除行程失败:', error)
        message.error(t('travelList.deleteFailed') + ': ' + (error.message || '未知错误'))
      }
    }
  })
}

// 登出
const handleLogout = () => {
  Modal.confirm({
    title: '确认登出',
    content: '确定要退出登录吗？',
    okText: '登出',
    cancelText: '取消',
    onOk: async () => {
      await userStore.logout()
      travelListStore.clearAll()
      message.success('已退出登录')
      router.push('/')
    }
  })
}


// 获取模式颜色
const getModeColor = (mode: string) => {
  const colors: { [key: string]: string } = {
    planner: 'blue',
    seeker: 'pink',
    inspiration: 'green'
  }
  return colors[mode] || 'default'
}

// 获取模式标签
const getModeLabel = (mode: string) => {
  const labels: { [key: string]: string } = {
    planner: '规划',
    seeker: '随心',
    inspiration: '灵感'
  }
  return t(`travelList.travelMode.${mode}` as any)
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 获取模式样式类
const getModeClass = (mode: string) => {
  return `mode-${mode}`
}

// 获取模式图标
const getModeEmoji = (mode: string) => {
  const emojis: { [key: string]: string } = {
    planner: '✈️',
    seeker: '🌿',
    inspiration: '💡'
  }
  return emojis[mode] || '🗺️'
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    draft: 'default',
    active: 'processing',
    completed: 'success'
  }
  return colors[status] || 'default'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    draft: '草稿',
    active: '进行中',
    completed: '已完成'
  }
  return labels[status] || status
}

// 获取封面图片
const getCoverImage = (travel: Travel) => {
  if (travel.coverImage) {
    return travel.coverImage
  }
  // 使用不同模式的默认图片
  const images: { [key: string]: string } = {
    planner: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    seeker: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73bbf?w=800',
    inspiration: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  }
  return images[travel.mode] || images.planner
}

// 获取日期范围
const getDateRange = (travel: Travel) => {
  if (travel.startDate && travel.endDate) {
    const start = new Date(travel.startDate).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    })
    const end = new Date(travel.endDate).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    })
    return `${start} ~ ${end}`
  }
  return '待定'
}

// 获取旅程引用文案
const getQuote = (travel: Travel) => {
  const quotes: { [key: string]: string } = {
    planner: '一次精心安排的完美旅程',
    seeker: '让心情指引我的旅程',
    inspiration: '将灵感转化为真实体验'
  }
  return quotes[travel.mode] || '一次美好的旅程'
}

// 提取目的地国家代码
const extractDestinationCountry = (travel: Travel) => {
  // 1. 从 location 字段提取
  if (travel.location) {
    for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
      if (travel.location.includes(country.name) || travel.location.includes(code)) {
        return code
      }
    }
  }
  
  // 2. 从 destination 字段提取
  if (travel.data?.destination) {
    const destStr = travel.data.destination
    for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
      if (destStr.includes(country.name) || destStr.includes(code)) {
        return code
      }
    }
  }
  
  return null
}

// 获取签证状态（从缓存中读取）
const getVisaStatus = (travel: Travel) => {
  const visaInfo = visaInfoCache.value.get(travel.id)
  return visaInfo || null
}

// 获取签证状态文本
const getVisaStatusText = (travel: Travel) => {
  const visaInfo = getVisaStatus(travel)
  if (!visaInfo) return ''
  
  const typeMap: Record<string, string> = {
    'visa-free': '✅ 免签',
    'visa-on-arrival': '🛬 落地签',
    'e-visa': '💻 电子签',
    'visa-required': '⚠️ 需签证',
    'permanent-resident-benefit': '🪪 永久居民便利'
  }
  
  return typeMap[visaInfo.visaType] || '签证信息'
}

// 根据目的地格式化预算金额
const formatBudgetAmount = (amount: number, travel: Travel) => {
  const destination = travel.location || travel.destination || travel.data?.destination || ''
  if (!destination) {
    // 如果没有目的地，使用系统配置的默认货币
    return formatCurrency(amount, getDefaultCurrency())
  }
  
  const currency = getCurrencyForDestination(destination)
  return formatCurrency(amount, currency)
}

// 获取签证状态颜色
const getVisaStatusColor = (travel: Travel) => {
  const visaInfo = getVisaStatus(travel)
  if (!visaInfo) return 'default'
  
  const colorMap: Record<string, string> = {
    'visa-free': 'success',
    'visa-on-arrival': 'processing',
    'e-visa': 'cyan',
    'visa-required': 'warning',
    'permanent-resident-benefit': 'blue'
  }
  
  return colorMap[visaInfo.visaType] || 'default'
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto 2rem;
}

.title {
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 999px;
  color: white;
  backdrop-filter: blur(6px);
}

.user-avatar {
  background-color: #1890ff;
}

.user-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.user-name {
  font-weight: 600;
  color: white;
}

.user-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: 40px !important;
}

.new-journey-btn {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  border: none !important;
  height: 40px !important;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* 空状态样式 */
.empty-state {
  padding: 4rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-content {
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.empty-title {
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin-bottom: 2rem;
}


.create-btn {
  border-radius: 6px !important;
  height: 40px !important;
}

/* 旅行列表样式 */
.travel-list {
  margin-top: 1rem;
}

.travel-card-wrapper {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.travel-card-wrapper:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 封面图片区域 */
.travel-cover-image {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
}

.travel-cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.visa-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
}

.cover-actions {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
}

.travel-card-wrapper:hover .cover-actions {
  opacity: 1;
}

.cover-action-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: none !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cover-action-btn:hover {
  background: rgba(255, 255, 255, 1) !important;
  transform: scale(1.05);
}

/* 内容区域 */
.travel-card-body {
  padding: 1.25rem;
}

.travel-info {
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.info-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.info-text {
  color: #666;
}

.travel-quote {
  padding: 0.75rem;
  background: #f8f9fa;
  border-left: 3px solid #667eea;
  border-radius: 4px;
  color: #666;
  font-style: italic;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.travel-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  flex: 1;
  min-width: 80px;
}

.action-button {
  flex: 1;
  min-width: 80px;
}

.action-button-icon {
  padding: 0 0.5rem !important;
  min-width: auto !important;
}


/* 响应式 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .new-journey-btn {
    width: 100%;
  }
}
/* 创建旅程模态框样式 */
.create-journey-modal :deep(.ant-modal-content) {
  padding: 0;
  border-radius: 24px;
  overflow: hidden;
}

.create-journey-modal :deep(.ant-modal-body) {
  padding: 0;
}

.plan-form-container {
  background: #ffffff;
  overflow: hidden;
  padding: 0px !important;
}

/* 横幅标题区域 */
.hero-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 16px;
  text-align: center;
  color: white;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}


.hero-title {
  font-size: 32px;
  font-weight: 500;
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
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-section-row {
  flex-direction: row;
  gap: 16px;
  align-items: flex-start;
}

.form-item-half {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.label-icon {
  font-size: 14px;
  color: #1890ff;
}

.inspiration-link {
  font-size: 13px;
  color: #1890ff;
  text-decoration: underline;
  cursor: pointer;
}

.inspiration-link:hover {
  color: #096dd9;
}

/* 推荐框样式 */
.recommendation-box {
  width: 100%;
  background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%);
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
}

.recommendation-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recommendation-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #667eea;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recommendation-icon :deep(.anticon) {
  font-size: 20px;
  color: #667eea;
}

.recommendation-text {
  flex: 1;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
}

/* 目的地输入 */
.destination-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.destination-input {
  flex: 1;
}

/* 天数滑块 */
.duration-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-slider {
  flex: 1;
}

.duration-value {
  min-width: 30px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

/* 旅行者数量 */
.travelers-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.number-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  background: #ffffff;
  font-size: 12px;
}

.number-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.travelers-display {
  width: 60px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  padding: 0 8px;
}

/* 预算按钮组 */
.budget-buttons {
  gap: 6px;
  
}

.budget-btn {
  flex: 1;
  height: 32px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  transition: all 0.3s ease;
  padding: 0 32px;
  margin-right: 8px;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;

}

.interest-btn {
  height: 32px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 400;
  border: none;
  background: #f0f4f8;
  color: #4a5568;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: none;
  cursor: pointer;
  padding: 0 12px;
  user-select: none;
  margin-bottom: 8px;
  margin-right: 8px;
}

.interest-btn:hover:not(.active) {
  background: #e2e8f0;
  color: #2d3748;
}

.interest-btn.active {
  background: #1890ff;
  color: white;
}

.interest-btn.active:hover {
  background: #096dd9;
}

/* 额外描述输入框 */
.additional-description-input {
  width: 100%;
}

.additional-description-input :deep(.ant-input) {
  font-size: 13px;
  line-height: 1.5;
}

/* 提交按钮区域 */
.submit-section {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.generate-button {
  width: 100%;
  height: 40px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
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
  
  .destinations-grid {
    grid-template-columns: 1fr;
  }
  
  .recommended-destinations-section {
    padding: 16px;
  }
}

/* 推荐目的地列表样式 */
.recommended-destinations-section {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.recommended-destinations-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
  text-align: center;
}

.destinations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.destination-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.destination-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.destination-card-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.destination-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.destination-card-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: white;
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
}

.destination-card-content {
  padding: 16px;
}

.destination-description {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.destination-feature {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
}

.feature-icon {
  color: #52c41a;
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.feature-text {
  font-size: 13px;
  color: #1f2937;
  line-height: 1.5;
  flex: 1;
}

.destination-price {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #1890ff;
  font-weight: 600;
}

.price-icon {
  font-size: 16px;
}

.destination-highlights {
  margin-bottom: 16px;
}

.highlights-label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.highlights-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.highlights-list li {
  font-size: 13px;
  color: #4a5568;
  line-height: 1.8;
  padding-left: 16px;
  position: relative;
}

.highlights-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #1890ff;
  font-weight: bold;
}

.generate-itinerary-btn {
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  border-radius: 6px;
}

.generate-itinerary-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}
</style>

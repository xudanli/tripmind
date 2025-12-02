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
              <a class="inspiration-link" @click="toggleInspirationMode">
                {{ needInspiration ? $t('planner.haveDestination') : $t('planner.needInspiration') }}
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
                <div class="duration-value">{{ formData.days || 3 }}{{ $t('planner.day') }}</div>
              </div>
            </div>
            <!-- 出行人数 -->
            <div class="form-item-half">
              <label class="form-label">
                <team-outlined class="label-icon" />
                {{ $t('planner.step3.label') }}
              </label>
              <div class="travelers-input-wrapper">
                <a-button class="number-btn" @click="updateParticipants(-1)" :disabled="(formData.participants || 1) <= 1">
                  <minus-outlined />
                </a-button>
                <div class="travelers-display">{{ formData.participants || 1 }}{{ $t('planner.people') }}</div>
                <a-button class="number-btn" @click="updateParticipants(1)" :disabled="(formData.participants || 1) >= 20">
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
                @click="setBudget(option.value)"
              >
                {{ option.label }}
              </a-button>
            </div>
          </div>

          <!-- 兴趣选择 -->
          <div class="form-section">
            <label class="form-label">
              <heart-outlined class="label-icon" />
              {{ $t('planner.step5.label') }}
            </label>
            <div class="interests-grid">
              <span
                v-for="option in preferenceOptions" 
                :key="option.value" 
                :class="['interest-btn', { active: (formData.preferences?.interests || []).includes(option.value) }]"
                @click="toggleInterest(option.value)"
              >
                {{ option.icon }} {{ option.label }}
              </span>
            </div>
          </div>

          <!-- 额外描述（可选） -->
          <div class="form-section">
            <label class="form-label">
              <bulb-outlined class="label-icon" />
              {{ $t('planner.additionalDescription') }}
            </label>
            <a-textarea
              :value="formData.additionalDescription"
              @update:value="(value) => travelStore.setPlannerData({ additionalDescription: value })"
              :placeholder="$t('planner.additionalDescriptionPlaceholder')"
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
              {{ $t('planner.startDate') }}
            </label>
            <a-date-picker
              v-model:value="startDateModel"
              size="large"
              style="width: 100%"
              :disabled-date="disabledDate"
              :allow-clear="false"
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
              {{ formLoading || loadingDestinations ? t('common.loading') : t('planner.generateTravelPlan') }}
              </a-button>
            </div>
        </div>
      </div>
      
      <!-- 推荐目的地列表 -->
      <div v-if="showRecommendedDestinations" class="recommended-destinations-section">
        <div class="section-header">
        <h3 class="recommended-destinations-title">{{ $t('planner.recommendedDestinationsTitle') }}</h3>
          <a-button type="link" @click="showRecommendedDestinations = false">{{ $t('planner.backToEdit') }}</a-button>
        </div>
        
        <div v-if="loadingDestinations" class="loading-state">
          <a-spin :tip="$t('planner.analyzingPreferences')" />
        </div>
        
        <div v-else class="destinations-grid">
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
                <div class="destination-tags">
                  <a-tag color="blue">{{ dest.feature }}</a-tag>
                  <a-tag color="green">{{ $t('planner.perPerson') }} {{ dest.priceRange }}</a-tag>
              </div>
              <a-button 
                type="primary" 
                block
                class="generate-itinerary-btn"
                :loading="selectedDestinationForGeneration === dest.name && formLoading"
                @click="handleGenerateWithDestination(dest.name)"
              >
                {{ $t('planner.generateItinerary') }}
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 行程生成加载页面 -->
    <ItineraryGenerationModal :open="isGenerating" />

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="skeleton-grid">
        <a-card v-for="i in 3" :key="i" class="skeleton-card">
          <a-skeleton active :paragraph="{ rows: 4 }" />
        </a-card>
      </div>

      <!-- 空状态：首次登录或无旅程 -->
      <div v-else-if="travelList.length === 0" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">🗺️</div>
          <h3 class="empty-title">{{ t('travelList.emptyTitle') }}</h3>
          <p class="empty-description">{{ t('travelList.emptyDescription') }}</p>
          <a-button type="primary" size="large" @click="showCreateModal" class="create-first-btn">
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
                <img :src="getCoverImage(travel)" :alt="travel.title" loading="lazy" />
                <!-- 状态标签 -->
                <div class="status-badge">
                  <a-tag :color="getStatusColor(travel.status)">{{ getStatusLabel(travel.status) }}</a-tag>
                </div>
                <!-- 悬浮操作按钮 -->
                <div class="cover-overlay">
                  <div class="cover-actions">
                    <a-button shape="circle" @click.stop="handleEdit(travel, $event)">
                      <template #icon><edit-outlined /></template>
                  </a-button>
                    <a-button shape="circle" danger @click.stop="handleDelete(travel, $event)">
                      <template #icon><delete-outlined /></template>
                  </a-button>
                  </div>
                </div>
              </div>

              <!-- 内容区域 -->
              <div class="travel-card-body">
                <!-- 标题 -->
                <h3 class="travel-title" :title="travel.title">{{ travel.title }}</h3>

                <!-- 行程信息 -->
                <div class="travel-meta">
                  <span class="meta-item"><calendar-outlined /> {{ travel.duration || 1 }}天</span>
                  <span class="meta-item"><user-outlined /> {{ travel.participants || 1 }}人</span>
                  </div>
                <div class="travel-location">
                  <environment-outlined /> {{ travel.location }}
                  </div>
                <div class="travel-footer">
                  <span class="updated-time">{{ formatTimeAgo(travel.updatedAt) }}</span>
                  <span class="budget-tag">{{ formatBudgetAmount(travel.budget || 5000, travel) }}</span>
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
import { deleteItinerary, createJourneyFromFrontendData } from '@/services/itineraryAPI'
import { getCurrencyForDestination, formatCurrency } from '@/utils/currency'
import { getDefaultCurrency } from '@/config/currency'
import dayjs, { type Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import ItineraryGenerationModal from '@/components/ItineraryGenerationModal.vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

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
const isGenerating = ref(false) // 控制加载页面显示
const formData = computed(() => travelStore.plannerData)
const needInspiration = ref(false) // 是否需要灵感推荐

// 推荐目的地相关状态
const showRecommendedDestinations = ref(false)
const recommendedDestinations = ref<Array<{
  name: string
  description: string
  feature: string
  priceRange: string
  highlights?: string[]
  image?: string
}>>([])
const loadingDestinations = ref(false)
const selectedDestinationForGeneration = ref<string | null>(null)

// 日期选择器绑定
const startDateModel = computed({
  get: () => formData.value.startDate ? dayjs(formData.value.startDate) : dayjs(),
  set: (val: Dayjs | null) => {
    travelStore.setPlannerData({ startDate: val ? val.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') })
  }
})

const disabledDate = (current: Dayjs) => current && current < dayjs().startOf('day')

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
  // 重置表单
  travelStore.setPlannerData({
    startDate: dayjs().format('YYYY-MM-DD'),
    days: 3,
    participants: 1,
    preferences: { budget: 'medium', interests: [] },
    destination: '',
    additionalDescription: ''
  })
  needInspiration.value = false
  showRecommendedDestinations.value = false
  createModalVisible.value = true
}

const toggleInspirationMode = () => {
  needInspiration.value = !needInspiration.value
  if (needInspiration.value) {
    travelStore.setPlannerData({ destination: '' })
  }
}

const updateParticipants = (delta: number) => {
  const newVal = (formData.value.participants || 1) + delta
  if (newVal >= 1 && newVal <= 20) {
    travelStore.setPlannerData({ participants: newVal })
  }
}

const setBudget = (budget: string) => {
  travelStore.setPlannerData({
    preferences: { ...formData.value.preferences, budget }
  })
}

// 预算按钮选项
const budgetButtonOptions = [
  { value: 'low', label: '经济型' },
  { value: 'medium', label: '舒适型' },
  { value: 'high', label: '豪华型' }
]

// 兴趣选项
const preferenceOptions = [
    { value: 'culture', label: '历史文化', icon: '🏛️' },
    { value: 'nature', label: '自然风光', icon: '🌲' },
    { value: 'food', label: '美食探店', icon: '🍜' },
    { value: 'adventure', label: '冒险运动', icon: '🏔️' },
    { value: 'art', label: '艺术博物馆', icon: '🎨' },
    { value: 'shopping', label: '购物血拼', icon: '🛍️' },
    { value: 'relaxation', label: '休闲疗养', icon: '🏖️' },
    { value: 'photography', label: '摄影采风', icon: '📸' },
  ]

// 切换兴趣选择
const toggleInterest = (interest: string) => {
  const current = formData.value.preferences?.interests || []
  const newInterests = current.includes(interest)
    ? current.filter(i => i !== interest)
    : [...current, interest]
  
  travelStore.setPlannerData({
    preferences: { ...formData.value.preferences, interests: newInterests }
  })
}

// 验证是否可以提交
const canSubmit = computed(() => {
  // 灵感模式不需要目的地
  if (needInspiration.value) return true
  // 普通模式必须有目的地
  return !!formData.value.destination?.trim()
})


// 模拟推荐目的地 (后续接真实 API)
const loadRecommendedDestinations = async () => {
  loadingDestinations.value = true
  showRecommendedDestinations.value = true
  // 模拟延迟
  setTimeout(() => {
    recommendedDestinations.value = [
      { name: '京都', description: '古老寺庙与现代文化的完美融合', feature: '历史文化', priceRange: '¥8000', highlights: ['清水寺', '伏见稻荷'] },
      { name: '普吉岛', description: '阳光沙滩与潜水爱好者的天堂', feature: '休闲度假', priceRange: '¥5000', highlights: ['皮皮岛', '芭东海滩'] },
    ]
    loadingDestinations.value = false
  }, 1500)
}


const handleGenerateWithDestination = (name: string) => {
  travelStore.setPlannerData({ destination: name })
  handleSubmit()
}

// 提交表单
const handleSubmit = async () => {
  if (!canSubmit.value) return

  // 如果是灵感模式且没有推荐列表，先获取推荐
  if (needInspiration.value && !formData.value.destination) {
    await loadRecommendedDestinations()
    return
  }

  formLoading.value = true
  isGenerating.value = true // 显示加载页面
  try {
    // 步骤1: 识别用户意图（仅在用户填写了额外需求时调用，用于增强行程生成）
    let intentData: any = null
    // 只在有额外需求时才调用意图识别
    if (formData.value.additionalDescription && formData.value.additionalDescription.trim().length > 0) {
      try {
        console.log('🧭 [Planner] 检测到额外需求，正在识别旅行意图...')
        const { createIntentService } = await import('@/services/intentService')
        const intentService = createIntentService()
        // 直接使用 additionalDescription 作为自然语言输入
        const naturalLanguageInput = formData.value.additionalDescription.trim()
        console.log('📝 [Planner] 使用额外需求作为自然语言描述:', naturalLanguageInput)
        intentData = await intentService.detect(naturalLanguageInput, 'zh-CN')
        console.log('✅ [Planner] 意图识别成功:', {
          intentType: intentData.intentType,
          keywords: intentData.keywords,
          confidence: intentData.confidence
        })
      } catch (intentError: any) {
        console.warn('⚠️ [Planner] 意图识别失败，继续生成:', intentError.message)
        // 意图识别失败不影响主流程，继续生成行程
      }
    } else {
      console.log('ℹ️ [Planner] 未填写额外需求，跳过意图识别')
    }
    
    // 1. 调用 LLM 生成
    const mode = needInspiration.value ? 'inspiration' : 'planner'
    await travelStore.generateItinerary(mode, null) // intent 暂时传 null，后续可扩展
    
    const itineraryData = travelStore.itineraryData
    if (!itineraryData) throw new Error('生成数据为空')

    // 2. 构造请求
    const days = (itineraryData as any).days || []
      const createRequest = {
        itineraryData: {
        destination: formData.value.destination || itineraryData.destination,
        duration: days.length || formData.value.days,
        days: days,
          totalCost: (itineraryData as any).totalCost || 0,
          summary: (itineraryData as any).summary || '',
        title: `${formData.value.destination || itineraryData.destination}之旅`,
          preferences: formData.value.preferences?.interests || []
        },
      startDate: formData.value.startDate
    }

    // 3. 核心修改：异步创建，不等待 enrichment
    const res = await createJourneyFromFrontendData(createRequest, {
      enrichWithLocationInfo: false, // ❌ 关键：前端不阻塞
      onProgress: (msg) => console.log(msg)
    })

    if (res.id) {
      // 延迟关闭加载页面，让用户看到完成效果
      await new Promise(resolve => setTimeout(resolve, 500))
      isGenerating.value = false
      
      message.success(t('travelList.createSuccess') || '创建成功')
  createModalVisible.value = false
  
    // 跳转到详情页
      await router.push(`/travel/${res.id}`)
    }
  } catch (err) {
    console.error('生成行程失败:', err)
    isGenerating.value = false
    message.error(t('travelList.createFailed') || '生成行程失败，请重试')
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
  userStore.logout()
      travelListStore.clearAll()
      router.push('/')
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
  return travel.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80'
}

// 简单的占位图生成
const getDestinationImage = (dest: typeof recommendedDestinations.value[0]) => {
  return dest.image || `https://source.unsplash.com/400x300/?${encodeURIComponent(dest.name)}`
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://via.placeholder.com/400x300?text=No+Image'
}

// 格式化时间（相对时间）
const formatTimeAgo = (dateStr: string) => {
  return dayjs(dateStr).fromNow()
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
  background: #f0f2f5;
  padding-bottom: 40px;
}

.header {
  background: #fff;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.header-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
}

.user-email {
  font-size: 12px;
  color: #6b7280;
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
  max-width: 1200px;
  margin: 32px auto;
  padding: 0 24px;
}

/* 骨架屏 */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.skeleton-card {
  border-radius: 12px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 80px 0;
}

.empty-icon {
  font-size: 64px; 
  margin-bottom: 24px; 
  opacity: 0.5; 
}

.empty-title {
  font-size: 24px; 
  font-weight: 600;
  color: #374151; 
}

.empty-description {
  color: #6b7280; 
  margin-bottom: 32px; 
}

.create-first-btn { 
  height: 48px; 
  font-size: 16px; 
  border-radius: 24px; 
  padding: 0 32px; 
}

/* 旅行列表样式 */
.travel-list {
  margin-top: 1rem;
}

.travel-card-wrapper {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.travel-card-wrapper:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08);
  border-color: transparent;
}

/* 封面图片区域 */
.travel-cover-image {
  height: 180px;
  position: relative;
  overflow: hidden;
}

.travel-cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.travel-card-wrapper:hover .travel-cover-image img {
  transform: scale(1.05);
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.travel-card-wrapper:hover .cover-overlay {
  opacity: 1;
}

.cover-actions {
  display: flex;
  gap: 12px;
}

/* 内容区域 */
.travel-card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.travel-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.travel-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.travel-location {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 12px;
}

.travel-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}

.budget-tag {
  color: #059669;
  font-weight: 500;
  background: #ecfdf5;
  padding: 2px 8px;
  border-radius: 4px;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.recommended-destinations-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 40px;
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
  padding: 12px;
}

.destination-description {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 12px;
}

.destination-tags {
  display: flex;
  gap: 8px;
  margin: 8px 0;
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

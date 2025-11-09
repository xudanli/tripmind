<template>
  <div class="container">
    <!-- 头部导航栏 -->
    <div class="header">
      <div class="header-left">
        <h2 class="title">🗺️ {{ t('travelList.title') }}</h2>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="showCreateModal" class="new-journey-btn">
          <template #icon>
            <plus-outlined />
          </template>
          {{ t('travelList.newJourney') }}
        </a-button>
        <a-button type="text" @click="handleLogout" class="logout-btn">
          <template #icon>
            <logout-outlined />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 创建旅程模态框 -->
    <a-modal
      v-model:open="createModalVisible"
                  :title="t('createModal.title')"
      width="800px"
      :footer="null"
    >
      <div class="create-modal-content">
        <p class="modal-description">{{ t('createModal.description') }}</p>
        
        <a-row :gutter="[24, 24]">
          <!-- Planner 模式 -->
          <a-col :xs="24" :sm="8">
            <div class="mode-option-card" @click="handleCreateJourney('planner')">
              <div class="mode-icon">🚀</div>
              <h3 class="mode-title">{{ t('createModal.modes.planner.title') }}</h3>
              <p class="mode-description">{{ t('createModal.modes.planner.description') }}</p>
              <a-button type="primary" block class="create-btn">
                {{ t('createModal.modes.planner.button') }}
              </a-button>
            </div>
          </a-col>

          <!-- Seeker 模式 -->
          <a-col :xs="24" :sm="8">
            <div class="mode-option-card" @click="handleCreateJourney('seeker')">
              <div class="mode-icon">🌿</div>
              <h3 class="mode-title">{{ t('createModal.modes.seeker.title') }}</h3>
              <p class="mode-description">{{ t('createModal.modes.seeker.description') }}</p>
              <a-button type="primary" block class="create-btn">
                {{ t('createModal.modes.seeker.button') }}
              </a-button>
            </div>
          </a-col>

          <!-- Inspiration 模式 -->
          <a-col :xs="24" :sm="8">
            <div class="mode-option-card" @click="handleCreateJourney('inspiration')">
              <div class="mode-icon">💡</div>
              <h3 class="mode-title">{{ t('createModal.modes.inspiration.title') }}</h3>
              <p class="mode-description">{{ t('createModal.modes.inspiration.description') }}</p>
              <a-button type="primary" block class="create-btn">
                {{ t('createModal.modes.inspiration.button') }}
              </a-button>
            </div>
          </a-col>
        </a-row>
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
                    <span class="budget-spent">¥{{ travel.spent || 0 }}</span>
                    <span class="budget-separator">/</span>
                    <span class="budget-total">¥{{ travel.budget || 5000 }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTravelListStore, type Travel } from '@/stores/travelList'
import { useI18n } from 'vue-i18n'
import { Modal, message } from 'ant-design-vue'
import { getVisaInfo } from '@/config/visa'
import { getUserNationalityCode } from '@/config/userProfile'
import { PRESET_COUNTRIES } from '@/constants/countries'

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
  BulbOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const travelListStore = useTravelListStore()

// 获取旅行列表
const travelList = computed(() => travelListStore.travelList)

// 创建模态框显示状态
const createModalVisible = ref(false)

// 组件挂载时检查是否有待处理的意图
onMounted(() => {
  const pendingIntent = userStore.pendingIntent
  if (pendingIntent && userStore.isLoggedIn) {
    // 根据意图创建旅程
    handleCreateFromIntent(pendingIntent)
    userStore.clearIntent()
  }
})

// 从意图创建旅程
const handleCreateFromIntent = (intent: any) => {
  const modeData = {
    planner: {
      title: '新的旅行计划',
      location: '待定',
      description: '开始规划你的旅程',
      mode: 'planner' as const
    },
    seeker: {
      title: '随心而行的旅程',
      location: '待定',
      description: '让心情指引你的旅程',
      mode: 'seeker' as const
    },
    inspiration: {
      title: '灵感之旅',
      location: '待定',
      description: '将灵感转化为旅程',
      mode: 'inspiration' as const
    }
  }
  
  const travelData = modeData[intent.mode] || modeData.planner
  travelListStore.createTravel({
    ...travelData,
    status: 'draft' as const
  })
  
  message.success('已为你创建新旅程！')
}

// 显示创建模态框
const showCreateModal = () => {
  createModalVisible.value = true
}

// 创建旅程
const handleCreateJourney = (mode: 'planner' | 'seeker' | 'inspiration') => {
  // 关闭模态框
  createModalVisible.value = false
  
  // 跳转到对应模式页面
  if (mode === 'planner') {
    router.push('/planner')
  } else if (mode === 'seeker') {
    router.push('/seeker')
  } else {
    router.push('/inspiration')
  }
}

// 打开旅程详情（点击卡片）
const handleOpenTravel = (travel: Travel) => {
  console.log('打开旅程:', travel)
  if (travel.mode === 'inspiration') {
    const data = travel.data || {}
    const hasFullItinerary = data?.hasFullItinerary || (Array.isArray(data?.days) && data.days.length > 0)
    if (!hasFullItinerary || travel.status === 'draft') {
      message.info('灵感行程仍在生成中，请稍候再查看。')
      return
    }
  }
  // 跳转到旅行详情页
  router.push(`/travel/${travel.id}`)
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
const handleDelete = (travel: Travel, e: Event) => {
  e.stopPropagation()
  
  Modal.confirm({
    title: t('travelList.confirmDelete'),
    content: t('travelList.confirmDeleteContent', { title: travel.title }),
    okText: t('travelList.deleteJourney'),
    okType: 'danger',
    cancelText: t('common.cancel'),
    onOk: () => {
      const success = travelListStore.deleteTravel(travel.id)
      if (success) {
        message.success(t('travelList.deleteSuccess'))
      } else {
        message.error(t('travelList.deleteFailed'))
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
    onOk: () => {
      userStore.logout()
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

// 获取签证状态
const getVisaStatus = (travel: Travel) => {
  const countryCode = extractDestinationCountry(travel)
  if (!countryCode) return null
  
  const nationalityCode = getUserNationalityCode()
  if (!nationalityCode) return null
  
  const visaInfos = getVisaInfo(countryCode, nationalityCode, null)
  if (visaInfos.length === 0) return null
  
  return visaInfos[0]
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

/* 创建模态框样式 */
.create-modal-content {
  padding: 1rem 0;
}

.modal-description {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.mode-option-card {
  padding: 1.5rem;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mode-option-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
}

.mode-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.mode-title {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.mode-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  flex: 1;
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
</style>

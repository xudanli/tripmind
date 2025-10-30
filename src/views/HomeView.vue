<template>
  <div class="container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-element floating-element-1">✈️</div>
      <div class="floating-element floating-element-2">🌿</div>
      <div class="floating-element floating-element-3">🗺️</div>
      <div class="floating-element floating-element-4">🌸</div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
            <!-- 产品标题区域 -->
            <div class="header-section">
              <h1 class="main-title">🌍 {{ t('home.title') }}</h1>
              <p class="subtitle">🪄 {{ t('home.subtitle') }}</p>
              <div class="test-link">
                <a-button 
                  type="link" 
                  @click="handleApiTest"
                  style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;"
                >
                  🧪 API测试页面
                </a-button>
              </div>
            </div>

            <!-- 模式选择区域 -->
            <a-row :gutter="[24, 24]" justify="center" class="mode-selection">
              <a-col :xs="24" :sm="12" :lg="8">
                <a-card 
                  class="mode-card planner-card"
                  hoverable
                  @click="handlePlannerMode"
                >
                  <div class="card-content">
                    <div class="card-icon">
                      <rocket-outlined />
                    </div>
                    <h3 class="card-title">{{ t('home.plannerMode.title') }}</h3>
                    <span class="card-subtitle">{{ t('home.plannerMode.subtitle') }}</span>
                    <p class="card-description">
                      {{ t('home.plannerMode.description') }}
                      <br />
                      <span class="quote">「{{ t('home.plannerMode.quote') }}」</span>
                    </p>
                    <div class="card-features">
                      <a-space direction="vertical" size="small">
                        <span v-for="(feature, index) in getFeatures('planner')" :key="index">{{ feature }}</span>
                      </a-space>
                    </div>
                  </div>
                </a-card>
              </a-col>

              <a-col :xs="24" :sm="12" :lg="8">
                <a-card 
                  class="mode-card seeker-card"
                  hoverable
                  @click="handleSeekerMode"
                >
                  <div class="card-content">
                    <div class="card-icon">
                      <heart-outlined />
                    </div>
                    <h3 class="card-title">{{ t('home.seekerMode.title') }}</h3>
                    <span class="card-subtitle">{{ t('home.seekerMode.subtitle') }}</span>
                    <p class="card-description">
                      {{ t('home.seekerMode.description') }}
                      <br />
                      <span class="quote">「{{ t('home.seekerMode.quote') }}」</span>
                    </p>
                    <div class="card-features">
                      <a-space direction="vertical" size="small">
                        <span v-for="(feature, index) in getFeatures('seeker')" :key="index">{{ feature }}</span>
                      </a-space>
                    </div>
                  </div>
                </a-card>
              </a-col>

              <a-col :xs="24" :sm="12" :lg="8">
                <a-card 
                  class="mode-card inspiration-card"
                  hoverable
                  @click="handleInspirationMode"
                >
                  <div class="card-content">
                    <div class="card-icon">
                      <bulb-outlined />
                    </div>
                    <h3 class="card-title">{{ t('home.inspirationMode.title') }}</h3>
                    <span class="card-subtitle">{{ t('home.inspirationMode.subtitle') }}</span>
                    <p class="card-description">
                      {{ t('home.inspirationMode.description') }}
                      <br />
                      <span class="quote">「{{ t('home.inspirationMode.quote') }}」</span>
                    </p>
                    <div class="card-features">
                      <a-space direction="vertical" size="small">
                        <span v-for="(feature, index) in getFeatures('inspiration')" :key="index">{{ feature }}</span>
                      </a-space>
                    </div>
                  </div>
                </a-card>
              </a-col>
            </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'
import { RocketOutlined, HeartOutlined, BulbOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'

const { t, locale } = useI18n()

// 添加 watchEffect 来观察语言变化
watchEffect(() => {
  console.log('HomeView - Current locale:', locale.value)
  console.log('HomeView - Translated title:', t('home.title'))
})

// 获取特性列表
const getFeatures = (mode: 'planner' | 'seeker' | 'inspiration') => {
  const key = `home.${mode}Mode.features` as const
  const features = t(key)
  // 如果是数组，直接返回；如果是字符串，说明 i18n 有问题，返回空数组
  return Array.isArray(features) ? features : []
}

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)

const handlePlannerMode = async () => {
  console.log('进入 Planner 模式')
  
  // 检查是否已登录
  if (userStore.isLoggedIn) {
    // 已登录，保存意图并跳转
    userStore.saveIntent({ mode: 'planner' })
    router.push('/planner')
  } else {
    // 未登录，弹出登录提示
    showLoginModal('planner')
  }
}

const handleSeekerMode = async () => {
  console.log('进入 Seeker 模式')
  
  if (userStore.isLoggedIn) {
    userStore.saveIntent({ mode: 'seeker' })
    router.push('/seeker')
  } else {
    showLoginModal('seeker')
  }
}

const handleInspirationMode = async () => {
  console.log('进入 Inspiration 模式')
  
  if (userStore.isLoggedIn) {
    userStore.saveIntent({ mode: 'inspiration' })
    router.push('/inspiration')
  } else {
    showLoginModal('inspiration')
  }
}

const handleApiTest = () => {
  console.log('进入 API 测试页面')
  router.push('/api-test')
}

const showLoginModal = (mode: 'planner' | 'seeker' | 'inspiration') => {
  // 根据模式获取对应的登录消息
  const messages: { [key: string]: string } = {
    planner: t('login.rememberPlan'),
    seeker: t('login.rememberStyle'),
    inspiration: t('login.rememberInspiration')
  }
  
  Modal.info({
    title: t('login.title'),
    content: messages[mode],
    okText: t('login.loginWithGoogle'),
    onOk: async () => {
      loading.value = true
      try {
        await userStore.login()
        // 保存意图
        userStore.saveIntent({ mode })
        // 跳转到列表页
        router.push('/travel-list')
      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    },
    onCancel: () => {
      // 用户取消登录，仍然允许进入（不保存意图）
      if (mode === 'planner') router.push('/planner')
      else if (mode === 'seeker') router.push('/seeker')
      else router.push('/inspiration')
    }
  })
}
</script>

<style scoped>
/* 主容器 */
.container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

/* 背景装饰元素 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  font-size: 2rem;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.floating-element-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.floating-element-2 {
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.floating-element-3 {
  bottom: 30%;
  left: 20%;
  animation-delay: 4s;
}

.floating-element-4 {
  top: 40%;
  right: 30%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 主要内容区域 */
.main-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem 0;
  box-sizing: border-box;
}

/* 标题区域 */
.header-section {
  margin-bottom: 2rem;
  animation: fadeInUp 1s ease-out;
}

.main-title {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  margin-bottom: 0;
  animation: fadeInUp 1s ease-out 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 模式选择区域 */
.mode-selection {
  animation: fadeInUp 1s ease-out 0.6s both;
  margin-bottom: 0;
}

.mode-card {
  height: 100%;
  border-radius: 20px !important;
  border: none !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.3s ease !important;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.mode-card:hover {
  transform: translateY(-8px) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
}

.mode-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mode-card:hover::before {
  opacity: 1;
}

/* Planner 卡片样式（冷色调） */
.planner-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}

.planner-card::before {
  background: linear-gradient(90deg, transparent, #4facfe, transparent);
}

.planner-card:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
}

/* Seeker 卡片样式（暖色调） */
.seeker-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
  color: white !important;
}

.seeker-card::before {
  background: linear-gradient(90deg, transparent, #ffecd2, transparent);
}

.seeker-card:hover {
  background: linear-gradient(135deg, #ee82e8 0%, #f3455a 100%) !important;
}

/* Inspiration 卡片样式（创新色调） */
.inspiration-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  color: white !important;
}

.inspiration-card::before {
  background: linear-gradient(90deg, transparent, #a8edea, transparent);
}

.inspiration-card:hover {
  background: linear-gradient(135deg, #0f8a7a 0%, #2dd46a 100%) !important;
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
  opacity: 0.8;
}

.card-title {
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.card-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  margin-bottom: 0.8rem;
}

.card-description {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.card-features span {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
}

.quote {
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0;
  }
  
  .main-content {
    padding: 0.5rem 0;
  }
  
  .header-section {
    margin-bottom: 1.5rem;
  }
  
  .main-title {
    font-size: 1.5rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .card-content {
    padding: 8px;
  }
  
  .card-title {
    font-size: 1.1rem;
  }
  
  .card-icon {
    font-size: 2rem;
  }
  
  .floating-element {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.3rem;
  }
  
  .subtitle {
    font-size: 0.8rem;
  }
  
  .card-content {
    padding: 8px;
  }
  
  .card-icon {
    font-size: 1.8rem;
  }
}
</style>
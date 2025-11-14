<template>
  <!-- 如果已登录，显示原来的首页内容 -->
  <div v-if="userStore.isLoggedIn" class="container">
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

  <!-- 如果未登录，显示登录界面 -->
  <div v-else class="login-container">
    <div class="login-background">
      <!-- 背景装饰 -->
      <div class="background-decoration">
        <div class="floating-element floating-element-1">✈️</div>
        <div class="floating-element floating-element-2">🌿</div>
        <div class="floating-element floating-element-3">🗺️</div>
        <div class="floating-element floating-element-4">🌸</div>
      </div>
    </div>

    <div class="login-content">
      <div class="login-card">
        <!-- 主要内容 -->
        <div class="login-body">
          <div class="login-title-section">
            <h1 class="login-title">🌍 {{ t('login.pageTitle') }}</h1>
            <p class="login-subtitle">{{ t('login.pageSubtitle') }}</p>
          </div>

          <div class="login-form-section">
            <div class="login-description">
              <p>{{ t('login.description') }}</p>
            </div>

            <!-- 登录按钮 -->
            <div class="google-signin-wrapper">
              <a-button
                type="primary"
                size="large"
                block
                @click="handleGoogleLogin"
              >
                {{ t('login.loginWithGoogle') }}
              </a-button>
            </div>

            <!-- 开发者备用登录 -->
            <div v-if="enableDevLogin" class="dev-login">
              <a-divider plain>{{ t('login.devLoginDivider') }}</a-divider>
              <a-button
                block
                size="large"
                type="default"
                class="dev-login-button"
                :loading="devLoginLoading"
                @click="handleDevLogin"
              >
                <template #icon>
                  <ExperimentOutlined />
                </template>
                {{ t('login.devLoginButton') }}
              </a-button>
              <p class="dev-login-tip">{{ t('login.devLoginTip') }}</p>
            </div>

            <!-- 错误提示 -->
            <div v-if="loginError" class="error-message">
              <a-alert
                :message="loginError"
                type="error"
                show-icon
                closable
                @close="loginError = ''"
              />
            </div>

            <!-- 提示信息 -->
            <div class="login-tips">
              <p>{{ t('login.tips') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { RocketOutlined, HeartOutlined, BulbOutlined, ExperimentOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginError = ref('')
const devLoginLoading = ref(false)
const enableDevLogin = userStore.devLoginEnabled
const hasHandledLogin = ref(false)
const shouldAnnounceLogin = ref(!userStore.isLoggedIn)

// 获取特性列表（用于已登录状态显示）
const getFeatures = (mode: 'planner' | 'seeker' | 'inspiration') => {
  const key = `home.${mode}Mode.features` as const
  const features = t(key)
  return Array.isArray(features) ? features : []
}

// 处理模式选择（已登录状态）
const handlePlannerMode = () => {
  userStore.saveIntent({ mode: 'planner' })
  router.push('/planner')
}

const handleSeekerMode = () => {
  userStore.saveIntent({ mode: 'seeker' })
  router.push('/seeker')
}

const handleInspirationMode = () => {
  userStore.saveIntent({ mode: 'inspiration' })
  router.push('/inspiration')
}

const navigateAfterLogin = () => {
  if (hasHandledLogin.value) return
  hasHandledLogin.value = true

  if (shouldAnnounceLogin.value) {
    message.success(t('login.success') || '登录成功！')
  }

  const redirect = route.query.redirect as string
  if (redirect) {
    router.replace(redirect)
    return
  }

  if (userStore.pendingIntent) {
    const intent = userStore.pendingIntent
    userStore.clearIntent()
    
    if (intent.mode === 'planner') {
      router.replace('/planner')
    } else if (intent.mode === 'seeker') {
      router.replace('/seeker')
    } else if (intent.mode === 'inspiration') {
      router.replace('/inspiration')
    } else {
      router.replace('/travel-list')
    }
  } else {
    router.replace('/travel-list')
  }
}

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      navigateAfterLogin()
    } else {
      hasHandledLogin.value = false
      shouldAnnounceLogin.value = true
    }
  },
  { immediate: true }
)

const handleGoogleLogin = () => {
  const target = (route.query.redirect as string) || route.fullPath || '/travel-list'
  userStore.startLogin(target)
}

const handleDevLogin = async () => {
  try {
    devLoginLoading.value = true
    await userStore.login()
    navigateAfterLogin()
  } catch (error) {
    console.error('开发模式登录失败:', error)
    const messageText = error instanceof Error ? error.message : String(error)
    loginError.value = messageText
    message.error(messageText)
  } finally {
    devLoginLoading.value = false
  }
}

</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100vw;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.background-decoration {
  position: relative;
  width: 100%;
  height: 100%;
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

.login-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480px;
}

.login-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  padding: 20px 24px 0;
}

.back-button {
  color: #666;
  font-size: 14px;
}

.back-button:hover {
  color: #1890ff;
}

.login-body {
  padding: 40px 48px 48px;
}

.login-title-section {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 32px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  line-height: 1.2;
}

.login-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.login-form-section {
  width: 100%;
}

.login-description {
  margin-bottom: 32px;
  text-align: center;
}

.login-description p {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.google-signin-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.dev-login {
  text-align: center;
  margin-bottom: 24px;
}

.dev-login-button {
  margin-top: 8px;
}

.dev-login-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
  line-height: 1.6;
}

.error-message {
  margin-bottom: 24px;
}

.login-tips {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.login-tips p {
  font-size: 13px;
  color: #999;
  line-height: 1.6;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 576px) {
  .login-container {
    padding: 16px;
  }

  .login-body {
    padding: 32px 24px 40px;
  }

  .login-title {
    font-size: 28px;
  }

  .login-subtitle {
    font-size: 14px;
  }
}
</style>

<!-- 首页样式（已登录状态） -->
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
.container .background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.container .floating-element {
  position: absolute;
  font-size: 2rem;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.container .floating-element-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.container .floating-element-2 {
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.container .floating-element-3 {
  bottom: 30%;
  left: 20%;
  animation-delay: 4s;
}

.container .floating-element-4 {
  top: 40%;
  right: 30%;
  animation-delay: 1s;
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

.card-content {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: inherit;
}

.card-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 1rem;
  display: block;
}

.card-description {
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  opacity: 0.95;
  flex-grow: 1;
}

.quote {
  font-style: italic;
  opacity: 0.85;
}

.card-features {
  margin-top: 1rem;
  width: 100%;
  text-align: left;
}

.card-features span {
  font-size: 0.85rem;
  opacity: 0.9;
  display: block;
  padding: 0.25rem 0;
}
</style>


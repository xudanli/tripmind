<template>
  <div class="google-sign-in">
    <div 
      ref="googleButtonRef" 
      id="google-sign-in-button"
      class="google-button-container"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  initializeGoogleSignIn,
  configureGoogleSignIn,
  renderGoogleSignInButton,
  type GoogleCredentialResponse,
} from '@/services/googleAuth'

interface Props {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logoAlignment?: 'left' | 'center'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'outline',
  size: 'large',
  text: 'signin_with',
  shape: 'rectangular',
  logoAlignment: 'left',
})

const emit = defineEmits<{
  success: [userInfo: any]
  error: [error: Error]
}>()

const googleButtonRef = ref<HTMLElement | null>(null)
const isInitialized = ref(false)

// 获取 Google Client ID
const getGoogleClientId = (): string => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('未配置 VITE_GOOGLE_CLIENT_ID，请在 .env.local 中设置')
  }
  return clientId
}


// 处理 Google 登录回调
const handleGoogleSignIn = async (response: GoogleCredentialResponse) => {
  try {
    console.log('收到 Google 登录响应:', response)
    
    // 使用 user store 的 loginWithGoogle 方法
    // 这会自动处理后端验证和状态更新
    const { useUserStore } = await import('@/stores/user')
    const userStore = useUserStore()
    
    const userInfo = await userStore.loginWithGoogle(response.credential)
    console.log('登录成功，用户信息:', userInfo)
    
    emit('success', userInfo)
  } catch (error) {
    console.error('Google 登录失败:', error)
    emit('error', error instanceof Error ? error : new Error(String(error)))
  }
}

// 初始化 Google Sign In
const initGoogleSignIn = async () => {
  try {
    // 初始化 Google Identity Services
    await initializeGoogleSignIn()
    
    // 配置 Google Sign In
    const clientId = getGoogleClientId()
    configureGoogleSignIn(clientId, handleGoogleSignIn)
    
    // 渲染登录按钮
    if (googleButtonRef.value) {
      renderGoogleSignInButton('google-sign-in-button', {
        type: 'standard',
        theme: props.theme,
        size: props.size,
        text: props.text,
        shape: props.shape,
        logo_alignment: props.logoAlignment,
      })
      isInitialized.value = true
    }
  } catch (error) {
    console.error('初始化 Google Sign In 失败:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // 如果是网络超时或连接失败，提供更友好的错误信息
    if (errorMessage.includes('超时') || errorMessage.includes('连接') || errorMessage.includes('代理')) {
      const friendlyError = new Error(
        '无法连接到 Google 登录服务。\n\n' +
        '可能的原因：\n' +
        '• 网络连接问题\n' +
        '• 代理设置问题\n' +
        '• 防火墙阻止访问\n\n' +
        '请检查网络设置或稍后重试。'
      )
      emit('error', friendlyError)
    } else {
      emit('error', error instanceof Error ? error : new Error(String(error)))
    }
  }
}

onMounted(() => {
  // 延迟初始化，确保 DOM 已渲染
  setTimeout(() => {
    initGoogleSignIn()
  }, 100)
})

onUnmounted(() => {
  // 清理工作（如果需要）
  isInitialized.value = false
})
</script>

<style scoped>
.google-sign-in {
  display: inline-block;
}

.google-button-container {
  display: inline-block;
}

/* 确保按钮容器有足够的空间 */
#google-sign-in-button {
  min-width: 200px;
  min-height: 40px;
}
</style>


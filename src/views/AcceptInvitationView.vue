<template>
  <div class="accept-invitation-container">
    <a-card class="invitation-card" :loading="loading">
      <template #title>
        <div class="card-title">
          <user-add-outlined />
          <span>{{ t('invitation.acceptInvitation') }}</span>
        </div>
      </template>

      <!-- 加载中 -->
      <div v-if="loading" class="loading-content">
        <a-spin size="large" />
        <p>{{ t('invitation.loading') }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-content">
        <close-circle-outlined class="error-icon" />
        <h3>{{ t('invitation.error') }}</h3>
        <p>{{ error }}</p>
        <a-button type="primary" @click="handleRetry">{{ t('common.retry') }}</a-button>
      </div>

      <!-- 邀请信息 -->
      <div v-else-if="invitationInfo" class="invitation-content">
        <div class="invitation-info">
          <check-circle-outlined class="success-icon" />
          <h3>{{ t('invitation.invitedToJoin') }}</h3>
          <p class="journey-name">{{ invitationInfo.journeyName || invitationInfo.destination }}</p>
          <div class="invitation-details">
            <p><strong>{{ t('invitation.role') }}:</strong> {{ getRoleName(invitationInfo.role) }}</p>
            <p v-if="invitationInfo.message"><strong>{{ t('invitation.message') }}:</strong> {{ invitationInfo.message }}</p>
          </div>
        </div>

        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="login-prompt">
          <exclamation-circle-outlined />
          <p>{{ t('invitation.loginRequired') }}</p>
          <a-button type="primary" @click="handleLogin">{{ t('common.login') }}</a-button>
        </div>

        <!-- 已登录，显示接受按钮 -->
        <div v-else class="accept-actions">
          <a-button type="primary" size="large" :loading="accepting" @click="handleAccept">
            {{ t('invitation.accept') }}
          </a-button>
          <a-button @click="handleDecline">{{ t('invitation.decline') }}</a-button>
        </div>
      </div>

      <!-- 成功状态 -->
      <div v-else-if="accepted" class="success-content">
        <check-circle-outlined class="success-icon" />
        <h3>{{ t('invitation.accepted') }}</h3>
        <p>{{ t('invitation.redirecting') }}</p>
        <a-button type="primary" @click="goToJourney">{{ t('invitation.viewJourney') }}</a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import {
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import { addMember } from '@/services/itineraryAPI'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const error = ref<string | null>(null)
const accepting = ref(false)
const accepted = ref(false)
const invitationInfo = ref<any>(null)

const isLoggedIn = computed(() => userStore.isLoggedIn)

// 获取邀请ID（从URL参数或路径中）
const invitationId = computed(() => {
  return (route.params.invitationId as string) || (route.query.token as string) || (route.query.invitationId as string)
})

// 获取角色名称
const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    owner: t('travelDetail.memberManagement.owner'),
    admin: t('travelDetail.memberManagement.admin'),
    member: t('travelDetail.memberManagement.member')
  }
  return roleMap[role] || role
}

// 加载邀请信息
const loadInvitation = async () => {
  if (!invitationId.value) {
    error.value = t('invitation.invalidLink') || '无效的邀请链接'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null

    // TODO: 调用后端API验证邀请
    // const { verifyInvitation } = await import('@/services/itineraryAPI')
    // const info = await verifyInvitation(invitationId.value)
    
    // 临时：从URL参数获取信息（后端应该提供验证接口）
    const journeyId = route.query.journeyId as string
    const email = route.query.email as string
    const role = (route.query.role as string) || 'member'
    const journeyName = route.query.journeyName as string
    const inviteMessage = route.query.message as string

    if (!journeyId) {
      throw new Error(t('invitation.missingInfo') || '邀请信息不完整')
    }

    invitationInfo.value = {
      invitationId: invitationId.value,
      journeyId,
      email,
      role,
      journeyName,
      destination: journeyName,
      message: inviteMessage
    }
  } catch (err: any) {
    console.error('[AcceptInvitation] 加载邀请信息失败:', err)
    error.value = err.message || (t('invitation.loadFailed') || '加载邀请信息失败')
  } finally {
    loading.value = false
  }
}

// 处理登录
const handleLogin = () => {
  const redirect = route.fullPath
  router.push({
    path: '/',
    query: { redirect }
  })
}

// 接受邀请
const handleAccept = async () => {
  if (!invitationInfo.value || !isLoggedIn.value) {
    return
  }

  try {
    accepting.value = true
    error.value = null

    const user = userStore.user
    if (!user) {
      throw new Error(t('invitation.loginRequired') || '请先登录')
    }

    // 调用添加成员接口
    await addMember(invitationInfo.value.journeyId, {
      name: user.name || user.nickname || user.email || '新成员',
      email: invitationInfo.value.email || user.email,
      role: invitationInfo.value.role as 'member' | 'admin',
      userId: user.id
    })

    accepted.value = true
    message.success(t('invitation.acceptSuccess') || '已成功加入行程')

    // 3秒后自动跳转
    setTimeout(() => {
      goToJourney()
    }, 3000)
  } catch (err: any) {
    console.error('[AcceptInvitation] 接受邀请失败:', err)
    error.value = err.message || (t('invitation.acceptFailed') || '接受邀请失败')
    message.error(error.value)
  } finally {
    accepting.value = false
  }
}

// 拒绝邀请
const handleDecline = () => {
  message.info(t('invitation.declined') || '已拒绝邀请')
  router.push('/travel-list')
}

// 重试
const handleRetry = () => {
  loadInvitation()
}

// 跳转到行程详情
const goToJourney = () => {
  if (invitationInfo.value?.journeyId) {
    // 查找对应的 travel ID
    // TODO: 如果后端返回了 travelId，直接使用
    // 否则需要通过 journeyId 查找
    router.push(`/travel-list`)
  } else {
    router.push('/travel-list')
  }
}

// 组件挂载时加载邀请信息
onMounted(() => {
  loadInvitation()
})
</script>

<style scoped>
.accept-invitation-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.invitation-card {
  max-width: 500px;
  width: 100%;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
}

.loading-content,
.error-content,
.invitation-content,
.success-content {
  text-align: center;
  padding: 20px 0;
}

.loading-content p {
  margin-top: 16px;
  color: #666;
}

.error-icon,
.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-icon {
  color: #ff4d4f;
}

.success-icon {
  color: #52c41a;
}

.error-content h3,
.success-content h3 {
  margin: 16px 0;
  font-size: 20px;
}

.invitation-info {
  margin-bottom: 24px;
}

.journey-name {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
  margin: 16px 0;
}

.invitation-details {
  text-align: left;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.invitation-details p {
  margin: 8px 0;
}

.login-prompt {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.login-prompt p {
  margin: 8px 0;
}

.accept-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}
</style>


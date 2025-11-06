<template>
  <div class="message-group" :class="{ 'message-group-self': isSelf }">
    <!-- 左侧头像（仅他人消息且为首条显示） -->
    <a-avatar 
      v-if="!isSelf && showAvatar" 
      :size="40" 
      class="message-avatar"
    >
      {{ group.avatar || group.author[0] }}
    </a-avatar>
    <div v-else-if="!isSelf" class="message-avatar-placeholder"></div>
    
    <!-- 消息内容区 -->
    <div class="message-group-content">
      <!-- 消息组头部（仅首条消息显示：作者名/角色 + 时间） -->
      <div v-if="showAvatar || !isSelf" class="message-group-header">
        <div class="message-author-info">
          <span class="message-author">{{ group.author }}</span>
          <span v-if="group.role" class="message-role-badge">{{ group.role }}</span>
        </div>
        <span class="message-group-time" :aria-label="`时间: ${groupTime || formatGroupTime(group.time)}`">{{ groupTime || formatGroupTime(group.time) }}</span>
      </div>
      
      <!-- 消息气泡列表 -->
      <div class="message-bubbles">
        <div
          v-for="(message, index) in group.messages"
          :key="message.id"
          class="message-bubble-wrapper"
          :class="{ 'message-bubble-first': index === 0 }"
        >
            <MessageBubble 
              :message="message" 
              :is-self="isSelf"
              :group-time="group.time"
              @retry="handleRetry"
              @action="handleAction"
              @add-to-itinerary="handleAddToItinerary"
            />
        </div>
      </div>
    </div>
    
    <!-- 右侧占位（自己消息时） -->
    <div v-if="isSelf" class="message-avatar-placeholder"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MessageBubble from './MessageBubble.vue'

interface Message {
  id: string
  content: string
  timestamp: number
  status?: 'sending' | 'sent' | 'failed' | 'read'
  type?: 'text' | 'ai-card' | 'itinerary-card' | 'attachment' | 'image'
  aiActions?: Array<{
    label: string
    action: string
  }>
  itineraryInfo?: {
    time: string
    activity: string
    location: string
    type: string
    category: string
    icon: string
    categoryColor: string
  }
}

interface MessageGroup {
  id: string
  author: string
  role?: string
  avatar?: string
  isOwn: boolean
  time: number
  messages: Message[]
}

interface Props {
  group: MessageGroup
  isSelf: boolean
  groupTime?: string
}

const props = withDefaults(defineProps<Props>(), {
  groupTime: ''
})
const { t, locale } = useI18n()

const emit = defineEmits<{
  retry: [messageId: string]
  action: [action: string, messageId: string]
  addToItinerary: [messageId: string, content: string]
}>()

const handleRetry = (messageId: string) => {
  emit('retry', messageId)
}

const handleAction = (action: string, messageId: string) => {
  emit('action', action, messageId)
}

const handleAddToItinerary = (messageId: string, content: string) => {
  emit('addToItinerary', messageId, content)
}

// 是否显示头像和头部（仅首条消息显示）
const showAvatar = computed(() => {
  return props.group.messages.length > 0 && props.group.messages[0]
})

// 格式化组时间
const formatGroupTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diff = today.getTime() - msgDate.getTime()
  
  if (diff === 0) {
    // 今天
    return date.toLocaleTimeString(locale.value, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } else if (diff === 86400000) {
    // 昨天
    return (locale.value.startsWith('zh') ? '昨天 ' : 'Yesterday ') + date.toLocaleTimeString(locale.value, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } else if (diff < 7 * 86400000) {
    // 一周内
    const weekdays = locale.value.startsWith('zh') 
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return weekdays[date.getDay()] + ' ' + date.toLocaleTimeString(locale.value, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } else {
    // 更早
    return date.toLocaleDateString(locale.value, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
}
</script>

<style scoped>
.message-group {
  --brand: #11998e;
  --brand-hi: #38ef7d;
  --ink-1: #111;
  --ink-2: #333;
  --ink-3: #666;
  --ink-4: #999;
  --bg: #fff;
  --bubble-self: #F2F3F5;
  --bubble-other: #fff;
  --divider: #EDEEF0;
  --r-card: 16px;
  --r-bubble: 16px;
  --gap-group: 10px;
  --gap-msg: 6px;
  --gap-stack: 12px;
}
.message-group {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  position: relative;
  padding-left: 4px;
  padding-right: 4px;
}

.message-group-self {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bubble-other);
  border: 1px solid var(--divider);
}

.message-avatar-placeholder {
  width: 32px;
  flex-shrink: 0;
}

.message-group-content {
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding: 0 4px;
}

.message-author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-author {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
}

.message-role-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(17, 153, 142, 0.1);
  color: var(--brand);
  border: 1px solid rgba(17, 153, 142, 0.2);
}

.message-group-self .message-author-info {
  order: 2;
}

.message-group-time {
  font-size: 12px;
  color: var(--ink-4);
  white-space: nowrap;
}

.message-group-self .message-group-time {
  order: 1;
}

.message-bubbles {
  display: flex;
  flex-direction: column;
  gap: var(--gap-msg);
}

.message-bubble-wrapper {
  position: relative;
}

.message-bubble-first {
  margin-top: 0;
}
</style>

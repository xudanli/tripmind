<template>
  <div class="message-bubble" :class="bubbleClass">
    <!-- AI卡片样式 -->
    <div v-if="message.type === 'ai-card'" class="ai-card">
      <div class="ai-card-header">
        <span class="ai-icon">⌁</span>
        <span class="ai-label">{{ message.author }}</span>
        <span class="ai-time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="ai-card-content">
        <div class="message-text" v-html="formatContent(message.content)"></div>
      </div>
      <div v-if="message.aiActions && message.aiActions.length > 0" class="ai-card-actions">
        <button
          v-for="action in message.aiActions"
          :key="action.action"
          class="ai-action-btn"
          @click="handleAction(action.action)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
    
    <!-- 普通文本消息 -->
    <div v-else class="message-text" v-html="formatContent(message.content)"></div>
    
    <!-- 消息状态 -->
    <div v-if="isSelf" class="message-status">
      <span v-if="message.status === 'sending'" class="status-sending">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </span>
      <span v-else-if="message.status === 'failed'" class="status-failed">
        <span class="status-icon">⚠</span>
        <button class="retry-btn" @click="handleRetry">重试</button>
      </span>
      <span v-else-if="message.status === 'read'" class="status-read">
        <span class="status-icon">✔</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Message {
  id: string
  content: string
  timestamp: number
  status?: 'sending' | 'sent' | 'failed' | 'read'
  type?: 'text' | 'ai-card' | 'attachment' | 'image'
  aiActions?: Array<{
    label: string
    action: string
  }>
}

interface Props {
  message: Message
  isSelf: boolean
  groupTime?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  retry: [messageId: string]
  action: [action: string, messageId: string]
}>()

const bubbleClass = computed(() => {
  return {
    'message-bubble-self': props.isSelf,
    'message-bubble-other': !props.isSelf,
    'message-bubble-ai': props.message.type === 'ai-card'
  }
})

// 格式化内容（支持换行和链接）
const formatContent = (content: string) => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')
    .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 处理重试
const handleRetry = () => {
  emit('retry', props.message.id)
}

// 处理AI动作
const handleAction = (action: string) => {
  emit('action', action, props.message.id)
}
</script>

<style scoped>
.message-bubble {
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
.message-bubble {
  position: relative;
  max-width: 560px;
  word-break: break-word;
}

.message-bubble-self {
  margin-left: auto;
}

.message-bubble-other {
  margin-right: auto;
}

.message-text {
  padding: 10px 14px;
  border-radius: var(--r-bubble);
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-1);
  background: var(--bubble-other);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.message-bubble-self .message-text {
  background: var(--bubble-self);
  color: var(--ink-1);
}

.message-text :deep(p) {
  margin: 0 0 var(--gap-stack) 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(.message-link) {
  color: var(--brand);
  text-decoration: none;
  border-bottom: 1px solid rgba(200, 16, 46, 0.3);
}

.message-text :deep(.message-link:hover) {
  color: var(--brand-hi);
  border-bottom-color: var(--brand-hi);
}

.message-text :deep(.mention) {
  color: var(--brand);
  background: rgba(200, 16, 46, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
}

/* AI卡片样式 */
.ai-card {
  background: var(--bg);
  border: 1px solid var(--divider);
  border-radius: var(--r-card);
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.ai-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--ink-4);
}

.ai-icon {
  color: var(--brand);
  font-size: 14px;
}

.ai-label {
  font-weight: 500;
  color: var(--ink-2);
}

.ai-time {
  margin-left: auto;
}

.ai-card-content {
  margin-bottom: 8px;
}

.ai-card-content .message-text {
  background: transparent;
  padding: 0;
  box-shadow: none;
}

.ai-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--divider);
}

.ai-action-btn {
  padding: 6px 12px;
  background: var(--brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-action-btn:hover {
  background: var(--brand-hi);
}

/* 消息状态 */
.message-status {
  position: absolute;
  bottom: -18px;
  right: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--ink-4);
}

.message-bubble-self .message-status {
  right: auto;
  left: 4px;
}

.status-sending {
  display: flex;
  gap: 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.status-sending .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--ink-4);
  animation: dotPulse 1.4s infinite;
}

.status-sending .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.status-sending .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}

.status-failed {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--brand-hi);
  cursor: pointer;
}

.retry-btn {
  background: none;
  border: none;
  color: var(--brand-hi);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.retry-btn:hover {
  opacity: 0.8;
}

.status-read {
  color: var(--ink-4);
}

.status-icon {
  font-size: 12px;
}
</style>

<template>
  <div class="message-bubble" :class="bubbleClass">
    <!-- 行程卡片样式（识别到添加行程时） -->
    <div v-if="message.type === 'itinerary-card' && message.itineraryInfo" class="itinerary-card">
      <div class="itinerary-card-header">
        <span class="itinerary-icon">📍</span>
        <span class="itinerary-label">{{ t('travelDetail.discussion.itineraryCard') || '行程建议' }}</span>
        <span class="itinerary-time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="itinerary-card-content">
        <div class="itinerary-info">
          <div class="itinerary-time-slot">
            <span class="time-icon">🕒</span>
            <span class="time-text">{{ message.itineraryInfo.time }}</span>
          </div>
          <div class="itinerary-activity">
            <span class="activity-icon">{{ message.itineraryInfo.icon }}</span>
            <span class="activity-text">{{ message.itineraryInfo.activity }}</span>
            <a-tag v-if="message.itineraryInfo.category" size="small" :color="message.itineraryInfo.categoryColor">
              {{ message.itineraryInfo.category }}
            </a-tag>
          </div>
          <div v-if="message.itineraryInfo.location" class="itinerary-location">
            <span class="location-icon">📍</span>
            <span class="location-text">{{ message.itineraryInfo.location }}</span>
          </div>
        </div>
        <div class="itinerary-description">
          <div class="message-text" v-html="formatContent(message.content)"></div>
        </div>
      </div>
      <div class="itinerary-card-actions">
        <button
          class="add-to-itinerary-btn"
          @click="handleAddToItinerary"
          :title="t('travelDetail.discussion.addToItinerary')"
        >
          <span class="btn-icon">➕</span>
          <span class="btn-text">{{ t('travelDetail.discussion.addToItinerary') }}</span>
        </button>
      </div>
    </div>
    
    <!-- AI卡片样式 -->
    <div v-else-if="message.type === 'ai-card'" class="ai-card">
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
    
    <!-- 添加到行程按钮（仅非自己的消息且包含活动信息时显示，但行程卡片内部已有按钮，不再显示） -->
    <div v-if="!isSelf && canAddToItinerary && message.type !== 'itinerary-card'" class="add-to-itinerary-actions">
      <button
        class="add-to-itinerary-btn"
        @click="handleAddToItinerary"
        :title="t('travelDetail.discussion.addToItinerary')"
      >
        <span class="btn-icon">➕</span>
        <span class="btn-text">{{ t('travelDetail.discussion.addToItinerary') }}</span>
      </button>
    </div>
    
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
// @ts-nocheck
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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

interface Props {
  message: Message
  isSelf: boolean
  groupTime?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  retry: [messageId: string]
  action: [action: string, messageId: string]
  addToItinerary: [messageId: string, content: string]
}>()

const { t } = useI18n()

const bubbleClass = computed(() => {
  return {
    'message-bubble-self': props.isSelf,
    'message-bubble-other': !props.isSelf,
    'message-bubble-ai': props.message.type === 'ai-card' || props.message.type === 'itinerary-card',
    'message-bubble-itinerary': props.message.type === 'itinerary-card'
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

// 判断是否可以添加到行程（增强意图识别）
const canAddToItinerary = computed(() => {
  const content = props.message.content.toLowerCase()
  
  // 1. 检查是否包含明确的添加意图关键词
  const hasAddIntent = /添加|加入|加入行程|添加到|add.*itinerary|add.*行程|加入.*行程|我想.*添加|想要.*添加|要.*添加|行程点/.test(content)
  
  // 2. 检查是否包含时间（如 10:00, 14:30, 10点, 14时等）
  const hasTime = /\d{1,2}[:：]\d{2}|\d{1,2}[点时]/.test(content)
  
  // 3. 检查是否包含活动相关关键词（扩展关键词列表）
  const hasActivityKeywords = /参观|游览|去|访问|体验|活动|行程点|景点|餐厅|博物馆|公园|寺庙|海滩|山|湖|山脊|行走|静默|gallery|museum|restaurant|park|temple|beach|mountain|lake|ridge|walk|silent|visit|explore|experience|activity|attraction/.test(content)
  
  // 4. 检查是否包含地点或位置信息
  const hasLocation = /在|到|去|from|to|at|位置|地点|location|place/.test(content)
  
  // 5. 检查是否包含日期信息（第一天、第2天、day 1等）
  const hasDayInfo = /第[一二三四五六七八九十\d]+天|第\d+天|day\s*\d+|第一天|第二天|第三天/.test(content)
  
  // 如果有明确的添加意图，或者（有时间且（有活动关键词或有地点或有日期）），则显示按钮
  return hasAddIntent || (hasTime && (hasActivityKeywords || hasLocation || hasDayInfo))
})

// 处理添加到行程
const handleAddToItinerary = () => {
  emit('addToItinerary', props.message.id, props.message.content)
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

/* 行程卡片样式 */
.itinerary-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border: 1px solid var(--divider);
  border-radius: var(--r-card);
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-width: 100%;
}

.itinerary-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--ink-3);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider);
}

.itinerary-icon {
  color: var(--brand);
  font-size: 16px;
}

.itinerary-label {
  font-weight: 600;
  color: var(--ink-2);
  font-size: 14px;
}

.itinerary-time {
  margin-left: auto;
  font-size: 12px;
}

.itinerary-card-content {
  margin-bottom: 12px;
}

.itinerary-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border-left: 3px solid var(--brand);
}

.itinerary-time-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-1);
}

.time-icon {
  font-size: 16px;
}

.time-text {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  color: var(--brand);
}

.itinerary-activity {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-1);
  flex-wrap: wrap;
}

.activity-icon {
  font-size: 18px;
}

.activity-text {
  flex: 1;
  min-width: 0;
}

.itinerary-location {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-3);
}

.location-icon {
  font-size: 14px;
  opacity: 0.7;
}

.location-text {
  flex: 1;
  min-width: 0;
}

.itinerary-description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--divider);
}

.itinerary-description .message-text {
  background: transparent;
  padding: 0;
  box-shadow: none;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink-2);
}

.itinerary-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--divider);
}

.itinerary-card-actions .add-to-itinerary-btn {
  flex: 1;
}

/* 添加到行程按钮样式 */
.add-to-itinerary-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--divider);
}

.add-to-itinerary-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.add-to-itinerary-btn:hover {
  background: var(--brand-hi);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(17, 153, 142, 0.3);
}

.add-to-itinerary-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 14px;
}

.btn-text {
  font-weight: 500;
}
</style>

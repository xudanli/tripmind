<template>
  <div class="composer">
    <div class="composer-input-wrapper">
      <!-- 附件按钮（暂时隐藏，功能待实现） -->
      <!-- <button class="composer-attach-btn" @click="handleAttach" title="添加附件">
        <plus-outlined />
      </button> -->
      
      <!-- 输入框 -->
      <textarea
        ref="inputRef"
        v-model="localValue"
        :placeholder="placeholder"
        :disabled="loading"
        class="composer-input"
        @keydown="handleKeyDown"
        @input="handleInput"
        rows="1"
      />
      
      <!-- 发送按钮 -->
      <button
        class="composer-send-btn"
        :class="{ 'composer-send-btn-active': canSend }"
        :disabled="!canSend || loading"
        @click="handleSend"
        title="发送 (⌘ + Enter)"
      >
        <send-outlined v-if="canSend" />
        <loading-outlined v-else-if="loading" :spin="true" />
      </button>
    </div>
    
    <!-- 命令提示 -->
    <div v-if="showCommandHint" class="composer-command-hint">
      <span class="command-hint-text">{{ commandHint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch, nextTick } from 'vue'
import { PlusOutlined, SendOutlined, LoadingOutlined } from '@ant-design/icons-vue'

interface Props {
  value: string
  loading?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  loading: false,
  placeholder: '输入消息…'
})

const emit = defineEmits<{
  'update:value': [value: string]
  send: []
  attach: []
  command: [command: string, content: string]
}>()

const localValue = ref(props.value)
const inputRef = ref<HTMLTextAreaElement | null>(null)

const canSend = computed(() => {
  return localValue.value.trim().length > 0 && !props.loading
})

const showCommandHint = computed(() => {
  const text = localValue.value.trim()
  if (!text.startsWith('/')) return false
  
  const command = text.split(/\s/)[0]
  const hints: Record<string, string> = {
    '/summary': '总结本线程的讨论内容',
    '/todo': '生成待办事项',
    '/translate': '翻译消息',
    '/polish': '优化文案'
  }
  
  return hints[command] !== undefined
})

const commandHint = computed(() => {
  const text = localValue.value.trim()
  const command = text.split(/\s/)[0]
  const hints: Record<string, string> = {
    '/summary': '总结本线程的讨论内容',
    '/todo': '生成待办事项',
    '/translate': '翻译消息',
    '/polish': '优化文案'
  }
  return hints[command] || ''
})

// 监听外部value变化
watch(() => props.value, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal
    adjustHeight()
  }
})

// 监听本地value变化
watch(localValue, (newVal) => {
  emit('update:value', newVal)
  adjustHeight()
})

// 调整输入框高度
const adjustHeight = () => {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
      const height = Math.min(inputRef.value.scrollHeight, 120) // 最大120px
      inputRef.value.style.height = `${height}px`
    }
  })
}

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  // ⌘ + Enter 或 Ctrl + Enter 发送
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    if (canSend.value) {
      handleSend()
    }
  }
}

// 处理输入
const handleInput = () => {
  adjustHeight()
}

// 发送消息
const handleSend = () => {
  if (!canSend.value) return
  
  const text = localValue.value.trim()
  
  // 检查是否是命令
  const commandMatch = text.match(/^\/(\w+)(?:\s+(.+))?$/)
  if (commandMatch) {
    const [, command, content] = commandMatch
    emit('command', command, content || '')
  } else {
    emit('send')
  }
  
  localValue.value = ''
  adjustHeight()
}

// 处理附件
const handleAttach = () => {
  emit('attach')
}
</script>

<style scoped>
.composer {
  --brand: #11998e;
  --brand-hi: #38ef7d;
  --ink-1: #111;
  --ink-2: #333;
  --ink-3: #666;
  --ink-4: #999;
  --bg: #fff;
  --bubble-self: #F2F3F5;
  --divider: #EDEEF0;
}
.composer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--divider);
}

.composer-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px;
  background: var(--bg);
  border: 1px solid var(--divider);
  border-radius: 12px;
  min-height: 44px;
  max-height: 120px;
}

.composer-attach-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--ink-4);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.composer-attach-btn:hover {
  background: var(--bubble-self);
  color: var(--ink-2);
}

.composer-input {
  flex: 1;
  min-height: 28px;
  max-height: 104px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-1);
  resize: none;
  overflow-y: auto;
  font-family: inherit;
}

.composer-input::placeholder {
  color: var(--ink-4);
}

.composer-input:focus {
  outline: none;
}

.composer-send-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ink-4);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: not-allowed;
  transition: all 0.2s;
  opacity: 0.4;
}

.composer-send-btn-active {
  background: var(--brand);
  cursor: pointer;
  opacity: 1;
  box-shadow: 0 2px 8px rgba(17, 153, 142, 0.3);
}

.composer-send-btn-active:hover {
  background: var(--brand-hi);
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.4);
  transform: translateY(-1px);
}

.composer-send-btn :deep(.anticon) {
  font-size: 18px;
  font-weight: 500;
}

.composer-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.composer-command-hint {
  margin-top: 6px;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--ink-4);
}

.command-hint-text {
  color: var(--ink-3);
}
</style>

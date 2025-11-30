<template>
  <!-- 浮动按钮 -->
  <div 
    v-if="!isOpen"
    class="assistant-float-button"
    @click="openAssistant"
  >
    <div class="assistant-icon">
      <message-outlined />
    </div>
  </div>

  <!-- 聊天窗口 -->
  <div v-if="isOpen" class="assistant-chat-window">
    <!-- 头部 -->
    <div class="chat-header">
      <div class="header-left">
        <div class="header-icon">
          <robot-outlined />
        </div>
        <div class="header-text">
          <div class="header-title">{{ $t('travelAssistant.title') }}</div>
          <div class="header-subtitle">
            {{ $t('travelAssistant.subtitle') }}
          </div>
        </div>
      </div>
      <div class="header-close" @click="closeAssistant">
        <close-outlined />
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        :class="['message-item', message.isOwn ? 'message-own' : 'message-assistant']"
      >
        <!-- AI消息 -->
        <template v-if="!message.isOwn">
          <div class="message-avatar">
            <div class="avatar-icon">
              <robot-outlined />
            </div>
          </div>
          <div class="message-bubble message-bubble-assistant">
            <div class="message-content" v-html="renderMarkdown(message.content)"></div>
          </div>
        </template>

        <!-- 用户消息 -->
        <template v-else>
          <div class="message-bubble message-bubble-user">
            <div class="message-content">{{ message.content }}</div>
          </div>
          <div class="message-avatar message-avatar-user">
            <a-avatar :size="24" class="user-avatar">
              {{ userInitial }}
            </a-avatar>
          </div>
        </template>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="message-item message-assistant">
        <div class="message-avatar">
          <div class="avatar-icon">
            <robot-outlined />
          </div>
        </div>
        <div class="message-bubble message-bubble-assistant">
          <div class="message-content typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <a-input
        v-model:value="inputValue"
        :placeholder="$t('travelAssistant.inputPlaceholder')"
        class="chat-input"
        @pressEnter="handleSend"
        :disabled="isLoading"
      />
      <a-button
        type="primary"
        :loading="isLoading"
        :disabled="!inputValue.trim() || isLoading"
        class="send-button"
        @click="handleSend"
      >
        <template #icon>
          <send-outlined />
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Modal, message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { useTravelListStore } from '@/stores/travelList'
import { 
  chatWithAssistant, 
  updateSlot, 
  addSlotToDay, 
  deleteSlot, 
  reorderSlots,
  type ModificationSuggestion,
  getItineraryDetail,
  getConversationHistory
} from '@/services/itineraryAPI'
import {
  MessageOutlined,
  RobotOutlined,
  CloseOutlined,
  SendOutlined
} from '@ant-design/icons-vue'

interface Message {
  id: string
  content: string
  isOwn: boolean
  timestamp: number
}

const props = defineProps<{
  travelId?: string
}>()

const { t } = useI18n()
const userStore = useUserStore()
const travelListStore = useTravelListStore()

const isOpen = ref(false)
const messages = ref<Message[]>([])
const inputValue = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const conversationId = ref<string | null>(null)
const isProcessingModifications = ref(false)

const currentUser = computed(() => userStore.user)
const userInitial = computed(() => {
  const user = currentUser.value
  return (user?.nickname || user?.name || user?.email || 'U').charAt(0).toUpperCase()
})

// Markdown渲染函数（支持加粗、列表、箭头、链接等）
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  
  let html = text
  
  // 1. 转义HTML特殊字符（防止XSS，但保留已生成的HTML标签）
  // 先标记已处理的链接和格式，避免重复处理
  const placeholders: Record<string, string> = {}
  let placeholderIndex = 0
  
  // 2. 先处理链接 [text](url)
  const linkPattern = new RegExp('\\[([^\\]]+)\\]\\(([^)]+)\\)', 'g')
  html = html.replace(linkPattern, (match, text, url) => {
    const key = `__LINK_${placeholderIndex++}__`
    // 使用 RegExp 构造函数避免 Vue 编译器解析问题
    const ampPattern = new RegExp('&', 'g')
    const ltPattern = new RegExp('<', 'g')
    const gtPattern = new RegExp('>', 'g')
    const escapedUrl = url.replace(ampPattern, '&amp;').replace(ltPattern, '&lt;').replace(gtPattern, '&gt;')
    placeholders[key] = '<a href="' + escapedUrl + '" target="_blank" rel="noopener noreferrer" class="markdown-link">' + text + '</a>'
    return key
  })
  
  // 3. 转义剩余的HTML特殊字符
  // 使用 RegExp 构造函数避免 Vue 编译器解析问题
  const ampPattern2 = new RegExp('&', 'g')
  const ltPattern2 = new RegExp('<', 'g')
  const gtPattern2 = new RegExp('>', 'g')
  html = html
    .replace(ampPattern2, '&amp;')
    .replace(ltPattern2, '&lt;')
    .replace(gtPattern2, '&gt;')
  
  // 4. 恢复链接
  Object.keys(placeholders).forEach(key => {
    const placeholder = placeholders[key]
    if (placeholder) {
      html = html.replace(key, placeholder)
    }
  })
  
  // 5. 处理加粗 **text** 或 __text__
  const boldPattern1 = new RegExp('\\*\\*(.+?)\\*\\*', 'g')
  const boldPattern2 = new RegExp('__(.+?)__', 'g')
  html = html.replace(boldPattern1, '<strong>$1</strong>')
  html = html.replace(boldPattern2, '<strong>$1</strong>')
  
  // 6. 处理箭头符号（→ 或 ->）
  const arrowPattern1 = new RegExp('→', 'g')
  const arrowPattern2 = new RegExp('->', 'g')
  html = html.replace(arrowPattern1, '<span class="markdown-arrow">→</span>')
  html = html.replace(arrowPattern2, '<span class="markdown-arrow">→</span>')
  
  // 7. 处理直接URL（不在链接中的，避免重复处理）
  // 使用字符串替换方法，避免使用不支持的负向后顾断言
  // 使用 RegExp 构造函数避免 Vue 编译器解析问题
  const urlPattern = new RegExp('https?:\\/\\/[^\\s<>"\']+', 'g')
  const urlMatches: Array<{ url: string; index: number }> = []
  let match
  
  // 先收集所有URL的位置（使用原始html）
  const originalHtml = html
  while ((match = urlPattern.exec(originalHtml)) !== null) {
    const url = match[0]
    const index = match.index
    
    // 检查这个URL是否已经在链接标签内
    const beforeUrl = originalHtml.substring(0, index)
    const lastATag = beforeUrl.lastIndexOf('<a')
    const lastATagClose = beforeUrl.lastIndexOf('</a>') // eslint-disable-line no-useless-escape
    
    // 如果最近的 <a> 标签没有关闭，说明这个URL已经在链接内，跳过
    if (lastATag <= lastATagClose) {
      urlMatches.push({ url, index })
    }
  }
  
  // 从后往前替换，避免索引偏移问题
  for (let i = urlMatches.length - 1; i >= 0; i--) {
    const match = urlMatches[i]
    if (match) {
      const { url, index } = match
      // 使用 RegExp 构造函数避免 Vue 编译器解析问题
      const ampPattern3 = new RegExp('&', 'g')
      const ltPattern3 = new RegExp('<', 'g')
      const gtPattern3 = new RegExp('>', 'g')
      const quotPattern = new RegExp('"', 'g')
      const escapedUrl = url.replace(ampPattern3, '&amp;').replace(ltPattern3, '&lt;').replace(gtPattern3, '&gt;').replace(quotPattern, '&quot;')
      const link = '<a href="' + escapedUrl + '" target="_blank" rel="noopener noreferrer" class="markdown-link">' + escapedUrl + '</a>'
      html = html.substring(0, index) + link + html.substring(index + url.length)
    }
  }
  
  // 8. 处理无序列表（- 或 * 开头，行首）
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line !== undefined) {
      // 使用 RegExp 构造函数避免 Vue 编译器解析问题
      const listPattern = new RegExp('^(\\s*)[-*]\\s+(.+)$')
      const listMatch = line.match(listPattern)
      
      if (listMatch && listMatch[2]) {
        if (!inList) {
          processedLines.push('<ul>')
          inList = true
        }
        processedLines.push(`<li>${listMatch[2]}</li>`)
      } else {
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        processedLines.push(line)
      }
    }
  }
  
  if (inList) {
    processedLines.push('</ul>')
  }
  
  html = processedLines.join('\n')
  
  // 9. 处理换行（\n 转换为 <br>，但列表项内的换行保持）
  // 使用 RegExp 构造函数避免 Vue 编译器解析问题
  // 避免在正则表达式中直接使用 </ 标签，改用字符类
  const listTagOpen = '<[uo]l>'
  const listTagClose = '</[uo]l>'
  const listItemTag = '<li>'
  const newlinePattern = new RegExp('\\n(?!' + listTagOpen + '|' + listTagClose + '|' + listItemTag + ')', 'g')
  html = html.replace(newlinePattern, '<br>')
  
  return html
}

// 获取行程ID的辅助函数
const getJourneyId = (): string | null => {
  // 使用 RegExp 构造函数避免 Vue 编译器解析问题
  const uuidPattern = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', 'i')
  const isUUID = props.travelId && uuidPattern.test(props.travelId)
  
  if (isUUID) {
    return props.travelId
  } else {
    const travel = getTravel()
    return travel?.data?.backendItineraryId || travel?.id || props.travelId || null
  }
}

// 获取本地存储的conversationId
const getStoredConversationId = (): string | null => {
  const journeyId = getJourneyId()
  if (!journeyId) return null
  
  try {
    const stored = localStorage.getItem(`assistant_conversation_${journeyId}`)
    return stored || null
  } catch (error) {
    console.warn('[TravelAssistant] 读取本地存储失败:', error)
    return null
  }
}

// 保存conversationId到本地存储
const saveConversationId = (id: string) => {
  const journeyId = getJourneyId()
  if (!journeyId) return
  
  try {
    localStorage.setItem(`assistant_conversation_${journeyId}`, id)
    conversationId.value = id
  } catch (error) {
    console.warn('[TravelAssistant] 保存本地存储失败:', error)
  }
}

// 加载对话历史
const loadConversationHistory = async (journeyId: string, convId: string) => {
  try {
    console.log('[TravelAssistant] 加载对话历史:', { journeyId, conversationId: convId })
    
    const history = await getConversationHistory(journeyId, convId)
    
    if (history.success && history.messages && history.messages.length > 0) {
      // 将历史消息转换为Message格式
      const historyMessages: Message[] = history.messages
        .sort((a, b) => a.sequence - b.sequence) // 按序号排序
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          isOwn: msg.role === 'user',
          timestamp: typeof msg.createdAt === 'string' 
            ? new Date(msg.createdAt).getTime() 
            : msg.createdAt instanceof Date 
            ? msg.createdAt.getTime() 
            : Date.now()
        }))
      
      // 添加到消息列表
      messages.value = historyMessages
      
      console.log('[TravelAssistant] 对话历史加载成功:', historyMessages.length, '条消息')
      
      return true
    }
    
    return false
  } catch (error: any) {
    console.warn('[TravelAssistant] 加载对话历史失败:', error)
    // 静默失败，不影响正常使用
    return false
  }
}

// 打开助手
const openAssistant = async () => {
  isOpen.value = true
  
  // 如果没有消息，尝试加载历史或获取欢迎消息
  if (messages.value.length === 0) {
    const journeyId = getJourneyId()
    const storedConvId = getStoredConversationId()
    
    // 如果有存储的conversationId，尝试加载历史
    if (journeyId && storedConvId) {
      const loaded = await loadConversationHistory(journeyId, storedConvId)
      if (loaded) {
        // 历史加载成功，恢复conversationId
        conversationId.value = storedConvId
        nextTick(() => {
          scrollToBottom()
        })
        return
      }
    }
    
    // 如果没有历史或加载失败，获取欢迎消息
    await fetchWelcomeMessage()
  }
  
  nextTick(() => {
    scrollToBottom()
  })
}

// 关闭助手
const closeAssistant = () => {
  isOpen.value = false
}

// 获取 travel 对象的辅助函数
const getTravel = () => {
  if (!props.travelId) return undefined
  
  // 首先尝试直接获取
  let travel = travelListStore.getTravel(props.travelId)
  
  // 如果找不到，尝试从所有 travel 列表中查找匹配的
  if (!travel) {
    const allTravels = travelListStore.travelList || []
    travel = allTravels.find(t => 
      t.id === props.travelId || 
      t.data?.backendItineraryId === props.travelId
    ) || undefined
  }
  
  return travel
}

// 从后端获取欢迎消息
const fetchWelcomeMessage = async () => {
  try {
    const journeyId = getJourneyId()
    
    if (!journeyId) {
      console.warn('[TravelAssistant] 无法获取行程ID，使用默认欢迎消息')
      // 如果无法获取行程ID，使用默认消息（但这种情况应该很少）
      const defaultMessage: Message = {
        id: `welcome_${Date.now()}`,
        content: t('travelAssistant.defaultWelcome'),
        isOwn: false,
        timestamp: Date.now()
      }
      messages.value.push(defaultMessage)
      return
    }

    // 调用后端接口获取欢迎消息（发送空消息或特殊初始化消息）
    const aiResponse = await chatWithAssistant(journeyId, {
      message: '', // 空消息表示获取欢迎消息
      language: 'zh-CN',
      conversationId: conversationId.value || undefined // 如果有存储的conversationId，使用它
    })

    // 保存conversationId用于后续对话
    if (aiResponse.conversationId) {
      saveConversationId(aiResponse.conversationId)
    }
    
    // 添加欢迎消息
    const welcomeMessage: Message = {
      id: `welcome_${Date.now()}`,
      content: aiResponse.response || t('travelAssistant.defaultWelcome'),
      isOwn: false,
      timestamp: Date.now()
    }
    messages.value.push(welcomeMessage)
  } catch (error: any) {
    console.error('[TravelAssistant] 获取欢迎消息失败:', error)
    // 如果获取失败，使用默认欢迎消息
    const travel = getTravel()
    const destination = travel?.location || travel?.data?.destination || '您的目的地'
    const defaultMessage: Message = {
      id: `welcome_${Date.now()}`,
      content: t('travelAssistant.fallbackWelcome', { destination }),
      isOwn: false,
      timestamp: Date.now()
    }
    messages.value.push(defaultMessage)
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 发送消息
const handleSend = async () => {
  if (!inputValue.value.trim() || isLoading.value) return

  const userMessage: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content: inputValue.value.trim(),
    isOwn: true,
    timestamp: Date.now()
  }

  messages.value.push(userMessage)
  const currentInput = inputValue.value.trim()
  inputValue.value = ''
  
  nextTick(() => {
    scrollToBottom()
  })

  isLoading.value = true

  try {
    const journeyId = getJourneyId()
    
    if (!journeyId) {
      throw new Error('无法获取行程ID')
    }

    // 调用AI助手接口
    const aiResponse = await chatWithAssistant(journeyId, {
      message: currentInput,
      conversationId: conversationId.value || undefined,
      language: 'zh-CN'
    })

    // 保存conversationId用于多轮对话
    if (aiResponse.conversationId) {
      saveConversationId(aiResponse.conversationId)
    }
    
    // 添加AI回复
    const aiMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: aiResponse.response || t('travelAssistant.defaultError'),
      isOwn: false,
      timestamp: Date.now()
    }
    
    messages.value.push(aiMessage)
    
    nextTick(() => {
      scrollToBottom()
    })
    
    // 检查是否有修改建议
    if (aiResponse.modifications && aiResponse.modifications.length > 0) {
      // 延迟处理，让用户先看到回复
      setTimeout(() => {
        handleModifications(aiResponse.modifications!, journeyId)
      }, 500)
    }
  } catch (error: any) {
    console.error('AI助手回复失败:', error)
    const errorMessage: Message = {
      id: `msg_error_${Date.now()}`,
      content: error.message?.includes('无权访问') 
        ? t('travelAssistant.errorNoAccess')
        : error.message?.includes('不存在')
        ? t('travelAssistant.errorNotFound')
        : t('travelAssistant.errorGeneric'),
      isOwn: false,
      timestamp: Date.now()
    }
    messages.value.push(errorMessage)
    
    nextTick(() => {
      scrollToBottom()
    })
  } finally {
    isLoading.value = false
  }
}

// 处理修改建议
const handleModifications = async (modifications: ModificationSuggestion[], journeyId: string) => {
  if (isProcessingModifications.value) {
    return
  }
  
  try {
    // 1. 获取行程详情，用于ID映射
    const itinerary = await getItineraryDetail(journeyId)
    
    // 2. 补充缺失的ID信息
    const enrichedModifications = modifications.map(mod => {
      // 如果只有 day 序号，查找对应的 dayId
      if (mod.target.day && !mod.target.dayId) {
        const day = itinerary.days?.find(d => d.day === mod.target.day)
        if (day) {
          mod.target.dayId = day.id
        }
      }
      
      // 如果只有 activityId，补充 slotId
      if (mod.target.activityId && !mod.target.slotId) {
        mod.target.slotId = mod.target.activityId
      }
      
      return mod
    })
    
    // 3. 显示确认对话框
    const summary = enrichedModifications
      .map(m => m.reason || `${m.type} 操作`)
      .join('\n')
    
    Modal.confirm({
      title: t('travelAssistant.modificationConfirmTitle'),
      content: `${t('travelAssistant.modificationConfirmMessage')}\n\n${summary}`,
      okText: t('travelAssistant.modificationConfirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        await executeModifications(enrichedModifications, journeyId)
      }
    })
  } catch (error: any) {
    console.error('[TravelAssistant] 处理修改建议失败:', error)
    message.error(t('travelAssistant.modificationError'))
  }
}

// 执行修改操作
const executeModifications = async (modifications: ModificationSuggestion[], journeyId: string) => {
  if (isProcessingModifications.value) {
    return
  }
  
  isProcessingModifications.value = true
  const total = modifications.length
  let completed = 0
  const results: Array<{ modification: ModificationSuggestion; success: boolean; error?: string }> = []
  
  try {
    message.loading({
      content: t('travelAssistant.modificationProgress', { current: completed, total }),
      key: 'modification-progress',
      duration: 0
    })
    
    for (const mod of modifications) {
      try {
        await executeModification(mod, journeyId)
        completed++
        results.push({ modification: mod, success: true })
        
        message.loading({
          content: t('travelAssistant.modificationProgress', { current: completed, total }),
          key: 'modification-progress',
          duration: 0
        })
      } catch (error: any) {
        console.error(`[TravelAssistant] 修改失败: ${mod.type}`, error)
        results.push({
          modification: mod,
          success: false,
          error: error.message || '未知错误'
        })
      }
    }
    
    message.destroy('modification-progress')
    
    // 显示结果摘要
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    if (failCount > 0) {
      message.warning(t('travelAssistant.modificationPartialSuccess', { success: successCount, fail: failCount }))
    } else {
      message.success(t('travelAssistant.modificationSuccess', { count: successCount }))
    }
    
    // 刷新行程数据（通过事件通知父组件）
    window.dispatchEvent(new CustomEvent('itinerary-updated', { detail: { journeyId } }))
  } finally {
    isProcessingModifications.value = false
  }
}

// 执行单个修改操作
const executeModification = async (mod: ModificationSuggestion, journeyId: string) => {
  const { target } = mod
  
  if (!target.dayId) {
    throw new Error('缺少 dayId')
  }
  
  switch (mod.type) {
    case 'modify':
      if (!target.slotId || !mod.changes) {
        throw new Error('缺少必要的修改信息')
      }
      await updateSlot(journeyId, target.dayId, target.slotId, mod.changes)
      break
      
    case 'add':
      if (!mod.newActivity) {
        throw new Error('缺少新活动数据')
      }
      await addSlotToDay(journeyId, target.dayId, mod.newActivity)
      break
      
    case 'delete':
      if (!target.slotId) {
        throw new Error('缺少 slotId')
      }
      await deleteSlot(journeyId, target.dayId, target.slotId)
      break
      
    case 'reorder':
      if (!mod.newOrder) {
        throw new Error('缺少新顺序')
      }
      await reorderSlots(journeyId, target.dayId, { activityIds: mod.newOrder })
      break
      
    default:
      throw new Error(`未知的修改类型: ${mod.type}`)
  }
}

// 监听消息变化，自动滚动
watch(() => messages.value.length, () => {
  nextTick(() => {
    scrollToBottom()
  })
})
</script>

<style scoped>
/* 浮动按钮 */
.assistant-float-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #1a1a1a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: all 0.3s ease;
}

.assistant-float-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}

.assistant-float-button .assistant-icon {
  color: #ffd700;
  font-size: 32px;
}

/* 聊天窗口 */
.assistant-chat-window {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 420px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  overflow: hidden;

  /* 头部 */
  .chat-header {
    background: #0f172a;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
  }

  .chat-header .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .chat-header .header-left .header-icon {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
  }

  .chat-header .header-left .header-text {
    flex: 1;
  }

  .chat-header .header-left .header-text .header-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .chat-header .header-left .header-text .header-subtitle {
    font-size: 12px;
    opacity: 0.85;
    line-height: 1.4;
  }

  .chat-header .header-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    transition: background 0.2s;
  }

  .chat-header .header-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* 消息区域 */
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #f8f8f8;

    .message-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .message-item.message-own {
      flex-direction: row-reverse;
    }

    .message-item .message-avatar {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
    }

    .message-item .message-avatar .avatar-icon {
      width: 36px;
      height: 36px;
      background: #1e293b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fbbf24;
      font-size: 18px;
    }

    .message-item .message-avatar.message-avatar-user .user-avatar {
      background: #d9d9d9;
    }

    .message-item .message-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 12px;
      word-wrap: break-word;
    }

    .message-item .message-bubble.message-bubble-assistant {
      background: #fff;
      color: #333;
      border: 1px solid #e8e8e;
      border-bottom-left-radius: 4px;
    }

    .message-item .message-bubble.message-bubble-user {
      background: #1e293b;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-item .message-bubble .message-content {
      font-size: 14px;
      line-height: 1.6;
      word-wrap: break-word;
      
      /* Markdown样式 */
      :deep(strong) {
        font-weight: 600;
        color: #0f172a;
      }
      
      :deep(em) {
        font-style: italic;
      }
      
      :deep(ul), :deep(ol) {
        margin: 8px 0;
        padding-left: 24px;
      }
      
      :deep(li) {
        margin: 4px 0;
        line-height: 1.6;
      }
      
      :deep(.markdown-link) {
        color: #1890ff;
        text-decoration: none;
        border-bottom: 1px solid rgba(24, 144, 255, 0.3);
        transition: all 0.2s;
      }
      
      :deep(.markdown-link:hover) {
        color: #40a9ff;
        border-bottom-color: #40a9ff;
      }
      
      :deep(.markdown-arrow) {
        color: #1890ff;
        font-weight: 500;
        margin: 0 4px;
      }
    }

    .message-item .message-bubble .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }

    .message-item .message-bubble .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: typing 1.4s infinite;
    }

    .message-item .message-bubble .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .message-item .message-bubble .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
  }

  /* 输入区域 */
  .chat-input-area {
    padding: 16px;
    background: white;
    border-top: 1px solid #e8e8e8;
    display: flex;
    gap: 8px;
    align-items: center;

    .chat-input {
      flex: 1;
    }

    .send-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #d9d9d9;
      border: none;
      color: #666;
    }

    .send-button:hover:not(:disabled) {
      background: #bfbfbf;
      color: #333;
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .assistant-chat-window {
    width: calc(100vw - 32px);
    height: calc(100vh - 100px);
    bottom: 16px;
    right: 16px;
    left: 16px;
  }

  .assistant-float-button {
    bottom: 16px;
    right: 16px;
    width: 56px;
    height: 56px;
  }

  .assistant-float-button .assistant-icon {
    font-size: 24px;
  }
}
</style>


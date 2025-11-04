<template>
  <a-card :title="t('travelDetail.discussion')" class="discussion-card" :bordered="false">
    <div class="discussion-area">
      <!-- 消息列表 -->
      <div 
        class="messages-container" 
        ref="messagesContainer"
        aria-live="polite"
        aria-label="讨论区消息列表"
        :aria-busy="loading || isTyping"
      >
        <div v-if="messageGroups.length === 0" class="chat-placeholder">
          <message-outlined :style="{ fontSize: '32px', color: '#999' }" />
          <p>{{ t('travelDetail.chatPlaceholder') }}</p>
        </div>
        <div v-else class="messages-list">
          <template v-for="(group, i) in messageGroups" :key="group.id">
            <!-- 日期分隔线（距离上一组超过 TOKENS.DATE_DIVIDER_THRESHOLD_MS 时显示） -->
            <div
              v-if="i > 0 && (group.time - messageGroups[i - 1].time) > TOKENS.DATE_DIVIDER_THRESHOLD_MS"
              class="date-divider"
              :aria-label="formatDate(group.time)"
            >
              <span>{{ formatDate(group.time) }}</span>
            </div>

            <!-- 时间分割线 -->
            <TimeDivider 
              v-if="shouldShowTimeDivider(group, i)"
              :time="formatTime(group.time)"
            />
            
            <!-- 消息组 -->
            <MessageGroup
              :group="group"
              :is-self="group.isOwn"
              :group-time="formatTime(group.time)"
            />
          </template>
          
          <!-- 输入中指示器 -->
          <div v-if="isTyping" role="status" aria-live="polite">
            <TypingIndicator />
          </div>
          
          <!-- 新消息提示条 -->
          <div 
            v-if="newMsgHint" 
            class="new-msg-hint" 
            @click="() => { scrollToBottom(); newMsgHint = false }"
            @keydown.enter.stop.prevent="() => { scrollToBottom(); newMsgHint = false }"
            @keydown.space.stop.prevent="() => { scrollToBottom(); newMsgHint = false }"
            role="button"
            tabindex="0"
            :aria-label="t('travelDetail.newMessages') || '有新消息，点击查看'"
          >
            {{ t('travelDetail.newMessages') || '有新消息，点击查看' }}
          </div>
        </div>
      </div>
      
      <!-- 输入区 -->
      <Composer
        v-model:value="inputValue"
        :loading="loading"
        :placeholder="composerPlaceholder"
        @send="handleSend"
        @attach="handleAttach"
        @command="handleCommand"
      />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { MessageOutlined } from '@ant-design/icons-vue'
import { useTravelListStore } from '@/stores/travelList'
import { getUserNationalityCode } from '@/config/userProfile'
import { getVisaInfo } from '@/config/visa'
import { PRESET_COUNTRIES } from '@/constants/countries'
import MessageGroup from './DiscussionArea/MessageGroup.vue'
import TimeDivider from './DiscussionArea/TimeDivider.vue'
import TypingIndicator from './DiscussionArea/TypingIndicator.vue'
import Composer from './DiscussionArea/Composer.vue'

export interface Message {
  id: string
  author: string
  role?: string // 角色：'AI助手' | '我' | 其他用户名
  content: string
  timestamp: number
  isOwn: boolean
  avatar?: string
  status?: 'sending' | 'sent' | 'failed' | 'read'
  type?: 'text' | 'ai-card' | 'attachment' | 'image'
  attachments?: Array<{
    type: 'file' | 'image'
    name: string
    url?: string
    size?: number
  }>
  aiActions?: Array<{
    label: string
    action: string
  }>
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
  travelId?: string
  initialMessages?: Message[]
}

const props = withDefaults(defineProps<Props>(), {
  travelId: '',
  initialMessages: () => []
})

const { t, locale } = useI18n()
const travelListStore = useTravelListStore()
const route = useRoute()

// 设计令牌
const TOKENS = {
  GROUP_TIME_THRESHOLD_MS: 30 * 60 * 1000, // 30分钟
  DATE_DIVIDER_THRESHOLD_MS: 6 * 60 * 60 * 1000 // 6小时
}

// 国家别名缓存（模块加载时构建）
const COUNTRY_ALIASES = new Map<string, string>()
const buildCountryAliases = () => {
  const countryAliasesConfig: Record<string, string[]> = {
    'US': ['alaska', '阿拉斯加', 'fairbanks', '费尔班克斯', 'usa', 'united states', '美国', 'america'],
    'JP': ['japan', '日本'],
    'KR': ['korea', 'south korea', '韩国'],
    'TH': ['thailand', '泰国'],
    'SG': ['singapore', '新加坡'],
    'MY': ['malaysia', '马来西亚'],
    'ID': ['indonesia', '印尼'],
    'PH': ['philippines', '菲律宾'],
    'VN': ['vietnam', '越南'],
    'AU': ['australia', '澳大利亚'],
    'CA': ['canada', '加拿大'],
    'NZ': ['new zealand', '新西兰'],
    'GB': ['united kingdom', 'uk', '英国', 'britain'],
    'FR': ['france', '法国'],
    'DE': ['germany', '德国'],
    'IT': ['italy', '意大利'],
    'ES': ['spain', '西班牙'],
    'FI': ['finland', '芬兰'],
    'TW': ['taiwan', '台湾'],
    'HK': ['hong kong', '香港'],
    'MO': ['macau', 'macao', '澳门']
  }
  
  // 遍历PRESET_COUNTRIES，构建索引
  for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
    COUNTRY_ALIASES.set(country.name.toLowerCase(), code)
    COUNTRY_ALIASES.set(code.toLowerCase(), code)
    
    // 添加别名
    const aliases = countryAliasesConfig[code] || []
    aliases.forEach(alias => {
      COUNTRY_ALIASES.set(alias.toLowerCase(), code)
    })
  }
}
buildCountryAliases()

// 查找国家代码（使用缓存）
const lookupCountryCode = (text: string): string | null => {
  if (!text) return null
  const lower = text.toLowerCase()
  for (const [alias, code] of COUNTRY_ALIASES) {
    if (lower.includes(alias)) return code
  }
  return null
}

// 日期/时间正则（复用）
const reTime = /(\d{1,2}):(\d{2})|(\d{1,2})[点时]|(\d{1,2})[:：](\d{2})/
const reDate = /(\d{1,2})[\.\/月](\d{1,2})|(\d{1,2})月(\d{1,2})日|(?<!\d)(\d{1,2})(?=号(?!\d))/

const parseTime = (text: string): string | null => {
  const m = text.match(reTime)
  if (!m) return null
  const h = m[1] || m[3] || m[4]
  const mm = m[2] || m[5] || '00'
  return h ? `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : null
}

const parseDate = (text: string): RegExpMatchArray | null => {
  return text.match(reDate)
}

const inputValue = ref('')
const loading = ref(false)
const messages = ref<Message[]>(props.initialMessages || [])
const messagesContainer = ref<HTMLElement | null>(null)
const isTyping = ref(false)
const atBottom = ref(true)
const newMsgHint = ref(false)

// 时间格式化工具（本地化）
const formatTime = (ts: number): string => {
  try {
    return new Intl.DateTimeFormat(locale.value.startsWith('zh') ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(ts))
  } catch {
    return ''
  }
}

const formatDate = (ts: number): string => {
  try {
    return new Intl.DateTimeFormat(locale.value.startsWith('zh') ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: '2-digit',
      weekday: 'short'
    }).format(new Date(ts))
  } catch {
    return ''
  }
}

// 判断是否在底部
const isNearBottom = (el: HTMLElement, tolerance = 24): boolean => {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= tolerance
}

// 获取旅行数据
const travel = computed(() => {
  return travelListStore.getTravel(props.travelId || route.params.id as string)
})

// 获取行程数据
const itineraryData = computed(() => {
  const data = travel.value?.data
  if (data?.days && Array.isArray(data.days)) {
    return data
  }
  if (data?.plannerItinerary?.days && Array.isArray(data.plannerItinerary.days)) {
    return data.plannerItinerary
  }
  if (data?.itineraryData?.days && Array.isArray(data.itineraryData.days)) {
    return data.itineraryData
  }
  return null
})

// 获取目的地
const destination = computed(() => {
  return travel.value?.location || 
         travel.value?.data?.selectedLocation || 
         itineraryData.value?.destination ||
         ''
})

// 消息组（增量构建，避免频繁重算）
const messageGroups = ref<MessageGroup[]>([])

const rebuildGroups = () => {
  const list = messages.value
  if (!list.length) {
    messageGroups.value = []
    return
  }
  
  const groups: MessageGroup[] = []
  let cur: MessageGroup | null = null
  
  for (const msg of list) {
      const needNew =
      !cur ||
      cur.isOwn !== msg.isOwn ||
      cur.author !== msg.author ||
      (msg.timestamp - cur.time) > TOKENS.GROUP_TIME_THRESHOLD_MS
    
    if (needNew) {
      cur = {
        id: `group_${msg.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        author: msg.author,
        role: msg.role,
        avatar: msg.avatar,
        isOwn: msg.isOwn,
        time: msg.timestamp,
        messages: []
      }
      groups.push(cur)
    }
    cur.messages.push(msg)
    cur.time = msg.timestamp
  }
  
  messageGroups.value = groups
}

// 只在关键字段变化时重建分组（优化性能）
watch(
  () => messages.value.map(m => [m.id, m.author, m.isOwn, m.timestamp].join('|')).join('\n'),
  () => rebuildGroups(),
  { immediate: true }
)

// 是否显示时间分割线
const shouldShowTimeDivider = (group: MessageGroup, index: number): boolean => {
  if (index === 0) return false
  const prev = messageGroups.value[index - 1]
  return (group.time - prev.time) > TOKENS.GROUP_TIME_THRESHOLD_MS
}

// 输入框占位符
const composerPlaceholder = computed(() => {
  return t('travelDetail.chatInputPlaceholder') || '输入消息… 试试 /summary /todo /translate'
})

// 加载保存的消息
const loadMessages = () => {
  if (!props.travelId) return
  
  const travel = travelListStore.getTravel(props.travelId)
  if (travel?.data?.discussionMessages) {
    messages.value = travel.data.discussionMessages.map((msg: any) => ({
      ...msg,
      status: msg.status || 'read'
    }))
  }
}

// 保存消息（节流版本，避免频繁 IO）
let saveTimer: number | null = null
const saveMessagesThrottled = () => {
  if (saveTimer) return
  saveTimer = setSafeTimeout(() => {
    saveTimer = null
    if (!props.travelId) return
    travelListStore.updateTravel(props.travelId, {
      data: {
        ...travelListStore.getTravel(props.travelId)?.data,
        discussionMessages: messages.value
      }
    })
  }, 250) // 250ms 批量保存
}

// 处理命令
const handleCommand = async (command: string, content: string) => {
  if (loading.value) return
  
  const text = (content ?? '').trim() || `/${command}` // 无参命令也能走通
  
  loading.value = true
  isTyping.value = true
  
  // 添加用户消息
  const userMessage: Message = {
    id: crypto.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    author: locale.value.startsWith('zh') ? '我' : 'Me',
    content: text,
    timestamp: Date.now(),
    isOwn: true,
    status: 'sending',
    type: 'text'
  }
  
  await pushAndMaybeScroll(userMessage)
  inputValue.value = ''
  
  // 模拟处理命令
  setSafeTimeout(async () => {
    userMessage.status = 'sent'
    
    // 根据命令类型生成AI回复
    let aiResponse: Message | null = null
    
    switch (command) {
      case 'summary':
        aiResponse = {
          id: crypto.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          author: 'AI 助手',
          role: 'AI助手',
          content: '今日共识：\n1. 优化路线建议：可以将"森林浴+静默徒步"做成模板\n2. 雨天替代方案：书店+茶室',
          timestamp: Date.now(),
          isOwn: false,
          type: 'ai-card',
          status: 'sent',
          aiActions: [
            { label: '插入待办', action: 'todo' },
            { label: '生成行程', action: 'itinerary' }
          ]
        }
        break
      case 'todo':
        aiResponse = {
          id: crypto.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          author: 'AI 助手',
          role: 'AI助手',
          content: '已为您生成待办事项：\n1. 准备"森林浴+静默徒步"模板\n2. 准备雨天替代方案（书店+茶室）',
          timestamp: Date.now(),
          isOwn: false,
          type: 'ai-card',
          status: 'sent'
        }
        break
      default:
        aiResponse = {
          id: crypto.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          author: 'AI 助手',
          role: 'AI助手',
          content: '收到你的消息！我可以帮你优化路线、解答问题，随时提问关于这趟旅程的任何信息。',
          timestamp: Date.now(),
          isOwn: false,
          type: 'text',
          status: 'sent'
        }
    }
    
    if (aiResponse) {
      await pushAndMaybeScroll(aiResponse)
    }
    
    loading.value = false
    isTyping.value = false
  }, 1000)
}

// 定时器管理（防止内存泄漏）
const timers = new Set<number>()
const setSafeTimeout = (fn: () => void, ms: number): number => {
  // @ts-ignore
  const id = window.setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
  return id
}

// 生成AI回复（基于用户问题和旅行数据）
const generateAIResponse = (userMessage: string): string => {
  const msg = userMessage.toLowerCase().trim()
  const originalMsg = userMessage.trim()
  
  // 获取最近的对话历史（最近5条消息，包括AI和用户）
  const recentMessages = messages.value.slice(-5)
  const lastAIMessage = [...recentMessages].reverse().find(m => !m.isOwn)
  const lastUserMessage = [...recentMessages].reverse().find(m => m.isOwn && m.id !== messages.value[messages.value.length - 1]?.id)
  
  // 检查是否是签证信息查询（优先级最高）
  // 1. 包含签证相关关键词
  const hasVisaKeywords = msg.includes('签证') || msg.includes('visa') || 
                          msg.includes('护照') || msg.includes('passport') ||
                          msg.includes('办理') || msg.includes('查看签证') ||
                          (msg.includes('需要') && (msg.includes('办理') || msg.includes('什么')))
  
  // 2. 包含目的地和护照类型（简洁格式："目的地,护照类型"）
  // 动态生成护照类型列表（基于PRESET_COUNTRIES）
  const passportTypes: string[] = []
  Object.entries(PRESET_COUNTRIES).forEach(([code, country]) => {
    passportTypes.push(`${country.name}护照`)
    passportTypes.push(`${code.toLowerCase()} passport`)
    // 添加常见英文名称
    if (code === 'CN') passportTypes.push('chinese passport')
    if (code === 'US') passportTypes.push('american passport', 'us passport')
    if (code === 'JP') passportTypes.push('japanese passport')
    if (code === 'KR') passportTypes.push('korean passport')
  })
  passportTypes.push('护照', 'passport')
  const hasPassportType = passportTypes.some(type => originalMsg.toLowerCase().includes(type.toLowerCase()))
  
  // 动态提取目的地关键词（基于PRESET_COUNTRIES）
  const locationKeywords: string[] = []
  Object.entries(PRESET_COUNTRIES).forEach(([code, country]) => {
    locationKeywords.push(country.name)
    locationKeywords.push(code)
    // 添加常见英文名称和别名
    if (code === 'US') {
      locationKeywords.push('alaska', '阿拉斯加', 'fairbanks', '费尔班克斯', 'usa', 'united states', '美国')
    } else if (code === 'JP') {
      locationKeywords.push('japan', '日本')
    } else if (code === 'KR') {
      locationKeywords.push('korea', '韩国', 'south korea')
    } else if (code === 'TH') {
      locationKeywords.push('thailand', '泰国')
    } else if (code === 'SG') {
      locationKeywords.push('singapore', '新加坡')
    } else if (code === 'MY') {
      locationKeywords.push('malaysia', '马来西亚')
    } else if (code === 'ID') {
      locationKeywords.push('indonesia', '印尼', 'indonesia')
    } else if (code === 'PH') {
      locationKeywords.push('philippines', '菲律宾')
    }
  })
  const hasDestination = locationKeywords.some(keyword => originalMsg.toLowerCase().includes(keyword.toLowerCase()))
  
  const isVisaQuery = hasVisaKeywords || (hasPassportType && hasDestination)
  
  if (isVisaQuery) {
    // 尝试从消息中提取目的地信息
    let extractedDestination = ''
    
    // 检查是否包含"目的地是"、"目的地"、"去"、"前往"等关键词
    const destPatterns = [
      /目的地[是为：:]?([^，。！？\n，,]+)/i,
      /destination[:\s]+([^，。！？\n，,]+)/i,
      /去([^，。！？\n，,]+?)(?:的|需要|查看|查询|签证)/i,
      /前往([^，。！？\n，,]+?)(?:的|需要|查看|查询|签证)/i,
      /到([^，。！？\n，,]+?)(?:的|需要|查看|查询|签证)/i
    ]
    
    for (const pattern of destPatterns) {
      const match = originalMsg.match(pattern)
      if (match && match[1]) {
        extractedDestination = match[1].trim()
        // 移除可能的标点符号
        extractedDestination = extractedDestination.replace(/[，,。！？\n]+$/, '')
        if (extractedDestination) break
      }
    }
    
    // 如果还没有提取到，尝试从locationKeywords中匹配
    if (!extractedDestination) {
      for (const keyword of locationKeywords) {
        if (originalMsg.toLowerCase().includes(keyword.toLowerCase())) {
          // 提取包含关键词的部分（逗号分隔的话，提取逗号前的部分）
          const parts = originalMsg.split(/[，,]/)
          for (const part of parts) {
            if (part.toLowerCase().includes(keyword.toLowerCase())) {
              // 尝试提取关键词前后的文字（最多20个字符）
              const index = part.toLowerCase().indexOf(keyword.toLowerCase())
              const start = Math.max(0, index - 10)
              const end = Math.min(part.length, index + keyword.length + 10)
              extractedDestination = part.substring(start, end).trim()
              break
            }
          }
          if (!extractedDestination) {
            extractedDestination = originalMsg
          }
          break
        }
      }
    }
    
    // 从消息中提取护照类型（用于临时设置国籍代码）- 动态匹配PRESET_COUNTRIES
    let extractedNationalityCode: string | null = null
    const msgLower = originalMsg.toLowerCase()
    
    // 护照类型英文名称映射（常见格式）
    const passportNameMap: Record<string, string[]> = {
      'CN': ['chinese passport', 'china passport'],
      'US': ['american passport', 'us passport', 'usa passport', 'united states passport'],
      'JP': ['japanese passport'],
      'KR': ['korean passport', 'south korean passport'],
      'GB': ['british passport', 'uk passport'],
      'FR': ['french passport'],
      'DE': ['german passport'],
      'IT': ['italian passport'],
      'ES': ['spanish passport'],
      'AU': ['australian passport'],
      'CA': ['canadian passport'],
      'NZ': ['new zealand passport']
    }
    
    for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
      const countryName = country.name
      
      // 匹配中文格式："XX护照"
      if (originalMsg.includes(`${countryName}护照`)) {
        extractedNationalityCode = code
        break
      }
      
      // 匹配英文格式："XX passport" 或 "XX code passport"
      const aliases = passportNameMap[code] || []
      if (aliases.some(alias => msgLower.includes(alias)) || 
          msgLower.includes(`${code.toLowerCase()} passport`)) {
        extractedNationalityCode = code
        break
      }
    }
    
    // 从目的地字符串提取国家代码（使用缓存）
    const extractCountryCodeFromDestination = (destStr: string): string | null => {
      return lookupCountryCode(destStr)
    }
    
    // 如果提取到目的地，尝试更新旅行数据
    if (extractedDestination && travel.value) {
      const countryCode = extractCountryCodeFromDestination(extractedDestination)
      
      // 更新旅行数据的目的地
      if (countryCode && !travel.value.location) {
        travelListStore.updateTravel(travel.value.id, {
          location: extractedDestination
        })
      }
    }
    
    // 获取目的地信息
    const dest = destination.value || extractedDestination || ''
    
    // 判断目的地国家（使用统一的提取函数）
    const countryCode = extractCountryCodeFromDestination(dest)
    
    // 获取用户国籍（优先使用消息中提取的，其次使用配置中的）
    const nationalityCode = extractedNationalityCode || getUserNationalityCode()
    
    if (countryCode && nationalityCode) {
      const visaInfos = getVisaInfo(countryCode, nationalityCode, null)
      if (visaInfos.length > 0) {
        const visaInfo = visaInfos[0]
        const visaTypeMap: Record<string, string> = {
          'visa-free': '免签',
          'visa-on-arrival': '落地签',
          'e-visa': '电子签证',
          'visa-required': '需要提前申请签证',
          'permanent-resident-benefit': '永久居民便利'
        }
        
        const visaTypeText = visaTypeMap[visaInfo.visaType] || visaInfo.visaType
        const durationText = visaInfo.duration ? `，停留期限：${visaInfo.duration}天` : ''
        
        let response = `根据你的护照信息，前往${dest || '该目的地'}的签证情况：\n\n`
        response += `**签证类型**：${visaTypeText}${durationText}\n`
        if (visaInfo.description) {
          response += `**说明**：${visaInfo.description}\n`
        }
        
        // 如果是需要签证，提供建议
        if (visaInfo.visaType === 'visa-required') {
          response += `\n**建议**：\n1. 提前至少1-2个月申请签证\n2. 准备完整的申请材料（护照、照片、行程单等）\n3. 关注签证处理时间，提前规划\n\n需要我帮你生成签证申请的任务清单吗？`
        } else if (visaInfo.visaType === 'e-visa') {
          response += `\n**建议**：\n1. 提前在线申请电子签证\n2. 准备电子版材料（护照扫描件、照片等）\n3. 关注申请处理时间\n\n需要我帮你生成电子签证申请的任务清单吗？`
        } else {
          response += `\n**好消息**：你可以直接前往，无需提前申请签证！\n\n需要我帮你生成其他旅行准备的任务清单吗？`
        }
        
        return response
      } else {
        return `抱歉，我暂时没有找到${dest || '该目的地'}的详细签证信息。建议你：\n\n1. 访问目的地国家的大使馆或领事馆官网查询\n2. 咨询专业的签证服务机构\n3. 查看旅行论坛或社区的签证经验分享\n\n需要我帮你生成其他旅行准备的任务清单吗？`
      }
    } else if (countryCode) {
      return `我识别到目的地是${dest || '该地点'}，但需要你的护照信息才能查询具体的签证要求。\n\n请告诉我你的护照类型（如：中国护照、美国护照等），我可以帮你查询详细的签证信息。`
    } else {
      return `我可以帮你查询签证信息！请告诉我：\n\n1. 你的目的地（如：阿拉斯加、美国等）\n2. 你的护照类型（如：中国护照）\n\n或者直接说"目的地是XX，查看签证信息"，我会帮你查询。`
    }
  }
  
  // 检查是否是活动修改请求（取消、删除、替换、换、调整等）
  const isModificationRequest = msg.includes('取消') || msg.includes('删除') || msg.includes('替换') || 
                                 msg.includes('换') || msg.includes('去掉') || msg.includes('调整') ||
                                 msg.includes('remove') || msg.includes('cancel') || msg.includes('replace') || 
                                 msg.includes('change') || msg.includes('adjust') || msg.includes('modify')
  
  if (isModificationRequest && itineraryData.value?.days) {
    // 提取日期信息（第一天、第二天、第1天、day 1等）
    const dayMatch = originalMsg.match(/第[一二三四五六七八九十\d]+天|第\d+天|day\s*\d+|第一天|第二天|第三天|第四天|第五天/i)
    let targetDayIndex = -1
    
    if (dayMatch) {
      const dayText = dayMatch[0]
      // 处理中文数字
      const chineseNumbers: Record<string, number> = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
      }
      
      const numMatch = dayText.match(/[一二三四五六七八九十]|\d+/)
      if (numMatch) {
        const dayNum = chineseNumbers[numMatch[0]] || parseInt(numMatch[0])
        targetDayIndex = dayNum - 1 // 转换为索引（从0开始）
      }
    } else {
      // 如果没有明确指定，默认第一天
      if (msg.includes('第一天') || msg.includes('第一个') || !msg.includes('第') && !msg.includes('day')) {
        targetDayIndex = 0
      }
    }
    
    // 提取时间信息（如"14:00"、"14时"、"14点"等）
    const timeStr = parseTime(originalMsg)
    let targetTime = timeStr || ''
    
    // 提取活动名称（尝试从原消息中提取）
    const activityKeywords = ['museum', 'museum of', 'restaurant', 'park', 'temple', 'beach', 'lake', 'mountain', 'gallery', 'market', 
                              '博物馆', '餐厅', '公园', '寺庙', '海滩', '湖', '山', '画廊', '市场', '温泉', 'hot', 'springs']
    let mentionedActivity = ''
    
    // 尝试从消息中提取英文活动名称（大写字母开头的短语）
    const activityMatch = originalMsg.match(/([A-Z][a-zA-Z\s]+(?:of\s+the\s+[A-Z][a-zA-Z]+)?)/)
    if (activityMatch) {
      mentionedActivity = activityMatch[1].trim()
    } else {
      // 尝试提取中文活动名称（通过时间后面的文本，或者包含活动关键词的文本）
      // 如果有时间，提取时间后面的内容作为活动名称
      const timeIndex = originalMsg.indexOf(timeStr)
      if (timeIndex !== -1) {
        const afterTime = originalMsg.substring(timeIndex + timeStr.length).trim()
        // 提取时间后到句号、逗号或结尾的内容
        const activityFromTime = afterTime.match(/^[^，。！？\n]+/)?.[0] || ''
        if (activityFromTime && activityFromTime.length > 2) {
          mentionedActivity = activityFromTime.trim()
        }
      }
      
      // 如果还没有提取到，尝试从消息中提取包含关键词的短语
      if (!mentionedActivity) {
        for (const keyword of activityKeywords) {
          if (msg.includes(keyword) || originalMsg.includes(keyword)) {
            // 提取包含关键词的完整短语（从逗号或时间到下一个逗号或句号）
            const keywordMatch = originalMsg.match(new RegExp(`([^，。！？]*${keyword}[^，。！？]*)`, 'i'))
            if (keywordMatch) {
              mentionedActivity = keywordMatch[1].trim()
              break
            }
          }
        }
      }
      
      // 如果还是没有，尝试提取包含"·"的短语（中文活动名称常用格式）
      if (!mentionedActivity) {
        const dotMatch = originalMsg.match(/[··]\s*([^，。！？\n]+)/)
        if (dotMatch) {
          mentionedActivity = dotMatch[1].trim()
        }
      }
    }
    
    // 提取用户想要的替代活动类型
    const replacementType = msg.includes('休闲') || msg.includes('放松') || msg.includes('轻松') ? '休闲' :
                            msg.includes('刺激') || msg.includes('冒险') ? '刺激' :
                            msg.includes('文化') || msg.includes('历史') ? '文化' :
                            msg.includes('自然') || msg.includes('户外') ? '自然' :
                            msg.includes('美食') || msg.includes('餐厅') ? '美食' :
                            '休闲'
    
    if (targetDayIndex >= 0 && targetDayIndex < itineraryData.value.days.length) {
      const targetDay = itineraryData.value.days[targetDayIndex]
      const activities = targetDay.timeSlots || targetDay.activities || []
      
      // 尝试找到提到的活动（优先通过时间匹配，其次通过名称匹配）
      let foundActivity = null
      
      // 如果提供了时间，优先通过时间匹配
      if (targetTime) {
        foundActivity = activities.find((a: any) => {
          const activityTime = a.time || ''
          // 匹配时间格式（如"14:00"、"14时"等）
          const activityTimeStr = parseTime(activityTime)
          if (activityTimeStr) {
            return activityTimeStr === targetTime
          }
          return false
        })
      }
      
      // 如果通过时间没找到，或者没有提供时间，通过名称匹配
      if (!foundActivity && mentionedActivity) {
        foundActivity = activities.find((a: any) => {
          const title = (a.title || a.activity || a.details?.name?.chinese || a.details?.name?.english || '').toLowerCase()
          const searchTerm = mentionedActivity.toLowerCase()
          // 检查是否包含关键词，或者检查是否包含活动名称的主要部分
          const titleWords = title.split(/[·\s\-_]+/)
          const searchWords = searchTerm.split(/[·\s\-_]+/)
          // 如果搜索词中的主要词汇都在标题中，或者标题包含搜索词，则匹配
          const hasMainWords = searchWords.some(word => word.length > 2 && title.includes(word))
          return title.includes(searchTerm) || searchTerm.includes(title) || hasMainWords
        })
      }
      
      // 如果提供了时间但没找到，尝试模糊匹配时间（允许前后30分钟）
      if (!foundActivity && targetTime) {
        const [targetHour, targetMinute] = targetTime.split(':').map(Number)
        const targetMinutes = targetHour * 60 + targetMinute
        
        foundActivity = activities.find((a: any) => {
          const activityTime = a.time || ''
          const activityTimeStr = parseTime(activityTime)
          if (activityTimeStr) {
            const [hour, minute] = activityTimeStr.split(':').map(Number)
            const activityMinutes = hour * 60 + minute
            // 允许前后30分钟的误差
            return Math.abs(activityMinutes - targetMinutes) <= 30
          }
          return false
        })
      }
      
      // 生成替代活动建议（基于实际情况）
      const suggestions: string[] = []
      
      // 获取目的地信息
      const dest = destination.value || ''
      const destLower = dest.toLowerCase()
      
      // 获取活动详细信息
      const activityTitle = foundActivity?.title || foundActivity?.activity || 
                           foundActivity?.details?.name?.chinese || 
                           foundActivity?.details?.name?.english || ''
      const activityLocation = foundActivity?.location || 
                              foundActivity?.details?.address?.chinese || 
                              foundActivity?.details?.address?.english || ''
      const activityType = foundActivity?.type || foundActivity?.category || ''
      const activityDescription = foundActivity?.details?.description?.chinese ||
                                 foundActivity?.details?.description?.english || ''
      
      // 分析活动特征
      const activityTitleLower = activityTitle.toLowerCase()
      const activityLocationLower = activityLocation.toLowerCase()
      const activityDescLower = activityDescription.toLowerCase()
      
      const isHotSpring = activityTitleLower.includes('温泉') || activityTitleLower.includes('hot spring') ||
                         activityLocationLower.includes('温泉') || activityLocationLower.includes('hot spring') ||
                         activityLocationLower.includes('chena') || activityDescLower.includes('温泉')
      
      const isOutdoor = activityTitleLower.includes('户外') || activityTitleLower.includes('outdoor') ||
                       activityTitleLower.includes('徒步') || activityTitleLower.includes('hiking') ||
                       activityTitleLower.includes('自然') || activityTitleLower.includes('nature')
      
      const isNatural = activityTitleLower.includes('湖') || activityTitleLower.includes('lake') ||
                       activityTitleLower.includes('山') || activityTitleLower.includes('mountain') ||
                       activityLocationLower.includes('湖') || activityLocationLower.includes('lake')
      
      const isAurora = activityTitleLower.includes('极光') || activityTitleLower.includes('aurora') ||
                      activityDescLower.includes('极光') || activityDescLower.includes('aurora')
      
      const isAlaska = destLower.includes('alaska') || destLower.includes('阿拉斯加') ||
                       activityLocationLower.includes('alaska') || activityLocationLower.includes('阿拉斯加') ||
                       activityLocationLower.includes('fairbanks') || activityLocationLower.includes('费尔班克斯') ||
                       activityLocationLower.includes('chena') || activityLocationLower.includes('切纳')
      
      // 获取当天其他活动的位置和类型，用于推荐附近的活动
      const otherActivities = activities.filter((a: any) => a !== foundActivity)
      const otherActivitiesLocations = otherActivities
        .map((a: any) => a.location || a.details?.address?.chinese || a.details?.address?.english || '')
        .filter(Boolean)
      
      // 分析其他活动的类型
      const hasHotSpring = otherActivities.some((a: any) => {
        const title = (a.title || a.activity || '').toLowerCase()
        return title.includes('温泉') || title.includes('hot spring')
      })
      
      const hasOutdoor = otherActivities.some((a: any) => {
        const title = (a.title || a.activity || '').toLowerCase()
        return title.includes('户外') || title.includes('徒步') || title.includes('hiking')
      })
      
      // 根据目的地特征推荐
      const isCity = destLower.includes('城市') || destLower.includes('city') || 
                     destLower.includes('北京') || destLower.includes('上海') || 
                     destLower.includes('纽约') || destLower.includes('london') || 
                     destLower.includes('tokyo') || destLower.includes('paris')
      
      const isCoastal = destLower.includes('海') || destLower.includes('岛') ||
                        destLower.includes('beach') || destLower.includes('island') ||
                        destLower.includes('coast') || destLower.includes('三亚') ||
                        destLower.includes('malibu') || destLower.includes('hawaii')
      
      const isMountain = destLower.includes('山') || destLower.includes('mountain') ||
                          destLower.includes('alps') || destLower.includes('rocky')
      
      // 基于实际活动信息和目的地生成建议
      if (foundActivity) {
        // 如果找到了活动，基于活动特征推荐
        if (isAlaska) {
          // 阿拉斯加特定推荐
          if (isHotSpring) {
            // 如果是温泉活动，推荐其他温泉或放松活动
            suggestions.push('切纳温泉度假村其他设施体验')
            suggestions.push('附近的自然步道或观景台')
            suggestions.push('度假村内休息或用餐')
            if (isAurora) {
              suggestions.push('等待极光的休息点或观景台')
            }
          } else if (isOutdoor || isNatural) {
            // 如果是户外自然活动
            if (replacementType === '休闲') {
              suggestions.push('切纳温泉度假村休息或SPA')
              suggestions.push('度假村内咖啡厅或餐厅')
              suggestions.push('附近观景台或步道（轻松版）')
            } else {
              suggestions.push('切纳湖附近自然步道')
              suggestions.push('观鸟或野生动物观察点')
              suggestions.push('附近自然观景台')
            }
          } else {
            // 其他活动
            if (replacementType === '休闲') {
              suggestions.push('切纳温泉度假村休息')
              suggestions.push('度假村内咖啡厅或用餐')
              suggestions.push('附近自然步道（轻松）')
            }
          }
        } else if (isCity) {
          // 城市目的地
          if (replacementType === '休闲') {
            suggestions.push('城市公园漫步或咖啡厅小憩')
            suggestions.push('当地市场或特色小店探索')
            suggestions.push('书店或艺术馆参观')
            if (isCoastal) {
              suggestions.push('海边观景台或步道')
            }
          }
        } else {
          // 其他自然目的地
          if (replacementType === '休闲') {
            suggestions.push('自然步道或观景台')
            suggestions.push('附近休息点或咖啡厅')
            suggestions.push('野餐或下午茶')
            if (isMountain || isHotSpring) {
              suggestions.push('温泉或SPA放松')
            }
          }
        }
      }
      
      // 如果还没有足够的建议，基于替代类型和目的地特征补充
      if (suggestions.length < 3) {
        if (replacementType === '休闲') {
          if (isAlaska) {
            suggestions.push('切纳温泉度假村内休息或用餐')
            suggestions.push('附近自然步道或观景台')
            suggestions.push('等待极光的休息点')
          } else if (isCity) {
            suggestions.push('城市公园漫步或咖啡厅小憩')
            suggestions.push('当地市场或特色小店探索')
            suggestions.push('书店或艺术馆参观')
          } else if (isNatural || isMountain) {
            suggestions.push('自然步道或观景台')
            suggestions.push('湖边或溪边休息')
            suggestions.push('野餐或下午茶')
            if (isMountain) {
              suggestions.push('温泉或SPA放松')
            }
          } else if (isCoastal) {
            suggestions.push('海边漫步或沙滩休息')
            suggestions.push('海边咖啡厅或餐厅')
            suggestions.push('海边观景台')
          } else {
            suggestions.push('公园漫步或咖啡厅休息')
            suggestions.push('当地市场或特色小店探索')
            suggestions.push('湖边或海边观景')
            suggestions.push('温泉或SPA放松')
          }
        } else if (replacementType === '自然') {
          if (isAlaska) {
            suggestions.push('切纳湖自然步道')
            suggestions.push('野生动物观察点')
            suggestions.push('附近自然观景台')
          } else if (isCity) {
            suggestions.push('城市公园或植物园')
            suggestions.push('郊外自然步道')
            suggestions.push('观鸟或自然观察点')
          } else {
            suggestions.push('自然公园或保护区')
            suggestions.push('徒步小径或观景台')
            suggestions.push('植物园或花园')
          }
        } else if (replacementType === '文化') {
          suggestions.push('当地文化中心或艺术馆')
          suggestions.push('历史街区或古镇探索')
          suggestions.push('传统手工艺体验')
        } else if (replacementType === '美食') {
          suggestions.push('当地特色餐厅')
          suggestions.push('美食市场或小吃街')
          suggestions.push('烹饪体验课程')
        }
      }
      
      // 如果活动位置信息可用，添加基于位置的建议
      if (activityLocation && suggestions.length < 4) {
        const locationLower = activityLocation.toLowerCase()
        if (locationLower.includes('museum') || locationLower.includes('gallery') || locationLower.includes('博物馆')) {
          if (!suggestions.some(s => s.includes('咖啡厅') || s.includes('公园'))) {
            suggestions.push('附近的公园或咖啡厅')
          }
        } else if (locationLower.includes('park') || locationLower.includes('公园')) {
          if (!suggestions.some(s => s.includes('餐厅') || s.includes('市场'))) {
            suggestions.push('附近的特色餐厅或市场')
          }
        }
      }
      
      // 根据当天其他活动的位置，推荐附近的活动
      if (otherActivitiesLocations.length > 0 && suggestions.length < 4) {
        const hasLake = otherActivitiesLocations.some(loc => 
          loc.toLowerCase().includes('lake') || loc.includes('湖') || loc.includes('lakeside'))
        const hasBeach = otherActivitiesLocations.some(loc => 
          loc.toLowerCase().includes('beach') || loc.includes('海') || loc.includes('海边'))
        const hasMountain = otherActivitiesLocations.some(loc => 
          loc.toLowerCase().includes('mountain') || loc.includes('山'))
        
        if (hasLake && replacementType === '休闲' && !suggestions.some(s => s.includes('湖'))) {
          suggestions.push('湖边漫步或观景')
        }
        if (hasBeach && replacementType === '休闲' && !suggestions.some(s => s.includes('海'))) {
          suggestions.push('海边休息或观景')
        }
        if (hasMountain && replacementType === '休闲' && !suggestions.some(s => s.includes('山'))) {
          suggestions.push('山间步道或观景台')
        }
      }
      
      // 如果还没有足够的建议，补充通用建议
      if (suggestions.length === 0) {
        if (replacementType === '休闲') {
          suggestions.push('公园漫步或咖啡厅休息')
          suggestions.push('当地市场或特色小店探索')
        } else if (replacementType === '自然') {
          suggestions.push('自然公园或保护区')
          suggestions.push('徒步小径或观景台')
        } else if (replacementType === '文化') {
          suggestions.push('当地文化中心或艺术馆')
          suggestions.push('历史街区或古镇')
        }
      }
      
      const dayNum = targetDayIndex + 1
      const dayText = dayNum === 1 ? '第一天' : `第${dayNum}天`
      const activityName = foundActivity ? 
        (foundActivity.title || foundActivity.activity || foundActivity.details?.name?.chinese || foundActivity.details?.name?.english || '该活动') :
        (mentionedActivity || '该活动')
      
      const suggestionsText = suggestions.length > 0 ? 
        `\n\n我建议的${replacementType}替代方案：\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : 
        ''
      
      return `我理解了，你想在${dayText}取消"${activityName}"，换一个${replacementType}的活动。${suggestionsText}\n\n需要我帮你确定具体的替代活动和时间安排吗？`
    } else if (targetDayIndex === -1 && mentionedActivity) {
      // 如果只提到了活动名称，但没有明确日期
      return `我注意到你想修改"${mentionedActivity}"这个活动。请告诉我这是在第几天的安排？这样我可以帮你找到合适的替代方案。`
    }
  }
  
  // 检查是否是回应AI的提问（"需要"、"好的"、"可以"等）
  const isAffirmativeResponse = msg.match(/^(需要|好的|可以|行|嗯|ok|yes|sure|好的|没问题)/i)
  const isOptimizationRequest = msg.includes('优化') || msg.includes('建议') || msg.includes('optimize') || msg.includes('suggest')
  
  // 如果用户回应"需要"或询问"优化建议"，且上一条是AI消息
  if ((isAffirmativeResponse || isOptimizationRequest) && lastAIMessage) {
    const aiContent = lastAIMessage.content.toLowerCase()
    
    // 如果AI刚提到行程安排或日期
    if (aiContent.includes('安排') || aiContent.includes('行程') || aiContent.includes('需要我帮你优化')) {
      // 提取AI消息中提到的日期或行程
      const dateMatchInAI = parseDate(lastAIMessage.content)
      if (dateMatchInAI) {
        const month = dateMatchInAI[1] || dateMatchInAI[3] || ''
        const day = dateMatchInAI[2] || dateMatchInAI[4] || dateMatchInAI[5] || ''
        
        if (itineraryData.value?.days && day) {
          const targetDay = itineraryData.value.days.find((d: any) => {
            if (d.date) {
              try {
                const date = new Date(d.date)
                const dayNum = parseInt(day)
                if (month) {
                  const monthNum = parseInt(month)
                  return date.getMonth() + 1 === monthNum && date.getDate() === dayNum
                } else {
                  return date.getDate() === dayNum
                }
              } catch (e) {
                return false
              }
            }
            return false
          })
          
          if (targetDay) {
            const activities = targetDay.timeSlots || targetDay.activities || []
            const suggestions: string[] = []
            
            // 分析活动，给出优化建议
            if (activities.length > 4) {
              suggestions.push('活动安排较密集，建议适当减少2-3个活动，留出更多休息和自由探索的时间')
            }
            
            // 检查时间间隔
            const timeSlots = activities.filter((a: any) => a.time).map((a: any) => {
              const timeStr = parseTime(a.time)
              if (timeStr) {
                const [hour, minute] = timeStr.split(':').map(Number)
                return hour * 60 + minute
              }
              return null
            }).filter((t: any) => t !== null).sort((a: number, b: number) => a - b)
            
            if (timeSlots.length > 1) {
              const intervals = []
              for (let i = 1; i < timeSlots.length; i++) {
                intervals.push(timeSlots[i] - timeSlots[i - 1])
              }
              const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
              if (avgInterval < 60) {
                suggestions.push('活动之间的时间间隔较短，建议至少间隔1-2小时，避免过于匆忙')
              }
            }
            
            // 检查是否有重复地点
            const locations = activities.map((a: any) => a.location || a.details?.address?.chinese || '').filter(Boolean)
            const uniqueLocations = new Set(locations)
            if (locations.length > uniqueLocations.size && locations.length > 2) {
              suggestions.push('建议优化路线，将相同或相近地点的活动安排在一起，减少往返时间')
            }
            
            // 检查是否有用餐时间
            const hasMeal = activities.some((a: any) => {
              const title = (a.title || a.activity || '').toLowerCase()
              return title.includes('餐') || title.includes('吃') || title.includes('meal') || title.includes('restaurant')
            })
            if (!hasMeal && activities.length >= 3) {
              suggestions.push('建议在行程中安排用餐时间，确保有充足的休息和能量补充')
            }
            
            if (suggestions.length > 0) {
              return `针对${month && day ? `${month}月${day}日` : `${day}号`}的行程，我的优化建议是：\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n需要我帮你调整具体的时间安排吗？`
            } else {
              return `关于${month && day ? `${month}月${day}日` : `${day}号`}的行程，目前的安排比较合理。如果觉得时间紧张，可以考虑：\n\n1. 适当延长每个活动的停留时间\n2. 增加休息缓冲时间\n3. 准备备选方案（如遇天气变化）\n\n有其他需要调整的地方吗？`
            }
          }
        }
      }
      
      // 通用优化建议
      return `针对行程优化，我的建议是：\n\n1. **时间分配**：确保每个活动之间有足够的缓冲时间（建议至少1-2小时），避免过于匆忙\n\n2. **路线优化**：将相同或相近地点的活动安排在一起，减少往返时间\n\n3. **用餐安排**：在行程中合理穿插用餐时间，避免连续活动导致疲劳\n\n4. **备选方案**：准备雨天或突发情况的备选活动\n\n5. **休息时间**：每天安排1-2小时的自由时间，用于休息或临时调整\n\n需要我帮你调整具体某一天的安排吗？`
    }
  }
  
  // 检查日期相关问题（如"11.5"、"11月5日"、"11/5"、"5号"等）
  // 改进：避免匹配地址中的数字（如"6450号"），只匹配合理的日期格式
  const dateMatch = msg.match(/(\d{1,2})[\.\/月](\d{1,2})|(\d{1,2})月(\d{1,2})日|(?<!\d)(\d{1,2})(?=号(?!\d))/)
  // 进一步验证：如果匹配到的是大数字（如50、6450），且上下文是地址，则忽略
  if (dateMatch) {
    const day = dateMatch[2] || dateMatch[4] || dateMatch[5] || ''
    const dayNum = parseInt(day)
    // 如果数字大于31，可能是地址中的数字，不是日期
    let isAddress = false
    if (dayNum > 31) {
      // 检查前后文是否有地址相关关键词
      const context = originalMsg.substring(Math.max(0, (dateMatch.index || 0) - 10), Math.min(originalMsg.length, (dateMatch.index || 0) + dateMatch[0].length + 10)).toLowerCase()
      if (context.includes('路') || context.includes('街') || context.includes('road') || context.includes('street') || context.includes('address') || context.includes('机场路')) {
        // 很可能是地址，跳过日期匹配
        isAddress = true
      }
    }
    
    // 如果不是地址，继续处理日期匹配
    if (!isAddress) {
      const month = dateMatch[1] || dateMatch[3] || ''
      const day = dateMatch[2] || dateMatch[4] || dateMatch[5] || ''
      
      if (itineraryData.value?.days && day) {
        // 尝试匹配日期
        const targetDay = itineraryData.value.days.find((d: any) => {
        if (d.date) {
          try {
            const date = new Date(d.date)
            const dayNum = parseInt(day)
            // 如果指定了月份，同时匹配月份和日期；否则只匹配日期
            if (month) {
              const monthNum = parseInt(month)
              return date.getMonth() + 1 === monthNum && date.getDate() === dayNum
            } else {
              return date.getDate() === dayNum
            }
          } catch (e) {
            return false
          }
        }
        // 如果日期字段是字符串格式，尝试解析
        if (typeof d.date === 'string') {
          const dateStr = d.date
          const dayNum = parseInt(day)
          if (month) {
            const monthNum = parseInt(month)
            return dateStr.includes(`${month}.${day}`) || 
                   dateStr.includes(`${month}/${day}`) ||
                   dateStr.includes(`${month}月${day}日`)
          } else {
            return dateStr.includes(`${day}号`) || dateStr.includes(`-${day}`) || dateStr.endsWith(`-${day}`)
          }
        }
          return false
        })
        
        if (targetDay) {
          const activities = (targetDay.timeSlots || targetDay.activities || []).map((slot: any, idx: number) => {
            const time = slot.time || ''
            const title = slot.title || slot.activity || slot.details?.name?.chinese || slot.details?.name?.english || ''
            const location = slot.location || slot.details?.address?.chinese || slot.details?.address?.english || ''
            return `${idx + 1}. ${time} ${title}${location ? ` · ${location}` : ''}`
          }).join('\n')
          
          const dateStr = targetDay.date || (month && day ? `${month}月${day}日` : `${day}号`)
          return `根据行程安排，${dateStr}的安排如下：\n\n${activities || '暂无具体安排'}\n\n需要我帮你优化或调整吗？`
        }
        
        // 如果没有找到具体日期，返回通用信息
        const dateStr = month && day ? `${month}月${day}日` : `${day}号`
        return `我查看了行程，${dateStr}${itineraryData.value.days.length ? `，共有${itineraryData.value.days.length}天的行程安排` : '暂无具体安排'}。需要我帮你查看哪一天的详细安排？`
      }
      
      // 如果只是提到了日期但没有明确的天数
      if (itineraryData.value?.days) {
        return `我查看了行程，共有${itineraryData.value.days.length}天的安排。请输入具体日期（如：11.5 或 5号）查看详细安排。`
      }
    }
  }
  
  // 检查优化/调整相关请求
  if (msg.includes('优化') || msg.includes('调整') || msg.includes('建议') || msg.includes('optimize') || msg.includes('suggest') || msg.includes('adjust')) {
    // 如果上一条AI消息提到了具体日期或行程
    if (lastAIMessage && (lastAIMessage.content.includes('安排') || lastAIMessage.content.includes('行程'))) {
      const dateMatchInAI = lastAIMessage.content.match(/(\d{1,2})[\.\/月](\d{1,2})|(\d{1,2})月(\d{1,2})日|(\d{1,2})号/)
      if (dateMatchInAI) {
        const month = dateMatchInAI[1] || dateMatchInAI[3] || ''
        const day = dateMatchInAI[2] || dateMatchInAI[4] || dateMatchInAI[5] || ''
        
        if (itineraryData.value?.days && day) {
          const targetDay = itineraryData.value.days.find((d: any) => {
            if (d.date) {
              try {
                const date = new Date(d.date)
                const dayNum = parseInt(day)
                if (month) {
                  const monthNum = parseInt(month)
                  return date.getMonth() + 1 === monthNum && date.getDate() === dayNum
                } else {
                  return date.getDate() === dayNum
                }
              } catch (e) {
                return false
              }
            }
            return false
          })
          
          if (targetDay) {
            const activities = targetDay.timeSlots || targetDay.activities || []
            const suggestions: string[] = []
            
            if (activities.length > 4) {
              suggestions.push('活动安排较密集，建议减少2-3个活动，留出休息时间')
            }
            
            const timeSlots = activities.filter((a: any) => a.time).map((a: any) => {
              const timeMatch = a.time.match(/(\d{1,2}):(\d{2})/)
              if (timeMatch) {
                return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2])
              }
              return null
            }).filter((t: any) => t !== null).sort((a: number, b: number) => a - b)
            
            if (timeSlots.length > 1) {
              const intervals = []
              for (let i = 1; i < timeSlots.length; i++) {
                intervals.push(timeSlots[i] - timeSlots[i - 1])
              }
              const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
              if (avgInterval < 60) {
                suggestions.push('活动时间间隔较短，建议至少间隔1-2小时')
              }
            }
            
            if (suggestions.length > 0) {
              return `针对${month && day ? `${month}月${day}日` : `${day}号`}的优化建议：\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n需要我帮你调整具体安排吗？`
            }
          }
        }
      }
    }
    
    // 通用优化建议
    return `针对行程优化，我的建议是：\n\n1. **时间分配**：活动之间保留1-2小时缓冲时间\n2. **路线优化**：将相近地点活动安排在一起\n3. **用餐安排**：合理穿插用餐和休息时间\n4. **备选方案**：准备雨天或突发情况的备选活动\n\n需要我帮你调整具体某一天的安排吗？`
  }
  
  // 检查路线/行程相关问题
  if (msg.includes('路线') || msg.includes('行程') || msg.includes('安排') || msg.includes('schedule') || msg.includes('itinerary')) {
    if (itineraryData.value?.days) {
      const dayCount = itineraryData.value.days.length
      const dest = destination.value || '目的地'
      return `当前行程共${dayCount}天，目的地是${dest}。我可以帮你：\n1. 优化路线安排\n2. 查看具体某一天的详细安排\n3. 调整活动时间\n\n你想了解哪方面？`
    }
    return '我可以帮你优化路线、查看行程安排。告诉我你想了解哪一天的安排，或者输入日期（如：11.5）查看具体行程。'
  }
  
  // 检查预算相关问题
  if (msg.includes('预算') || msg.includes('花费') || msg.includes('费用') || msg.includes('budget') || msg.includes('cost')) {
    const budget = travel.value?.budget || 0
    const spent = travel.value?.spent || 0
    if (budget > 0) {
      const remaining = budget - spent
      return `当前预算情况：\n总预算：${budget}\n已花费：${spent}\n剩余：${remaining}\n\n需要我帮你优化预算或分析支出吗？`
    }
    return '我可以帮你管理预算、分析支出。你可以在右侧的"预算管理"中查看和编辑预算详情。'
  }
  
  // 检查目的地相关问题
  if (msg.includes('哪里') || msg.includes('目的地') || msg.includes('去哪') || msg.includes('where') || msg.includes('destination')) {
    const dest = destination.value
    if (dest) {
      return `目的地是：${dest}\n\n关于${dest}，我可以帮你：\n1. 查看签证信息\n2. 推荐当地活动\n3. 优化行程路线\n\n你想了解什么？`
    }
    return '我可以帮你了解目的地信息、推荐景点和活动。告诉我你想了解的目的地或具体问题。'
  }
  
  // 检查天气/季节相关问题
  if (msg.includes('天气') || msg.includes('季节') || msg.includes('weather') || msg.includes('season')) {
    return '我可以帮你查看目的地天气和季节建议。建议关注目的地的天气预报，并根据季节特点准备相应的衣物和装备。需要我帮你查看具体的季节建议吗？'
  }
  
  // 默认回复
  return '收到你的消息！我是这趟旅程的AI助手，可以帮你：\n\n1. 📅 查看和优化行程安排（输入日期如"11.5"查看具体安排）\n2. 💰 管理预算和支出\n3. 🗺️ 优化路线和推荐景点\n4. 📋 生成待办事项\n5. 💡 解答关于旅程的任何问题\n\n随时提问，我会尽力帮助你！'
}

// 发送消息
const handleSend = async () => {
  if (!inputValue.value.trim() || loading.value) return
  
  // 检查是否是命令
  const commandMatch = inputValue.value.trim().match(/^\/(\w+)(?:\s+(.+))?$/)
  if (commandMatch) {
    const [, command, content] = commandMatch
    await handleCommand(command, content || '')
    return
  }
  
  loading.value = true
  isTyping.value = true
  
  const userMessageContent = inputValue.value.trim()
  const newMessage: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    author: locale.value.startsWith('zh') ? '我' : 'Me',
    content: userMessageContent,
    timestamp: Date.now(),
    isOwn: true,
    status: 'sending',
    type: 'text'
  }
  
  await pushAndMaybeScroll(newMessage)
  inputValue.value = ''
  
  // 模拟发送成功，然后生成AI回复
  setSafeTimeout(async () => {
    newMessage.status = 'sent'
    saveMessagesThrottled()
    
    // 生成AI回复（延迟1-2秒模拟思考）
    setSafeTimeout(async () => {
      const aiResponseContent = generateAIResponse(userMessageContent)
      
      const aiResponse: Message = {
        id: crypto.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        author: 'AI 助手',
        role: 'AI助手',
        content: aiResponseContent,
        timestamp: Date.now(),
        isOwn: false,
        type: 'text',
        status: 'sent'
      }
      
      await pushAndMaybeScroll(aiResponse)
      loading.value = false
      isTyping.value = false
    }, 1000 + Math.random() * 1000) // 1-2秒随机延迟
  }, 500)
}

// 处理附件
const handleAttach = () => {
  // TODO: 实现附件上传
  console.log('Attach file')
}

// 滚动行为
const updateAtBottom = () => {
  if (!messagesContainer.value) return
  atBottom.value = isNearBottom(messagesContainer.value)
}

const scrollToBottom = (smooth = true) => {
  const el = messagesContainer.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

const handleIncomingMessage = async () => {
  await nextTick()
  if (atBottom.value) {
    scrollToBottom()
    newMsgHint.value = false
  } else {
    newMsgHint.value = true
  }
}


const pushAndMaybeScroll = async (msg: Message) => {
  messages.value.push(msg)
  saveMessagesThrottled()
  await handleIncomingMessage()
}

// 键盘快捷键（全局监听）
const onKeydown = (e: KeyboardEvent) => {
  // 忽略正在输入法合成
  // @ts-ignore
  if (e.isComposing) return
  const isSubmit = (e.metaKey || e.ctrlKey) && e.key === 'Enter'
  if (isSubmit && inputValue.value.trim() && !loading.value) {
    e.preventDefault()
    handleSend()
  }
}

// 监听travelId变化，加载消息
watch(() => props.travelId, () => {
  if (props.travelId) {
    loadMessages()
  }
}, { immediate: true })

// 监听消息长度变化，处理滚动
watch(() => messages.value.length, () => handleIncomingMessage())

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  loadMessages()
  const el = messagesContainer.value
  if (!el) return
  el.addEventListener('scroll', updateAtBottom, { passive: true })
  updateAtBottom() // 初始检查
  window.addEventListener('keydown', onKeydown)
  
  // 使用 ResizeObserver 监听内容高度变化
  resizeObserver = new ResizeObserver(() => {
    updateAtBottom()
  })
  resizeObserver.observe(el)
})

onUnmounted(() => {
  messagesContainer.value?.removeEventListener('scroll', updateAtBottom as any)
  window.removeEventListener('keydown', onKeydown)
  resizeObserver?.disconnect()
  timers.forEach(clearTimeout)
  timers.clear()
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
})
</script>

<style scoped>
/* 设计令牌 */
.discussion-card {
  --brand: #c8102e;
  --brand-hi: #fe3232;
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

.discussion-card {
  border-radius: var(--r-card);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.discussion-card :deep(.ant-card-body) {
  padding: 16px 20px;
}

.discussion-card :deep(.ant-card-head) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider);
  min-height: auto;
}

.discussion-card :deep(.ant-card-head-title) {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-2);
  padding: 0;
}

.discussion-area {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.messages-container {
  min-height: 240px;
  max-height: min(48vh, 560px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 0;
  background: var(--bg);
}

.chat-placeholder {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--ink-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.chat-placeholder p {
  margin: 0;
  font-size: 14px;
  color: var(--ink-4);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--gap-group);
  padding: 0 4px;
  position: relative;
}

/* 日期分隔线 */
.date-divider {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--ink-4);
  font-size: 12px;
  margin: 6px 0;
}

.date-divider > span {
  background: var(--bg);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--divider);
}

/* 新消息提示条 */
.new-msg-hint {
  position: sticky;
  bottom: 8px;
  align-self: center;
  background: var(--brand);
  color: #fff;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(200, 16, 46, 0.25);
  z-index: 20;
  transition: opacity 0.2s, transform 0.2s;
}

.new-msg-hint:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.new-msg-hint:active {
  transform: translateY(0);
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 暗黑模式（系统偏好） */
@media (prefers-color-scheme: dark) {
  .discussion-card {
    --bg: #0f1115;
    --bubble-self: #1a1f28;
    --bubble-other: #151a21;
    --ink-1: #eaecef;
    --ink-2: #c9d1d9;
    --ink-3: #a3a9b2;
    --ink-4: #7a818b;
    --divider: #20242c;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  
  .date-divider > span {
    background: var(--bg);
  }
  
  .new-msg-hint {
    box-shadow: 0 6px 16px rgba(200, 16, 46, 0.4);
    filter: saturate(1.05);
  }
  
  .messages-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .messages-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>
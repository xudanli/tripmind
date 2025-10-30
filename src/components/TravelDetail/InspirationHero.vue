<template>
  <!-- 🪞 层1：情绪入口（Emotional Gate）-->
  <div class="hero-section inspiration-hero" :data-intent="detectedIntent">
    <div class="hero-cover">
      <!-- 动态背景层 -->
      <div class="bg-layer">
        <img 
          :src="dynamicCoverImage" 
          :alt="title"
          @error="handleImageError"
          class="hero-background-image"
        />
        <!-- 缓慢光晕扩散动效 -->
        <div class="glow-orb glow-orb-1"></div>
        <div class="glow-orb glow-orb-2"></div>
        <div class="glow-orb glow-orb-3"></div>
      </div>
      
      <!-- 内容层 -->
      <div class="hero-content">
        <!-- 顶部导航栏 -->
        <div class="entry-header">
          <div class="header-left">
            <a-button @click="handleBack" class="back-btn">
              <template #icon><arrow-left-outlined /></template>
            </a-button>
            <h2 class="header-title">{{ editableTitle }}</h2>
          </div>
    </div>
    
        <!-- 主要内容区域 -->
        <div class="hero-main-content">
      
      <!-- 主标题 - 可编辑，带打字效果 -->
      <div class="title-section">
        <div class="title-editable" v-if="!isEditingTitle">
          <h1 class="emotion-title" ref="titleRef">{{ editableTitle }}</h1>
          <a-button 
            type="text" 
            shape="circle" 
            size="small"
            class="edit-btn glass-btn-small"
            @click="startEditTitle"
            title="编辑标题"
          >
            <template #icon><edit-outlined /></template>
          </a-button>
        </div>
        <div class="title-editable" v-else>
          <a-input
            v-model:value="editableTitle"
            @pressEnter="saveTitle"
            @blur="saveTitle"
            class="title-input-glass"
            :autoFocus="true"
          />
          <a-button 
            type="text" 
            shape="circle" 
            size="small"
            class="edit-btn glass-btn-small"
            @click="saveTitle"
            title="保存"
          >
            <template #icon><check-outlined /></template>
          </a-button>
        </div>
      </div>
      
      <!-- ① 召唤阶段：诗意短句 - 让好奇发声 -->
      <div class="summon-section" @touchstart="playHeartbeatPulse">
        <!-- 核心洞见（如有） -->
        <transition name="quote-fade">
          <div v-if="coreInsight" class="core-insight">
            <p class="insight-text">{{ coreInsight }}</p>
        </div>
        </transition>
        <!-- 动态关键词诗句 -->
        <p v-if="dynamicPoetry" class="dynamic-poetry">{{ dynamicPoetry }}</p>
      </div>
      
      <!-- 旅程背景（如有，显示在底部） -->
      <transition name="fade">
        <div v-if="journeyBackground" class="journey-background-section">
          <p class="background-text">{{ journeyBackground }}</p>
          </div>
      </transition>
      
      <!-- AI语音旁白 - 引导语（隐藏，保留原有功能但不显示） -->
      <div class="ai-voice-section" style="display: none;">
        <div class="message-editable" v-if="!isEditingMessage">
          <p class="ai-voice-text">"{{ guideMessage }}"</p>
          <a-button 
            type="text" 
            shape="circle" 
            size="small"
            class="edit-btn glass-btn-small"
            @click="startEditMessage"
            title="编辑消息"
          >
            <template #icon><edit-outlined /></template>
          </a-button>
        </div>
        <div class="message-editable" v-else>
          <a-textarea
            v-model:value="editableMessage"
            @pressEnter.ctrl="saveMessage"
            @blur="saveMessage"
            class="message-input-glass"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            :autoFocus="true"
          />
          <a-button 
            type="text" 
            shape="circle" 
            size="small"
            class="edit-btn glass-btn-small"
            @click="saveMessage"
            title="保存"
          >
            <template #icon><check-outlined /></template>
          </a-button>
        </div>
      </div>
      
      <!-- 呼吸式能量圈 -->
      <div class="breathing-energy-circle" :class="{ 'breathing-active': isInteracting }">
        <div class="energy-ring ring-outer"></div>
        <div class="energy-ring ring-middle"></div>
        <div class="energy-core">
          <div class="core-pulse"></div>
        </div>
      </div>
      
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useTravelListStore } from '@/stores/travelList'
import { useI18nStore } from '@/stores/i18n'
import { getUserLocation, PRESET_COUNTRIES } from '@/config/location'
import { playSound, SoundType } from '@/utils/audioFeedback'
import { searchDestinationPhotos, translateDestination } from '@/services/unsplashAPI'
import { echoStatementTemplates } from '@/config/inspirationConfig'
import { 
  BulbOutlined, 
  ExperimentOutlined,
  PictureOutlined,
  SwapOutlined,
  EditOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  GlobalOutlined,
  TranslationOutlined
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const travelListStore = useTravelListStore()
const i18nStore = useI18nStore()

interface Props {
  title: string
  coverImage: string
  progressPercent?: number
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  progressPercent: 65,
  showProgress: true
})

// 动态背景图片
const dynamicCoverImage = ref(props.coverImage)
const isImageLoading = ref(false)
const photoList = ref<any[]>([])
const currentPhotoIndex = ref(0)

// 从 travel data 中获取数据
const travel = computed(() => travelListStore.getTravel(route.params.id as string))

// 检测到的意图
const detectedIntent = computed(() => {
  return travel.value?.data?.detectedIntent?.intentType || ''
})

// 交互状态
const isInteracting = ref(false)
const isVoiceActive = ref(false)
const titleRef = ref<HTMLElement | null>(null)

// 语音朗读
const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9
    utterance.pitch = 1.1
    utterance.onstart = () => { isVoiceActive.value = true }
    utterance.onend = () => { isVoiceActive.value = false }
    speechSynthesis.speak(utterance)
  }
}

const toggleVoice = () => {
  if (isVoiceActive.value) {
    speechSynthesis.cancel()
    isVoiceActive.value = false
  } else {
    speakText(`${editableTitle.value}。${editableMessage.value}`)
  }
}

// 处理延展
const handleExtend = () => {
  // 触发延展事件，由父组件处理
  emit('extend-inspiration')
}

// 监听用户交互（鼠标移动、滚动等）
const handleInteraction = () => {
  isInteracting.value = true
  setTimeout(() => {
    isInteracting.value = false
  }, 2000)
}


// 暴露事件
const emit = defineEmits<{
  'extend-inspiration': []
}>()

// 顶部导航栏功能
const handleBack = () => {
  router.back()
}

const currentCountryDisplay = computed(() => {
  const userLocation = getUserLocation()
  if (!userLocation) {
    return '🌍 未设置'
  }
  const countryInfo = PRESET_COUNTRIES[userLocation.countryCode as keyof typeof PRESET_COUNTRIES]
  if (countryInfo) {
    return `${countryInfo.flag} ${countryInfo.name}`
  }
  return `🌍 ${userLocation.country}`
})

const currentLanguageDisplay = computed(() => {
  return locale.value === 'zh-CN' ? '🇨🇳 中文' : '🇺🇸 English'
})

const handleLanguageToggle = () => {
  const current = i18nStore.currentLocale
  const newLang = current === 'zh-CN' ? 'en-US' : 'zh-CN'
  i18nStore.setLocale(newLang)
  message.success(newLang === 'zh-CN' ? '已切换到中文' : 'Switched to English')
}

const handleLocationClick = () => {
  Modal.info({
    title: '位置信息',
    content: `当前位置：${currentCountryDisplay.value}`,
    okText: '确定'
  })
}

// 处理"轻轻进入"按钮点击
const handleSummonEnter = () => {
  playSound(SoundType.CLICK)
  // 滚动到下一阶段（映照阶段）
  nextTick(() => {
    const experienceDayEl = document.querySelector('.experience-day-container') || 
                           document.querySelector('.reflection-stage')
    if (experienceDayEl) {
      experienceDayEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// 核心洞见
const coreInsight = computed(() => {
  return travel.value?.data?.coreInsight
})

// 旅程背景
const journeyBackground = computed(() => {
  return travel.value?.data?.journeyBackground
})

// 五段心智流体验（从数据加载）
const mentalFlowStages = computed(() => {
  return travel.value?.data?.mentalFlowStages
})

// 召唤阶段内容（从mentalFlowStages.summon获取）
const summonStageContent = computed(() => {
  const stage = mentalFlowStages.value?.summon
  
  const subtitle = stage?.theme || stage?.emotionalGoal || ''
  const quote = stage?.symbolicElement || ''
  
  // 分割副标题为两行（智能分割，优先按逗号，其次按长度）
  const subtitleParts = subtitle 
    ? (subtitle.includes('，') 
      ? subtitle.split('，')
      : subtitle.length > 15
        ? [subtitle.substring(0, Math.ceil(subtitle.length / 2)), subtitle.substring(Math.ceil(subtitle.length / 2))]
        : [subtitle])
    : []
  
  // 分割引语为两行
  const quoteParts = quote 
    ? (quote.includes('，') 
      ? quote.split('，')
      : [quote])
    : []
  
  return {
    theme: stage?.theme || '',
    subtitle: subtitle,
    subtitleLine1: subtitleParts[0] || '',
    subtitleLine2: subtitleParts[1] || '',
    quote: quote,
    quoteLine1: quoteParts[0] || '',
    quoteLine2: quoteParts[1] || '',
    emotionalGoal: stage?.emotionalGoal || '',
    activities: stage?.activities || [],
    symbolicElement: stage?.symbolicElement || '',
    buttonText: ''
  }
})

// 引语显示控制（3.5秒后显示）
const showQuote = ref(false)

// 组件挂载时的动效
const scrollSpeed = ref(0)
const lastScrollY = ref(window.scrollY)
const lastTs = ref(0)

const keywords = computed(() => {
  const list = travel.value?.data?.keywords
  return Array.isArray(list) ? list : []
})

const dynamicPoetry = computed(() => {
  // 关键词 → 诗句组合：取前3个关键词，填入模板
  const k = keywords.value.slice(0, 3)
  if (k.length === 0) return ''
  const tpl = [
    `${k[0]} 像风，${k[1]} 在呼吸里，${k[2]} 等你归来。`,
    `让 ${k[0]} 经过胸腔，和 ${k[1]} 一起慢慢呼吸，然后把 ${k[2]} 留给明天。`,
    `当 ${k[0]} 被看见，${k[1]} 会更轻，${k[2]} 也会更靠近。`
  ]
  return tpl[Math.floor(Math.random() * tpl.length)]
})

function onScrollMeasure(e: Event) {
  const now = performance.now()
  const dy = Math.abs(window.scrollY - lastScrollY.value)
  const dt = Math.max(16, now - (lastTs.value || now))
  const v = dy / dt // px per ms
  lastScrollY.value = window.scrollY
  lastTs.value = now
  // 将速度映射到 1.5s ~ 5s 的动画周期
  const period = Math.max(1500, Math.min(5000, 5000 - v * 6000))
  // 通过 CSS 变量传入动画时长
  setBreathingPeriod(period)
}

function setBreathingPeriod(ms: number) {
  const root = document.documentElement
  root.style.setProperty('--breath-period', `${ms}ms`)
}

// 低频脉动音：触摸时播放微弱心跳
let audioCtx: AudioContext | null = null
let pulseOsc: OscillatorNode | null = null
let pulseGain: GainNode | null = null

function playHeartbeatPulse() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    pulseOsc = audioCtx.createOscillator()
    pulseGain = audioCtx.createGain()
    pulseOsc.type = 'sine'
    pulseOsc.frequency.value = 55 // 低频
    pulseGain.gain.value = 0.0001
    pulseOsc.connect(pulseGain).connect(audioCtx.destination)
    pulseOsc.start()
    // 短促包络（心跳感）
    const now = audioCtx.currentTime
    pulseGain.gain.exponentialRampToValueAtTime(0.02, now + 0.05)
    pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
    // 自动停止
    setTimeout(() => {
      try { pulseOsc?.stop(); pulseOsc?.disconnect(); pulseGain?.disconnect() } catch {}
      pulseOsc = null; pulseGain = null
    }, 380)
  } catch {}
}

onMounted(() => {
  fetchDynamicBackground()
  window.addEventListener('mousemove', handleInteraction)
  window.addEventListener('scroll', handleInteraction)
  window.addEventListener('scroll', onScrollMeasure, { passive: true })
  setBreathingPeriod(3000)
  setTimeout(() => { showQuote.value = true }, 3500)
})

// 引导语（召唤阶段的副标题）
const guideMessage = computed(() => {
  // 优先使用动态生成的引导语
  return travel.value?.data?.guideMessage || ''
})

// 延展语句（从配置或数据中获取，不硬编码）
const extensionMessage = computed(() => {
  // 优先从配置模板中获取
  const intentType = travel.value?.data?.detectedIntent?.intentType
  const templates = echoStatementTemplates?.[intentType || 'default']
  
  if (typeof templates === 'string') {
    return templates
  } else if (Array.isArray(templates)) {
    return templates[0] || ''
  }
  
  // 如果都没有，返回空字符串
  return ''
})

// 编辑状态
const isEditingTitle = ref(false)
const isEditingMessage = ref(false)
const editableTitle = ref(props.title)
const editableMessage = ref(guideMessage.value || '')

// 监听标题变化
watch(() => props.title, (newTitle) => {
  if (!isEditingTitle.value) {
    editableTitle.value = newTitle
  }
})

// 监听引导语变化
watch(guideMessage, (newMessage) => {
  if (!isEditingMessage.value && newMessage) {
    editableMessage.value = newMessage
  }
})


// 编辑标题
const startEditTitle = () => {
  isEditingTitle.value = true
  editableTitle.value = travel.value?.title || props.title
}

const saveTitle = () => {
  if (!travel.value) return
  
  const newTitle = editableTitle.value.trim()
  if (newTitle && newTitle !== travel.value.title) {
    travelListStore.updateTravel(travel.value.id, {
      title: newTitle
    })
    message.success('标题已更新')
  }
  isEditingTitle.value = false
}

// 编辑消息
const startEditMessage = () => {
  isEditingMessage.value = true
  editableMessage.value = guideMessage.value || ''
}

const saveMessage = () => {
  if (!travel.value?.data) return
  
  const newMessage = editableMessage.value.trim()
  const currentMessage = guideMessage.value || ''
  
  if (newMessage && newMessage !== currentMessage) {
    const selectedLocation = travel.value.data.selectedLocation
    const updates: any = { ...travel.value.data }
    
    // 如果有选中地点，更新该地点的AI消息
    if (selectedLocation && travel.value.data.locationDetails?.[selectedLocation]) {
      if (!updates.locationDetails) {
        updates.locationDetails = { ...travel.value.data.locationDetails }
      }
      if (!updates.locationDetails[selectedLocation]) {
        updates.locationDetails[selectedLocation] = {}
      }
      updates.locationDetails[selectedLocation].aiMessage = newMessage
    } else {
      // 更新全局引导语（优先）或AI消息
      updates.guideMessage = newMessage
    }
    
    travelListStore.updateTravel(travel.value.id, {
      data: updates
    })
    message.success('AI消息已更新')
  }
  isEditingMessage.value = false
}

// 根据意图生成主题标签
const themeTags = computed(() => {
  const intentType = travel.value?.data?.detectedIntent?.intentType
  
  if (intentType === 'emotional_healing' || intentType === 'mind_healing') {
    return [
      { color: 'green' as const, text: '情感疗愈' },
      { color: 'cyan' as const, text: '静心冥想' },
      { color: 'blue' as const, text: '内心对话' }
    ]
  } else if (intentType === 'extreme_exploration') {
    return [
      { color: 'red' as const, text: '极限挑战' },
      { color: 'orange' as const, text: '自我突破' },
      { color: 'gold' as const, text: '冒险体验' }
    ]
  } else if (intentType === 'cultural_exchange') {
    return [
      { color: 'purple' as const, text: '人文交流' },
      { color: 'magenta' as const, text: '文化探索' },
      { color: 'geekblue' as const, text: '世界连接' }
    ]
  } else if (intentType === 'photography_exploration' || intentType === 'urban_creation') {
    return [
      { color: 'green' as const, text: '光影捕捉' },
      { color: 'cyan' as const, text: '创意构图' },
      { color: 'blue' as const, text: '视觉艺术' }
    ]
  } else {
    // 默认标签
    return [
      { color: 'green' as const, text: '灵感旅程' },
      { color: 'cyan' as const, text: '创意提案' },
      { color: 'blue' as const, text: '独特体验' }
    ]
  }
})

// 根据场景信息生成搜索关键词
const generateSearchKeywords = () => {
  if (!travel.value?.data) {
    return 'travel inspiration journey'
  }

  const intentType = travel.value.data.detectedIntent?.intentType
  const selectedLocation = travel.value.data.selectedLocation
  const location = travel.value.data.location || travel.value.data.locationDetails?.[selectedLocation]?.location
  
  let keywords = []
  
  // 添加目的地相关关键词（翻译为英文以改善搜索效果）
  if (location) {
    const translatedLocation = translateDestination(location)
    keywords.push(translatedLocation)
  }
  
  // 根据意图添加场景关键词
  if (intentType === 'emotional_healing' || intentType === 'mind_healing') {
    keywords.push('peaceful', 'serene', 'nature', 'healing', 'calm')
  } else if (intentType === 'extreme_exploration') {
    keywords.push('adventure', 'extreme', 'mountain', 'wild')
  } else if (intentType === 'cultural_exchange') {
    keywords.push('culture', 'heritage', 'traditional', 'local')
  } else if (intentType === 'photography_exploration') {
    keywords.push('landscape', 'photography', 'scenic', 'beautiful')
  } else if (intentType === 'urban_creation') {
    keywords.push('city', 'urban', 'architecture', 'street')
  } else {
    keywords.push('travel', 'inspiration', 'journey')
  }
  
  // 添加通用关键词
  keywords.push('travel', 'landscape')
  
  return keywords.join(' ')
}

// 处理图片加载错误
const handleImageError = () => {
  console.log('❌ 图片加载失败，使用默认图片')
  dynamicCoverImage.value = props.coverImage
}

// 从Unsplash动态获取背景图片
const fetchDynamicBackground = async () => {
  if (!travel.value?.data) return
  
  try {
    isImageLoading.value = true
    const searchQuery = generateSearchKeywords()
    console.log('🔍 搜索背景图片关键词:', searchQuery)
    
    const photos = await searchDestinationPhotos(searchQuery, 10)
    
    if (photos && photos.length > 0) {
      // 保存所有图片
      photoList.value = photos
      currentPhotoIndex.value = 0
      
      // 随机选择一张图片
      const randomIndex = Math.floor(Math.random() * photos.length)
      currentPhotoIndex.value = randomIndex
      dynamicCoverImage.value = photos[randomIndex].urls.regular || photos[randomIndex].urls.full
      console.log('✅ 成功获取背景图片:', dynamicCoverImage.value)
    } else {
      console.log('⚠️ 未找到匹配的背景图片，使用默认图片')
    }
  } catch (error) {
    console.error('❌ 获取背景图片失败:', error)
    // 发生错误时保持使用原始的 coverImage
    dynamicCoverImage.value = props.coverImage
  } finally {
    isImageLoading.value = false
  }
}

// 切换到下一张图片
const switchToNextPhoto = () => {
  if (photoList.value.length > 0) {
    currentPhotoIndex.value = (currentPhotoIndex.value + 1) % photoList.value.length
    const photo = photoList.value[currentPhotoIndex.value]
    dynamicCoverImage.value = photo.urls.regular || photo.urls.full
    console.log('🖼️ 切换到第', currentPhotoIndex.value + 1, '张图片')
  }
}

// 清理函数
onUnmounted(() => {
  window.removeEventListener('mousemove', handleInteraction)
  window.removeEventListener('scroll', handleInteraction)
  window.removeEventListener('scroll', onScrollMeasure)
  speechSynthesis.cancel()
  try { pulseOsc?.stop(); pulseOsc?.disconnect(); pulseGain?.disconnect(); audioCtx?.close() } catch {}
})
</script>

<style scoped>
/* 🪞 层1：情绪入口（Emotional Gate）- Apple风格沉浸设计 */
.emotional-gate {
  position: relative;
  border-radius: clamp(28px, 5vw, 40px);
  overflow: hidden;
  min-height: 100vh;
  margin: 0 0 clamp(2.5rem, 6vw, 4rem) 0;
  background: rgba(17, 153, 142, 0.03);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.04);
}

/* Hero Section - 与其他模式一致的风格 */
.inspiration-hero {
  margin-bottom: 2rem;
}

.hero-cover {
  position: relative;
  overflow: hidden;
  height: 600px;
}

.bg-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero-background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(2px);
  transform: scale(1.1);
  animation: slowPan 30s ease-in-out infinite;
  transition: all 2s ease;
}

@keyframes slowPan {
  0%, 100% {
    transform: scale(1.1) translate(0, 0);
  }
  50% {
    transform: scale(1.15) translate(-2%, -2%);
  }
}

/* 缓慢光晕扩散 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
  animation: glowPulse 8s ease-in-out infinite;
  pointer-events: none;
}

.glow-orb-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.glow-orb-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  right: -50px;
  animation-delay: 2s;
  background: radial-gradient(circle, rgba(56, 239, 125, 0.2), transparent);
}

.glow-orb-3 {
  width: 250px;
  height: 250px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
  background: radial-gradient(circle, rgba(17, 153, 142, 0.25), transparent);
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

/* 内容层 - 与其他模式一致的风格 */
.hero-content {
  position: absolute;
  inset: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.85), rgba(56, 239, 125, 0.85));
}

.summon-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  gap: 2rem;
}

/* 标题「灵感之旅」动画：由模糊到清晰淡入（1-1.5s） */
.emotion-title {
  animation: titleFadeIn 0.5s ease-out 1s both;
}

@keyframes titleFadeIn {
  from {
    opacity: 0;
    filter: blur(8px);
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

/* 副标题：上浮式淡入，每行间隔0.5s（1.5-2.5s） */
.summon-subtitle {
  text-align: center;
  margin: 0;
}

.subtitle-line {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 300;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.02em;
  margin: 0;
  opacity: 0;
  transform: translateY(30px);
}

.subtitle-line-1 {
  animation: subtitleFloatIn 0.8s ease-out 1.5s both;
}

.subtitle-line-2 {
  animation: subtitleFloatIn 0.8s ease-out 2s both;
}

@keyframes subtitleFloatIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 引语：3.5秒后淡入 */
.summon-quote {
  text-align: center;
  margin: 0;
}

.quote-line {
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  font-weight: 300;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.03em;
  margin: 0.5rem 0;
  font-style: italic;
}

.quote-fade-enter-active {
  transition: opacity 1.2s ease-out, transform 1.2s ease-out;
}

.quote-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* 旅行目的地显示 */
.summon-destinations {
  margin-top: 2rem;
  text-align: center;
  animation: fadeInUp 0.8s ease-out 2.5s both;
}

.destinations-label {
  font-size: clamp(0.9rem, 2vw, 1rem);
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem;
  letter-spacing: 0.1em;
  font-weight: 300;
}

.destinations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
}

.destination-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.95);
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
  font-weight: 300;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}

.destination-tag:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 转型关键词标签 */
.summon-transformation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 2rem;
  margin-bottom: 1rem;
  animation: fadeInUp 0.8s ease-out 3s both;
}

.summon-transformation-tags .transformation-tag {
  display: inline-block;
  padding: 0.4rem 0.9rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(0.75rem, 1.5vw, 0.85rem);
  font-weight: 300;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}

.summon-transformation-tags .transformation-tag:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

/* 按钮「轻轻进入」：从透明到亮，随后缓慢脉动（4-5s） */
.summon-button-wrapper {
  margin-top: 1rem;
}

.summon-button {
  font-size: clamp(1rem, 2.5vw, 1.2rem) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 300 !important;
  letter-spacing: 0.1em !important;
  padding: 0.75rem 2rem !important;
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  transition: all 0.4s ease !important;
  animation: buttonAppear 1s ease-out 4s both, buttonPulse 3s ease-in-out 5s infinite !important;
  cursor: pointer !important;
}

.summon-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  transform: translateY(-2px) !important;
}

@keyframes buttonAppear {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes buttonPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
  }
}

/* 背景层：从深绿色 → 浅青绿色渐变；轻微模糊流动（0-1s） */
.hero-content {
  animation: backgroundFlow 1s ease-out;
}

@keyframes backgroundFlow {
  from {
    background: linear-gradient(135deg, rgba(17, 80, 90, 0.85), rgba(17, 153, 142, 0.85));
    filter: blur(2px);
  }
  to {
    background: linear-gradient(135deg, rgba(17, 153, 142, 0.85), rgba(56, 239, 125, 0.85));
    filter: blur(0);
  }
}

/* 核心洞见样式 */
.core-insight {
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeIn 1s ease-out 0.5s both;
}

.insight-text {
  font-size: clamp(1.3rem, 3.5vw, 2rem);
  font-weight: 400;
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.03em;
  line-height: 1.7;
  margin: 0;
  padding: 0 1rem;
}

/* 旅程背景样式 */
.journey-background-section {
  text-align: center;
  animation: fadeIn 1.2s ease-out 2s both;
}

.background-text {
  font-size: clamp(1rem, 2.2vw, 1.3rem);
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  line-height: 1.8;
  letter-spacing: 0.02em;
  margin: 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

@keyframes gentleBreath {
  0%, 100% { opacity: 0.95; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-4px); }
}

@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 根据意图动态变化的背景渐变 */
.inspiration-hero[data-intent="emotional_healing"] .hero-content,
.inspiration-hero[data-intent="mind_healing"] .hero-content {
  background: linear-gradient(135deg, rgba(139, 195, 74, 0.85), rgba(102, 187, 106, 0.85));
}

.inspiration-hero[data-intent="extreme_exploration"] .hero-content {
  background: linear-gradient(135deg, rgba(255, 87, 34, 0.85), rgba(255, 152, 0, 0.85));
}

.inspiration-hero[data-intent="cultural_exchange"] .hero-content {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.85), rgba(123, 31, 162, 0.85));
}

.inspiration-hero[data-intent="photography_exploration"] .hero-content,
.inspiration-hero[data-intent="urban_creation"] .hero-content {
  background: linear-gradient(135deg, rgba(3, 169, 244, 0.85), rgba(0, 188, 212, 0.85));
}

/* 主要内容区域 */
.hero-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 2rem;
}

/* 顶部导航栏 */
.entry-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1rem);
  flex: 1;
}

.back-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateX(-2px);
}

.header-title {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}


.glass-btn-small {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.title-section:hover .glass-btn-small,
.ai-voice-section:hover .glass-btn-small {
  opacity: 1;
}

/* 标题区域 */
.title-section {
  text-align: center;
}

.emotion-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 600;
  margin: 0;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.01em;
  line-height: 1.2;
  animation: titleFadeIn 1.2s ease-out;
}

@keyframes titleFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Apple式慢速动效：标题打字效果优化 */
@keyframes typeWriter {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* AI语音区域 */
.ai-voice-section {
  max-width: 700px;
  text-align: center;
  position: relative;
}

.voice-indicator {
  margin-bottom: 1.5rem;
  cursor: pointer;
  display: inline-block;
}

.voice-wave {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 40px;
}

.wave-bar {
  width: 4px;
  height: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  animation: waveIdle 1.5s ease-in-out infinite;
  animation-delay: var(--delay);
}

.voice-active .wave-bar {
  animation: waveActive 0.5s ease-in-out infinite;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(56, 239, 125, 0.5);
}

@keyframes waveIdle {
  0%, 100% {
    height: 8px;
    opacity: 0.4;
  }
  50% {
    height: 24px;
    opacity: 0.8;
  }
}

@keyframes waveActive {
  0%, 100% {
    height: 12px;
  }
  50% {
    height: 32px;
  }
}

.ai-voice-text {
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-style: italic;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.8;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin: 0;
  animation: textFadeIn 1.5s ease-out;
}

@keyframes textFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 呼吸式能量圈 - 保留动效 */
.breathing-energy-circle {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.energy-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  animation: breathingRing 4s ease-in-out infinite;
}

.ring-outer {
  width: 200px;
  height: 200px;
  border-color: rgba(255, 255, 255, 0.2);
  animation-delay: 0s;
}

.ring-middle {
  width: 150px;
  height: 150px;
  border-color: rgba(255, 255, 255, 0.25);
  animation-delay: 0.3s;
}

.energy-core {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.core-pulse {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4), transparent);
  animation: corePulse 3s ease-in-out infinite;
}

.breathing-active .energy-ring {
  animation-duration: 2s;
}

.breathing-active .core-pulse {
  animation-duration: 1.5s;
}

@keyframes breathingRing {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes corePulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 浮层延展语句 - 保留动效 */
.extension-floating {
  position: relative;
  cursor: pointer;
  transition: all 0.4s ease;
  animation: floatUp 2s ease-out;
}

.extension-floating:hover {
  transform: translateY(-4px);
}

.floating-text {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 1.25rem 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.floating-text::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
  pointer-events: none;
}

.floating-message {
  font-size: clamp(0.95rem, 1.8vw, 1.1rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  line-height: 1.6;
  position: relative;
  z-index: 1;
}

.floating-quote {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.4);
  font-family: Georgia, serif;
  line-height: 0;
  vertical-align: middle;
}

.floating-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-120px);
  opacity: 0;
  animation: sparkleFloat 3s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes sparkleFloat {
  0%, 100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-120px) scale(0);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-140px) scale(1);
  }
}

@keyframes floatUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 输入框玻璃态 */
.title-input-glass,
.message-input-glass {
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 16px !important;
}

.title-input-glass :deep(.ant-input) {
  text-align: center;
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 300;
  color: white;
  background: transparent;
}

.title-input-glass :deep(.ant-input)::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.message-input-glass {
  max-width: 800px;
}

.message-input-glass :deep(.ant-input) {
  text-align: center;
  font-style: italic;
  font-weight: 300;
  color: white;
  background: transparent;
}

.message-input-glass :deep(.ant-input)::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* 可编辑样式 */
.title-editable,
.message-editable {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-editable {
  flex-direction: column;
}

.message-editable {
  flex-direction: column;
  max-width: 700px;
  width: 100%;
}

.edit-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.edit-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.1);
}

.message-editable:hover .edit-btn,
.title-editable:hover .edit-btn {
  opacity: 1;
}

.title-input {
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  max-width: 700px;
}

.title-input :deep(.ant-input) {
  text-align: center;
  font-size: 3rem;
  font-weight: 700;
}

.message-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
}

.message-input :deep(.ant-input) {
  text-align: center;
  font-style: italic;
}

.dynamic-poetry {
  font-size: clamp(1.1rem, 2.6vw, 1.6rem);
  font-weight: 300;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.02em;
  margin: 0.25rem 0 0;
  padding: 0 1rem;
  text-align: center;
  animation: textFadeIn 1.2s ease-out;
}

/* 将呼吸圈动画周期绑定到 CSS 变量 */
:root { --breath-period: 3000ms; }
.breathing-energy-circle .energy-ring { animation-duration: var(--breath-period); }
.breathing-energy-circle .core-pulse { animation-duration: calc(var(--breath-period) * 0.75); }
</style>

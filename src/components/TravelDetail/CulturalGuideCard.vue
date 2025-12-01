/**
 * 文化红黑榜卡片组件
 * 显示目的地的文化指南，包括推荐做法、禁忌行为和实用建议
 */

<template>
  <a-card 
    class="cultural-guide-card" 
    :title="cardTitle"
    :loading="loading"
  >
    <template #extra>
      <a-tag v-if="fromCache" color="blue" size="small">
        {{ t('travelDetail.culturalGuide.fromCache') || '缓存' }}
      </a-tag>
      <a-button 
        v-if="!loading && !content"
        type="link" 
        size="small"
        @click="loadGuide"
      >
        {{ t('travelDetail.culturalGuide.load') || '加载' }}
      </a-button>
    </template>

    <div v-if="loading && !content" class="loading-state">
      <a-spin :spinning="true" />
      <span style="margin-left: 8px;">
        {{ t('travelDetail.culturalGuide.loading') || '正在加载文化指南...' }}
      </span>
    </div>

    <div v-else-if="error" class="error-state">
      <a-alert
        type="warning"
        :message="t('travelDetail.culturalGuide.loadError') || '加载失败'"
        :description="error"
        show-icon
      />
      <a-button 
        type="link" 
        size="small"
        @click="loadGuide"
        style="margin-top: 8px;"
      >
        {{ t('travelDetail.culturalGuide.retry') || '重试' }}
      </a-button>
    </div>

    <div v-else-if="content" class="cultural-guide-content">
      <div 
        class="markdown-content" 
        v-html="renderMarkdown(content)"
      ></div>
      
      <div v-if="generatedAt" class="guide-meta">
        <span class="meta-text">
          {{ t('travelDetail.culturalGuide.generatedAt') || '生成时间' }}: 
          {{ formatDate(generatedAt) }}
        </span>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <a-empty 
        :description="t('travelDetail.culturalGuide.empty') || '暂无文化指南'"
        :image="false"
      />
      <a-button 
        type="link" 
        size="small"
        @click="loadGuide"
        style="margin-top: 8px;"
      >
        {{ t('travelDetail.culturalGuide.load') || '加载' }}
      </a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { getCulturalGuide } from '@/services/itineraryAPI'
import dayjs from 'dayjs'

interface Props {
  journeyId: string
  destination?: string
}

const props = defineProps<Props>()

const { t } = useI18n()

const content = ref<string>('')
const loading = ref(false)
const error = ref<string | null>(null)
const fromCache = ref(false)
const generatedAt = ref<string | null>(null)

const cardTitle = computed(() => {
  return props.destination 
    ? `🤝 ${props.destination}${t('travelDetail.culturalGuide.title') || '文化红黑榜'}`
    : `🤝 ${t('travelDetail.culturalGuide.title') || '文化红黑榜'}`
})

/**
 * Markdown 渲染函数（支持标题、列表、加粗、链接等）
 * 参考 TravelAssistant.vue 的实现，优化处理顺序
 */
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  
  let html = text
  const placeholders: Record<string, string> = {}
  let placeholderIndex = 0
  
  // 1. 先处理链接 [text](url)，避免后续处理破坏链接
  const linkPattern = new RegExp('\\[([^\\]]+)\\]\\(([^)]+)\\)', 'g')
  html = html.replace(linkPattern, (match, linkText, linkUrl) => {
    const key = `__LINK_${placeholderIndex++}__`
    const ampPattern = new RegExp('&', 'g')
    const ltPattern = new RegExp('<', 'g')
    const gtPattern = new RegExp('>', 'g')
    const escapedUrl = linkUrl.replace(ampPattern, '&amp;').replace(ltPattern, '&lt;').replace(gtPattern, '&gt;')
    placeholders[key] = '<a href="' + escapedUrl + '" target="_blank" rel="noopener noreferrer" class="markdown-link">' + linkText + '</a>'
    return key
  })
  
  // 2. 转义 HTML 特殊字符
  const ampPattern2 = new RegExp('&', 'g')
  const ltPattern2 = new RegExp('<', 'g')
  const gtPattern2 = new RegExp('>', 'g')
  html = html
    .replace(ampPattern2, '&amp;')
    .replace(ltPattern2, '&lt;')
    .replace(gtPattern2, '&gt;')
  
  // 3. 恢复链接
  Object.keys(placeholders).forEach(key => {
    const placeholder = placeholders[key]
    if (placeholder) {
      html = html.replace(key, placeholder)
    }
  })
  
  // 4. 处理标题（按行处理，必须在转义之后）
  const lines = html.split('\n')
  const processedLines: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // 处理标题（需要转义后的格式）
    if (line.match(/^### /)) {
      line = line.replace(/^### (.+)$/, '<h3>$1</h3>')
    } else if (line.match(/^## /)) {
      line = line.replace(/^## (.+)$/, '<h2>$1</h2>')
    } else if (line.match(/^# /)) {
      line = line.replace(/^# (.+)$/, '<h1>$1</h1>')
    }
    
    processedLines.push(line)
  }
  
  html = processedLines.join('\n')
  
  // 5. 处理无序列表（- 或 * 开头，行首）
  let inList = false
  const finalLines: string[] = []
  
  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i]
    const isListItem = line.match(/^[\-\*] /)
    
    if (isListItem) {
      if (!inList) {
        finalLines.push('<ul>')
        inList = true
      }
      finalLines.push('<li>' + line.replace(/^[\-\*] /, '') + '</li>')
    } else {
      if (inList) {
        finalLines.push('</ul>')
        inList = false
      }
      finalLines.push(line)
    }
  }
  
  if (inList) {
    finalLines.push('</ul>')
  }
  
  html = finalLines.join('\n')
  
  // 6. 处理有序列表
  inList = false
  const orderedLines: string[] = []
  const tempLines = html.split('\n')
  
  for (let i = 0; i < tempLines.length; i++) {
    const line = tempLines[i]
    const isOrderedItem = line.match(/^\d+\. /)
    
    if (isOrderedItem) {
      if (!inList) {
        orderedLines.push('<ol>')
        inList = true
      }
      orderedLines.push('<li>' + line.replace(/^\d+\. /, '') + '</li>')
    } else {
      if (inList) {
        orderedLines.push('</ol>')
        inList = false
      }
      orderedLines.push(line)
    }
  }
  
  if (inList) {
    orderedLines.push('</ol>')
  }
  
  html = orderedLines.join('\n')
  
  // 7. 处理加粗 **text** 或 __text__
  const boldPattern1 = new RegExp('\\*\\*(.+?)\\*\\*', 'g')
  const boldPattern2 = new RegExp('__(.+?)__', 'g')
  html = html.replace(boldPattern1, '<strong>$1</strong>')
  html = html.replace(boldPattern2, '<strong>$1</strong>')
  
  // 8. 处理换行和段落
  // 将连续的换行转换为段落分隔
  html = html.replace(/\n\n+/g, '</p><p>')
  // 单个换行转换为 <br>
  html = html.replace(/\n/g, '<br>')
  
  // 9. 确保内容被段落包裹
  const trimmed = html.trim()
  if (trimmed && !trimmed.startsWith('<')) {
    html = '<p>' + html
  }
  if (trimmed && !trimmed.endsWith('>')) {
    html = html + '</p>'
  }
  
  return html
}

/**
 * 格式化日期
 */
const formatDate = (dateString: string): string => {
  try {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm')
  } catch {
    return dateString
  }
}

/**
 * 加载文化红黑榜
 */
const loadGuide = async () => {
  if (!props.journeyId) {
    error.value = t('travelDetail.culturalGuide.noJourneyId') || '缺少行程ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await getCulturalGuide(props.journeyId)
    
    content.value = result.content || ''
    fromCache.value = result.fromCache || false
    generatedAt.value = result.generatedAt || null

    console.log('[CulturalGuideCard] 加载成功:', {
      journeyId: props.journeyId,
      destination: result.destination,
      contentLength: content.value.length,
      fromCache: fromCache.value
    })
  } catch (err: any) {
    console.error('[CulturalGuideCard] 加载失败:', err)
    error.value = err.message || t('travelDetail.culturalGuide.loadError') || '加载失败'
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

// 监听 journeyId 变化，自动加载
watch(
  () => props.journeyId,
  (newId) => {
    if (newId && !content.value) {
      loadGuide()
    }
  },
  { immediate: true }
)

// 组件挂载时加载
onMounted(() => {
  if (props.journeyId && !content.value) {
    loadGuide()
  }
})
</script>

<style scoped>
.cultural-guide-card {
  margin-bottom: 0;
}

.loading-state,
.error-state,
.empty-state {
  padding: 16px;
  text-align: center;
}

.cultural-guide-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.markdown-content {
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  word-wrap: break-word;
}

.markdown-content :deep(h1) {
  font-size: 20px;
  font-weight: 700;
  margin: 24px 0 16px 0;
  color: #0f172a;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.markdown-content :deep(h2) {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 12px 0;
  color: #1e293b;
}

.markdown-content :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px 0;
  color: #334155;
}

.markdown-content :deep(p) {
  margin: 12px 0;
  line-height: 1.8;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 8px 0;
  line-height: 1.8;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #0f172a;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #475569;
}

.markdown-content :deep(a) {
  color: #1890ff;
  text-decoration: none;
  border-bottom: 1px solid rgba(24, 144, 255, 0.3);
  transition: all 0.2s;
}

.markdown-content :deep(a:hover) {
  color: #40a9ff;
  border-bottom-color: #40a9ff;
}

.guide-meta {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
  text-align: right;
}

.meta-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>


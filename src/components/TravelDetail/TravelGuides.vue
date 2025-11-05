<template>
  <a-card :bordered="false" class="guides-card">
    <div class="guides-container">
      <a-spin :spinning="loading">
        <div v-if="guides.length === 0 && !loading" class="empty-state">
          <a-empty :description="t('travelDetail.guides.empty') || '暂无相关攻略'" />
        </div>
        
        <a-list
          v-else
          :dataSource="guides"
          item-layout="vertical"
          size="small"
          :pagination="paginationConfig"
        >
          <template #renderItem="{ item }">
            <a-list-item class="guide-item">
              <template #actions>
                <a-button type="link" size="small" @click="openGuide(item)">
                  {{ t('travelDetail.guides.readMore') || '阅读全文' }}
                </a-button>
              </template>
              <a-list-item-meta>
                <template #title>
                  <a :href="item.url" target="_blank" @click.prevent="openGuide(item)">
                    {{ item.title }}
                  </a>
                </template>
              <template #description>
                <div class="guide-meta">
                  <span class="guide-source">
                    <span v-if="getPlatformIcon(item.source)" class="platform-icon">
                      {{ getPlatformIcon(item.source) }}
                    </span>
                    {{ item.source }}
                  </span>
                  <span class="guide-date">{{ formatDate(item.publishedAt) }}</span>
                  <span v-if="item.readTime" class="guide-read-time">{{ item.readTime }}分钟阅读</span>
                </div>
                <p class="guide-excerpt">{{ item.excerpt }}</p>
                <div v-if="item.tags && item.tags.length > 0" class="guide-tags">
                  <a-tag
                    v-for="tag in item.tags.slice(0, 3)"
                    :key="tag"
                    size="small"
                    color="blue"
                  >
                    {{ tag }}
                  </a-tag>
                </div>
              </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelListStore } from '@/stores/travelList'
import { message } from 'ant-design-vue'
import { getTravelGuides } from '@/services/guidesAPI'

interface Guide {
  id: string
  title: string
  excerpt: string
  url: string
  source: string
  publishedAt: string
  tags?: string[]
}

interface Props {
  travelId?: string
}

const props = withDefaults(defineProps<Props>(), {
  travelId: ''
})

const { t } = useI18n()
const travelListStore = useTravelListStore()

const guides = ref<Guide[]>([])
const loading = ref(false)

// 分页配置
const paginationConfig = computed(() => ({
  pageSize: 10,
  showSizeChanger: false,
  showTotal: (total: number) => t('travelDetail.guides.total', { count: total }) || `共 ${total} 篇`,
  simple: true
}))

// 获取目的地
const destination = computed(() => {
  if (!props.travelId) return ''
  const travel = travelListStore.getTravel(props.travelId)
  return travel?.location || travel?.data?.location || travel?.data?.destination || ''
})

// 加载攻略
const loadGuides = async () => {
  if (!destination.value) {
    guides.value = []
    return
  }

  loading.value = true
  try {
    // getTravelGuides 现在会静默处理API错误并使用fallback
    const result = await getTravelGuides(destination.value, 50, true, true)
    guides.value = result || []
    // 如果没有结果，静默显示空状态，不显示错误消息
  } catch (error) {
    // 只有在非网络错误时才显示错误消息
    if (error instanceof Error && !error.message.includes('Failed to fetch') && !error.message.includes('CONNECTION_REFUSED')) {
      console.warn('加载攻略失败:', error)
      message.warning(t('travelDetail.guides.loadError') || '加载攻略失败')
    }
    guides.value = []
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

// 打开攻略
const openGuide = (guide: Guide) => {
  if (guide.url) {
    window.open(guide.url, '_blank')
  }
}

// 获取平台图标（简化版）
const getPlatformIcon = (source: string): string | null => {
  // 平台图标映射
  const iconMap: Record<string, string> = {
    '马蜂窝': '🦋',
    '携程': '📱',
    '穷游网': '🎒',
    '飞猪': '🐷',
    'TripAdvisor': '🌐',
    'Lonely Planet': '🌍',
    'Rough Guides': '📖',
    'Wikitravel': '📚',
    'AI推荐': '🤖'
  }
  return iconMap[source] || null
}

// 监听目的地变化
watch(destination, () => {
  loadGuides()
}, { immediate: true })

onMounted(() => {
  loadGuides()
})
</script>

<style scoped>
.guides-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.guides-container {
  min-height: 200px;
  max-height: 800px;
  overflow-y: auto;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
}

.guide-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.guide-item:last-child {
  border-bottom: none;
}

.guide-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #999;
}

.guide-source {
  font-weight: 500;
  color: #666;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.platform-icon {
  font-size: 14px;
}

.guide-read-time {
  color: #999;
  font-size: 11px;
  margin-left: 8px;
}

.guide-date {
  color: #999;
}

.guide-excerpt {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.guide-tags {
  margin-top: 8px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

:deep(.ant-list-item-meta-title) {
  margin-bottom: 4px;
}

:deep(.ant-list-item-meta-title a) {
  color: #1890ff;
  font-size: 15px;
  font-weight: 500;
}

:deep(.ant-list-item-meta-title a:hover) {
  color: #40a9ff;
  text-decoration: underline;
}

:deep(.ant-list-item-action) {
  margin-left: 16px;
}
</style>


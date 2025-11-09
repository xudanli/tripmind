<template>
  <div class="catalog-container">
    <div class="catalog-header">
      <h2>灵感目的地目录</h2>
      <a-space>
        <a-input-search v-model:value="keyword" placeholder="搜索名称/关键词" style="width: 260px;" @search="load" allow-clear />
        <a-select v-model:value="country" style="width: 220px;" placeholder="按国家筛选" allow-clear @change="load">
          <a-select-option v-for="c in countries" :key="c" :value="c">{{ c }}</a-select-option>
        </a-select>
        <a-select v-model:value="stage" style="width: 220px;" placeholder="按心智阶段筛选" allow-clear @change="load">
          <a-select-option v-for="s in stages" :key="s" :value="s">{{ stageLabel(s) }}</a-select-option>
        </a-select>
      </a-space>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col v-for="item in pagedItems" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
        <a-card hoverable class="dest-card">
          <template #cover>
            <div class="cover-wrapper">
              <img 
                :src="item.images?.cover || placeholder"
                :alt="item.name"
                referrerpolicy="no-referrer"
                loading="lazy"
                decoding="async"
                @error="onImgError"
              />
              <div class="cover-badges">
                <a-tag color="blue">{{ item.country }}</a-tag>
                <a-tag :color="stageColor(item.recommendedStage)">{{ stageLabel(item.recommendedStage) }}</a-tag>
              </div>
            </div>
          </template>

          <a-card-meta>
            <template #description>
              <div class="meta">
                <div class="meta-title">{{ item.name }}</div>
                <div class="row">
                  <span class="label">认知密度</span>
                  <span class="value">{{ item.cognitiveDensity ?? '-' }}/10</span>
                </div>
                <div v-if="item.symbolicArchetype" class="row">
                  <span class="label">象征</span>
                  <a-tag>{{ item.symbolicArchetype }}</a-tag>
                </div>
                <div class="desc">{{ (item.description || '').slice(0, 68) }}{{ (item.description || '').length > 68 ? '…' : '' }}</div>
                <div class="tags">
                  <a-tag v-for="k in (item.keywords || []).slice(0, 3)" :key="k">{{ k }}</a-tag>
                </div>
                <div v-if="item.intentTags && item.intentTags.length" class="intent-tags">
                  <a-tag
                    v-for="tag in item.intentTags"
                    :key="tag"
                    :color="intentColor(tag)"
                  >{{ intentLabel(tag) }}</a-tag>
                </div>
              </div>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>
    </a-row>

    <div class="pager">
      <a-pagination :current="page" :page-size="pageSize" :total="items.length" @change="p => page = p" hide-on-single-page />
    </div>
  </div>
  
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'

type InspirationStage = 'summon' | 'reflection' | 'awakening' | 'internalization' | 'transformation'

interface DestinationItem {
  id: string
  name: string
  country: string
  symbolicArchetype?: string
  description?: string
  cognitiveDensity?: number
  recommendedStage?: InspirationStage
  keywords?: string[]
  images?: { cover?: string; gallery?: string[] }
  intentTags?: Array<'emotional_healing' | 'mind_healing' | 'extreme_exploration' | 'cultural_exchange' | 'photography_exploration' | 'urban_creation'>
}

const loading = ref(false)
const items = ref<DestinationItem[]>([])
const allCountries = ref<string[]>([])

const keyword = ref('')
const country = ref<string | undefined>(undefined)
const stage = ref<InspirationStage | undefined>(undefined)

const stages: InspirationStage[] = ['summon', 'reflection', 'awakening', 'internalization', 'transformation']

const countries = computed(() => allCountries.value)

const page = ref(1)
const pageSize = 12
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize
  return items.value.slice(start, start + pageSize)
})

const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%2311998e" offset="0"/><stop stop-color="%2338ef7d" offset="1"/></linearGradient></defs><rect width="1200" height="800" fill="url(%23g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="42" fill="white" opacity="0.9">No Image</text></svg>'
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = placeholder
}

function stageLabel(s?: InspirationStage): string {
  if (!s) return '阶段'
  const map: Record<InspirationStage, string> = {
    summon: '召唤',
    reflection: '映照',
    awakening: '觉醒',
    internalization: '沉淀',
    transformation: '转化'
  }
  return map[s]
}

function stageColor(s?: InspirationStage): string {
  switch (s) {
    case 'summon': return 'gold'
    case 'reflection': return 'cyan'
    case 'awakening': return 'purple'
    case 'internalization': return 'green'
    case 'transformation': return 'magenta'
    default: return 'default'
  }
}

function intentLabel(tag: NonNullable<DestinationItem['intentTags']>[number]): string {
  const map: Record<string, string> = {
    emotional_healing: '疗愈',
    mind_healing: '静心',
    extreme_exploration: '极限探索',
    cultural_exchange: '人文交流',
    photography_exploration: '摄影探索',
    urban_creation: '城市创作'
  }
  return map[tag] || tag
}

function intentColor(tag: NonNullable<DestinationItem['intentTags']>[number]): string {
  switch (tag) {
    case 'emotional_healing':
    case 'mind_healing':
      return 'green'
    case 'extreme_exploration':
      return 'red'
    case 'cultural_exchange':
      return 'gold'
    case 'photography_exploration':
      return 'geekblue'
    case 'urban_creation':
      return 'purple'
    default:
      return 'default'
  }
}

async function load() {
  loading.value = true
  try {
    const { listDestinations } = await import('@/utils/inspirationDb')
    const list = listDestinations({
      country: country.value,
      stage: stage.value,
      keyword: keyword.value?.trim() || undefined
    } as any)
    items.value = list.map(d => ({
      id: d.id,
      name: d.name,
      country: d.country,
      symbolicArchetype: (d as any).symbolicArchetype,
      description: (d as any).description,
      cognitiveDensity: (d as any).cognitiveDensity,
      recommendedStage: (d as any).recommendedStage,
      keywords: (d as any).keywords,
      images: (d as any).images,
      intentTags: (d as any).intentTags
    }))
    const countrySet = new Set(list.map(d => d.country))
    allCountries.value = Array.from(countrySet).sort()
    page.value = 1
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.catalog-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dest-card {
  border-radius: 12px;
  overflow: hidden;
}

.cover-wrapper {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-badges {
  position: absolute;
  left: 8px;
  bottom: 8px;
  display: flex;
  gap: 6px;
}

.meta {
  margin-top: 8px;
}

.meta-title {
  font-size: 14px;
  font-weight: 600;
  color: #222;
  margin-bottom: 6px;
}

.row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.label { color: #888; }
.value { color: #333; font-weight: 600; }

.desc {
  margin-top: 6px;
  color: #555;
  font-size: 12px;
  line-height: 1.5;
}

.tags { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }

.intent-tags { margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; }

.pager { margin-top: 16px; display: flex; justify-content: center; }
</style>



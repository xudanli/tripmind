<template>
  <div class="template-catalog">
    <section class="hero">
      <div class="hero__content">
        <h1>旅程模版库</h1>
        <p>精选灵感旅程，一键导入至「我的行程」。支持按照关键字与类型快速检索。</p>

        <div class="hero__filters">
          <a-input-search
            v-model:value="keyword"
            size="large"
            allow-clear
            placeholder="搜索目的地、标题、关键字…"
            @search="handleSearch"
          />

          <div class="filter-row">
            <a-radio-group v-model:value="modeFilter" class="mode-filter" size="large">
              <a-radio-button value="all">全部模式</a-radio-button>
              <a-radio-button value="inspiration">灵感模式</a-radio-button>
              <a-radio-button value="planner">Planner</a-radio-button>
              <a-radio-button value="seeker">Seeker</a-radio-button>
            </a-radio-group>

            <a-select
              v-model:value="statusFilter"
              size="large"
              class="status-filter"
              style="min-width: 180px"
              @change="handleStatusChange"
            >
              <a-select-option value="all">全部状态</a-select-option>
              <a-select-option value="published">已发布</a-select-option>
              <a-select-option value="draft">草稿</a-select-option>
              <a-select-option value="archived">已归档</a-select-option>
            </a-select>

            <a-select
              v-model:value="modePrimaryFilter"
              size="large"
              class="status-filter"
              style="min-width: 180px"
              placeholder="主要模式"
              allow-clear
              @change="handleModePrimaryChange"
            >
              <a-select-option
                v-for="option in modePrimaryOptions"
                :key="option"
                :value="option"
              >
                {{ option }}
              </a-select-option>
            </a-select>

            <a-select
              v-model:value="modeTagFilter"
              mode="multiple"
              size="large"
              class="mode-tag-filter"
              style="min-width: 220px"
              placeholder="标签筛选"
              allow-clear
              @change="handleModeTagChange"
            >
              <a-select-option
                v-for="tag in modeTagOptions"
                :key="tag"
                :value="tag"
              >
                {{ tag }}
              </a-select-option>
            </a-select>
          </div>
        </div>
      </div>
    </section>

    <main class="catalog-body">
      <a-spin :spinning="loading">
        <section class="result-summary">
          <span>共找到 {{ total }} 个模版</span>
          <a-button type="link" @click="resetFilters" v-if="isFiltered">重置筛选</a-button>
        </section>

        <a-alert
          v-if="errorMessage"
          type="error"
          show-icon
          :message="errorMessage"
          style="margin-bottom: 16px"
        />

        <a-alert
          v-else-if="fallbackUsed"
          type="warning"
          show-icon
          message="当前展示的是本地模版数据，API 暂不可用"
          style="margin-bottom: 16px"
        />

        <a-empty
          v-if="!templates.length && !loading"
          description="暂无匹配的旅程模版"
        />

        <div v-else class="template-grid">
          <a-card
            v-for="template in templates"
            :key="template.id"
            class="template-card"
            :hoverable="true"
          >
            <template #cover>
              <div class="template-card__cover">
                <img
                  v-if="template.coverImage"
                  :src="template.coverImage"
                  alt="模板封面"
                />
                <div v-else class="template-card__cover--placeholder">
                  <span>暂无封面</span>
                </div>
              </div>
            </template>

            <template #actions>
              <a-button type="link" @click="openTemplate(template.id)">查看详情</a-button>
              <a-button type="primary" ghost @click="openTemplate(template.id)">一键加入</a-button>
            </template>

            <a-card-meta>
              <template #title>
                <router-link :to="detailRoute(template.id)" class="template-card__title">
                  {{ template.title }}
                </router-link>
              </template>
              <template #description>
                <div class="template-card__meta">
                  <div class="meta-row">
                    <environment-outlined />
                    <span>{{ template.location || '目的地待定' }}</span>
                  </div>
                  <div class="meta-row">
                    <clock-circle-outlined />
                    <span>{{ template.durationDays || template.duration || '--' }} 天</span>
                  </div>
                </div>
                <p class="template-card__summary">
                  {{ template.summary || template.description || '查看详情以获取更多介绍。' }}
                </p>
                <div class="template-card__tags">
                  <a-tag color="purple">{{ modeLabel(template.mode) }}</a-tag>
                  <a-tag v-if="template.status" :color="statusColor(template.status)">
                    {{ statusLabel(template.status) }}
                  </a-tag>
                  <a-tag v-if="template.modePrimary" color="blue">
                    {{ template.modePrimary }}
                  </a-tag>
                  <a-tag
                    v-for="tag in template.modeTags"
                    :key="`${template.id}-tag-${tag}`"
                    color="cyan"
                  >
                    {{ tag }}
                  </a-tag>
                  <a-tag v-if="template.personaProfile?.type" color="geekblue">
                    {{ template.personaProfile.type }}
                  </a-tag>
                </div>
              </template>
            </a-card-meta>
          </a-card>
        </div>

        <div v-if="total > limit" class="catalog-pagination">
          <a-pagination
            :current="page"
            :page-size="limit"
            :total="total"
            show-size-changer
            :show-total="(total) => `共 ${total} 项`"
            @change="handlePageChange"
            @showSizeChange="handlePageSizeChange"
          />
        </div>
      </a-spin>
    </main>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import { fetchJourneyTemplatesWithFallback } from '@/apis/journeyTemplates'

const router = useRouter()
const keyword = ref('')
const modeFilter = ref('all')
const statusFilter = ref('all')
const modePrimaryFilter = ref<string | undefined>(undefined)
const modeTagFilter = ref<string[]>([])
const templates = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(12)
const loading = ref(false)
const errorMessage = ref('')
const fallbackUsed = ref(false)

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

const isFiltered = computed(
  () =>
    Boolean(normalizedKeyword.value) ||
    modeFilter.value !== 'all' ||
    statusFilter.value !== 'all' ||
    Boolean(modePrimaryFilter.value) ||
    modeTagFilter.value.length > 0,
)

const modePrimaryOptions = computed(() => {
  const set = new Set<string>()
  templates.value.forEach((tpl: any) => {
    if (tpl.modePrimary) set.add(tpl.modePrimary)
  })
  return Array.from(set)
})

const modeTagOptions = computed(() => {
  const set = new Set<string>()
  templates.value.forEach((tpl: any) => {
    if (Array.isArray(tpl.modeTags)) {
      tpl.modeTags.forEach((tag: string) => set.add(tag))
    }
  })
  return Array.from(set)
})

const loadTemplates = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    console.log('[JourneyTemplateCatalog] request params', {
      keyword: keyword.value,
      mode: modeFilter.value,
      status: statusFilter.value,
      modePrimary: modePrimaryFilter.value,
      modeTags: modeTagFilter.value,
      page: page.value,
      limit: limit.value,
    })
    const response = await fetchJourneyTemplatesWithFallback({
      keyword: keyword.value.trim() || undefined,
      mode: modeFilter.value === 'all' ? undefined : modeFilter.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      modePrimary: modePrimaryFilter.value || undefined,
      modeTags: modeTagFilter.value.length ? modeTagFilter.value.join(',') : undefined,
      page: page.value,
      limit: limit.value,
    })
    console.log('[JourneyTemplateCatalog] response raw', response)
    templates.value = response.data || []
    total.value = response.total || templates.value.length
    fallbackUsed.value = Boolean(response.fallback)
    console.log('[JourneyTemplateCatalog] templates length', templates.value.length, 'total', total.value)
    if (!templates.value.length) {
      console.warn('[JourneyTemplateCatalog] API returned empty template list. Check filters or backend data.')
    }
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__journeyResponse = response
      // @ts-ignore
      window.__journeyTemplates = templates.value
    }
  } catch (error) {
    console.error('Failed to load journey templates:', error)
    templates.value = []
    total.value = 0
    fallbackUsed.value = false
    errorMessage.value = '加载旅程模版失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(loadTemplates)

const handleSearch = (value: string) => {
  keyword.value = value
  page.value = 1
  loadTemplates()
}

const resetFilters = () => {
  keyword.value = ''
  modeFilter.value = 'all'
  statusFilter.value = 'all'
  modePrimaryFilter.value = undefined
  modeTagFilter.value = []
  page.value = 1
  limit.value = 12
  loadTemplates()
}

const detailRoute = (id: string) => `/journey/templates/${id}`

const openTemplate = (id: string) => {
  router.push(detailRoute(id))
}

const handlePageChange = (current: number) => {
  page.value = current
  loadTemplates()
}

const handlePageSizeChange = (_current: number, size: number) => {
  limit.value = size
  page.value = 1
  loadTemplates()
}

const handleStatusChange = () => {
  page.value = 1
  loadTemplates()
}

const handleModePrimaryChange = () => {
  page.value = 1
  loadTemplates()
}

const handleModeTagChange = () => {
  page.value = 1
  loadTemplates()
}

watch([modeFilter], () => {
  page.value = 1
  loadTemplates()
})

watch(keyword, (value, oldValue) => {
  if (oldValue && !value) {
    page.value = 1
    loadTemplates()
  }
})

watch(modePrimaryFilter, () => {
  page.value = 1
  loadTemplates()
})

const modeLabel = (mode: string) => {
  switch (mode) {
    case 'planner':
      return 'Planner 模式'
    case 'seeker':
      return 'Seeker 模式'
    case 'inspiration':
    default:
      return '灵感模式'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'published':
      return '已发布'
    case 'draft':
      return '草稿'
    case 'archived':
      return '已归档'
    default:
      return status
  }
}

const statusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'gold'
    case 'archived':
      return 'default'
    default:
      return 'default'
  }
}
</script>

<style scoped>
.template-catalog {
  min-height: 100vh;
  background: #f8fafc;
}

.hero {
  padding: 64px clamp(16px, 6vw, 64px) 40px;
  background: linear-gradient(135deg, #3730a3 0%, #7c3aed 60%, #38bdf8 100%);
  color: #fff;
}

.hero__content {
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero__content h1 {
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  margin: 0;
  font-weight: 700;
}

.hero__content p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.92;
}

.hero__filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.mode-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-filter {
  min-width: 160px;
}

.mode-tag-filter {
  min-width: 220px;
}

.catalog-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px clamp(16px, 5vw, 40px) 64px;
}

.result-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  color: #475569;
  font-size: 0.95rem;
}

.template-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.template-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 40px -24px rgba(15, 23, 42, 0.4);
}

.template-card__cover {
  width: 100%;
  height: 200px;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.template-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-card__cover--placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  font-size: 0.95rem;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.35));
}

.template-card__title {
  color: #111827;
  font-weight: 600;
}

.template-card__title:hover {
  color: #7c3aed;
}

.template-card__meta {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 0.9rem;
}

.template-card__summary {
  margin: 12px 0;
  color: #334155;
  line-height: 1.6;
  font-size: 0.95rem;
}

.template-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.catalog-pagination {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .mode-filter {
    flex-direction: column;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .mode-tag-filter {
    width: 100%;
  }
}
</style>


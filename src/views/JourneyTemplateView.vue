<template>
  <div class="journey-template-page">
  <div v-if="loading" class="page-loading">
    <a-spin size="large" />
  </div>

  <div v-else-if="template" class="journey-template">
      <section class="hero" :style="heroStyle">
        <div class="hero__overlay">
          <div class="hero__header">
            <a-button class="hero__back" @click="handleBack">
              <template #icon>
                <arrow-left-outlined />
              </template>
              返回
            </a-button>
            <div class="hero__status">
              <a-tag color="purple" class="hero__tag">旅程模版</a-tag>
              <a-tag
                v-if="template.status"
                :color="statusColor(template.status)"
                class="hero__tag"
              >
                {{ statusLabel(template.status) }}
              </a-tag>
            </div>
          </div>

          <div class="hero__content">
            <h1 class="hero__title">{{ template.title }}</h1>
            <p class="hero__subtitle">{{ template.summary }}</p>

            <div class="hero__meta">
              <div class="meta-item">
                <environment-outlined />
                <span>{{ template.location }}</span>
              </div>
              <div class="meta-item">
                <clock-circle-outlined />
                <span>{{ template.duration }} 天</span>
              </div>
            </div>

            <div
              v-if="template.modePrimary || template.modeTags?.length"
              class="hero__tags"
            >
              <a-tag v-if="template.modePrimary" color="blue">
                {{ template.modePrimary }}
              </a-tag>
              <a-tag
                v-for="tag in template.modeTags"
                :key="`${template.id}-hero-tag-${tag}`"
                color="cyan"
              >
                {{ tag }}
              </a-tag>
            </div>

            <div class="hero__actions">
              <a-button
                type="primary"
                size="large"
                class="create-button"
                @click="handleCreateJourney"
              >
                <template #icon>
                  <plus-outlined />
                </template>
                一键创建到我的行程
              </a-button>
              <a-button size="large" ghost @click="scrollToDetails">
                了解行程详情
              </a-button>
            </div>
          </div>
        </div>
      </section>

      <main ref="detailsRef" class="content">
        <a-alert
          v-if="fallbackUsed"
          type="warning"
          show-icon
          message="当前展示的是本地模版数据，API 暂不可用"
          class="page-alert"
        />
        <a-alert
          v-else-if="errorMessage"
          type="error"
          show-icon
          :message="errorMessage"
          class="page-alert"
        />
        <section class="section">
          <div class="section__grid">
            <a-card class="info-card" :bordered="false">
              <h3 class="section-title">
                <flag-outlined />
                核心洞察
              </h3>
              <p class="info-card__text">{{ template.coreInsight }}</p>
            </a-card>
            <a-card v-if="template.safetyNotice" class="info-card" :bordered="false">
              <h3 class="section-title">
                <safety-outlined />
                安全提醒
              </h3>
              <p class="info-card__text">{{ template.safetyNotice }}</p>
            </a-card>
          </div>
        </section>

        <section class="section">
          <a-card class="description-card" :bordered="false">
            <h3 class="section-title">
              <calendar-outlined />
              模版简介
            </h3>
            <p class="description-text">{{ template.description }}</p>
            <ul v-if="template.journeyBackground?.length" class="description-list">
              <li v-for="(item, index) in template.journeyBackground" :key="index">
                {{ item }}
              </li>
            </ul>
          </a-card>
        </section>

        <section class="section" v-if="template.personaProfile || template.journeyDesign">
          <div class="section__grid section__grid--two">
            <a-card v-if="template.personaProfile" class="persona-card" title="旅者画像" :bordered="false">
              <dl class="persona-grid">
                <div class="persona-row">
                  <dt>角色定位</dt>
                  <dd>{{ template.personaProfile?.type }}</dd>
                </div>
                <div class="persona-row">
                  <dt>旅行动机</dt>
                  <dd>{{ template.personaProfile?.motivation }}</dd>
                </div>
                <div class="persona-row">
                  <dt>主导情绪</dt>
                  <dd>{{ template.personaProfile?.dominantEmotion }}</dd>
                </div>
                <div class="persona-row">
                  <dt>旅行节奏</dt>
                  <dd>{{ template.personaProfile?.travelRhythm }}</dd>
                </div>
                <div class="persona-row">
                  <dt>社交偏好</dt>
                  <dd>{{ template.personaProfile?.socialPreference }}</dd>
                </div>
                <div class="persona-row">
                  <dt>认知需求</dt>
                  <dd>{{ template.personaProfile?.cognitiveNeed }}</dd>
                </div>
                <div v-if="template.personaProfile?.foodPreference" class="persona-row">
                  <dt>饮食偏好</dt>
                  <dd>{{ template.personaProfile?.foodPreference }}</dd>
                </div>
              </dl>
            </a-card>

            <a-card v-if="template.journeyDesign" class="journey-design-card" title="旅程设计" :bordered="false">
              <p class="journey-design__insight">{{ template.journeyDesign?.coreInsight }}</p>
              <div v-if="template.journeyDesign?.psychologicalFlow?.length" class="journey-flow">
                <span
                  v-for="(stage, index) in template.journeyDesign?.psychologicalFlow"
                  :key="stage"
                  class="journey-flow__item"
                >
                  {{ stage }}
                  <span v-if="index < template.journeyDesign.psychologicalFlow.length - 1" class="journey-flow__arrow">
                    →
                  </span>
                </span>
              </div>
              <div v-if="template.journeyDesign?.symbolicElements?.length" class="journey-tags">
                <a-tag v-for="symbol in template.journeyDesign.symbolicElements" :key="symbol" color="geekblue">
                  {{ symbol }}
                </a-tag>
              </div>
              <p v-if="template.journeyDesign?.recommendedRhythm" class="journey-design__note">
                节奏建议：{{ template.journeyDesign.recommendedRhythm }}
              </p>
              <p v-if="template.journeyDesign?.socialMode" class="journey-design__note">
                社交模式：{{ template.journeyDesign.socialMode }}
              </p>
            </a-card>
          </div>
        </section>

        <section class="section" v-if="template.mentalFlowStages">
          <a-card class="mental-flow-card" title="五段式心智旅程" :bordered="false">
            <div class="mental-flow-grid">
              <div
                v-for="(stage, key) in template.mentalFlowStages"
                :key="key"
                class="mental-flow-item"
              >
                <h4 class="mental-flow-item__title">{{ stageNameMap[key] || key }}</h4>
                <p v-if="stage?.theme" class="mental-flow-item__meta">主题：{{ stage.theme }}</p>
                <p v-if="stage?.emotionalGoal" class="mental-flow-item__meta">
                  情绪目标：{{ stage.emotionalGoal }}
                </p>
                <p v-if="stage?.symbolicElement" class="mental-flow-item__meta">
                  象征元素：{{ stage.symbolicElement }}
                </p>
                <ul v-if="stage?.activities?.length" class="mental-flow-item__list">
                  <li v-for="(activity, idx) in stage.activities" :key="idx">
                    {{ activity }}
                  </li>
                </ul>
              </div>
            </div>
          </a-card>
        </section>

        <section class="section">
          <a-card class="tasks-card" title="出发前准备清单" :bordered="false">
            <div v-if="template.tasks?.length" class="task-list">
              <div v-for="task in template.tasks" :key="task.id" class="task-list__item">
                <div class="task-list__header">
                  <a-tag :color="taskCategoryColor(task.category)" class="task-list__tag">
                    {{ taskCategoryLabel(task.category) }}
                  </a-tag>
                  <span class="task-list__title">{{ task.title }}</span>
                </div>
                <div v-if="task.links?.length" class="task-list__links">
                  <a
                    v-for="link in task.links"
                    :key="link.url"
                    :href="link.url"
                    class="task-list__link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ link.name }}
                  </a>
                </div>
              </div>
            </div>
            <p v-else class="task-list__empty">暂无默认准备事项，可在创建后自行完善。</p>
          </a-card>
        </section>

        <section class="section itinerary-section">
          <a-card class="itinerary-card" :bordered="false">
            <template #title>
              <div class="itinerary-header">
                <h3>{{ template.duration || (template.days?.length || 0) }}天行程总览</h3>
                <span class="itinerary-subtitle">详细时间表将同步至「我的行程」，支持进一步编辑</span>
              </div>
            </template>

            <a-timeline v-if="template.days?.length" class="itinerary-timeline">
              <a-timeline-item v-for="day in template.days" :key="day.day">
                <div class="day-card">
                  <div class="day-card__header">
                    <div class="day-card__title">
                      <span class="day-number">Day {{ day.day }}</span>
                      <span class="day-name">{{ day.title }}</span>
                    </div>
                    <p class="day-summary">{{ day.summary }}</p>
                  </div>
                  <div class="day-card__slots">
                    <div v-for="(slot, index) in day.timeSlots" :key="index" class="slot">
                      <div class="slot__meta">
                        <span class="slot__time">{{ slot.startTime || '待定时间' }}</span>
                        <a-tag class="slot__tag" color="cyan">
                          {{ typeLabelMap[slot.type] || slot.type }}
                        </a-tag>
                      </div>
                      <h4 class="slot__title">{{ slot.title }}</h4>
                      <p v-if="slot.activityHighlights" class="slot__text">
                        {{ slot.activityHighlights }}
                      </p>
                      <p v-if="slot.scenicIntro" class="slot__text slot__text--muted">
                        {{ slot.scenicIntro }}
                      </p>
                      <p v-if="slot.localTip" class="slot__tip">💡 {{ slot.localTip }}</p>
                      <div class="slot__foot">
                        <span v-if="slot.location" class="slot__foot-item">
                          📍 {{ slot.location }}
                        </span>
                        <span v-if="slot.durationHours" class="slot__foot-item">
                          ⏱ {{ slot.durationHours }} 小时
                        </span>
                        <span v-if="slot.transport?.mode" class="slot__foot-item">
                          🚚 {{ transportLabelMap[slot.transport.mode] || slot.transport.mode }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
            <a-empty v-else description="暂无时间表信息" />
          </a-card>
        </section>
      </main>
    </div>

    <div v-else class="not-found">
      <a-result
        status="404"
        title="未找到旅程模版"
        :sub-title="errorMessage || '请检查链接是否正确，或返回上一页。'"
      >
        <template #extra>
          <a-button type="primary" @click="router.back()">返回</a-button>
        </template>
      </a-result>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - 快速迭代页面，后续可补充完整类型
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  PlusOutlined,
  SafetyOutlined,
} from '@ant-design/icons-vue'
import { buildJourneyTemplateData } from '@/data/journeyTemplates'
import { fetchJourneyTemplateDetailWithFallback } from '@/apis/journeyTemplates'
import { useTravelListStore } from '@/stores/travelList'

const route = useRoute()
const router = useRouter()
const travelListStore = useTravelListStore()
const detailsRef = ref<HTMLElement>()

const loading = ref(true)
const fallbackUsed = ref(false)
const errorMessage = ref('')
const template = ref<any>(null)

const heroStyle = computed(() => {
  if (!template.value?.coverImage) return {}
  return {
    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.75) 100%), url(${template.value.coverImage})`,
  }
})

const typeLabelMap: Record<string, string> = {
  transport: '交通',
  arrival: '到达',
  departure: '离境',
  culture: '文化',
  sightseeing: '观光',
  cruise: '巡游',
  hiking: '徒步',
  nature: '自然',
  education: '讲座',
  community: '仪式',
  leisure: '自由活动',
}

const transportLabelMap: Record<string, string> = {
  flight: '航班',
  ship: '邮轮',
  boat: '快艇',
  private_transfer: '专车',
}

const stageNameMap: Record<string, string> = {
  summon: '召唤',
  reflection: '沉淀',
  awakening: '觉醒',
  internalization: '内化',
  transformation: '转化',
}

const loadTemplate = async (id?: string | string[]) => {
  if (!id || typeof id !== 'string') {
    loading.value = false
    template.value = null
    errorMessage.value = '未提供有效的模版 ID'
    return
  }

  loading.value = true
  fallbackUsed.value = false
  errorMessage.value = ''

  try {
    const { template: mapped, fallback } = await fetchJourneyTemplateDetailWithFallback(id)
    template.value = mapped
    fallbackUsed.value = Boolean(fallback)
  } catch (error) {
    console.error('Failed to load journey template:', error)
    template.value = null
    errorMessage.value = '加载旅程模版失败，请稍后再试。'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  (id) => {
    loadTemplate(id)
  },
  { immediate: true },
)

const handleBack = () => {
  router.back()
}

const scrollToDetails = () => {
  if (!detailsRef.value) return
  detailsRef.value.scrollIntoView({ behavior: 'smooth' })
}

const handleCreateJourney = () => {
  if (!template.value) {
    message.error('未找到旅程模版')
    return
  }
  try {
    const data = buildJourneyTemplateData(template.value)
    const travel = travelListStore.createTravel({
      title: template.value.title,
      location: template.value.location,
      description: template.value.summary,
      mode: 'inspiration',
      status: 'active',
      duration: template.value.duration,
      coverImage: template.value.coverImage,
      data,
    })
    message.success('已将模版加入「我的行程」，可随时查看和编辑')
    router.push(`/travel/${travel.id}`)
  } catch (error) {
    console.error('创建旅程失败:', error)
    message.error('创建旅程失败，请稍后再试')
  }
}

const taskCategoryLabel = (category: string) => {
  switch (category) {
    case 'gear':
      return '装备'
    case 'safety':
      return '安全'
    case 'documents':
      return '证件'
    default:
      return '准备'
  }
}

const taskCategoryColor = (category: string) => {
  switch (category) {
    case 'gear':
      return 'geekblue'
    case 'safety':
      return 'volcano'
    case 'documents':
      return 'gold'
    default:
      return 'blue'
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
.journey-template-page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #1d1d1f;
}

.hero {
  position: relative;
  background: #111;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hero__overlay {
  padding: 80px clamp(24px, 8vw, 120px);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.8) 100%);
  color: #ffffff;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hero__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero__back {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  backdrop-filter: blur(6px);
}

.hero__back:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
}

.hero__tag {
  font-weight: 500;
  backdrop-filter: blur(6px);
}

.hero__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero__content {
  margin-top: auto;
  max-width: 720px;
}

.hero__title {
  font-size: clamp(2.25rem, 4vw, 3.5rem);
  font-weight: 700;
  margin-bottom: 12px;
}

.hero__subtitle {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  line-height: 1.6;
  margin-bottom: 24px;
  opacity: 0.9;
}

.hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
  font-size: 1rem;
}

.hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  backdrop-filter: blur(6px);
}

.hero__actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.page-loading {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-alert {
  margin-bottom: 16px;
}

.create-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  padding: 0 28px;
}

.content {
  max-width: 1120px;
  margin: -64px auto 80px;
  padding: 0 clamp(16px, 5vw, 32px);
  position: relative;
  z-index: 1;
}

.section {
  margin-top: 32px;
}

.section__grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.section__grid--two {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.info-card {
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fb 100%);
  box-shadow: 0 20px 45px -20px rgba(15, 23, 42, 0.18);
}

.info-card__text {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.7;
  color: #1f2937;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.15rem;
  margin-bottom: 12px;
  font-weight: 600;
  color: #0f172a;
}

.description-card {
  border-radius: 24px;
  padding: 24px;
  background: #ffffff;
  box-shadow: 0 24px 55px -28px rgba(30, 41, 59, 0.35);
}

.description-text {
  font-size: 1.05rem;
  line-height: 1.8;
  margin-bottom: 16px;
  color: #1f2937;
}

.description-list {
  padding-left: 20px;
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.persona-card,
.journey-design-card,
.mental-flow-card,
.tasks-card,
.itinerary-card {
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 28px 60px -32px rgba(15, 23, 42, 0.25);
}

.persona-grid {
  display: grid;
  gap: 16px;
  margin: 0;
}

.persona-row {
  display: flex;
  gap: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  padding-bottom: 12px;
}

.persona-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.persona-row dt {
  min-width: 90px;
  font-weight: 600;
  color: #0f172a;
}

.persona-row dd {
  margin: 0;
  color: #475569;
}

.journey-design__insight {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.journey-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  color: #1d4ed8;
  font-weight: 500;
}

.journey-flow__arrow {
  color: #94a3b8;
}

.journey-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.journey-design__note {
  margin: 0;
  color: #475569;
}

.mental-flow-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.mental-flow-item {
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.16), rgba(59, 130, 246, 0.12));
  color: #0f172a;
}

.mental-flow-item__title {
  margin: 0 0 10px 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.mental-flow-item__meta {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 0.95rem;
}

.mental-flow-item__list {
  margin: 0;
  padding-left: 18px;
  color: #1f2937;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-list__item {
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.task-list__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.task-list__title {
  flex: 1;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.5;
}

.task-list__links {
  margin-top: 10px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.task-list__link {
  color: #2563eb;
  font-size: 0.92rem;
}

.task-list__empty {
  margin: 0;
  color: #94a3b8;
  font-size: 0.95rem;
  padding: 8px 0;
}

.itinerary-section {
  margin-bottom: 64px;
}

.itinerary-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.itinerary-header h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.itinerary-subtitle {
  color: #64748b;
  font-size: 0.95rem;
}

.itinerary-timeline {
  margin-top: 16px;
}

.day-card {
  padding: 22px;
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-card__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-card__title {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: baseline;
}

.day-number {
  font-weight: 700;
  color: #4338ca;
}

.day-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0f172a;
}

.day-summary {
  margin: 0;
  color: #475569;
  line-height: 1.6;
}

.day-card__slots {
  display: grid;
  gap: 12px;
}

.slot {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.95rem;
  color: #4338ca;
}

.slot__time {
  font-weight: 600;
}

.slot__tag {
  border-radius: 999px;
  font-size: 0.85rem;
}

.slot__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #0f172a;
}

.slot__text {
  margin: 0;
  color: #475569;
  line-height: 1.6;
}

.slot__text--muted {
  color: #64748b;
  font-size: 0.92rem;
}

.slot__tip {
  margin: 0;
  color: #1d4ed8;
  font-size: 0.92rem;
}

.slot__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #94a3b8;
  font-size: 0.9rem;
}

.not-found {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

@media (max-width: 768px) {
  .hero__overlay {
    padding: 60px 20px;
    min-height: 360px;
  }

  .content {
    margin-top: -32px;
  }

  .hero__actions {
    flex-direction: column;
  }

  .create-button,
  .hero__actions .ant-btn {
    width: 100%;
  }
}
</style>


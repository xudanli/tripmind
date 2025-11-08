<template>
  <div v-if="plannerItinerary" class="planner-overview">
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :xl="16">
        <a-card :bordered="false" class="summary-card" :title="t('travelDetail.plannerOverview.summaryTitle')">
          <p class="summary-text">{{ summaryText }}</p>
          <div class="stats-row">
            <div class="stat-item" v-for="metric in statMetrics" :key="metric.key">
              <span class="stat-label">{{ metric.label }}</span>
              <span class="stat-value">{{ metric.value }}</span>
            </div>
          </div>
        </a-card>

        <a-card
          v-if="insightBlocks.length"
          :bordered="false"
          class="insights-card"
          :title="t('travelDetail.plannerOverview.insightsTitle')"
        >
          <a-row :gutter="[16, 16]">
            <a-col v-for="block in insightBlocks" :key="block.key" :xs="24" :md="12">
              <div class="insight-block">
                <div class="insight-header">
                  <span class="insight-icon">{{ block.icon }}</span>
                  <span class="insight-title">{{ block.title }}</span>
                </div>
                <ul class="insight-list">
                  <li v-for="(item, index) in block.items" :key="index">
                    {{ item }}
                  </li>
                </ul>
              </div>
            </a-col>
          </a-row>
        </a-card>

        <a-card
          v-if="highlightDays.length"
          :bordered="false"
          class="highlights-card"
          :title="t('travelDetail.plannerOverview.highlightTitle')"
        >
          <a-timeline>
            <a-timeline-item v-for="highlight in highlightDays" :key="highlight.id" color="blue">
              <div class="highlight-item">
                <div class="highlight-title">{{ highlight.title }}</div>
                <div v-if="highlight.summary" class="highlight-summary">{{ highlight.summary }}</div>
                <div v-if="highlight.activity" class="highlight-activity">
                  <span class="highlight-chip">★</span>
                  <span>{{ highlight.activity }}</span>
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="8">
        <a-card
          :bordered="false"
          class="recommendations-card"
          :title="t('travelDetail.plannerOverview.recommendationsTitle')"
        >
          <div v-if="plannerItinerary.recommendations?.bestTimeToVisit" class="recommendation-item">
            <span class="recommendation-label">{{ t('travelDetail.plannerOverview.bestTime') }}</span>
            <p class="recommendation-text">{{ plannerItinerary.recommendations.bestTimeToVisit }}</p>
          </div>
          <div v-if="plannerItinerary.recommendations?.weatherAdvice" class="recommendation-item">
            <span class="recommendation-label">{{ t('travelDetail.plannerOverview.weatherAdvice') }}</span>
            <p class="recommendation-text">{{ plannerItinerary.recommendations.weatherAdvice }}</p>
          </div>

          <div v-if="packingTips.length" class="recommendation-item">
            <span class="recommendation-label">{{ t('travelDetail.plannerOverview.packingTips') }}</span>
            <div class="tag-list">
              <a-tag v-for="(tip, index) in packingTips" :key="index" color="blue">{{ tip }}</a-tag>
            </div>
          </div>

          <div v-if="localTips.length" class="recommendation-item">
            <span class="recommendation-label">{{ t('travelDetail.plannerOverview.localTips') }}</span>
            <ul class="recommendation-list">
              <li v-for="(tip, index) in localTips" :key="index">{{ tip }}</li>
            </ul>
          </div>

          <div v-if="emergencyContacts.length" class="recommendation-item">
            <span class="recommendation-label">{{ t('travelDetail.plannerOverview.emergencyContacts') }}</span>
            <ul class="recommendation-list">
              <li v-for="(contact, index) in emergencyContacts" :key="index">{{ contact }}</li>
            </ul>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useTravelStore } from '@/stores/travel'
import type { PlannerItineraryResponse } from '@/services/plannerAPI'
import { getCurrencyForDestination, formatCurrency, type CurrencyInfo } from '@/utils/currency'

interface Props {
  itinerary?: PlannerItineraryResponse | null
}

const props = withDefaults(defineProps<Props>(), {
  itinerary: null
})

const { t } = useI18n()
const travelStore = useTravelStore()
const { plannerItinerary: plannerItineraryRef, plannerRhythmInsights } = storeToRefs(travelStore)

const plannerItinerary = computed<PlannerItineraryResponse | null>(() => {
  if (props.itinerary?.days?.length) {
    return props.itinerary
  }
  if (plannerItineraryRef.value?.days?.length) {
    return plannerItineraryRef.value
  }
  return null
})

const summaryText = computed(() => {
  const summary = plannerItinerary.value?.summary?.trim()
  return summary && summary.length > 0 ? summary : t('travelDetail.plannerOverview.summaryFallback')
})

const dayCount = computed(() => plannerItinerary.value?.days?.length ?? 0)

const currencyInfo = computed<CurrencyInfo>(() => {
  const destination = plannerItinerary.value?.destination || ''
  if (destination) {
    const info = getCurrencyForDestination(destination)
    if (info.code !== 'CNY') return info
  }
  return { code: 'CNY', symbol: '¥', name: '人民币' }
})

const totalCostText = computed(() => {
  const amount = plannerItinerary.value?.totalCost ?? 0
  return formatCurrency(amount, currencyInfo.value)
})

const rhythmScore = computed(() => {
  const score = plannerRhythmInsights.value?.score
  return typeof score === 'number' ? Math.max(0, Math.min(100, Math.round(score))) : null
})

const statMetrics = computed(() => {
  const metrics = [
    {
      key: 'duration',
      label: t('travelDetail.plannerOverview.durationLabel'),
      value: `${plannerItinerary.value?.duration || 0}${t('travelDetail.plannerOverview.unitDays')}`
    },
    {
      key: 'days',
      label: t('travelDetail.plannerOverview.dayCountLabel'),
      value: `${dayCount.value}`
    },
    {
      key: 'cost',
      label: t('travelDetail.plannerOverview.costLabel'),
      value: totalCostText.value
    }
  ]

  if (rhythmScore.value !== null) {
    metrics.push({
      key: 'rhythm',
      label: t('travelDetail.plannerOverview.rhythmLabel'),
      value: `${rhythmScore.value}${t('travelDetail.plannerOverview.rhythmUnit')}`
    })
  }

  return metrics
})

const insightBlocks = computed(() => {
  if (!plannerItinerary.value?.aiInsights) return []
  const insights = plannerItinerary.value.aiInsights
  const blocks = [
    {
      key: 'optimization',
      icon: '⚡',
      title: t('travelDetail.plannerOverview.insightsOptimization'),
      items: insights.optimizationSuggestions || []
    },
    {
      key: 'alternatives',
      icon: '🎯',
      title: t('travelDetail.plannerOverview.insightsAlternatives'),
      items: insights.alternativeActivities || []
    },
    {
      key: 'budget',
      icon: '💰',
      title: t('travelDetail.plannerOverview.insightsBudget'),
      items: insights.budgetOptimization || []
    },
    {
      key: 'culture',
      icon: '🌏',
      title: t('travelDetail.plannerOverview.insightsCulture'),
      items: insights.culturalNotes || []
    }
  ]
  return blocks.filter((block) => Array.isArray(block.items) && block.items.length > 0)
})

const packingTips = computed(() =>
  Array.isArray(plannerItinerary.value?.recommendations?.packingTips)
    ? plannerItinerary.value?.recommendations?.packingTips ?? []
    : []
)
const localTips = computed(() =>
  Array.isArray(plannerItinerary.value?.recommendations?.localTips)
    ? plannerItinerary.value?.recommendations?.localTips ?? []
    : []
)
const emergencyContacts = computed(() =>
  Array.isArray(plannerItinerary.value?.recommendations?.emergencyContacts)
    ? plannerItinerary.value?.recommendations?.emergencyContacts ?? []
    : []
)

const highlightDays = computed(() => {
  const days = plannerItinerary.value?.days ?? []
  return days.slice(0, 3).map((day, index) => {
    const firstSlot = day.timeSlots?.[0]
    return {
      id: `${day.date || 'day'}-${index}`,
      title: day.title || day.date || t('travelDetail.plannerOverview.unitDayLabel', { value: index + 1 }),
      summary: day.description || '',
      activity: firstSlot?.activity || firstSlot?.notes || ''
    }
  }).filter((item) => item.title || item.summary || item.activity)
})
</script>

<style scoped>
.planner-overview {
  margin-bottom: 24px;
}

.summary-card,
.insights-card,
.highlights-card,
.recommendations-card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.summary-text {
  font-size: 15px;
  line-height: 1.8;
  color: #3c3c43;
  margin-bottom: 16px;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.stat-item {
  flex: 1 1 160px;
  background: #f6f9ff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #5f6b7c;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

.insight-block {
  background: #f8faff;
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.insight-icon {
  font-size: 18px;
}

.insight-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.insight-list {
  margin: 0;
  padding-left: 18px;
  color: #4b5563;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.highlights-card :deep(.ant-timeline-item-tail) {
  border-color: #d6e4ff;
}

.highlight-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.highlight-title {
  font-weight: 600;
  color: #1f2937;
}

.highlight-summary {
  font-size: 13px;
  color: #4b5563;
}

.highlight-activity {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #2563eb;
}

.highlight-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
}

.recommendation-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.recommendation-item:last-child {
  border-bottom: none;
}

.recommendation-label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.recommendation-text {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recommendation-list {
  margin: 0;
  padding-left: 18px;
  color: #4b5563;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 991px) {
  .stat-item {
    flex: 1 1 120px;
  }
}
</style>



<template>
  <a-card class="day-card" :bordered="false">
    <header class="day-card__header">
      <div class="day-card__title-block">
        <h3 class="day-card__title">{{ title }}</h3>
        <p v-if="dateText" class="day-card__date">{{ dateText }}</p>
      </div>
      <div class="day-card__tags">
        <a-tag v-if="day.mood" :color="moodColor" class="day-card__tag">{{ day.mood }}</a-tag>
        <a-tag v-if="stageLabel" color="purple" class="day-card__tag">
          {{ stageLabel }}
        </a-tag>
      </div>
    </header>

    <p v-if="summary" class="day-card__summary">{{ summary }}</p>

    <div class="day-card__slots">
      <slot name="slots" />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MOOD_COLORS } from '@/utils/travelConstants'

interface DayCardProps {
  day: Record<string, any>
  summary?: string | null
}

const props = defineProps<DayCardProps>()
const { t } = useI18n()

const title = computed(() => {
  if (props.day?.theme) {
    return props.day.theme
  }
  if (props.day?.day) {
    return `${t('travelDetail.experienceDay.day')} ${props.day.day}`
  }
  return t('travelDetail.experienceDay.day')
})

const dateText = computed(() => {
  if (!props.day?.date) {
    return ''
  }
  const date = new Date(props.day.date)
  if (Number.isNaN(date.getTime())) {
    return props.day.date
  }
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
})

const summary = computed(() => props.summary || '')

const moodColor = computed(() => {
  const mood = props.day?.mood
  if (!mood) return 'default'
  return MOOD_COLORS[mood] || 'default'
})

const stageLabel = computed(() => {
  if (!props.day?.psychologicalStage) {
    return ''
  }
  return props.day.psychologicalStage
})
</script>

<style scoped>
.day-card {
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 28px 32px;
}

.day-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.day-card__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.day-card__date {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  letter-spacing: 0.025em;
}

.day-card__tags {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-card__tag {
  font-size: 12px;
}

.day-card__summary {
  margin: 0 0 18px 0;
  font-size: 14px;
  line-height: 1.65;
  color: #475569;
  letter-spacing: -0.01em;
}

.day-card__slots {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 768px) {
  .day-card {
    padding: 22px 20px;
    border-radius: 20px;
  }

  .day-card__header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
}
</style>

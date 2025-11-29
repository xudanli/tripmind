<template>
  <a-card class="day-card" :bordered="false" :class="{ 'day-card--collapsed': !isExpanded }">
    <header class="day-card__header" @click="toggleExpand">
      <div class="day-card__title-block">
        <div class="day-card__number">{{ dayNumber }}</div>
        <div class="day-card__title-wrapper">
        <h3 class="day-card__title">{{ title }}</h3>
          <p v-if="dateText && isExpanded" class="day-card__date">{{ dateText }}</p>
        </div>
      </div>
      <div class="day-card__header-right">
      <div class="day-card__tags">
        <a-tag v-if="day.mood" :color="moodColor" class="day-card__tag">{{ day.mood }}</a-tag>
        <a-tag v-if="stageLabel" color="purple" class="day-card__tag">
          {{ stageLabel }}
        </a-tag>
        </div>
        <div class="day-card__expand-icon">
          <down-outlined v-if="!isExpanded" />
          <up-outlined v-else />
        </div>
      </div>
    </header>

    <p v-if="summary" class="day-card__summary" :class="{ 'day-card__summary--collapsed': !isExpanded }">{{ summary }}</p>

    <div v-show="isExpanded" class="day-card__slots">
      <slot name="slots" />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DownOutlined, UpOutlined } from '@ant-design/icons-vue'
import { MOOD_COLORS } from '@/utils/travelConstants'

interface DayCardProps {
  day: Record<string, any>
  summary?: string | null
}

const props = defineProps<DayCardProps>()
const { t } = useI18n()

// 展开/折叠状态，默认折叠
const isExpanded = ref(false)

const emit = defineEmits<{
  expand: [expanded: boolean]
}>()

// 切换展开/折叠
const toggleExpand = () => {
  const wasExpanded = isExpanded.value
  isExpanded.value = !isExpanded.value
  // 当展开时，触发事件
  if (!wasExpanded && isExpanded.value) {
    emit('expand', true)
  }
}

// 天数编号
const dayNumber = computed(() => {
  return props.day?.day || ''
})

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
  border: 2px solid #1890ff;
  padding: 28px 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-card--collapsed {
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  background: #ffffff;
}

.day-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.day-card--collapsed .day-card__header {
  margin-bottom: 0;
}

.day-card__header:hover {
  opacity: 0.8;
}

.day-card__title-block {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.day-card__number {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #1890ff;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.day-card--collapsed .day-card__number {
  background: #f1f5f9;
  color: #475569;
}

.day-card__title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.day-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
}

.day-card__date {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  letter-spacing: 0.025em;
}

.day-card__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.day-card__tags {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-card__tag {
  font-size: 12px;
}

.day-card__expand-icon {
  color: #64748b;
  font-size: 16px;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.day-card__header:hover .day-card__expand-icon {
  color: #1890ff;
}

.day-card__summary {
  margin: 0 0 18px 0;
  font-size: 14px;
  line-height: 1.65;
  color: #475569;
  letter-spacing: -0.01em;
}

.day-card__summary--collapsed {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.day-card__slots {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .day-card {
    padding: 22px 20px;
    border-radius: 20px;
  }

  .day-card__header {
    gap: 12px;
    margin-bottom: 16px;
  }

  .day-card__number {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .day-card__title {
    font-size: 16px;
  }
}
</style>

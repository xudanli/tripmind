<template>
  <div class="hero-section inspiration-hero">
    <div class="hero-cover">
      <img :src="heroCoverImage" :alt="heroTitle" />
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-top">
            <span class="hero-mode-tag">
              <star-outlined class="tag-icon" />
              {{ heroModeLabel }}
            </span>
            <a-tag v-if="journeyStatusLabel" color="gold" class="status-tag">
              {{ journeyStatusLabel }}
            </a-tag>
          </div>

          <h1 class="hero-title">{{ heroTitle }}</h1>

          <div class="hero-meta">
            <div
              v-for="(item, index) in heroMetaItems"
              :key="index"
              class="meta-item"
            >
              <component :is="item.icon" class="meta-icon" />
              <span class="meta-text">{{ item.label }}</span>
            </div>
          </div>

          <div v-if="heroChips.length" class="hero-chips">
            <a-tag
              v-for="chip in heroChips"
              :key="chip"
              class="chip"
            >
              {{ chip }}
            </a-tag>
          </div>

          <div v-if="heroCoreInsight" class="hero-insight">
            <bulb-outlined class="insight-icon" />
            <p>{{ heroCoreInsight }}</p>
          </div>

          <p v-if="heroSupportingText" class="hero-supporting-text">
            {{ heroSupportingText }}
          </p>

          <p v-if="heroJourneyBackground" class="hero-background">
            {{ heroJourneyBackground }}
          </p>
        </div>

        <div class="hero-side" v-if="sideHighlights.length">
          <div class="side-card" v-for="highlight in sideHighlights" :key="highlight.title">
            <div class="side-card-title">
              <component :is="highlight.icon" class="side-icon" />
              <span>{{ highlight.title }}</span>
            </div>
            <p>{{ highlight.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Travel } from '@/stores/travelList'
import {
  BulbOutlined,
  CompassOutlined,
  CrownOutlined,
  EnvironmentOutlined,
  FireOutlined,
  ScheduleOutlined,
  SmileOutlined,
  StarOutlined
} from '@ant-design/icons-vue'

interface Props {
  travel: Travel | null
}

const props = defineProps<Props>()
const { t } = useI18n()

const translate = (key: string, fallback: string, params?: Record<string, any>) => {
  const result = t(key, params)
  return result && `${result}` !== key ? result : fallback
}

const travelData = computed(() => props.travel?.data ?? {})

const itineraryData = computed(() => {
  const data: any = travelData.value
  if (!data) return null

  if (data.days && Array.isArray(data.days) && data.days.length > 0) {
    return data
  }

  if (data.plannerItinerary?.days && Array.isArray(data.plannerItinerary.days)) {
    return data.plannerItinerary
  }

  if (data.itineraryData?.days && Array.isArray(data.itineraryData.days)) {
    return data.itineraryData
  }

  return null
})

const heroTitle = computed(() => {
  const data: any = travelData.value
  return (
    data?.title ||
    itineraryData.value?.title ||
    props.travel?.title ||
    translate('travelDetail.experienceDay.defaultInspirationTitle', '灵感旅程')
  )
})

const extractDestination = (travelValue: Travel | null, data: any) => {
  const candidate =
    travelValue?.location ||
    data?.selectedLocation ||
    itineraryData.value?.destination ||
    data?.location ||
    data?.destination ||
    ''

  if (candidate && typeof candidate === 'string' && candidate.trim()) {
    const country =
      data?.currentCountry ||
      itineraryData.value?.country ||
      data?.locationCountries?.[candidate]

    if (country && !candidate.includes(country) && !candidate.includes('·') && !candidate.includes(',')) {
      return `${candidate} · ${country}`
    }
    return candidate
  }

  if (itineraryData.value?.days?.length) {
    const firstDay = itineraryData.value.days[0]
    const firstSlot = firstDay?.timeSlots?.[0]
    const slotLocation =
      firstSlot?.details?.address?.chinese ||
      firstSlot?.details?.address?.english ||
      firstSlot?.location

    if (slotLocation && typeof slotLocation === 'string') {
      const match = slotLocation.match(/([^·,，]+?)(?:·|,|，|$)/)
      if (match?.[1]) return match[1].trim()
    }
  }

  return ''
}

const heroDestination = computed(() => extractDestination(props.travel ?? null, travelData.value))

const heroCoverImage = computed(() => {
  const data: any = travelData.value
  if (props.travel?.coverImage) return props.travel.coverImage
  if (data?.coverImage) return data.coverImage

  const destination = heroDestination.value || ''
  if (destination) {
    return `https://source.unsplash.com/1600x450/?${encodeURIComponent(destination)}`
  }

  return 'https://source.unsplash.com/1600x450/?travel'
})

const heroCoreInsight = computed(() => {
  const data: any = travelData.value
  return (
    data?.coreInsight ||
    data?.narrative?.threshold ||
    data?.narrative?.stillness ||
    ''
  )
})

const heroSupportingText = computed(() => {
  const data: any = travelData.value
  return (
    data?.narrative?.mirror ||
    data?.cognitiveTriggers?.questions?.[0] ||
    ''
  )
})

const heroJourneyBackground = computed(() => {
  const data: any = travelData.value
  return (
    data?.journeyBackground ||
    data?.summary ||
    data?.aiMessage ||
    itineraryData.value?.summary ||
    ''
  )
})

const dayCount = computed(() => itineraryData.value?.days?.length || props.travel?.duration || 0)

const heroModeLabel = computed(() => translate('travelDetail.inspirationHero.modeLabel', 'AI 灵感行程'))

const journeyStatusLabel = computed(() => {
  if (travelData.value?.statusLabel) return travelData.value.statusLabel
  if (props.travel?.status === 'completed') {
    return translate('travelList.status.completed', '已完成')
  }
  if (itineraryData.value) return translate('travelDetail.inspirationHero.generatedLabel', 'AI 已生成')
  return ''
})

const travelPersonaName = computed(() => {
  const data: any = travelData.value
  return (
    data?.persona?.displayName ||
    data?.persona?.name ||
    data?.aiPersona ||
    data?.travelStyle ||
    ''
  )
})

const travelMood = computed(() => {
  const data: any = travelData.value
  if (Array.isArray(data?.moodKeywords) && data.moodKeywords.length) {
    return data.moodKeywords[0]
  }
  return data?.mood || data?.journeyMood || ''
})

const heroMetaItems = computed(() => {
  const items: Array<{ icon: any; label: string }> = []

  if (heroDestination.value) {
    items.push({
      icon: EnvironmentOutlined,
      label: heroDestination.value
    })
  }

  if (dayCount.value) {
    const durationText = t('travelDetail.inspirationHero.durationLabel', { days: dayCount.value })
    const normalizedDuration =
      durationText && !`${durationText}`.includes('travelDetail.inspirationHero.durationLabel')
        ? durationText
        : `${dayCount.value} ${translate('travelDetail.inspirationHero.dayUnit', '天')}`

    items.push({
      icon: ScheduleOutlined,
      label: normalizedDuration
    })
  }

  if (travelPersonaName.value) {
    items.push({
      icon: CrownOutlined,
      label: travelPersonaName.value
    })
  }

  if (travelMood.value) {
    items.push({
      icon: SmileOutlined,
      label: travelMood.value
    })
  }

  return items
})

const collectChips = () => {
  const chips = new Set<string>()
  const data: any = travelData.value

  if (Array.isArray(data?.themes)) {
    data.themes.forEach((item: string) => {
      if (item && typeof item === 'string') chips.add(item)
    })
  }

  if (Array.isArray(data?.highlights)) {
    data.highlights.forEach((item: string) => {
      if (item && typeof item === 'string') chips.add(item)
    })
  }

  if (Array.isArray(data?.moodKeywords)) {
    data.moodKeywords.forEach((item: string) => {
      if (item && typeof item === 'string') chips.add(item)
    })
  }

  if (itineraryData.value?.days?.length) {
    itineraryData.value.days.slice(0, 3).forEach((day: any) => {
      if (day?.theme && typeof day.theme === 'string') chips.add(day.theme)
    })
  }

  return Array.from(chips).filter(Boolean).slice(0, 4)
}

const heroChips = computed(() => collectChips())

const sideHighlights = computed(() => {
  const data: any = travelData.value
  const highlights: Array<{ title: string; description: string; icon: any }> = []

  if (data?.aiHighlights && Array.isArray(data.aiHighlights) && data.aiHighlights.length) {
    data.aiHighlights.slice(0, 2).forEach((text: string) => {
      if (text && typeof text === 'string') {
        highlights.push({
          title: translate('travelDetail.inspirationHero.highlightLabel', '亮点'),
          description: text,
          icon: StarOutlined
        })
      }
    })
  } else if (itineraryData.value?.days?.length) {
    const firstDay = itineraryData.value.days[0]
    if (firstDay?.timeSlots?.length) {
      const morning = firstDay.timeSlots[0]
      if (morning?.activity) {
      highlights.push({
        title: translate('travelDetail.inspirationHero.firstExperience', '开场体验'),
        description: morning.activity,
        icon: FireOutlined
      })
      }
    }

    if (firstDay?.mood) {
      highlights.push({
        title: translate('travelDetail.inspirationHero.dayMood', '当日情绪'),
        description: firstDay.mood,
        icon: SmileOutlined
      })
    }
  }

  if (data?.optimizationTips && typeof data.optimizationTips === 'string') {
    highlights.push({
      title: translate('travelDetail.inspirationHero.aiTip', 'AI 提示'),
      description: data.optimizationTips,
      icon: BulbOutlined
    })
  }

  if (!highlights.length && heroSupportingText.value) {
    highlights.push({
      title: translate('travelDetail.inspirationHero.storyHook', '故事线索'),
      description: heroSupportingText.value,
      icon: CompassOutlined
    })
  }

  return highlights.slice(0, 2)
})
</script>

<style scoped>
.hero-section {
  margin-bottom: 24px;
}

.hero-cover {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 380px;
  background: #111827;
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.85);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 64, 175, 0.75));
  padding: 32px;
  color: #fff;
  gap: 24px;
}

.hero-content {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-mode-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 13px;
  letter-spacing: 0.02em;
}

.tag-icon {
  font-size: 16px;
}

.status-tag {
  border-radius: 999px;
  background: rgba(255, 215, 0, 0.18);
  border: none;
  color: #ffe58f;
  font-weight: 500;
}

.hero-title {
  margin: 0;
  font-size: 36px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-top: 4px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
}

.meta-icon {
  font-size: 16px;
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.hero-insight {
  display: flex;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
}

.insight-icon {
  font-size: 20px;
  color: #ffe58f;
  margin-top: 2px;
}

.hero-supporting-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
}

.hero-background {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
}

.hero-side {
  display: grid;
  gap: 16px;
  align-self: flex-end;
  min-width: 260px;
}

.side-card {
  background: rgba(14, 22, 40, 0.72);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.side-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #f8fafc;
}

.side-card p {
  margin: 0;
  color: rgba(226, 232, 240, 0.85);
  font-size: 14px;
  line-height: 1.6;
}

.side-icon {
  font-size: 18px;
  color: #93c5fd;
}

@media (max-width: 991px) {
  .hero-overlay {
    padding: 24px;
    height: auto;
  }

  .hero-cover {
    height: auto;
    min-height: 420px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-side {
    display: none;
  }
}

@media (max-width: 576px) {
  .hero-overlay {
    padding: 20px;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-meta {
    gap: 10px 16px;
  }
}
</style>


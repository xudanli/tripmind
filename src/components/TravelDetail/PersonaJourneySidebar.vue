<template>
  <div v-if="personaProfile || journeyDesign" class="persona-journey-sidebar">
    <!-- 人格画像 -->
    <div v-if="personaProfile" class="persona-profile-card">
      <h4 class="subsection-title">{{ t('travelDetail.experienceDay.personaProfile') || '人格画像' }}</h4>
      <div class="persona-details">
        <div v-if="personaProfile.type" class="persona-item">
          <span class="persona-label">{{ t('travelDetail.experienceDay.personaType') || '类型' }}：</span>
          {{ personaProfile.type }}
        </div>
        <div v-if="personaProfile.motivation" class="persona-item">
          <span class="persona-label">{{ t('travelDetail.experienceDay.motivation') || '动机' }}：</span>
          {{ personaProfile.motivation }}
          <span v-if="personaProfile.motivation_detail">（{{ personaProfile.motivation_detail }}）</span>
        </div>
        <div v-if="personaProfile.dominantEmotion" class="persona-item">
          <span class="persona-label">{{ t('travelDetail.experienceDay.dominantEmotion') || '主导情绪' }}：</span>
          {{ personaProfile.dominantEmotion }}
          <span v-if="personaProfile.desiredEmotion"> → {{ personaProfile.desiredEmotion }}</span>
        </div>
        <div v-if="personaProfile.travelRhythm" class="persona-item">
          <span class="persona-label">{{ t('travelDetail.experienceDay.travelRhythm') || '旅行节奏' }}：</span>
          {{ personaProfile.travelRhythm }}
        </div>
        <div v-if="personaProfile.socialPreference" class="persona-item">
          <span class="persona-label">{{ t('travelDetail.experienceDay.socialPreference') || '社交偏好' }}：</span>
          {{ personaProfile.socialPreference }}
        </div>
        <div v-if="personaProfile.cognitiveNeed" class="persona-item">
          <span class="persona-label">{{ t('travelDetail.experienceDay.cognitiveNeed') || '认知需求' }}：</span>
          {{ personaProfile.cognitiveNeed }}
        </div>
        <div v-if="personaProfile.foodPreference" class="persona-item">
          <span class="persona-label">{{ t('travelDetail.experienceDay.foodPreference') || '美食偏好' }}：</span>
          {{ personaProfile.foodPreference }}
        </div>
      </div>
    </div>
    
    <!-- 旅程设计 -->
    <div v-if="journeyDesign" class="journey-design-card">
      <h4 class="subsection-title">{{ t('travelDetail.experienceDay.journeyDesign') || '旅程设计' }}</h4>
      <div class="journey-details">
        <div v-if="journeyDesign.coreInsight" class="journey-item">
          <span class="journey-label">{{ t('travelDetail.experienceDay.coreInsight') || '核心洞察' }}：</span>
          <p class="journey-text">{{ journeyDesign.coreInsight }}</p>
        </div>
        <div v-if="journeyDesign.psychologicalFlow && journeyDesign.psychologicalFlow.length" class="journey-item">
          <span class="journey-label">{{ t('travelDetail.experienceDay.psychologicalFlow') || '心理流程' }}：</span>
          <div class="journey-flow">
            <span v-for="(flow, idx) in journeyDesign.psychologicalFlow" :key="idx" class="flow-item">
              {{ flow }}<span v-if="idx < journeyDesign.psychologicalFlow.length - 1"> → </span>
            </span>
          </div>
        </div>
        <div v-if="journeyDesign.symbolicElements && journeyDesign.symbolicElements.length" class="journey-item">
          <span class="journey-label">{{ t('travelDetail.experienceDay.symbolicElements') || '象征元素' }}：</span>
          <div class="journey-symbols">
            <a-tag v-for="(element, idx) in journeyDesign.symbolicElements" :key="idx" color="purple">
              {{ element }}
            </a-tag>
          </div>
        </div>
        <div v-if="journeyDesign.recommendedRhythm" class="journey-item">
          <span class="journey-label">{{ t('travelDetail.experienceDay.recommendedRhythm') || '推荐节奏' }}：</span>
          {{ journeyDesign.recommendedRhythm }}
        </div>
        <div v-if="journeyDesign.socialMode" class="journey-item">
          <span class="journey-label">{{ t('travelDetail.experienceDay.socialMode') || '社交模式' }}：</span>
          {{ journeyDesign.socialMode }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTravelListStore } from '@/stores/travelList'

const { t } = useI18n()
const route = useRoute()
const travelListStore = useTravelListStore()

const travel = computed(() => travelListStore.getTravel(route.params.id as string))

// 人格画像
const personaProfile = computed(() => {
  return travel.value?.data?.personaProfile || null
})

// 旅程设计
const journeyDesign = computed(() => {
  return travel.value?.data?.journeyDesign || null
})
</script>

<style scoped>
.persona-journey-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.persona-profile-card,
.journey-design-card {
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #722ed1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subsection-title::after {
  content: '';
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #722ed1;
  margin-left: auto;
  margin-right: 0.5rem;
}

.persona-details,
.journey-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.persona-item,
.journey-item {
  color: #555;
  line-height: 1.6;
  font-size: 0.9rem;
}

.persona-label,
.journey-label {
  font-weight: 600;
  color: #666;
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.journey-text {
  margin-top: 0.5rem;
  color: #555;
  line-height: 1.6;
  font-size: 0.9rem;
}

.journey-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.flow-item {
  color: #555;
  font-size: 0.85rem;
}

.journey-symbols {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* 侧边栏样式优化 */
@media (max-width: 991px) {
  .persona-journey-sidebar {
    margin-top: 2rem;
  }
}
</style>


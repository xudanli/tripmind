<template>
  <div>
    <h3>{{ t('planner.completeTitle') }}</h3>
    <a-alert v-if="error" :message="error" type="error" show-icon closable @close="travelStore.setError(null)" style="margin-bottom:1rem" />
    <a-alert v-else-if="loading" message="AI 正在为你生成专属行程" description="基于你的需求，我们的 AI 旅行策划师正在为你制定详细的行程安排..." type="info" show-icon style="margin-bottom:1rem" />
    <a-alert v-else :message="t('planner.ready')" :description="t('planner.readyDescription')" type="success" show-icon style="margin-bottom:2rem" />

    <a-card class="summary-card">
      <h4>{{ t('planner.summaryTitle') }}</h4>
      <a-space direction="vertical" style="width:100%">
        <div><strong>目的地：</strong> {{ formData.destination }}</div>
        <div><strong>时长：</strong> {{ formData.duration }} 天</div>
        <div><strong>预算：</strong> {{ formData.budget }}</div>
        <div><strong>偏好：</strong>
          <a-tag v-for="pref in formData.preferences" :key="pref" color="blue">{{ pref }}</a-tag>
        </div>
        <div><strong>节奏：</strong> {{ formData.travelStyle }}</div>
        <div v-if="formData.customRequirements"><strong>自定义要求：</strong> {{ formData.customRequirements }}</div>
      </a-space>
    </a-card>

    <div style="margin-top:1rem; text-align:right">
      <a-button type="primary" size="large" :loading="loading" @click="handleSubmit">{{ loading ? t('common.loading') : t('planner.submit') }}</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'

const { t } = useI18n()
const router = useRouter()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

const formData = computed(()=> travelStore.plannerData)
const loading = computed(()=> travelStore.loading)
const error = computed(()=> travelStore.error)

const handleSubmit = async () => {
  try {
    await travelStore.generateItinerary('planner')
    const itineraryData = travelStore.itineraryData
    const plannerItinerary = travelStore.plannerItinerary
    if (!itineraryData && !plannerItinerary) throw new Error('行程生成失败')
    const newTravel = travelListStore.createTravel({
      title: `${formData.value.destination}之旅`,
      location: formData.value.destination,
      description: `精心安排的${formData.value.duration}天${formData.value.destination}之旅`,
      mode: 'planner', status: 'active', duration: formData.value.duration, participants: 1, budget: 0, data: { itineraryData, plannerItinerary }
    })
    message.success('行程生成成功！')
    router.push(`/travel/${newTravel.id}`)
  } catch (err) {
    console.error(err)
    message.error('生成行程失败，请重试')
  }
}
</script>


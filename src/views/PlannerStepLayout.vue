<template>
  <div class="container">
    <div class="header">
      <a-button @click="router.back()" class="back-button">
        <template #icon><arrow-left-outlined /></template>
        {{ t('common.back') }}
      </a-button>
      <div class="header-title">
        <rocket-outlined class="header-icon" />
        <h2 class="title">{{ t('planner.title') }}</h2>
      </div>
    </div>

    <div class="progress-section">
      <a-progress :percent="percent" :show-info="false" stroke-color="#667eea" />
      <div class="step-indicators">
        <div v-for="(s, i) in steps" :key="s.name" :class="['step-indicator', { active: i <= currentIndex }]">
          <div class="step-icon">{{ s.icon }}</div>
          <span class="step-text">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <a-card class="form-card">
        <router-view />
        <div class="action-buttons">
          <a-button v-if="currentIndex > 0" size="large" @click="goPrev">{{ t('common.prev') }}</a-button>
          <a-button v-if="currentIndex < steps.length - 1" type="primary" size="large" class="next-button" @click="goNext">{{ t('common.next') }}</a-button>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const steps = computed(() => [
  { name: 'planner-destination', path: '/planner/destination', label: t('planner.step1.label'), icon: '✈️' },
  { name: 'planner-duration', path: '/planner/duration', label: t('planner.step2.label'), icon: '📅' },
  { name: 'planner-budget', path: '/planner/budget', label: t('planner.step4.label'), icon: '💰' },
  { name: 'planner-preferences', path: '/planner/preferences', label: t('planner.step5.label'), icon: '🎯' },
  { name: 'planner-confirm', path: '/planner/confirm', label: t('common.confirm'), icon: '🎉' }
])

const currentIndex = computed(() => steps.value.findIndex(s => route.name === s.name))
const percent = computed(() => ((currentIndex.value) / (steps.value.length - 1)) * 100)

const goNext = () => {
  const next = steps.value[currentIndex.value + 1]
  if (next) router.push(next.path)
}
const goPrev = () => {
  const prev = steps.value[currentIndex.value - 1]
  if (prev) router.push(prev.path)
}
</script>

<style scoped>
.container { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; }
.header { display: flex; align-items: center; margin-bottom: 2rem; max-width: 1200px; margin-left: auto; margin-right: auto; }
.back-button { background: rgba(255,255,255,.2) !important; border: 1px solid rgba(255,255,255,.3) !important; color: white !important; margin-right: 1rem; }
.header-title { display: flex; align-items: center; flex: 1; }
.header-icon { font-size: 2rem; color: white; margin-right: 1rem; }
.title { color: white !important; margin: 0 !important; text-shadow: 0 2px 4px rgba(0,0,0,.3); }
.progress-section { max-width: 1200px; margin: 0 auto 1rem; background: rgba(255,255,255,.1); padding: 1rem; border-radius: 20px; backdrop-filter: blur(10px); }
.step-indicators { display: flex; justify-content: space-between; margin-top: .5rem; padding: 0 1rem; }
.step-indicator { display: flex; flex-direction: column; align-items: center; opacity: .5; transition: all .3s ease; }
.step-indicator.active { opacity: 1; }
.step-icon { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; margin-bottom: .3rem; font-size: 1rem; color: white; }
.step-text { color: white !important; font-size: .8rem; text-align: center; }
.main-content { max-width: 800px; margin: 0 auto; }
.form-card { border-radius: 20px !important; border: none !important; box-shadow: 0 20px 40px rgba(0,0,0,.2) !important; background: rgba(255,255,255,.95) !important; backdrop-filter: blur(10px); }
.action-buttons { display: flex; justify-content: space-between; padding: .5rem; border-top: 1px solid #f0f0f0; }
.next-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; border: none !important; border-radius: 12px !important; height: 48px !important; font-size: 1rem !important; font-weight: 600 !important; box-shadow: 0 4px 12px rgba(102,126,234,.3) !important; }
@media (max-width: 768px) { .container { padding: 1rem; } }
</style>


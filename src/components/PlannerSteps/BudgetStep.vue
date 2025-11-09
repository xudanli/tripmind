<template>
  <div>
    <h3>{{ t('planner.step4.title') }}</h3>
    <p>{{ t('planner.step4.description') }}</p>
    <a-form-item :rules="[{ required: true, message: t('planner.step4.rules') }]">
      <a-select :value="formData.budget" @update:value="(v)=>travelStore.setPlannerData({ budget: v as string })" size="large" :placeholder="t('planner.step4.placeholder')">
        <a-select-option v-for="o in budgetOptions" :key="o.value" :value="o.value">
          <div>
            <div>{{ o.label }}</div>
            <span class="text-secondary" style="font-size: 12px">{{ o.description }}</span>
          </div>
        </a-select-option>
      </a-select>
    </a-form-item>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'

const { t } = useI18n()
const travelStore = useTravelStore()
const formData = computed(()=> travelStore.plannerData)
const budgetOptions = computed(() => ([
  { value: 'economy', label: t('planner.budgetRanges.economy'), description: t('planner.budgetRanges.economyDesc') },
  { value: 'comfort', label: t('planner.budgetRanges.comfort'), description: t('planner.budgetRanges.comfortDesc') },
  { value: 'luxury', label: t('planner.budgetRanges.luxury'), description: t('planner.budgetRanges.luxuryDesc') }
]))
</script>


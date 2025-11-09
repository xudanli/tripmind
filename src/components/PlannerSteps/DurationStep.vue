<template>
  <div>
    <h3>{{ t('planner.step2.title') }}</h3>
    <p>{{ t('planner.step2.description') }}</p>
    <a-form-item :rules="[{ required: true, message: t('planner.step2.selectPlaceholder') }]">
      <a-select :value="formData.duration" @update:value="(v)=>travelStore.setPlannerData({ duration: v as number })" size="large" :placeholder="t('planner.step2.selectPlaceholder')">
        <a-select-option v-for="d in durationOptions" :key="d" :value="d">{{ d }} {{ t('planner.days') }}</a-select-option>
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
const durationOptions = [1,2,3,4,5,6,7,10,14,21,30]
</script>


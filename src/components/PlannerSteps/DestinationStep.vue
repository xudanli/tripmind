<template>
  <div>
    <h3>{{ t('planner.step1.title') }}</h3>
    <p>{{ t('planner.step1.description') }}</p>
    <a-form-item :rules="[{ required: true, message: t('planner.step1.rules') }]">
      <a-input :value="formData.destination" @update:value="(v)=>travelStore.setPlannerData({ destination: v })" size="large" :placeholder="t('planner.step1.placeholder')">
        <template #prefix><environment-outlined /></template>
      </a-input>
    </a-form-item>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'
import { EnvironmentOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
const travelStore = useTravelStore()
const formData = computed(()=> travelStore.plannerData)
</script>


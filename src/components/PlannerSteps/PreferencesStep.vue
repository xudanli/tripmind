<template>
  <div>
    <h3>{{ t('planner.step5.title') }}</h3>
    <p>{{ t('planner.step5.description') }}</p>
    <a-form-item :rules="[{ required: true, message: t('planner.step5.rules') }]">
      <a-select 
        :value="formData.preferences?.interests || []" 
        @update:value="(v)=>travelStore.setPlannerData({ 
          preferences: { 
            ...formData.preferences, 
            interests: v as string[] 
          } 
        })" 
        mode="multiple" 
        size="large" 
        :placeholder="t('planner.step5.placeholder')" 
        style="width:100%"
      >
        <a-select-option v-for="o in preferenceOptions" :key="o.value" :value="o.value">
          <a-space><span>{{ o.icon }}</span><span>{{ o.label }}</span></a-space>
        </a-select-option>
      </a-select>
    </a-form-item>
    <a-divider />
    <h4>{{ t('planner.step6.title') }}</h4>
    <a-form-item :rules="[{ required: true, message: t('planner.step6.rules') }]">
      <a-select :value="formData.travelStyle" @update:value="(v)=>travelStore.setPlannerData({ travelStyle: v as string })" size="large" :placeholder="t('planner.step6.placeholder')">
        <a-select-option v-for="o in travelStyleOptions" :key="o.value" :value="o.value">
          <div>
            <div>{{ o.label }}</div>
            <span class="text-secondary" style="font-size:12px">{{ o.description }}</span>
          </div>
        </a-select-option>
      </a-select>
    </a-form-item>
  </div>
  
  <a-form-item label="自定义要求">
    <a-textarea
      :value="formData.customRequirements"
      @update:value="(v)=>travelStore.setPlannerData({ customRequirements: v as string })"
      :rows="4"
      placeholder="请描述您的特殊要求或期望，例如：想要看日出、避开人多的地方、体验当地文化等…"
      show-count
      :maxlength="600"
    />
  </a-form-item>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelStore } from '@/stores/travel'

const { t } = useI18n()
const travelStore = useTravelStore()
const formData = computed(()=> travelStore.plannerData)
const preferenceOptions = computed(() => ([
  { value: 'culture', label: t('planner.preferences.culture'), icon: '🏛️' },
  { value: 'food', label: t('planner.preferences.food'), icon: '🍜' },
  { value: 'nature', label: t('planner.preferences.nature'), icon: '🌲' },
  { value: 'shopping', label: t('planner.preferences.shopping'), icon: '🛍️' },
  { value: 'adventure', label: t('planner.preferences.adventure'), icon: '🏔️' },
  { value: 'relaxation', label: t('planner.preferences.leisure'), icon: '🏖️' }
]))
const travelStyleOptions = computed(() => ([
  { value: 'fast', label: t('planner.travelRythm.fast'), description: t('planner.travelRythm.fastDesc') },
  { value: 'moderate', label: t('planner.travelRythm.moderate'), description: t('planner.travelRythm.moderateDesc') },
  { value: 'slow', label: t('planner.travelRythm.slow'), description: t('planner.travelRythm.slowDesc') }
]))
</script>


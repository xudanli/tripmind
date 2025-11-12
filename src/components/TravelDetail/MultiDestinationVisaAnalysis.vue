<template>
  <a-card 
    v-if="analysis && shouldShow" 
    class="multi-destination-visa-analysis" 
    :bordered="false"
  >
    <template #title>
      <span style="display: flex; align-items: center; gap: 8px;">
        <span>🌍</span>
        <span>{{ analysis.allCountries.length > 1 ? '多目的地签证分析' : '签证分析' }}</span>
      </span>
    </template>
    
    <div class="analysis-content">
      <!-- 综合建议 -->
      <div class="summary-box">
        <p class="summary-text">{{ analysis.summary }}</p>
      </div>
      
      <!-- 需要申请的签证 -->
      <div v-if="analysis.requiredVisas.length > 0" class="visas-section">
        <p class="section-title">需要申请的签证：</p>
        <div 
          v-for="(visa, index) in analysis.requiredVisas" 
          :key="index" 
          class="visa-item"
        >
          <p class="visa-name">{{ visa.name }}</p>
          <p class="visa-description">{{ visa.description }}</p>
          <p class="visa-countries">涉及国家：{{ visa.countries.join('、') }}</p>
        </div>
      </div>
      
      <!-- 目的地分组 -->
      <div 
        v-if="analysis.groupedByUnion && Object.keys(analysis.groupedByUnion).length > 0" 
        class="groups-section"
      >
        <p class="section-title">目的地分组：</p>
        <div 
          v-for="(group, unionKey) in analysis.groupedByUnion" 
          :key="unionKey" 
          class="group-item"
        >
          <p class="group-name">{{ group.unionName }}</p>
          <p class="group-description">{{ group.description }}</p>
          <p class="group-countries">国家：{{ group.countries.join('、') }}</p>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MultiDestinationVisaResult } from '@/config/visa'

interface Props {
  analysis: MultiDestinationVisaResult | null
  // 是否显示（即使只有1个国家也显示）
  showForSingleCountry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  analysis: null,
  showForSingleCountry: true
})

const shouldShow = computed(() => {
  if (!props.analysis) return false
  // 如果允许显示单个国家，或者有多个国家，则显示
  return props.showForSingleCountry || props.analysis.allCountries.length > 1
})
</script>

<style scoped>
.multi-destination-visa-analysis {
  margin-bottom: 24px;
}

.analysis-content {
  font-size: 13px;
  line-height: 1.8;
}

.summary-box {
  margin-bottom: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.summary-text {
  margin: 0;
  font-weight: 600;
  color: #1890ff;
  line-height: 1.6;
}

.visas-section,
.groups-section {
  margin-top: 16px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.visa-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #fff7e6;
  border-left: 3px solid #faad14;
  border-radius: 6px;
}

.visa-name {
  margin: 0 0 6px 0;
  font-weight: 600;
  color: #333;
}

.visa-description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.visa-countries {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: #999;
}

.group-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #f6ffed;
  border-left: 3px solid #52c41a;
  border-radius: 6px;
}

.group-name {
  margin: 0 0 6px 0;
  font-weight: 600;
  color: #333;
}

.group-description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.group-countries {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: #999;
}
</style>


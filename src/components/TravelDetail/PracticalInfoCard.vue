<template>
  <a-card v-if="practicalInfo" class="practical-info-card" title="📋 实用信息">
    <div class="practical-info-content">
      <div v-if="practicalInfo.weather" class="info-item">
        <div class="info-label">
          <span class="info-icon">🌤️</span>
          <strong>天气</strong>
        </div>
        <div class="info-text">{{ practicalInfo.weather }}</div>
      </div>

      <div v-if="practicalInfo.safety" class="info-item">
        <div class="info-label">
          <span class="info-icon">🛡️</span>
          <strong>安全提示</strong>
        </div>
        <div class="info-text">{{ practicalInfo.safety }}</div>
      </div>


      <div v-if="practicalInfo.culturalTaboos" class="info-item">
        <div class="info-label">
          <span class="info-icon">⚠️</span>
          <strong>文化禁忌</strong>
        </div>
        <div class="info-text">{{ practicalInfo.culturalTaboos }}</div>
      </div>

      <div v-if="practicalInfo.packingList" class="info-item">
        <div class="info-label">
          <span class="info-icon">🎒</span>
          <strong>打包清单</strong>
        </div>
        <div class="info-text">{{ practicalInfo.packingList }}</div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
interface PracticalInfo {
  weather?: string
  safety?: string
  culturalTaboos?: string
  packingList?: string
}

defineProps<{
  practicalInfo?: PracticalInfo
}>()
</script>

<style scoped>
.practical-info-card {
  margin-bottom: 0;
}

.practical-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1d1d1f;
}

.info-icon {
  font-size: 16px;
}

.info-text {
  font-size: 13px;
  line-height: 1.6;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>


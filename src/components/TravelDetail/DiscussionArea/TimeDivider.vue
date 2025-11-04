<template>
  <div class="time-divider" :aria-label="`时间: ${time}`">
    <div class="time-divider-line"></div>
    <span class="time-divider-text">{{ time }}</span>
    <div class="time-divider-line"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  time: string | number
}

defineProps<Props>()
</script>

<style scoped>
.time-divider {
  --divider: #EDEEF0;
  --ink-4: #999;
}
.time-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  padding: 0 20px;
}

.time-divider-line {
  flex: 1;
  height: 1px;
  background: var(--divider);
}

.time-divider-text {
  font-size: 12px;
  color: var(--ink-4);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>

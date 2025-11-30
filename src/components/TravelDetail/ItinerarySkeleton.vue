<template>
  <div class="itinerary-skeleton">
    <!-- 头部骨架 -->
    <div class="skeleton-header">
      <a-skeleton :paragraph="{ rows: 0 }" :title="{ width: '60%' }" active />
      <a-skeleton :paragraph="{ rows: 1, width: ['40%'] }" :title="false" active />
    </div>

    <!-- 天数骨架 -->
    <div v-for="day in days" :key="day" class="skeleton-day">
      <div class="skeleton-day-header">
        <a-skeleton :paragraph="{ rows: 0 }" :title="{ width: '100px' }" active />
        <a-skeleton :paragraph="{ rows: 0 }" :title="{ width: '120px' }" active />
      </div>
      
      <!-- 活动卡片骨架 -->
      <div v-for="slot in slots" :key="slot" class="skeleton-slot">
        <div class="skeleton-slot-image">
          <a-skeleton :paragraph="{ rows: 0 }" :title="false" :avatar="{ shape: 'square', size: 'large' }" active />
        </div>
        <div class="skeleton-slot-content">
          <a-skeleton :paragraph="{ rows: 2 }" :title="{ width: '70%' }" active />
          <a-skeleton :paragraph="{ rows: 1, width: ['50%'] }" :title="false" active />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  days?: number
  slotsPerDay?: number
}

withDefaults(defineProps<Props>(), {
  days: 3,
  slotsPerDay: 3
})

// 生成数组用于 v-for
const days = Array.from({ length: 3 }, (_, i) => i + 1)
const slots = Array.from({ length: 3 }, (_, i) => i + 1)
</script>

<style scoped>
.itinerary-skeleton {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.skeleton-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-day {
  margin-bottom: 32px;
}

.skeleton-day-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: center;
}

.skeleton-slot {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.skeleton-slot-image {
  width: 200px;
  height: 150px;
  flex-shrink: 0;
}

.skeleton-slot-content {
  flex: 1;
}
</style>


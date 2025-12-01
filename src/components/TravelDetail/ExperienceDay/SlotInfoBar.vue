/**
 * SlotInfoBar - 信息条组件
 * 显示时间、类型、时长、操作按钮
 */

<template>
  <div class="time-slot__info-bar">
    <div class="time-slot__info-bar-content">
      <div class="time-slot__info-bar-item" v-if="slot.time">
        <span class="time-slot__info-bar-icon">⏰</span>
        <span class="time-slot__info-bar-text">{{ slot.time }}</span>
      </div>
      <div class="time-slot__info-bar-divider" v-if="slot.time && slot.type">|</div>
      <div class="time-slot__info-bar-item" v-if="slot.type">
        <span class="time-slot__info-bar-icon">{{ typeIcon }}</span>
        <span class="time-slot__info-bar-text">{{ t('travelDetail.experienceDay.type') }}：{{ typeText }}</span>
      </div>
      <div class="time-slot__info-bar-divider" v-if="slot.type && slot.duration">|</div>
      <div class="time-slot__info-bar-item" v-if="slot.duration">
        <span class="time-slot__info-bar-icon">⏳</span>
        <span class="time-slot__info-bar-text">{{ t('travelDetail.experienceDay.duration') }}：{{ durationText }}</span>
      </div>
    </div>
    
    <!-- 操作按钮组 -->
    <div class="time-slot__info-bar-actions">
      <a-button
        type="text"
        size="small"
        class="time-slot__action-button"
        @click.stop="$emit('search')"
        title="搜索附近"
      >
        🔍
      </a-button>
      <a-button
        type="text"
        size="small"
        class="time-slot__action-button"
        @click.stop="$emit('edit')"
        title="编辑"
      >
        ✏️
      </a-button>
      <a-button
        type="text"
        size="small"
        danger
        class="time-slot__action-button"
        @click.stop="$emit('remove')"
        title="删除"
      >
        🗑️
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimeSlot } from './types'
import { useSlotFormatting } from '@/composables/useSlotFormatting'

interface Props {
  slot: TimeSlot
  currency?: any
}

const props = defineProps<Props>()

defineEmits<{
  search: []
  edit: []
  remove: []
}>()

const { t } = useI18n()
const { formatType, getTypeIcon, formatDuration } = useSlotFormatting(props.slot, props.currency)

const typeText = computed(() => formatType(props.slot.type))
const typeIcon = computed(() => getTypeIcon(props.slot.type || ''))
const durationText = computed(() => formatDuration(props.slot.duration))
</script>

<style scoped>
.time-slot__info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(148, 163, 184, 0.08);
  border-radius: 12px;
  margin-bottom: 12px;
  gap: 12px;
}

.time-slot__info-bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.time-slot__info-bar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
}

.time-slot__info-bar-icon {
  font-size: 14px;
}

.time-slot__info-bar-text {
  font-weight: 500;
}

.time-slot__info-bar-divider {
  color: #cbd5e1;
  font-size: 12px;
}

.time-slot__info-bar-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.time-slot__action-button {
  padding: 4px 8px;
  min-width: auto;
  height: auto;
}

@media (max-width: 768px) {
  .time-slot__info-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .time-slot__info-bar-content {
    width: 100%;
  }

  .time-slot__info-bar-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .time-slot__info-bar-divider {
    display: none;
  }
}
</style>


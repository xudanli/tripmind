/**
 * 活动编辑模态框组件
 * 从 ExperienceDay.vue 中提取的编辑表单
 */

<template>
  <a-modal
    :open="open"
    @update:open="$emit('update:open', $event)"
    :title="isNew ? (t('travelDetail.experienceDay.addActivity') || '添加活动') : (t('travelDetail.experienceDay.editActivity') || '编辑活动')"
    width="800px"
    :ok-text="t('travelDetail.experienceDay.save') || '保存'"
    :cancel-text="t('travelDetail.experienceDay.cancel') || '取消'"
    @ok="$emit('save')"
    @cancel="$emit('update:open', false)"
    :body-style="{ maxHeight: '70vh', overflowY: 'auto' }"
  >
    <div class="edit-modal-content">
      <a-collapse v-model:activeKey="activeKeys" :bordered="false">
        <!-- 基础信息 -->
        <a-collapse-panel key="basic" :header="t('travelDetail.experienceDay.basicInfo') || '基础信息'">
          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.time') || '时间' }}</label>
            <a-input
              v-model:value="localData.time"
              placeholder="HH:mm"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.activityName') || '活动名称' }}</label>
            <a-input
              v-model:value="localData.title"
              :placeholder="t('travelDetail.experienceDay.activityName') || '活动名称'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.chineseName') || '中文名称' }}</label>
            <a-input
              v-model:value="localData.nameChinese"
              placeholder="中文名称"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.englishName') || '英文名称' }}</label>
            <a-input
              v-model:value="localData.nameEnglish"
              placeholder="English Name"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.activityType') || '活动类型' }}</label>
            <a-select
              v-model:value="localData.type"
              :placeholder="t('travelDetail.experienceDay.activityType') || '活动类型'"
              style="width: 100%"
            >
              <a-select-option value="attraction">{{ t('travelDetail.experienceDay.attraction') || '景点' }}</a-select-option>
              <a-select-option value="restaurant">{{ t('travelDetail.experienceDay.restaurant') || '餐饮' }}</a-select-option>
              <a-select-option value="accommodation">{{ t('travelDetail.experienceDay.accommodation') || '住宿' }}</a-select-option>
              <a-select-option value="shopping">{{ t('travelDetail.experienceDay.shopping') || '购物' }}</a-select-option>
              <a-select-option value="transport">{{ t('travelDetail.experienceDay.transport') || '交通' }}</a-select-option>
            </a-select>
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.category') || '类别' }}</label>
            <a-input
              v-model:value="localData.category"
              placeholder="类别"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.duration') || '时长（分钟）' }}</label>
            <a-input-number
              v-model:value="localData.duration"
              :min="0"
              :placeholder="t('travelDetail.experienceDay.duration') || '时长'"
              style="width: 100%"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.cost') || '费用' }}</label>
            <a-input-number
              v-model:value="localData.cost"
              :min="0"
              :precision="2"
              :placeholder="t('travelDetail.experienceDay.cost') || '费用'"
              style="width: 100%"
            >
              <template #addonBefore>{{ currencySymbol }}</template>
            </a-input-number>
            <div class="form-item-hint" style="margin-top: 4px; font-size: 12px; color: #999;">
              {{ currencyHint }}
            </div>
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.location') || '位置' }}</label>
            <a-input
              v-model:value="localData.location"
              :placeholder="t('travelDetail.experienceDay.location') || '位置'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.rating') || '评分' }}</label>
            <a-input-number
              v-model:value="localData.rating"
              :min="0"
              :max="5"
              :step="0.1"
              :precision="1"
              placeholder="评分 (0-5)"
              style="width: 100%"
            />
          </div>
        </a-collapse-panel>

        <!-- 详细信息 -->
        <a-collapse-panel key="details" :header="t('travelDetail.experienceDay.details') || '详细信息'">
          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.transportation') || '交通信息' }}</label>
            <a-textarea
              v-model:value="localData.transportation"
              :rows="3"
              :placeholder="t('travelDetail.experienceDay.transportation') || '交通信息'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.openingHours') || '开放时间' }}</label>
            <a-textarea
              v-model:value="localData.openingHours"
              :rows="3"
              :placeholder="t('travelDetail.experienceDay.openingHours') || '开放时间'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.pricingDetail') || '票价详情' }}</label>
            <a-textarea
              v-model:value="localData.pricingDetail"
              :rows="3"
              :placeholder="t('travelDetail.experienceDay.pricingDetail') || '票价详情'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.bookingInfo') || '预订信息' }}</label>
            <a-textarea
              v-model:value="localData.bookingInfo"
              :rows="3"
              :placeholder="t('travelDetail.experienceDay.bookingInfo') || '预订信息'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.visitTips') || '游览建议' }}</label>
            <a-textarea
              v-model:value="localData.visitTips"
              :rows="3"
              :placeholder="t('travelDetail.experienceDay.visitTips') || '游览建议'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.accessibility') || '无障碍设施' }}</label>
            <a-textarea
              v-model:value="localData.accessibility"
              :rows="3"
              :placeholder="t('travelDetail.experienceDay.accessibility') || '无障碍设施'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.outfitSuggestions') || '穿搭建议' }}</label>
            <a-textarea
              v-model:value="localData.outfitSuggestions"
              :rows="3"
              :placeholder="t('travelDetail.experienceDay.outfitSuggestions') || '穿搭建议'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.culturalTips') || '当地文化提示' }}</label>
            <a-textarea
              v-model:value="localData.culturalTips"
              :rows="3"
              :placeholder="t('travelDetail.experienceDay.culturalTips') || '当地文化提示'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.scenicIntro') || '景点介绍' }}</label>
            <a-textarea
              v-model:value="localData.scenicIntro"
              :rows="4"
              :placeholder="t('travelDetail.experienceDay.scenicIntro') || '景点介绍'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.highlights') || '亮点' }}</label>
            <a-textarea
              v-model:value="localData.highlights"
              :rows="4"
              :placeholder="t('travelDetail.experienceDay.highlights') || '亮点（每行一个）'"
            />
          </div>

          <div class="edit-form-item">
            <label class="edit-form-label">{{ t('travelDetail.experienceDay.notes') || '活动描述' }}</label>
            <a-textarea
              v-model:value="localData.notes"
              :rows="4"
              :placeholder="t('travelDetail.experienceDay.notes') || '活动描述'"
            />
          </div>
        </a-collapse-panel>

        <!-- 预订链接 -->
        <a-collapse-panel key="booking" :header="t('travelDetail.experienceDay.bookingLinks') || '预订链接'">
          <div class="edit-form-item">
            <div class="booking-links-header">
              <label class="edit-form-label">🔗 {{ t('travelDetail.experienceDay.bookingLinks') || '预订链接' }}</label>
              <a-button
                type="dashed"
                size="small"
                @click="$emit('add-booking-link')"
              >
                <template #icon><plus-outlined /></template>
                {{ t('travelDetail.experienceDay.addLink') || '添加链接' }}
              </a-button>
            </div>
            <div v-if="localData.bookingLinks.length === 0" class="booking-links-empty">
              <span style="color: #999; font-size: 12px;">{{ t('travelDetail.experienceDay.noBookingLinks') || '暂无预订链接' }}</span>
            </div>
            <div v-else class="booking-links-list">
              <div
                v-for="(link, linkIndex) in localData.bookingLinks"
                :key="linkIndex"
                class="booking-link-item"
              >
                <a-input
                  v-model:value="link.name"
                  :placeholder="t('travelDetail.experienceDay.linkName') || '链接名称（如：Booking.com、官网预订等）'"
                  style="flex: 1; margin-right: 8px;"
                />
                <a-input
                  v-model:value="link.url"
                  placeholder="https://..."
                  style="flex: 2; margin-right: 8px;"
                />
                <a-button
                  type="text"
                  danger
                  size="small"
                  @click="$emit('remove-booking-link', linkIndex)"
                >
                  <template #icon><delete-outlined /></template>
                </a-button>
              </div>
            </div>
          </div>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { EditingData } from './useItineraryModals'
import type { CurrencyInfo } from '@/utils/currency'

interface Props {
  open: boolean
  isNew: boolean
  formData: EditingData
  currency?: CurrencyInfo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:formData': [data: EditingData]
  save: []
  'add-booking-link': []
  'remove-booking-link': [index: number]
}>()

const { t } = useI18n()

const activeKeys = ref<string[]>(['basic', 'details', 'booking'])

// 本地数据副本，用于双向绑定
const localData = ref<EditingData>({ ...props.formData })

// 监听 props 变化，同步到本地
watch(() => props.formData, (newData) => {
  localData.value = { ...newData }
}, { deep: true })

// 监听本地数据变化，同步到父组件
watch(localData, (newData) => {
  emit('update:formData', { ...newData })
}, { deep: true })

// 货币相关计算
const currencySymbol = computed(() => {
  return props.currency?.symbol || '¥'
})

const currencyHint = computed(() => {
  const currencyName = props.currency?.name || '人民币'
  return `${t('travelDetail.currencyHint') || '使用'}${currencyName}${t('travelDetail.record') || '记录'}`
})
</script>

<style scoped>
.edit-modal-content {
  padding: 8px 0;
}

.edit-form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.edit-form-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.booking-links-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.booking-links-empty {
  padding: 16px;
  text-align: center;
  background: #fafafa;
  border-radius: 4px;
}

.booking-links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.booking-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-item-hint {
  font-size: 12px;
  color: #999;
}
</style>


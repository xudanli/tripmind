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
      <!-- 自然语言输入（仅新增模式） -->
      <div v-if="isNew" class="natural-language-input-section">
        <div class="edit-form-item">
          <label class="edit-form-label">
            <span>💬 {{ t('travelDetail.experienceDay.naturalLanguageInput') || '自然语言输入' }}</span>
            <span class="form-label-hint">（支持自然语言描述，如"那个有很多鹿的日本公园"）</span>
          </label>
          <a-input-search
            v-model:value="naturalLanguageQuery"
            :placeholder="t('travelDetail.experienceDay.naturalLanguagePlaceholder') || '输入地点描述，如：奈良公园、那个有很多鹿的日本公园'"
            :loading="geocodingLoading"
            @search="handleNaturalLanguageSearch"
            @pressEnter="handleNaturalLanguageSearch"
            allow-clear
          >
            <template #enterButton>
              <a-button type="primary" :loading="geocodingLoading">
                {{ t('travelDetail.experienceDay.search') || '搜索' }}
              </a-button>
            </template>
          </a-input-search>
          <div v-if="geocodingError" class="geocoding-error">
            <a-alert type="error" :message="geocodingError" show-icon />
          </div>
        </div>
      </div>

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
import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { EditingData } from './useItineraryModals'
import type { CurrencyInfo } from '@/utils/currency'
import { accurateGeocode } from '@/services/locationAPI'
import { generateLocation } from '@/services/locationAPI'

interface Props {
  open: boolean
  isNew: boolean
  formData: EditingData
  currency?: CurrencyInfo | null
  destination?: string // 目的地信息，用于生成位置信息
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

// 自然语言输入相关状态
const naturalLanguageQuery = ref('')
const geocodingLoading = ref(false)
const geocodingError = ref<string | null>(null)

// 本地数据副本，用于双向绑定
const localData = ref<EditingData>({ ...props.formData })

// 防止循环更新的标志
const isUpdatingFromProps = ref(false)

// 监听 props 变化，同步到本地
watch(() => props.formData, (newData) => {
  if (!isUpdatingFromProps.value) {
    isUpdatingFromProps.value = true
  localData.value = { ...newData }
    nextTick(() => {
      isUpdatingFromProps.value = false
    })
  }
}, { deep: true })

// 监听本地数据变化，同步到父组件
watch(localData, (newData) => {
  if (!isUpdatingFromProps.value) {
  emit('update:formData', { ...newData })
  }
}, { deep: true })

// 货币相关计算
const currencySymbol = computed(() => {
  return props.currency?.symbol || '¥'
})

const currencyHint = computed(() => {
  const currencyName = props.currency?.name || '人民币'
  return `${t('travelDetail.currencyHint') || '使用'}${currencyName}${t('travelDetail.record') || '记录'}`
})

/**
 * 处理自然语言搜索
 */
const handleNaturalLanguageSearch = async () => {
  const query = naturalLanguageQuery.value.trim()
  if (!query || query.length < 2) {
    message.warning(t('travelDetail.experienceDay.queryTooShort') || '请输入至少2个字符')
    return
  }

  geocodingLoading.value = true
  geocodingError.value = null

  try {
    // 1. 获取目的地信息作为上下文（后续可能会被重新赋值，所以使用 let）
    let destination = props.destination || localData.value.location || ''
    
    // 2. 调用准确地理编码接口，传入目的地作为上下文
    const geocodeResult = await accurateGeocode({ 
      query,
      context: destination || undefined // 如果有目的地，作为上下文传入
    })
    
    if (!geocodeResult || !geocodeResult.success || !geocodeResult.location) {
      geocodingError.value = t('travelDetail.experienceDay.locationNotFound') || '未找到匹配的地点，请尝试使用更标准的地名'
      message.error(geocodingError.value)
      return
    }

    message.success(
      geocodeResult.usedAI 
        ? `${t('travelDetail.experienceDay.aiRecognized') || 'AI 识别出地点'}：${geocodeResult.name}`
        : `${t('travelDetail.experienceDay.foundLocation') || '找到地点'}：${geocodeResult.name}`
    )

    // 3. 如果 destination 为空，尝试从地址中提取（用于后续生成位置信息）
    if (!destination && geocodeResult.address) {
      // 从地址中提取城市或国家（简单提取，取最后一个逗号后的内容）
      const addressParts = geocodeResult.address.split(',').map(s => s.trim())
      if (addressParts.length > 1) {
        destination = addressParts[addressParts.length - 1] // 通常是国家或主要地区
      } else {
        destination = geocodeResult.address
      }
    }
    
    // 如果还是没有，使用国家代码或默认值
    if (!destination) {
      if (geocodeResult.countryCode) {
        // 可以根据 countryCode 映射到国家名称，这里简化处理
        destination = geocodeResult.countryCode
      } else {
        destination = geocodeResult.name || query
      }
    }

    // 4. 调用位置信息生成接口
    let locationInfo = null
    try {
      locationInfo = await generateLocation({
        activityName: geocodeResult.name || query,
        destination: destination,
        activityType: localData.value.type || 'attraction',
        coordinates: {
          lat: geocodeResult.location.latitude,
          lng: geocodeResult.location.longitude
        }
      })
    } catch (error: any) {
      console.warn('[SlotEditModal] 位置信息生成失败，使用基础信息:', error)
      // 即使位置信息生成失败，也继续使用地理编码结果
    }

    // 5. 自动填充表单
    isUpdatingFromProps.value = true
    
    // 基础信息（使用地理编码返回的数据）
    localData.value.title = geocodeResult.name || query
    localData.value.activity = geocodeResult.name || query
    localData.value.location = geocodeResult.address || geocodeResult.name || ''
    
    // 坐标信息（确保使用正确的字段名）
    if (geocodeResult.location) {
      localData.value.coordinates = {
        lat: geocodeResult.location.latitude,
        lng: geocodeResult.location.longitude
      }
    }
    
    // 可选：保存国家代码和地点类型（如果后续需要）
    // 这些信息可以用于后续的位置信息生成或其他功能
    if (geocodeResult.countryCode) {
      // 可以保存到 details 中，如果需要的话
      // localData.value.details = localData.value.details || {}
      // localData.value.details.countryCode = geocodeResult.countryCode
    }
    
    if (geocodeResult.placeType) {
      // 可以根据 placeType 调整活动类型
      // 例如：poi -> attraction, place -> attraction 等
    }

    // 如果生成了详细位置信息，填充更多字段
    if (locationInfo) {
      localData.value.nameChinese = locationInfo.chineseName || ''
      localData.value.nameEnglish = locationInfo.localName || ''
      localData.value.openingHours = locationInfo.openingHours || ''
      localData.value.pricingDetail = locationInfo.ticketPrice || ''
      localData.value.visitTips = locationInfo.visitTips || ''
      localData.value.scenicIntro = locationInfo.visitTips || ''
      localData.value.transportation = locationInfo.transportInfo || ''
      localData.value.accessibility = locationInfo.accessibility || ''
      localData.value.outfitSuggestions = locationInfo.outfitSuggestions || ''
      localData.value.culturalTips = locationInfo.culturalTips || ''
      
      if (locationInfo.rating) {
        localData.value.rating = locationInfo.rating
      }
      
      if (locationInfo.visitDuration) {
        // 解析时长字符串，转换为分钟数
        const durationMatch = locationInfo.visitDuration.match(/(\d+)/)
        if (durationMatch) {
          localData.value.duration = parseInt(durationMatch[1]) || null
        }
      }

      // 更新活动类型（如果位置信息中有）
      if (locationInfo.category) {
        const categoryMap: Record<string, string> = {
          '景点': 'attraction',
          '餐厅': 'restaurant',
          '酒店': 'accommodation',
          '购物': 'shopping',
          '交通': 'transport'
        }
        const mappedType = categoryMap[locationInfo.category] || localData.value.type
        localData.value.type = mappedType
        localData.value.category = locationInfo.category
      }
    }

    nextTick(() => {
      isUpdatingFromProps.value = false
    })

    // 自动展开基础信息面板
    if (!activeKeys.value.includes('basic')) {
      activeKeys.value.push('basic')
    }

    message.success(t('travelDetail.experienceDay.formFilled') || '表单已自动填充，您可以继续编辑或直接保存')
  } catch (error: any) {
    console.error('[SlotEditModal] 自然语言搜索失败:', error)
    geocodingError.value = error.message || t('travelDetail.experienceDay.searchFailed') || '搜索失败，请稍后重试'
    message.error(geocodingError.value)
  } finally {
    geocodingLoading.value = false
  }
}

// 当模态框关闭时，清空自然语言查询
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    naturalLanguageQuery.value = ''
    geocodingError.value = null
  }
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

.form-label-hint {
  margin-left: 6px;
  font-size: 12px;
  font-weight: normal;
  color: #999;
}

.natural-language-input-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.geocoding-error {
  margin-top: 8px;
}
</style>


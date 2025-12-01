/**
 * POI 搜索模态框组件
 * 从 ExperienceDay.vue 中提取的搜索表单
 */

<template>
  <a-modal
    :open="open"
    @update:open="$emit('update:open', $event)"
    :title="t('travelDetail.experienceDay.searchNearby') || '搜索附近'"
    width="900px"
    :footer="null"
    :mask-closable="false"
    :body-style="{ maxHeight: '720px', overflowY: 'auto' }"
  >
    <div class="poi-search-container">
      <!-- 搜索位置信息 -->
      <div class="search-location-info">
        <div class="location-display">
          <span class="location-icon">📍</span>
          <span class="location-text">
            {{ searchLocation.name }}
            <span v-if="searchLocation.address" class="location-address"> · {{ searchLocation.address }}</span>
          </span>
        </div>
      </div>

      <!-- 搜索输入框 -->
      <div class="search-input-container">
        <a-input-search
          :value="searchKeyword"
          @update:value="$emit('update:searchKeyword', $event)"
          :placeholder="t('travelDetail.experienceDay.searchPlaceholder') || '输入关键词搜索（如：咖啡厅、博物馆、公园等）'"
          size="large"
          @search="$emit('search')"
          @pressEnter="$emit('search')"
          allow-clear
        >
          <template #prefix>
            <span style="color: #999;">🔍</span>
          </template>
        </a-input-search>
      </div>

      <!-- 类别选择 -->
      <div class="category-selector">
        <div class="category-label">{{ t('travelDetail.experienceDay.searchCategory') || '搜索类别' }}：</div>
        <a-radio-group :value="selectedCategory" @update:value="$emit('update:selectedCategory', $event)" @change="$emit('category-change')">
          <a-radio-button value="restaurant">
            <span>🍽️</span> {{ t('travelDetail.experienceDay.restaurant') || '餐厅' }}
          </a-radio-button>
          <a-radio-button value="attraction">
            <span>🏛️</span> {{ t('travelDetail.experienceDay.attraction') || '景点' }}
          </a-radio-button>
          <a-radio-button value="accommodation">
            <span>🏨</span> {{ t('travelDetail.experienceDay.accommodation') || '住宿' }}
          </a-radio-button>
          <a-radio-button value="gas_station">
            <span>⛽</span> {{ t('travelDetail.experienceDay.gasStation') || '加油站' }}
          </a-radio-button>
          <a-radio-button value="ev_charging">
            <span>🔌</span> {{ t('travelDetail.experienceDay.evCharging') || '充电桩' }}
          </a-radio-button>
          <a-radio-button value="rest_area">
            <span>🛋️</span> {{ t('travelDetail.experienceDay.restArea') || '休息站' }}
          </a-radio-button>
        </a-radio-group>
      </div>

      <!-- 搜索状态 -->
      <div v-if="searching" class="search-status">
        <a-spin :spinning="true" />
        <span style="margin-left: 8px;">{{ t('travelDetail.experienceDay.searching') || '正在搜索...' }}</span>
      </div>

      <!-- 搜索结果 -->
      <div v-if="!searching && searchResults.length > 0" class="search-results">
        <div class="results-header">
          <span class="results-count">
            {{ t('travelDetail.experienceDay.foundResults') || '找到' }} {{ searchResults.length }} {{ t('travelDetail.experienceDay.results') || '个结果' }}
          </span>
        </div>
        <div class="results-list">
          <div
            v-for="(poi, index) in searchResults"
            :key="index"
            class="poi-result-card"
          >
            <!-- POI照片 -->
            <div v-if="poi.photo" class="poi-photo">
              <img :src="poi.photo" :alt="poi.name.chinese || poi.name.english" />
            </div>

            <!-- POI信息 -->
            <div class="poi-info">
              <div class="poi-header">
                <h4 class="poi-name">
                  <span v-if="poi.name.local" class="local-name">{{ poi.name.local }}</span>
                  <span v-if="poi.name.chinese" class="chinese-name">{{ poi.name.chinese }}</span>
                  <span v-if="poi.name.english" class="english-name">{{ poi.name.english }}</span>
                </h4>
                <a-tag v-if="poi.rating" :color="poi.rating.score >= 4 ? 'green' : poi.rating.score >= 3 ? 'orange' : 'red'">
                  ⭐ {{ poi.rating.score }}
                </a-tag>
              </div>

              <div class="poi-address">
                <span class="address-icon">📍</span>
                <div class="address-lines">
                  <span
                    v-for="(line, lineIndex) in getPOIAddressLines(poi)"
                    :key="lineIndex"
                    class="address-line"
                    :class="`address-line-${line.type}`"
                  >
                    {{ line.text }}
                  </span>
                  <span v-if="getPOIAddressLines(poi).length === 0">{{ t('travelDetail.experienceDay.addressUnknown') || '地址未知' }}</span>
                </div>
                <span v-if="poi.distance" class="distance-badge">{{ poi.distance }}</span>
              </div>

              <div v-if="poi.recommendation" class="poi-recommendation">
                <span class="recommendation-icon">💡</span>
                <span>{{ poi.recommendation }}</span>
              </div>

              <div class="poi-meta">
                <span v-if="poi.estimatedDuration" class="meta-item">
                  <span class="meta-icon">⏱️</span>
                  <span class="meta-label">{{ durationLabel }}：</span>
                  {{ poi.estimatedDuration }}
                </span>
                <span v-if="poi.pricing?.general" class="meta-item">
                  <span class="meta-icon">💰</span>
                  {{ formatCurrency(poi.pricing.general, currency) }}
                </span>
                <span v-if="poi.openingHours?.hours" class="meta-item">
                  <span class="meta-icon">🕐</span>
                  <span class="meta-label">{{ t('travelDetail.experienceDay.openingHours') || '营业时间' }}：</span>
                  {{ poi.openingHours.hours }}
                </span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="poi-actions">
              <a-button
                type="primary"
                size="small"
                @click="$emit('add-poi', poi)"
              >
                {{ t('travelDetail.experienceDay.addToItinerary') || '添加到行程' }}
              </a-button>
              <a-button
                type="text"
                size="small"
                @click="$emit('view-details', poi)"
              >
                {{ t('travelDetail.experienceDay.viewDetails') || '查看详情' }}
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 无结果 -->
      <div v-if="!searching && searchResults.length === 0 && hasSearched" class="no-results">
        <a-empty
          :description="noResultsDescription"
        />
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@/utils/currency'
import type { POIResult, POICategory } from '@/services/poiSearchAPI'
import type { SearchLocation } from './useItineraryModals'
import type { CurrencyInfo } from '@/utils/currency'

interface Props {
  open: boolean
  searching: boolean
  searchResults: POIResult[]
  selectedCategory: POICategory
  hasSearched: boolean
  searchKeyword: string
  searchLocation: SearchLocation
  durationLabelKey: string
  currency?: CurrencyInfo | null
  noResultsDescription?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:searchKeyword': [value: string]
  'update:selectedCategory': [value: POICategory]
  search: []
  'category-change': []
  'add-poi': [poi: POIResult]
  'view-details': [poi: POIResult]
}>()

const { t } = useI18n()

const durationLabel = computed(() => {
  return t(props.durationLabelKey) || t('travelDetail.experienceDay.estimatedStay') || '预计停留'
})

/**
 * 获取 POI 地址行
 */
const getPOIAddressLines = (poi: POIResult): Array<{ text: string; type: string }> => {
  const lines: Array<{ text: string; type: string }> = []
  
  if (poi.address?.local) {
    lines.push({ text: poi.address.local, type: 'local' })
  }
  if (poi.address?.english) {
    lines.push({ text: poi.address.english, type: 'english' })
  }
  if (poi.address?.chinese && poi.address.chinese !== poi.address.english) {
    lines.push({ text: poi.address.chinese, type: 'chinese' })
  }
  
  if (lines.length === 0 && poi.address) {
    const fallback = poi.address.english || poi.address.chinese || poi.address.local
    if (fallback) {
      lines.push({ text: fallback, type: 'fallback' })
    }
  }
  
  return lines
}
</script>

<style scoped>
.poi-search-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-location-info {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.location-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-icon {
  font-size: 16px;
}

.location-text {
  font-size: 14px;
  color: #333;
}

.location-address {
  color: #666;
  font-size: 12px;
}

.search-input-container {
  margin-bottom: 8px;
}

.category-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.search-status {
  padding: 24px;
  text-align: center;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results-header {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.results-count {
  font-size: 14px;
  color: #666;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.poi-result-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  transition: all 0.2s;
}

.poi-result-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.poi-photo {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.poi-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poi-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.poi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.poi-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.poi-address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.address-icon {
  font-size: 14px;
  margin-top: 2px;
}

.address-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.address-line {
  line-height: 1.5;
}

.distance-badge {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.poi-recommendation {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.recommendation-icon {
  font-size: 14px;
}

.poi-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 14px;
}

.meta-label {
  color: #666;
}

.poi-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  justify-content: flex-start;
}

.no-results {
  padding: 48px 24px;
  text-align: center;
}
</style>


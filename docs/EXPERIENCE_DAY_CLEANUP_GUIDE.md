# ExperienceDay.vue 清理指南

## 已完成的工作

✅ **Composables 已创建：**
- `useSlotEditing.ts` - 编辑逻辑
- `usePoiSearch.ts` - 搜索逻辑
- `useSlotFormatting.ts` - 格式化逻辑（已存在）
- `useMapNavigation.ts` - 地图导航逻辑（已存在）
- `useSlotActions.ts` - 操作逻辑（已存在）

✅ **组件已创建：**
- `SlotEditModal.vue` - 编辑模态框
- `PoiSearchModal.vue` - 搜索模态框
- `SlotHero.vue` - Hero 区域（已存在）
- `SlotInfoBar.vue` - 信息条（已存在）
- `SlotDetails.vue` - 详细信息（已存在）
- `TimeSlotCard.vue` - 已重构（已使用子组件）

## 需要删除的代码

### 1. 模板部分（81-529行）
- ❌ 删除内联编辑模态框（81-350行）
- ❌ 删除内联搜索模态框（353-519行）
- ✅ 保留 Timeline 和 DayCard 结构（1-79行）
- ✅ 保留图片预览模态框（522-528行）

### 2. Script 部分需要删除的函数

#### 编辑相关（已移到 useSlotEditing）
- ❌ `handleEdit` (2273-2345行)
- ❌ `handleSaveEdit` (3993-4307行)
- ❌ `handleCancelEdit` (3952-3990行)
- ❌ `addBookingLink` (4310-4312行)
- ❌ `removeBookingLink` (4314-4317行)
- ❌ `editFormActiveKeys` (2078行)

#### 搜索相关（已移到 usePoiSearch）
- ❌ `openSearchModal` (2651-2672行)
- ❌ `performSearch` (2741-2869行)
- ❌ `handleSearch` (2881-2883行)
- ❌ `handleCategoryChange` (2873-2878行)
- ❌ `addPOIToItinerary` (2886-3200+行)
- ❌ `convertPOISearchResultToPOIResult` (2675-2723行)
- ❌ `mapCategoryToBackendType` (2726-2738行)
- ❌ `getPOIAddressLines` (2221-2227行)
- ❌ `getSearchLocationCurrency` (2087-2110行)
- ❌ `searchLocationLatitude` (2112-2123行)
- ❌ `isRemoteSearchLocation` (2125-2132行)
- ❌ `noResultsDescription` (2134-2146行)

#### 格式化相关（已移到 useSlotFormatting）
- ❌ `formatDuration`
- ❌ `formatCurrency`
- ❌ `getSlotCurrency`
- ❌ `formatLocation`
- ❌ `getAddressText`
- ❌ `getTypeIcon`
- ❌ `formatType`
- ❌ `getRatingPlatform`
- ❌ `getRatingPlatformCode`

#### 导航相关（已移到 useMapNavigation）
- ❌ `handleNavigate` (4365-4443行)

#### 图片相关（应移到 useSlotMedia 或保留在 SlotHero）
- ❌ `activityImages` (1034行)
- ❌ `activityMediaList` (1035行)
- ❌ `activityVideoCache` (1036行)
- ❌ `previewVisible`, `previewMedia` 等（已移到 useItineraryModals）
- ❌ `openImagePreview` (1074-1175行)
- ❌ `closeImagePreview` (1175-1177行)
- ❌ `setAsCover` (1179-1209行)
- ❌ `loadActivityImage` (1211-1260行)
- ❌ `loadAllActivityImages` (1262-1280行)
- ❌ `hasImageError` (1282-1285行)
- ❌ `markImageError` (2265-2270行)
- ❌ `getSlotCover` (2258-2263行)
- ❌ `isImageLoading` (2253-2256行)

### 3. 需要保留的代码

#### 数据计算
- ✅ `itineraryData` computed
- ✅ `itineraryDays` computed
- ✅ `destination` computed
- ✅ `getDaySummary`
- ✅ `getSlotKey`
- ✅ `isSlotExpanded`, `toggleDetailsByKey`
- ✅ `expandedDetails`

#### 事件处理（简化版）
- ✅ `handleDayExpand`
- ✅ `handleAddSlot` → 调用 `useSlotEditing.openAdd`
- ✅ `handleAddDay`
- ✅ `handleDeleteSlot` → 调用 API，更新数据
- ✅ `handleAddNearbyAttraction` → 调用 `usePoiSearch.addPoi`

#### 辅助函数（保留必要的）
- ✅ `findPreviousSlot`
- ✅ `getSlotLabel`
- ✅ `getSlotCoords`
- ✅ `recalculateTransportAfterChange`

## 重构后的模板结构

```vue
<template>
  <div class="experience-journey">
    <section class="itinerary-timeline">
      <a-timeline>
        <a-timeline-item 
          v-for="day in itineraryDays"
          :key="day.id || day.date || day.day"
          color="blue"
        >
          <template #dot>
            <calendar-outlined :style="{ fontSize: '16px' }" />
          </template>

          <DayCard
            :day="day"
            :summary="getDaySummary(day)"
            @expand="handleDayExpand(day.day)"
          >
            <template #slots>
              <TimeSlotCard
                v-for="(slot, slotIndex) in day.timeSlots"
                :key="getSlotKey(day.day, slotIndex, slot)"
                :day="day"
                :slot="slot"
                :cover="getSlotCover(day.day, slotIndex, slot)"
                :currency="getSlotCurrency(slot)"
                :platform="getRatingPlatform(slot)"
                :expanded="isSlotExpanded(day.day, slotIndex, slot)"
                :is-inspiration-mode="travel?.mode === 'inspiration' || travel?.mode === 'classic'"
                :is-planner-mode="travel?.mode === 'planner'"
                @navigate="handleNavigate(slot)"
                @book="handleBook(slot)"
                @search="handleOpenSearch(day.day, slotIndex, slot)"
                @contact="handleContact(slot)"
                @edit="handleOpenEdit(day.day, slotIndex, slot)"
                @remove="handleDeleteSlot(day.day, slotIndex)"
                @preview="openImagePreview(day.day, slotIndex, slot)"
                @rating-click="handleRatingClick(slot)"
                @toggle="toggleDetailsByKey(getSlotKey(day.day, slotIndex, slot))"
                @image-error="markImageError(day.day, slotIndex, slot)"
                @add-nearby-attraction="handleAddNearbyAttraction(day.day, slotIndex, slot, $event)"
                :loading="isImageLoading(day.day, slotIndex, slot)"
              />

              <a-button 
                type="dashed" 
                size="small" 
                class="add-slot-btn"
                @click="handleAddSlot(day.day, (day.timeSlots || []).length)"
              >
                <span>➕</span>{{ t('travelDetail.experienceDay.addActivity') }}
              </a-button>
            </template>
          </DayCard>
        </a-timeline-item>

        <!-- 添加天数按钮 -->
        <a-timeline-item v-if="travel?.mode === 'planner' && canAddDay">
          <template #dot>
            <plus-outlined :style="{ fontSize: '16px', color: '#1890ff' }" />
          </template>
          <div class="add-day-section">
            <a-button 
              type="dashed" 
              size="large"
              class="add-day-btn"
              @click="handleAddDay"
              :loading="addingDay"
            >
              <template #icon>
                <plus-outlined />
              </template>
              {{ t('travelDetail.addNewDay') || t('travelDetail.experienceDay.addNewDay') || '添加新天数' }}
            </a-button>
          </div>
        </a-timeline-item>
      </a-timeline>
    </section>

    <!-- 编辑模态框 -->
    <SlotEditModal
      v-model:open="slotEditing.editModalVisible"
      :is-new="slotEditing.isAddingNew"
      :form-data="slotEditing.editingData"
      :currency="getOverallCurrency()"
      @update:form-data="slotEditing.editingData = $event"
      @save="slotEditing.save"
      @add-booking-link="slotEditing.addBookingLink"
      @remove-booking-link="slotEditing.removeBookingLink"
    />

    <!-- 搜索模态框 -->
    <PoiSearchModal
      v-model:open="poiSearch.searchModalVisible"
      :searching="poiSearch.searching"
      :search-results="poiSearch.searchResults"
      :selected-category="poiSearch.selectedSearchCategory"
      :has-searched="poiSearch.hasSearched"
      :search-keyword="poiSearch.searchKeyword"
      :search-location="poiSearch.searchLocation"
      :duration-label-key="poiSearch.durationLabelKey.value"
      :currency="getOverallCurrency()"
      @update:search-keyword="poiSearch.searchKeyword = $event"
      @update:selected-category="poiSearch.selectedSearchCategory = $event"
      @search="poiSearch.handleSearch"
      @category-change="poiSearch.handleCategoryChange"
      @add-poi="poiSearch.addPoi"
    />

    <!-- 图片预览模态框 -->
    <ImagePreviewModal
      v-model:open="previewVisible"
      :media="previewMedia"
      :index="previewCurrentIndex"
      @update:index="value => (previewCurrentIndex = value)"
      @set-cover="setAsCover"
    />
  </div>
</template>
```

## 重构后的 Script 结构

```typescript
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import { deleteSlot } from '@/services/itineraryAPI'
import { useSlotEditing } from '@/composables/useSlotEditing'
import { usePoiSearch } from '@/composables/usePoiSearch'
import { useSlotFormatting } from '@/composables/useSlotFormatting'
import { useSlotActions } from '@/composables/useSlotActions'
import DayCard from './ExperienceDay/DayCard.vue'
import TimeSlotCard from './ExperienceDay/TimeSlotCard.vue'
import SlotEditModal from './ExperienceDay/SlotEditModal.vue'
import PoiSearchModal from './ExperienceDay/PoiSearchModal.vue'
import ImagePreviewModal from './ExperienceDay/ImagePreviewModal.vue'
import { useItineraryModals } from './ExperienceDay/useItineraryModals'

const props = defineProps<{
  travel?: Travel | null
}>()

const emit = defineEmits<{
  update: [travel: Travel]
  refresh: []
}>()

const { t } = useI18n()

// 数据计算
const itineraryData = computed(() => { /* ... */ })
const itineraryDays = computed(() => { /* ... */ })
const destination = computed(() => { /* ... */ })

// 使用 Composables
const slotEditing = useSlotEditing({
  itineraryData,
  travel,
  onUpdate: (updatedTravel) => emit('update', updatedTravel),
  // ... 其他选项
})

const poiSearch = usePoiSearch({
  itineraryData,
  travel,
  onUpdate: (updatedTravel) => emit('update', updatedTravel),
  getSlotCoords: (slot) => { /* ... */ }
})

// 图片预览（保留在 useItineraryModals）
const {
  previewVisible,
  previewMedia,
  previewCurrentIndex,
} = useItineraryModals()

// 事件处理（简化版）
const handleOpenEdit = (day: number, slotIndex: number, slot: any) => {
  slotEditing.openEdit(day, slotIndex, slot)
}

const handleOpenAdd = (day: number, insertIndex: number) => {
  slotEditing.openAdd(day, insertIndex)
}

const handleOpenSearch = (day: number, slotIndex: number, slot: any) => {
  poiSearch.openSearch(day, slotIndex, slot)
}

const handleDeleteSlot = async (day: number, slotIndex: number) => {
  // 删除逻辑（调用 API）
}

// ... 其他必要的事件处理函数
</script>
```

## 下一步

1. 逐步替换 ExperienceDay.vue 中的代码
2. 测试功能是否正常
3. 删除未使用的导入和函数
4. 优化样式，移除未使用的 CSS


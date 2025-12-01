# ExperienceDay.vue 重构计划

## 当前状态
- 文件大小：7526 行
- 问题：包含大量应该被抽离的逻辑（编辑、搜索、图片、格式化等）

## 重构目标
将 `ExperienceDay.vue` 简化为只负责：
1. 数据源：接收 travel prop，计算 itineraryDays
2. 布局：渲染 Timeline 和 DayCard
3. 插槽分发：在 DayCard 中循环渲染 TimeSlotCard
4. 模态框容器：放置 SlotEditModal 和 PoiSearchModal（全局单例）
5. 事件转发：监听子组件事件，调用 Store 或 API 更新数据

## 需要删除的冗余逻辑

### 1. 编辑逻辑（已抽离到 useSlotEditing）
- ✅ `editModalVisible`, `editingSlot`, `editingData` → 使用 `useSlotEditing`
- ✅ `handleEdit`, `handleSaveEdit`, `handleCancelEdit` → 使用 `useSlotEditing`
- ✅ `addBookingLink`, `removeBookingLink` → 使用 `useSlotEditing`
- ✅ `editFormActiveKeys` → 移到 SlotEditModal 组件内部

### 2. 搜索逻辑（已抽离到 usePoiSearch）
- ✅ `searchModalVisible`, `searching`, `searchResults` → 使用 `usePoiSearch`
- ✅ `searchLocation`, `currentSearchContext` → 使用 `usePoiSearch`
- ✅ `openSearchModal`, `handleSearch`, `performSearch` → 使用 `usePoiSearch`
- ✅ `addPOIToItinerary`, `handleAddNearbyAttraction` → 使用 `usePoiSearch`
- ✅ `mapCategoryToBackendType`, `convertPOISearchResultToPOIResult` → 移到 usePoiSearch

### 3. 图片/预览逻辑（已抽离到 useSlotMedia 或 SlotHero）
- ✅ `activityImages`, `activityMediaList`, `activityVideoCache` → 移到 useSlotMedia
- ✅ `previewVisible`, `previewMedia` → 移到 ImagePreviewModal
- ✅ `openImagePreview`, `closeImagePreview`, `setAsCover` → 移到 useSlotMedia
- ✅ `loadActivityImage`, `loadAllActivityImages` → 移到 useSlotMedia
- ✅ `hasImageError`, `markImageError` → 移到 useSlotMedia

### 4. 格式化逻辑（已抽离到 useSlotFormatting）
- ✅ `formatDuration`, `formatCurrency`, `getSlotCurrency` → 使用 `useSlotFormatting`
- ✅ `formatLocation`, `getAddressText` → 使用 `useSlotFormatting`
- ✅ `getTypeIcon`, `formatType` → 使用 `useSlotFormatting`
- ✅ `getRatingPlatform`, `getRatingPlatformCode` → 移到 useSlotFormatting

### 5. 导航逻辑（已抽离到 useMapNavigation）
- ✅ `handleNavigate` → 使用 `useMapNavigation`

## 需要保留的逻辑

### ExperienceDay.vue 应该保留：
1. **数据计算**：
   - `itineraryDays` computed
   - `getDaySummary`
   - `getSlotKey`
   - `isSlotExpanded`, `toggleDetailsByKey`

2. **事件处理**（简化版）：
   - `handleDayExpand`
   - `handleAddSlot` → 调用 `useSlotEditing.openAdd`
   - `handleAddDay`
   - `handleDeleteSlot` → 调用 API，更新数据

3. **模态框管理**（使用 composables）：
   - 使用 `useSlotEditing` 管理编辑模态框
   - 使用 `usePoiSearch` 管理搜索模态框

## 重构步骤

### 步骤 1：创建 Composables ✅
- [x] `useSlotFormatting.ts` - 已完成
- [x] `useMapNavigation.ts` - 已完成
- [x] `useSlotActions.ts` - 已完成
- [ ] `useSlotEditing.ts` - 待创建
- [ ] `usePoiSearch.ts` - 待创建

### 步骤 2：创建组件 ✅
- [x] `SlotHero.vue` - 已完成
- [x] `SlotInfoBar.vue` - 已完成
- [x] `SlotDetails.vue` - 已完成
- [x] `TimeSlotCard.vue` - 已完成（已使用子组件）
- [ ] `SlotEditModal.vue` - 待创建
- [ ] `PoiSearchModal.vue` - 待创建

### 步骤 3：清理 ExperienceDay.vue
- [ ] 删除内联编辑模态框模板（81-509行）
- [ ] 删除内联搜索模态框模板（353-519行）
- [ ] 删除所有格式化函数
- [ ] 删除所有编辑相关函数
- [ ] 删除所有搜索相关函数
- [ ] 删除图片加载相关逻辑
- [ ] 简化模板，只保留组装逻辑

## 预期结果

重构后的 `ExperienceDay.vue` 应该只有约 200-300 行，主要包含：
- 模板：Timeline + DayCard + TimeSlotCard + 模态框组件
- Script：数据计算 + 事件转发 + composables 调用


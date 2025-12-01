# ExperienceDay.vue 清理进度

## ✅ 已完成的替换

### 1. 编辑相关函数
- ✅ `handleEdit` → 已替换为兼容层，调用 `handleOpenEdit`
- ✅ `handleCancelEdit` → 已替换为兼容层，调用 `slotEditing.cancel`
- ✅ `addBookingLink` → 已替换为兼容层，调用 `slotEditing.addBookingLink`
- ✅ `removeBookingLink` → 已替换为兼容层，调用 `slotEditing.removeBookingLink`
- ✅ `handleSaveEdit` → 已替换为兼容层，调用 `slotEditing.save`（旧实现保留为 `handleSaveEditOld`）

### 2. 搜索相关函数
- ✅ `openSearchModal` → 已替换为兼容层，调用 `handleOpenSearch`
- ✅ `performSearch` → 已替换为兼容层，调用 `poiSearch.performSearch`
- ✅ `handleSearch` → 已替换为兼容层，调用 `poiSearch.handleSearch`
- ✅ `handleCategoryChange` → 已替换为兼容层，调用 `poiSearch.handleCategoryChange`
- ✅ `convertPOISearchResultToPOIResult` → 已删除（移到 composable）
- ✅ `mapCategoryToBackendType` → 已删除（移到 composable）
- ✅ `addPOIToItinerary` → 已替换为兼容层，调用 `poiSearch.addPoi`（旧实现保留为 `addPOIToItineraryOld`）

## ⚠️ 需要手动删除的代码

### 1. 旧的函数实现（已标记为 Old）
以下函数已替换为兼容层，但旧的实现仍保留在文件中，需要手动删除：

- `handleSaveEditOld` (约 3455-3953行) - 约 500 行代码
- `addPOIToItineraryOld` (约 2382-2995行) - 约 600 行代码

**删除步骤：**
1. 搜索 `handleSaveEditOld` 和 `addPOIToItineraryOld`
2. 删除整个函数体（从 `const handleSaveEditOld = async () => {` 到对应的 `}`）
3. 确保没有其他地方引用这些函数

### 2. 旧的模态框模板（已标记为 `v-if="false"`）
以下模板代码已替换为新组件，但仍保留在文件中：

- 第 114-350 行：旧的编辑模态框（`<a-modal v-if="false"`）
- 第 386-540 行：旧的搜索模态框（`<a-modal v-if="false"`）

**删除步骤：**
1. 搜索 `<a-modal v-if="false"` 
2. 删除整个 `<a-modal>` 标签及其内容（从 `<a-modal` 到对应的 `</a-modal>`）

### 3. 未使用的导入
检查并删除以下不再需要的导入（如果它们只在已删除的函数中使用）：

- `addSlotToDay` - 已移到 composable
- `updateSlot` - 已移到 composable  
- `searchPOI` - 已移到 composable
- `searchNearbyPOI` - 已移到 composable
- `POISearchResult` - 已移到 composable

## 📊 清理效果

### 预期减少的代码行数
- `handleSaveEditOld`: ~500 行
- `addPOIToItineraryOld`: ~600 行
- 旧的编辑模态框模板: ~240 行
- 旧的搜索模态框模板: ~155 行
- **总计**: ~1500 行代码

### 当前状态
- 文件大小: 7172 行
- 预期清理后: ~5700 行
- 清理进度: 核心逻辑已迁移，剩余清理工作主要是删除旧代码

## 🔍 验证步骤

完成清理后，请验证：

1. **编译检查**
   ```bash
   npm run build
   # 或
   npm run type-check
   ```

2. **功能测试**
   - ✅ 编辑活动功能正常
   - ✅ 添加活动功能正常
   - ✅ 搜索 POI 功能正常
   - ✅ 添加 POI 到行程功能正常
   - ✅ 删除活动功能正常

3. **代码检查**
   - ✅ 没有未使用的导入
   - ✅ 没有未使用的变量
   - ✅ 没有 `@ts-nocheck` 指令（如果可能）

## 📝 注意事项

1. **兼容层函数**：当前保留的兼容层函数（如 `handleEdit`, `handleSaveEdit`）是为了确保现有代码不会立即中断。在确认所有调用都已更新后，可以删除这些兼容层。

2. **旧实现保留**：`handleSaveEditOld` 和 `addPOIToItineraryOld` 保留是为了参考，确认新实现功能正常后可以删除。

3. **测试覆盖**：删除旧代码前，确保新实现已通过完整测试。


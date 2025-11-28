# 后端迁移实施指南 - 第二部分：总费用计算

## 📋 概述

本文档指导后端开发人员如何在后端自动计算行程总费用，确保前端无需进行费用计算。

---

## 🎯 目标

**当前问题：**
- 前端需要从活动列表中计算总费用
- 如果后端返回的 `totalCost` 为 0，前端会重新计算
- 费用更新时，前端需要手动重新计算

**目标状态：**
- 后端在生成行程时自动计算总费用
- 每次更新活动费用时，后端自动重新计算总费用
- 提供专门的接口用于重新计算总费用
- 前端直接使用后端返回的 `totalCost`，无需计算

---

## 📝 费用计算规则

### 1. 费用来源

总费用应该从以下字段累加：

| 字段路径 | 说明 | 优先级 |
|---------|------|--------|
| `activity.cost` | 活动的直接费用字段 | 最高 |
| `activity.details.pricing.general` | 活动的通用价格 | 次高 |
| `activity.estimatedCost` | 活动的预估费用 | 最低 |

**计算逻辑：**
```typescript
// 伪代码
function getActivityCost(activity) {
  // 优先级1：直接费用字段
  if (activity.cost && activity.cost > 0) {
    return activity.cost
  }
  
  // 优先级2：通用价格
  if (activity.details?.pricing?.general && activity.details.pricing.general > 0) {
    return activity.details.pricing.general
  }
  
  // 优先级3：预估费用
  if (activity.estimatedCost && activity.estimatedCost > 0) {
    return activity.estimatedCost
  }
  
  // 如果没有费用信息，返回0
  return 0
}
```

### 2. 总费用计算公式

```typescript
totalCost = sum(
  for each day in days:
    sum(
      for each activity in day.activities:
        getActivityCost(activity)
    )
)
```

---

## ✅ 实施状态

**已完成！** 后端已经创建了 `CostCalculator` 工具类并在所有关键操作中应用了自动费用计算。

### 已实现的工具类

**文件位置：** `src/utils/costCalculator.ts`

**已实现的方法：**

1. **`getActivityCost()`** - 获取活动费用
   - 优先级1：`activity.cost` - 活动的直接费用字段
   - 优先级2：`activity.details.pricing.general` - 活动的通用价格
   - 优先级3：`activity.estimatedCost` - 活动的预估费用
   - 如果没有费用信息，返回 0

2. **`calculateDayCost()`** - 计算一天的总费用
   - 累加该天所有活动的费用

3. **`calculateTotalCost()`** - 计算行程的总费用
   - 累加所有天数的费用

4. **`calculateAndUpdateTotalCost()`** - 计算并更新总费用
   - 计算总费用并更新到行程对象

### 已应用自动计算的关键方法

#### 生成行程时
- ✅ `validateAndTransformResponse()` - 生成行程时使用 `CostCalculator` 计算总费用
  - 覆盖 AI 返回的值，确保准确性

#### 创建行程时
- ✅ `createItinerary()` - 创建行程时使用 `CostCalculator` 计算总费用
- ✅ `createItineraryFromFrontendData()` - 从前端数据创建时也计算总费用

#### 更新行程时
- ✅ `updateItineraryFromFrontendData()` - 更新行程时重新计算总费用

#### 创建活动时
- ✅ `createJourneyDayActivity()` - 创建活动后自动重新计算总费用

#### 更新活动时
- ✅ `updateJourneyDayActivity()` - 更新活动费用或 locationDetails 后自动重新计算总费用

#### 删除活动时
- ✅ `deleteJourneyDayActivity()` - 删除活动后自动重新计算总费用

#### 重新计算接口
- ✅ `POST /api/v1/journeys/:journeyId/recalculate-cost` - 专门的重新计算接口
- ✅ `recalculateJourneyTotalCost()` - 公共方法，供接口调用
- ✅ `RecalculateTotalCostResponseDto` - 响应 DTO

### 费用计算规则

| 优先级 | 字段路径 | 说明 |
|--------|---------|------|
| 1 | `activity.cost` | 活动的直接费用字段（最高优先级） |
| 2 | `activity.details.pricing.general` | 活动的通用价格 |
| 3 | `activity.estimatedCost` | 活动的预估费用（最低优先级） |
| - | 无 | 如果没有费用信息，返回 0 |

---

## 🔧 实施步骤（参考实现）

---

### 步骤2：在生成行程时自动计算总费用 ✅

**已实现位置：** 行程生成服务

**已实现的方法：**
- ✅ `validateAndTransformResponse()` - 生成行程时使用 `CostCalculator` 计算总费用
  - 覆盖 AI 返回的值，确保准确性

**实现效果：**
- 所有生成的行程都会自动计算总费用
- 确保总费用准确，不受 AI 返回值影响

---

### 步骤3：在更新活动时自动重新计算总费用 ✅

**已实现位置：** 活动更新服务

**已实现的方法：**
- ✅ `updateJourneyDayActivity()` - 更新活动费用或 locationDetails 后自动重新计算总费用

**实现效果：**
- 每次更新活动费用时，总费用自动更新
- 确保总费用始终准确

---

### 步骤4：创建重新计算总费用的接口 ✅

**已实现位置：** API路由

**已实现的接口：**
- ✅ `POST /api/v1/journeys/:journeyId/recalculate-cost` - 重新计算总费用接口
- ✅ `recalculateJourneyTotalCost()` - 公共方法，供接口调用
- ✅ `RecalculateTotalCostResponseDto` - 响应 DTO

**实现效果：**
- 提供专门的接口用于手动重新计算总费用
- 可以用于修复数据不一致的情况

---

### 步骤5：在创建和删除活动时也重新计算 ✅

**已实现位置：** 活动管理服务

**已实现的方法：**
- ✅ `createJourneyDayActivity()` - 创建活动后自动重新计算总费用
- ✅ `deleteJourneyDayActivity()` - 删除活动后自动重新计算总费用

**实现效果：**
- 每次创建或删除活动时，总费用自动更新
- 确保总费用始终反映当前活动列表的费用总和

---

### 步骤6：在数据库层面添加触发器（可选）

如果使用关系型数据库，可以在数据库层面添加触发器，自动计算总费用：

```sql
-- PostgreSQL示例
CREATE OR REPLACE FUNCTION calculate_journey_total_cost()
RETURNS TRIGGER AS $$
DECLARE
  new_total_cost NUMERIC;
BEGIN
  -- 计算总费用
  SELECT COALESCE(SUM(
    COALESCE(activity.cost, 0) +
    COALESCE((activity.details->>'pricing'->>'general')::NUMERIC, 0) +
    COALESCE(activity.estimated_cost, 0)
  ), 0)
  INTO new_total_cost
  FROM journeys j
  CROSS JOIN LATERAL jsonb_array_elements(j.days) AS day
  CROSS JOIN LATERAL jsonb_array_elements(day->'activities') AS activity
  WHERE j.id = NEW.id;

  -- 更新总费用
  NEW.total_cost = new_total_cost;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_journey_total_cost
BEFORE INSERT OR UPDATE ON journeys
FOR EACH ROW
EXECUTE FUNCTION calculate_journey_total_cost();
```

---

## ✅ 验证清单

**已完成验证：** 所有场景都已正确处理 ✅

- [x] 生成新行程时，`totalCost` 自动计算
- [x] 创建行程时，`totalCost` 自动计算
- [x] 更新行程时，`totalCost` 自动重新计算
- [x] 更新活动费用时，`totalCost` 自动更新
- [x] 创建活动时，`totalCost` 自动更新
- [x] 删除活动时，`totalCost` 自动更新
- [x] 调用重新计算接口时，`totalCost` 正确更新
- [x] 如果所有活动都没有费用，`totalCost` 为 0
- [x] 费用字段优先级正确（cost > pricing.general > estimatedCost）

**验证结果：**
- ✅ 所有关键操作都已应用自动费用计算
- ✅ 费用计算规则正确实现
- ✅ 重新计算接口正常工作

---

## 📊 测试用例

```typescript
describe('CostCalculator', () => {
  describe('getActivityCost', () => {
    it('应该优先使用cost字段', () => {
      const activity = {
        cost: 100,
        details: { pricing: { general: 50 } },
        estimatedCost: 30
      }
      expect(CostCalculator.getActivityCost(activity)).toBe(100)
    })

    it('应该使用pricing.general作为备选', () => {
      const activity = {
        details: { pricing: { general: 50 } },
        estimatedCost: 30
      }
      expect(CostCalculator.getActivityCost(activity)).toBe(50)
    })

    it('应该使用estimatedCost作为最后备选', () => {
      const activity = {
        estimatedCost: 30
      }
      expect(CostCalculator.getActivityCost(activity)).toBe(30)
    })

    it('如果没有费用信息，应该返回0', () => {
      const activity = {}
      expect(CostCalculator.getActivityCost(activity)).toBe(0)
    })
  })

  describe('calculateTotalCost', () => {
    it('应该正确计算总费用', () => {
      const itinerary = {
        days: [
          {
            activities: [
              { cost: 100 },
              { cost: 50 }
            ]
          },
          {
            activities: [
              { cost: 200 }
            ]
          }
        ]
      }
      expect(CostCalculator.calculateTotalCost(itinerary)).toBe(350)
    })

    it('应该处理空行程', () => {
      const itinerary = { days: [] }
      expect(CostCalculator.calculateTotalCost(itinerary)).toBe(0)
    })
  })
})
```

---

## 🎉 实施效果

**已完成实施！** 现在后端会：

1. ✅ **在生成新行程时自动计算总费用**
   - 使用 `CostCalculator` 计算，覆盖 AI 返回的值
   - 确保总费用准确

2. ✅ **在创建行程时自动计算总费用**
   - 无论是从 AI 生成还是从前端数据创建，都会自动计算

3. ✅ **在更新活动费用时自动重新计算总费用**
   - 每次更新活动费用或 locationDetails 时，总费用自动更新

4. ✅ **在创建活动时自动重新计算总费用**
   - 每次创建新活动时，总费用自动更新

5. ✅ **在删除活动时自动重新计算总费用**
   - 每次删除活动时，总费用自动更新

6. ✅ **提供专门的接口用于手动重新计算总费用**
   - `POST /api/v1/journeys/:journeyId/recalculate-cost`
   - 可以用于修复数据不一致的情况

**前端效果：**
- ✅ 前端可以直接使用后端返回的 `totalCost`，无需计算
- ✅ 总费用始终准确，反映当前活动列表的费用总和
- ✅ 减少前端代码复杂度
- ✅ 提高数据可靠性

---

## 📝 下一步

完成总费用计算后，继续实施：
- [第一部分：数据格式验证和修复](./BACKEND_MIGRATION_GUIDE_PART1.md) ✅
- [第三部分：数据转换逻辑统一](./BACKEND_MIGRATION_GUIDE_PART3.md)
- [第四部分：货币推断和格式化](./BACKEND_MIGRATION_GUIDE_PART4.md)


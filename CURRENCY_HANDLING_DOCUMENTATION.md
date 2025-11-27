# 货币处理逻辑完整文档

## 📋 概述

本文档整理了项目中所有与货币相关的处理逻辑，包括货币获取、格式化、显示等各个环节的实现方式。

---

## 🗂️ 核心文件

### 1. 货币工具文件
**文件路径：** `src/utils/currency.ts`

**功能：** 提供货币相关的核心工具函数

**主要导出：**
- `CurrencyInfo` 接口
- `getCurrencyForDestination()` - 根据目的地获取货币信息
- `formatCurrency()` - 格式化金额显示
- `getAllCurrencies()` - 获取所有可用货币列表
- `getCurrencyByCode()` - 根据货币代码获取货币信息
- `extractCountryFromDestination()` - 从目的地字符串中提取国家信息

---

## 🔧 货币处理逻辑详解

### 一、货币信息获取

#### 1.1 根据目的地获取货币 (`getCurrencyForDestination`)

**优先级顺序：**

1. **提取国家信息**（从括号、逗号等格式）
   - 支持格式：`"北京 (中国)"`、`"Paris, France"`、`"Tokyo - Japan"`
   - 使用 `extractCountryFromDestination()` 函数提取

2. **分词匹配**
   - 将目的地字符串按分隔符（`/`、`,`、`、`、`·`、`|`）分割
   - 逐个匹配国家名称

3. **直接匹配**
   - 整个字符串作为国家名称匹配

4. **模糊匹配**（不区分大小写）
   - 按名称长度排序，优先匹配长名称
   - 支持完整匹配或包含匹配

5. **默认值**
   - 如果所有匹配都失败，返回人民币（CNY）

**代码位置：** `src/utils/currency.ts:263-302`

**使用示例：**
```typescript
import { getCurrencyForDestination } from '@/utils/currency'

const currency = getCurrencyForDestination('冰岛')
// 返回: { code: 'ISK', symbol: 'kr', name: '冰岛克朗' }

const currency2 = getCurrencyForDestination('北京 (中国)')
// 返回: { code: 'CNY', symbol: '¥', name: '人民币' }
```

#### 1.2 根据货币代码获取货币 (`getCurrencyByCode`)

**功能：** 通过 ISO 4217 货币代码（如 'USD'、'CNY'）获取货币信息

**代码位置：** `src/utils/currency.ts:350-353`

**使用示例：**
```typescript
import { getCurrencyByCode } from '@/utils/currency'

const currency = getCurrencyByCode('USD')
// 返回: { code: 'USD', symbol: '$', name: '美元' }
```

#### 1.3 行程整体货币获取 (`getOverallCurrency`)

**文件位置：** `src/components/TravelDetail/ExperienceDay.vue:1777-1850`

**优先级顺序：**

1. **明确的货币代码**
   - `travel.data.currencyCode`
   - `travel.currency`
   - `travel.data.currency`
   - `itineraryData.currencyCode`

2. **明确的国家信息**
   - `travel.data.currentCountry`
   - `travel.data.locationCountries[location]`

3. **从目的地字符串提取**
   - `destination` 或 `travel.location`
   - 使用 `getCurrencyForDestination()` 提取

4. **从活动位置推断**
   - 遍历行程中的所有活动位置
   - 尝试从每个活动的位置信息推断货币

5. **默认值**
   - 返回人民币（CNY）

#### 1.4 活动货币获取 (`getSlotCurrency`)

**文件位置：** `src/components/TravelDetail/ExperienceDay.vue:1710-1749`

**优先级顺序：**

1. **明确的货币代码**
   - `slot.costCurrency`
   - `slot.currency`
   - `slot.details.currency`
   - `slot.details.currencyCode`
   - `slot.details.pricing.currency`
   - `slot.details.pricing.currencyCode`

2. **活动位置信息**
   - `slot.details.address.chinese`
   - `slot.details.address.english`
   - `slot.location`
   - 使用 `getCurrencyForDestination()` 提取

3. **行程整体货币**
   - 如果活动位置无法推断，使用 `getOverallCurrency()`

---

### 二、货币格式化

#### 2.1 金额格式化 (`formatCurrency`)

**文件位置：** `src/utils/currency.ts:307-328`

**功能：** 将数字金额格式化为带货币符号的字符串

**格式化规则：**

1. **处理非数字类型**
   - `null`、`undefined`、空字符串 → `¥0`

2. **类型转换**
   - 字符串转换为数字
   - 无效数字 → `¥0`

3. **小数位处理**
   - **无小数位货币：** JPY、KRW、VND、IDR → 四舍五入到整数
   - **其他货币：** 保留两位小数

**代码示例：**
```typescript
import { formatCurrency } from '@/utils/currency'

formatCurrency(100.5, { code: 'USD', symbol: '$', name: '美元' })
// 返回: "$100.50"

formatCurrency(1000, { code: 'JPY', symbol: '¥', name: '日元' })
// 返回: "¥1000" (无小数位)
```

---

### 三、货币使用场景

#### 3.1 预算管理 (`BudgetManager.vue`)

**文件位置：** `src/components/TravelDetail/BudgetManager.vue`

**货币处理逻辑：**

1. **目的地货币获取**
   ```typescript
   const getDestinationCurrency = computed((): CurrencyInfo => {
     // 1. 从国家代码获取（最准确）
     const countryCode = extractDestinationCountry()
     if (countryCode && PRESET_COUNTRIES[countryCode]) {
       return getCurrencyForDestination(PRESET_COUNTRIES[countryCode].name)
     }
     
     // 2. 从location字段获取
     if (travel.location) {
       const currency = getCurrencyForDestination(travel.location)
       if (currency.code !== 'CNY') return currency
     }
     
     // 3. 从destination字段获取
     const destination = travel.data?.itineraryData?.destination || travel.location
     if (destination) {
       return getCurrencyForDestination(destination)
     }
     
     // 4. 默认返回人民币
     return { code: 'CNY', symbol: '¥', name: '人民币' }
   })
   ```

2. **支出货币选择**
   - 默认使用目的地货币
   - 支持手动选择其他货币
   - 支出列表显示时，如果货币与目的地货币不同，会显示货币代码

3. **支出创建/更新**
   - 默认 `currencyCode` 为目的地货币代码
   - 如果用户选择了其他货币，使用选择的货币代码

**关键代码位置：**
- 目的地货币获取：`BudgetManager.vue:800-863`
- 支出表单：`BudgetManager.vue:615-626`
- 货币选择器：`BudgetManager.vue:157-161`

#### 3.2 行程详情 (`ExperienceDay.vue`)

**文件位置：** `src/components/TravelDetail/ExperienceDay.vue`

**货币处理逻辑：**

1. **总费用显示**
   - 使用 `getOverallCurrency()` 获取行程整体货币
   - 使用 `formatCurrency()` 格式化显示

2. **活动费用显示**
   - 每个活动使用 `getSlotCurrency()` 获取货币
   - 优先使用活动自己的货币，否则使用行程整体货币

3. **费用汇总**
   - 按活动货币分别汇总
   - 如果货币不同，分别显示

**关键代码位置：**
- 行程整体货币：`ExperienceDay.vue:1777-1850`
- 活动货币：`ExperienceDay.vue:1710-1749`
- 总费用格式化：`ExperienceDay.vue:2009-2022`

#### 3.3 旅伴管理 (`MemberManagement.vue`)

**文件位置：** `src/components/TravelDetail/MemberManagement.vue`

**货币处理逻辑：**

1. **成本分摊显示**
   - 使用目的地货币格式化成员成本
   - 货币获取逻辑与 `BudgetManager` 相同

**关键代码位置：**
- 目的地货币获取：`MemberManagement.vue:463-504`
- 金额格式化：`MemberManagement.vue:506-509`

#### 3.4 行程列表 (`TravelListView.vue`)

**文件位置：** `src/views/TravelListView.vue`

**货币处理逻辑：**

1. **预算显示**
   - 根据行程目的地获取货币
   - 使用 `formatCurrency()` 格式化显示

**关键代码位置：** `TravelListView.vue:635-645`

#### 3.5 灵感模式 (`InspirationHero.vue`)

**文件位置：** `src/components/TravelDetail/InspirationHero.vue`

**货币处理逻辑：**

1. **预算范围显示**
   - 根据选中的目的地获取货币
   - 如果没有选中目的地，默认使用人民币

**关键代码位置：** `InspirationHero.vue:724`

---

### 四、货币数据存储

#### 4.1 后端接口

**支出接口 (`itineraryAPI.ts`)**

**字段定义：**
```typescript
interface Expense {
  currencyCode: string  // ISO 4217 货币代码，必填
  amount: number        // 金额
  // ... 其他字段
}
```

**默认值处理：**
- 创建支出时，如果未指定 `currencyCode`，默认使用目的地货币代码
- 更新支出时，如果未指定 `currencyCode`，保持原有值或使用目的地货币代码

**代码位置：** `src/services/itineraryAPI.ts:2001-2410`

#### 4.2 前端数据模型

**Travel 对象**
- `travel.data.currencyCode` - 行程货币代码（可选）
- `travel.currency` - 行程货币（可选）

**ItineraryData**
- `itineraryData.currencyCode` - 行程数据货币代码（可选）

**TimeSlot**
- `slot.costCurrency` - 活动费用货币（可选）
- `slot.currency` - 活动货币（可选）
- `slot.details.currencyCode` - 详情货币代码（可选）
- `slot.details.pricing.currencyCode` - 价格货币代码（可选）

---

### 五、货币映射表

#### 5.1 支持的国家/地区货币

**文件位置：** `src/utils/currency.ts:12-192`

**已支持货币列表：**

| 国家/地区 | 货币代码 | 货币符号 | 货币名称 |
|----------|---------|---------|---------|
| 中国 | CNY | ¥ | 人民币 |
| 日本 | JPY | ¥ | 日元 |
| 韩国 | KRW | ₩ | 韩元 |
| 美国 | USD | $ | 美元 |
| 欧元区 | EUR | € | 欧元 |
| 瑞士 | CHF | CHF | 瑞士法郎 |
| 英国 | GBP | £ | 英镑 |
| 泰国 | THB | ฿ | 泰铢 |
| 新加坡 | SGD | S$ | 新加坡元 |
| 马来西亚 | MYR | RM | 马来西亚林吉特 |
| 印度尼西亚 | IDR | Rp | 印尼盾 |
| 越南 | VND | ₫ | 越南盾 |
| 澳大利亚 | AUD | A$ | 澳元 |
| 新西兰 | NZD | NZ$ | 新西兰元 |
| 印度 | INR | ₹ | 印度卢比 |
| 俄罗斯 | RUB | ₽ | 俄罗斯卢布 |
| 土耳其 | TRY | ₺ | 土耳其里拉 |
| 埃及 | EGP | E£ | 埃及镑 |
| 巴西 | BRL | R$ | 巴西雷亚尔 |
| 墨西哥 | MXN | Mex$ | 墨西哥比索 |
| 加拿大 | CAD | C$ | 加元 |
| 阿根廷 | ARS | $ | 阿根廷比索 |
| 智利 | CLP | $ | 智利比索 |
| 秘鲁 | PEN | S/ | 秘鲁索尔 |
| 哥伦比亚 | COP | $ | 哥伦比亚比索 |
| 尼泊尔 | NPR | ₨ | 尼泊尔卢比 |
| 冰岛 | ISK | kr | 冰岛克朗 |
| 挪威 | NOK | kr | 挪威克朗 |
| 瑞典 | SEK | kr | 瑞典克朗 |
| 丹麦 | DKK | kr | 丹麦克朗 |
| 法属波利尼西亚 | XPF | F | 太平洋法郎 |
| 波兰 | PLN | zł | 波兰兹罗提 |
| 捷克 | CZK | Kč | 捷克克朗 |
| 匈牙利 | HUF | Ft | 匈牙利福林 |
| 南非 | ZAR | R | 南非兰特 |

**注意：** 映射表支持多种格式的国家名称（中文、英文、国家代码）

#### 5.2 国家配置 (`constants/countries.ts`)

**文件位置：** `src/constants/countries.ts`

**功能：** 提供国家信息配置，包括货币代码

**使用示例：**
```typescript
import { PRESET_COUNTRIES } from '@/constants/countries'

const country = PRESET_COUNTRIES['CN']
// { name: '中国', code: 'CN', currency: 'CNY', ... }
```

---

### 六、用户偏好

#### 6.1 用户货币偏好

**文件位置：** `src/config/userProfile.ts:217-220`

**功能：** 获取用户偏好的货币代码

**默认值：** `'CNY'`（人民币）

**使用示例：**
```typescript
import { getUserPreferredCurrency } from '@/config/userProfile'

const preferredCurrency = getUserPreferredCurrency()
// 返回: 'CNY' 或用户设置的货币代码
```

**注意：** 当前项目中用户货币偏好主要用于配置，实际显示仍以目的地货币为主。

---

### 七、特殊处理

#### 7.1 无小数位货币

**货币代码：** `JPY`、`KRW`、`VND`、`IDR`

**处理逻辑：**
- 格式化时不显示小数位
- 金额四舍五入到整数

**代码位置：** `src/utils/currency.ts:321-324`

#### 7.2 中国地区特殊处理

**关键词检测：** `['中国', 'China', 'CN']`

**处理逻辑：**
- 当目的地包含中国相关关键词时，明确返回人民币
- 避免因匹配失败而返回默认值

**代码位置：** 
- `src/utils/travelConstants.ts:110-112`
- `src/components/TravelDetail/ExperienceDay.vue:1742, 1798, 1818`

#### 7.3 货币代码解析 (`resolveCurrencyByCode`)

**文件位置：** `src/components/TravelDetail/ExperienceDay.vue:1697-1710`

**功能：** 解析各种格式的货币代码

**支持格式：**
- 字符串：`'USD'`
- 对象：`{ code: 'USD' }`
- 嵌套对象：递归解析

---

## 📊 数据流图

### 货币获取流程

```
用户输入目的地
    ↓
getCurrencyForDestination()
    ↓
提取国家信息 (extractCountryFromDestination)
    ↓
匹配货币映射表 (countryCurrencyMap)
    ↓
返回 CurrencyInfo { code, symbol, name }
    ↓
formatCurrency(amount, currencyInfo)
    ↓
格式化显示 (带货币符号的字符串)
```

### 支出货币处理流程

```
创建/编辑支出
    ↓
获取目的地货币 (getDestinationCurrency)
    ↓
用户选择货币 (可选，默认目的地货币)
    ↓
保存到后端 (currencyCode: string)
    ↓
显示时根据 currencyCode 格式化
    ↓
如果与目的地货币不同，显示货币代码
```

---

## 🔍 使用场景汇总

### 场景1：预算管理
- **获取货币：** 根据行程目的地
- **显示位置：** 预算总额、已花费、支出列表
- **特殊处理：** 支持每笔支出使用不同货币

### 场景2：行程详情
- **获取货币：** 
  - 整体：根据行程目的地
  - 活动：根据活动位置或使用整体货币
- **显示位置：** 总费用、活动费用、价格信息

### 场景3：旅伴管理
- **获取货币：** 根据行程目的地
- **显示位置：** 成员成本分摊

### 场景4：行程列表
- **获取货币：** 根据每个行程的目的地
- **显示位置：** 行程卡片中的预算显示

---

## ⚠️ 注意事项

### 1. 默认货币
- **默认值：** 人民币（CNY）
- **触发条件：** 无法从目的地推断货币时

### 2. 货币代码格式
- **标准：** ISO 4217 货币代码（3位大写字母）
- **示例：** `USD`、`CNY`、`EUR`

### 3. 金额计算
- **注意：** 不同货币的金额不能直接相加
- **建议：** 需要汇总时，先转换为同一货币（当前未实现汇率转换）

### 4. 后端接口
- **支出接口：** `currencyCode` 字段为必填
- **默认值：** 如果未提供，后端可能使用 `'USD'`（需确认后端实现）

### 5. 货币选择器
- **位置：** `BudgetManager.vue` 支出表单
- **数据源：** `getAllCurrencies()` 返回所有支持的货币

---

## 🛠️ 工具函数汇总

### 核心函数

| 函数名 | 文件位置 | 功能 | 返回值 |
|--------|---------|------|--------|
| `getCurrencyForDestination()` | `utils/currency.ts:263` | 根据目的地获取货币 | `CurrencyInfo` |
| `formatCurrency()` | `utils/currency.ts:307` | 格式化金额 | `string` |
| `getCurrencyByCode()` | `utils/currency.ts:350` | 根据代码获取货币 | `CurrencyInfo \| null` |
| `getAllCurrencies()` | `utils/currency.ts:333` | 获取所有货币列表 | `CurrencyInfo[]` |
| `extractCountryFromDestination()` | `utils/currency.ts:226` | 提取国家信息 | `string \| null` |

### 组件内函数

| 函数名 | 文件位置 | 功能 |
|--------|---------|------|
| `getOverallCurrency()` | `ExperienceDay.vue:1777` | 获取行程整体货币 |
| `getSlotCurrency()` | `ExperienceDay.vue:1710` | 获取活动货币 |
| `resolveCurrencyByCode()` | `ExperienceDay.vue:1697` | 解析货币代码 |
| `getDestinationCurrency` (computed) | `BudgetManager.vue:800` | 获取目的地货币 |
| `getDestinationCurrency` (computed) | `MemberManagement.vue:463` | 获取目的地货币 |

---

## 📝 相关文件清单

### 核心工具
- ✅ `src/utils/currency.ts` - 货币工具函数
- ✅ `src/constants/countries.ts` - 国家配置（包含货币信息）
- ✅ `src/utils/travelConstants.ts` - 旅行常量（包含货币默认值）

### 组件使用
- ✅ `src/components/TravelDetail/BudgetManager.vue` - 预算管理
- ✅ `src/components/TravelDetail/MemberManagement.vue` - 旅伴管理
- ✅ `src/components/TravelDetail/ExperienceDay.vue` - 行程详情
- ✅ `src/components/TravelDetail/ExperienceDay/slotFormatters.ts` - 活动格式化
- ✅ `src/components/TravelDetail/InspirationHero.vue` - 灵感模式
- ✅ `src/views/TravelListView.vue` - 行程列表

### API 接口
- ✅ `src/services/itineraryAPI.ts` - 行程API（包含支出接口）

### 配置
- ✅ `src/config/userProfile.ts` - 用户配置（包含货币偏好）

### 类型定义
- ✅ `src/types/booking.ts` - 预订类型（包含货币字段）
- ✅ `src/types/location.ts` - 位置类型（可能包含货币信息）

---

## 🔄 货币处理最佳实践

### 1. 获取货币时
```typescript
// ✅ 推荐：使用工具函数
import { getCurrencyForDestination } from '@/utils/currency'
const currency = getCurrencyForDestination(destination)

// ❌ 不推荐：硬编码
const currency = { code: 'USD', symbol: '$', name: '美元' }
```

### 2. 格式化金额时
```typescript
// ✅ 推荐：使用工具函数
import { formatCurrency } from '@/utils/currency'
const formatted = formatCurrency(amount, currency)

// ❌ 不推荐：手动拼接
const formatted = `${currency.symbol}${amount}`
```

### 3. 存储货币时
```typescript
// ✅ 推荐：存储货币代码
expense.currencyCode = 'USD'

// ❌ 不推荐：存储货币对象
expense.currency = { code: 'USD', symbol: '$', name: '美元' }
```

### 4. 显示货币时
```typescript
// ✅ 推荐：根据代码获取货币信息
const currency = getCurrencyByCode(expense.currencyCode) || defaultCurrency
const formatted = formatCurrency(expense.amount, currency)
```

---

## 🚀 未来优化建议

### 1. 汇率转换
- 实现多货币金额的汇率转换
- 支持实时汇率API
- 允许用户选择基准货币

### 2. 货币缓存
- 缓存目的地到货币的映射结果
- 减少重复计算

### 3. 货币选择优化
- 在支出表单中，根据位置自动选择货币
- 支持货币历史记录

### 4. 后端集成
- 确保后端接口的货币代码格式一致
- 统一默认货币处理逻辑

### 5. 国际化
- 货币名称支持多语言
- 货币符号根据地区显示

---

## 📚 参考资料

- **ISO 4217 货币代码标准：** https://www.iso.org/iso-4217-currency-codes.html
- **货币符号 Unicode：** https://www.unicode.org/charts/PDF/U20A0.pdf

---

## 🔄 货币处理流程图

### 支出创建流程
```
用户填写支出表单
    ↓
获取目的地货币 (getDestinationCurrency)
    ↓
设置默认货币代码 (expenseForm.currencyCode)
    ↓
用户可选择其他货币 (可选)
    ↓
保存到后端 (currencyCode: string)
    ↓
后端存储 (Expense.currencyCode)
    ↓
显示时根据 currencyCode 格式化
```

### 活动费用显示流程
```
加载活动数据
    ↓
获取活动货币 (getSlotCurrency)
    ├─ 检查 slot.details.currencyCode
    ├─ 检查 slot.details.pricing.currencyCode
    ├─ 从活动位置推断 (getCurrencyForDestination)
    └─ 使用行程整体货币 (getOverallCurrency)
    ↓
格式化显示 (formatCurrency)
```

---

## 📋 货币字段映射表

### 前端数据模型中的货币字段

| 数据模型 | 字段路径 | 类型 | 说明 |
|---------|---------|------|------|
| Travel | `data.currencyCode` | `string?` | 行程货币代码 |
| Travel | `currency` | `string?` | 行程货币（旧字段） |
| ItineraryData | `currencyCode` | `string?` | 行程数据货币代码 |
| TimeSlot | `costCurrency` | `string?` | 活动费用货币 |
| TimeSlot | `currency` | `string?` | 活动货币（旧字段） |
| TimeSlot | `details.currencyCode` | `string?` | 详情货币代码 |
| TimeSlot | `details.currency` | `string?` | 详情货币（旧字段） |
| TimeSlot | `details.pricing.currencyCode` | `string?` | 价格货币代码 |
| TimeSlot | `details.pricing.currency` | `string?` | 价格货币（旧字段） |
| Expense | `currencyCode` | `string` | 支出货币代码（必填） |

### 后端接口中的货币字段

| 接口 | 字段 | 类型 | 必填 | 默认值 |
|------|------|------|------|--------|
| 创建支出 | `currencyCode` | `string?` | 否 | `'USD'` |
| 更新支出 | `currencyCode` | `string?` | 否 | 保持原值 |
| 支出响应 | `currencyCode` | `string` | 是 | - |

---

## ✅ 检查清单

使用货币功能时，请确保：

- [ ] 使用 `getCurrencyForDestination()` 获取货币，而不是硬编码
- [ ] 使用 `formatCurrency()` 格式化金额，而不是手动拼接
- [ ] 存储时使用货币代码（字符串），而不是货币对象
- [ ] 处理无小数位货币（JPY、KRW、VND、IDR）的特殊情况
- [ ] 提供默认货币（CNY）作为回退
- [ ] 在支出接口中正确传递 `currencyCode` 字段
- [ ] 支出列表显示时，如果货币与目的地货币不同，显示货币代码
- [ ] 确保货币选择器使用 `getAllCurrencies()` 获取所有可用货币

---

## 🐛 已知问题

### 1. 多货币汇总
**问题：** 当前不支持不同货币的金额汇总  
**影响：** 如果行程中有多种货币的支出，总金额计算可能不准确  
**建议：** 需要实现汇率转换功能

### 2. 后端默认货币
**问题：** 后端接口文档显示默认货币为 `'USD'`，但前端默认使用目的地货币  
**影响：** 如果前端未传递 `currencyCode`，后端可能使用 `'USD'`  
**建议：** 确保前端始终传递 `currencyCode` 字段

### 3. 货币代码大小写
**问题：** 部分地方可能使用小写货币代码  
**建议：** 统一使用大写货币代码（ISO 4217 标准）

---

**文档版本：** 1.0  
**最后更新：** 2025-01-27  
**维护者：** AI Travel Companion Team


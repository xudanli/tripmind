# 签证信息后端迁移方案

## 1. 概述

签证信息本质上是一个需要频繁维护的数据库，更适合放在后端管理。当前实现将签证数据硬编码在前端 `src/config/visa.ts` 中，存在以下问题：

- **维护困难**：每次更新签证政策都需要修改代码并重新部署
- **数据量大**：支持更多国家时，文件会变得很大，影响前端打包体积
- **更新不及时**：签证政策经常变化，前端静态数据难以实时更新
- **缺乏管理界面**：只能通过代码修改，无法通过管理后台维护
- **数据版本管理**：无法追踪数据变更历史

## 2. 数据库设计

### 2.1 表结构设计

#### `visa_policies` 表（签证政策主表）

```sql
CREATE TABLE visa_policies (
  id SERIAL PRIMARY KEY,
  destination_country_code VARCHAR(2) NOT NULL,  -- ISO 3166-1 alpha-2 国家代码
  destination_country_name VARCHAR(100) NOT NULL, -- 国家名称（中文）
  applicant_type VARCHAR(20) NOT NULL,            -- 申请人类型: 'nationality' | 'permanent_resident'
  applicant_country_code VARCHAR(2) NOT NULL,     -- 申请人国籍/永久居民国家代码
  applicant_description VARCHAR(100) NOT NULL,   -- 申请人描述（如：中国护照、美国永久居民）
  visa_type VARCHAR(20) NOT NULL,                 -- 签证类型: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required' | 'permanent-resident-benefit'
  description TEXT,                                -- 详细说明
  duration_days INTEGER,                           -- 停留期限（天数）
  application_url TEXT,                            -- 申请链接
  is_active BOOLEAN DEFAULT true,                  -- 是否生效
  effective_date DATE,                             -- 生效日期
  expiry_date DATE,                                -- 失效日期（可选）
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),                         -- 更新人
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(destination_country_code, applicant_type, applicant_country_code)
);

-- 索引
CREATE INDEX idx_visa_policies_destination ON visa_policies(destination_country_code);
CREATE INDEX idx_visa_policies_applicant ON visa_policies(applicant_type, applicant_country_code);
CREATE INDEX idx_visa_policies_active ON visa_policies(is_active, effective_date, expiry_date);
```

#### `visa_unions` 表（签证联盟表）

```sql
CREATE TABLE visa_unions (
  id SERIAL PRIMARY KEY,
  union_key VARCHAR(50) UNIQUE NOT NULL,  -- 联盟标识: 'schengen', 'asean', 'gcc'
  union_name VARCHAR(100) NOT NULL,         -- 联盟名称（中文）
  visa_name VARCHAR(100) NOT NULL,         -- 签证名称（如：申根签证）
  description TEXT,                         -- 联盟说明
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE visa_union_countries (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES visa_unions(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL,        -- 国家代码
  country_name VARCHAR(100) NOT NULL,     -- 国家名称
  UNIQUE(union_id, country_code)
);

CREATE INDEX idx_visa_union_countries_union ON visa_union_countries(union_id);
CREATE INDEX idx_visa_union_countries_country ON visa_union_countries(country_code);
```

#### `visa_policy_history` 表（历史记录表，用于审计）

```sql
CREATE TABLE visa_policy_history (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,             -- 'created' | 'updated' | 'deleted'
  old_data JSONB,                          -- 变更前的数据
  new_data JSONB,                          -- 变更后的数据
  changed_by VARCHAR(100),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visa_policy_history_policy ON visa_policy_history(policy_id);
CREATE INDEX idx_visa_policy_history_date ON visa_policy_history(changed_at);
```

### 2.2 数据迁移脚本

将现有的 `src/config/visa.ts` 中的数据迁移到数据库：

```typescript
// scripts/migrate-visa-data.ts
import { VISA_INFO, VISA_UNIONS } from '../src/config/visa'

async function migrateVisaData() {
  // 1. 迁移签证联盟数据
  for (const [unionKey, unionData] of Object.entries(VISA_UNIONS)) {
    await insertVisaUnion(unionKey, unionData)
  }
  
  // 2. 迁移签证政策数据
  for (const [destinationCode, policies] of Object.entries(VISA_INFO)) {
    for (const [applicantKey, visaInfos] of Object.entries(policies)) {
      const [applicantType, applicantCode] = parseApplicantKey(applicantKey)
      
      for (const visaInfo of visaInfos) {
        await insertVisaPolicy({
          destination_country_code: visaInfo.destinationCountry,
          destination_country_name: visaInfo.destinationName,
          applicant_type: applicantType,
          applicant_country_code: applicantCode,
          applicant_description: visaInfo.applicableTo,
          visa_type: visaInfo.visaType,
          description: visaInfo.description,
          duration_days: visaInfo.duration,
          application_url: visaInfo.applicationUrl,
          is_active: true,
          effective_date: new Date()
        })
      }
    }
  }
}

function parseApplicantKey(key: string): ['nationality' | 'permanent_resident', string] {
  if (key.endsWith('-PR')) {
    return ['permanent_resident', key.replace('-PR', '')]
  }
  return ['nationality', key]
}
```

## 3. 后端 API 设计

### 3.1 NestJS 模块结构

```
src/
  modules/
    visa/
      visa.module.ts
      visa.controller.ts
      visa.service.ts
      entities/
        visa-policy.entity.ts
        visa-union.entity.ts
      dto/
        get-visa-info.dto.ts
        create-visa-policy.dto.ts
        update-visa-policy.dto.ts
      repositories/
        visa-policy.repository.ts
```

### 3.2 API 端点

#### 3.2.1 查询签证信息

```typescript
// GET /api/visa/info
// 查询指定目的地的签证信息
interface GetVisaInfoQuery {
  destinationCountry: string        // 目的地国家代码
  nationalityCode?: string          // 用户国籍代码（可选）
  permanentResidencyCode?: string  // 永久居民身份国家代码（可选）
}

interface GetVisaInfoResponse {
  success: boolean
  data: VisaInfo[]
  message?: string
}
```

#### 3.2.2 多目的地签证分析

```typescript
// POST /api/visa/multi-destination-analysis
interface MultiDestinationAnalysisRequest {
  destinationCountries: string[]    // 目的地国家代码数组
  nationalityCode?: string
  permanentResidencyCode?: string
}

interface MultiDestinationAnalysisResponse {
  success: boolean
  data: {
    allCountries: string[]
    requiredVisas: Array<{
      name: string
      description: string
      countries: string[]
      visaInfo: VisaInfo[]
    }>
    groupedByUnion: Record<string, {
      unionName: string
      description: string
      countries: string[]
    }>
    summary: string
  }
}
```

#### 3.2.3 管理接口（需要认证）

```typescript
// GET /api/visa/admin/policies
// 获取所有签证政策（分页、筛选）

// POST /api/visa/admin/policies
// 创建新的签证政策

// PUT /api/visa/admin/policies/:id
// 更新签证政策

// DELETE /api/visa/admin/policies/:id
// 删除签证政策（软删除）

// GET /api/visa/admin/policies/:id/history
// 获取政策变更历史
```

### 3.3 服务层实现示例

```typescript
// visa.service.ts
@Injectable()
export class VisaService {
  constructor(
    @InjectRepository(VisaPolicy)
    private visaPolicyRepository: Repository<VisaPolicy>,
    @InjectRepository(VisaUnion)
    private visaUnionRepository: Repository<VisaUnion>
  ) {}

  async getVisaInfo(
    destinationCountry: string,
    nationalityCode?: string,
    permanentResidencyCode?: string
  ): Promise<VisaInfo[]> {
    const query = this.visaPolicyRepository
      .createQueryBuilder('policy')
      .where('policy.destination_country_code = :code', { code: destinationCountry })
      .andWhere('policy.is_active = true')
      .andWhere('(policy.effective_date IS NULL OR policy.effective_date <= :now)', { now: new Date() })
      .andWhere('(policy.expiry_date IS NULL OR policy.expiry_date >= :now)', { now: new Date() })

    const results: VisaInfo[] = []

    // 优先查询永久居民身份
    if (permanentResidencyCode) {
      const prPolicies = await query
        .andWhere('policy.applicant_type = :type', { type: 'permanent_resident' })
        .andWhere('policy.applicant_country_code = :code', { code: permanentResidencyCode })
        .getMany()
      
      results.push(...prPolicies.map(this.mapToVisaInfo))
    }

    // 查询国籍信息
    if (nationalityCode) {
      const nationalityPolicies = await query
        .andWhere('policy.applicant_type = :type', { type: 'nationality' })
        .andWhere('policy.applicant_country_code = :code', { code: nationalityCode })
        .getMany()
      
      results.push(...nationalityPolicies.map(this.mapToVisaInfo))
    }

    return results
  }

  async analyzeMultiDestinationVisa(
    destinationCountries: string[],
    nationalityCode?: string,
    permanentResidencyCode?: string
  ): Promise<MultiDestinationVisaResult> {
    // 实现多目的地签证分析逻辑
    // 1. 查询所有目的地的签证信息
    // 2. 识别签证联盟（申根、东盟等）
    // 3. 生成分析结果
  }

  private mapToVisaInfo(policy: VisaPolicy): VisaInfo {
    return {
      destinationCountry: policy.destination_country_code,
      destinationName: policy.destination_country_name,
      visaType: policy.visa_type as VisaType,
      applicableTo: policy.applicant_description,
      description: policy.description,
      duration: policy.duration_days,
      applicationUrl: policy.application_url
    }
  }
}
```

## 4. 前端迁移步骤

### 4.1 创建 API 服务

```typescript
// src/services/visaAPI.ts
import { apiClient } from '@/config/api'

export interface GetVisaInfoParams {
  destinationCountry: string
  nationalityCode?: string
  permanentResidencyCode?: string
}

export async function getVisaInfo(params: GetVisaInfoParams): Promise<VisaInfo[]> {
  const response = await apiClient.get('/api/visa/info', { params })
  return response.data.data
}

export async function analyzeMultiDestinationVisa(
  destinationCountries: string[],
  nationalityCode?: string,
  permanentResidencyCode?: string
): Promise<MultiDestinationVisaResult> {
  const response = await apiClient.post('/api/visa/multi-destination-analysis', {
    destinationCountries,
    nationalityCode,
    permanentResidencyCode
  })
  return response.data.data
}
```

### 4.2 更新前端调用

```typescript
// src/config/visa.ts
// 保留类型定义，但移除 VISA_INFO 常量
// 添加向后端 API 的调用

import { getVisaInfo as getVisaInfoFromAPI } from '@/services/visaAPI'

export async function getVisaInfo(
  destinationCountry: string,
  nationalityCode?: string | null,
  permanentResidencyCode?: string | null
): Promise<VisaInfo[]> {
  // 如果配置了后端 API，使用后端
  if (import.meta.env.VITE_API_BASE_URL) {
    return getVisaInfoFromAPI({
      destinationCountry,
      nationalityCode: nationalityCode || undefined,
      permanentResidencyCode: permanentResidencyCode || undefined
    })
  }
  
  // 否则使用前端静态数据（向后兼容）
  return getVisaInfoFromStaticData(destinationCountry, nationalityCode, permanentResidencyCode)
}
```

### 4.3 渐进式迁移

1. **阶段1**：后端 API 和前端静态数据并存，通过环境变量切换
2. **阶段2**：前端优先调用后端 API，失败时回退到静态数据
3. **阶段3**：完全移除前端静态数据，只使用后端 API

## 5. 管理后台设计

### 5.1 功能需求

- **签证政策管理**
  - 列表展示（支持筛选、搜索、分页）
  - 创建/编辑/删除签证政策
  - 批量导入/导出
  - 数据验证（国家代码、日期范围等）

- **签证联盟管理**
  - 管理签证联盟（申根、东盟等）
  - 管理联盟成员国

- **数据审计**
  - 查看变更历史
  - 数据版本对比
  - 回滚功能

- **数据统计**
  - 政策覆盖情况
  - 更新频率统计
  - 热门目的地查询统计

### 5.2 技术实现建议

- 使用 Ant Design Pro 或类似的管理后台框架
- 实现权限控制（管理员、编辑者等角色）
- 支持数据导入/导出（Excel、CSV）
- 集成数据验证和提示

## 6. 数据更新策略

### 6.1 定期更新

- 设置定时任务，定期检查签证政策变更
- 集成第三方签证数据源（如 Timatic、IATA）
- 支持手动触发更新

### 6.2 数据来源

- **官方渠道**：各国使领馆官网、移民局网站
- **第三方服务**：Timatic、IATA Travel Centre API
- **用户反馈**：允许用户报告过时信息

## 7. 缓存策略

### 7.1 Redis 缓存

```typescript
// 缓存键设计
const CACHE_KEYS = {
  visaInfo: (country: string, nationality?: string, pr?: string) => 
    `visa:info:${country}:${nationality || 'none'}:${pr || 'none'}`,
  multiDestination: (countries: string[]) => 
    `visa:multi:${countries.sort().join(',')}`
}

// 缓存时间
const CACHE_TTL = {
  visaInfo: 24 * 60 * 60,        // 24小时
  multiDestination: 12 * 60 * 60  // 12小时
}
```

### 7.2 缓存失效

- 当签证政策更新时，清除相关缓存
- 支持手动清除缓存
- 设置缓存预热机制

## 8. 实施计划

### 阶段1：后端基础建设（1-2周）
- [ ] 创建数据库表结构
- [ ] 实现 NestJS 模块和基础 API
- [ ] 数据迁移脚本
- [ ] 单元测试

### 阶段2：前端集成（1周）
- [ ] 创建前端 API 服务
- [ ] 更新前端调用逻辑
- [ ] 实现向后兼容
- [ ] 集成测试

### 阶段3：管理后台（2-3周）
- [ ] 设计管理界面
- [ ] 实现 CRUD 功能
- [ ] 权限控制
- [ ] 数据导入/导出

### 阶段4：优化和监控（1周）
- [ ] 实现缓存策略
- [ ] 性能优化
- [ ] 监控和告警
- [ ] 文档完善

## 9. 注意事项

1. **向后兼容**：迁移过程中确保现有功能不受影响
2. **数据一致性**：确保数据库数据和前端静态数据的一致性
3. **性能考虑**：合理使用缓存，避免频繁查询数据库
4. **安全性**：管理接口需要认证和授权
5. **数据备份**：定期备份数据库，支持数据恢复

## 10. 总结

将签证信息迁移到后端可以带来以下好处：

- ✅ **易于维护**：通过管理后台更新数据，无需重新部署
- ✅ **实时更新**：可以及时更新签证政策变化
- ✅ **数据管理**：支持版本控制、审计、统计分析
- ✅ **扩展性强**：可以支持更多功能（多语言、用户反馈等）
- ✅ **性能优化**：通过缓存和数据库索引提升查询性能

建议优先实施阶段1和阶段2，快速获得后端管理能力，然后逐步完善管理后台功能。


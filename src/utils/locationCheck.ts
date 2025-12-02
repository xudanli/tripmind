/**
 * 位置信息检查工具函数
 * 用于判断活动是否已有完整的位置信息，避免重复调用 API
 */

export interface LocationDetails {
  tripAdvisorId?: string
  location?: any
  coordinates?: any
  address?: any
  name?: any
  pricing?: { detail?: string }
}

/**
 * 检查位置对象是否有有效的坐标
 */
function hasValidCoordinates(loc: any): boolean {
  if (!loc || typeof loc !== 'object') return false
  // 检查是否有 lat 和 lng，且都是有效数字
  const lat = loc.lat ?? loc.latitude
  const lng = loc.lng ?? loc.longitude
  return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)
}

/**
 * 检查地址对象是否有实际内容
 */
function hasValidAddress(addr: any): boolean {
  if (!addr) return false
  // 如果是字符串，检查是否非空
  if (typeof addr === 'string') {
    return addr.trim().length > 0
  }
  // 如果是对象，检查是否有任何地址字段（chinese, english, local 等）
  if (typeof addr === 'object') {
    return !!(addr.chinese || addr.english || addr.local)
  }
  return false
}

/**
 * 检查名称对象是否有实际内容
 */
function hasValidName(name: any): boolean {
  if (!name) return false
  // 如果是字符串，检查是否非空
  if (typeof name === 'string') {
    return name.trim().length > 0
  }
  // 如果是对象，检查是否有任何名称字段（chinese, english, local 等）
  if (typeof name === 'object') {
    return !!(name.chinese || name.english || name.local)
  }
  return false
}

/**
 * 判断活动是否已有完整的位置信息
 * 
 * 判断逻辑（满足任一条件即认为有完整信息）：
 * 1. 有 TripAdvisor ID 且有有效位置数据（有效坐标或有效地址）
 * 2. 有有效地址且有有效名称
 * 3. 有有效坐标且有有效名称
 * 4. 有价格详情且有有效地址（特殊兜底）
 * 
 * **重要**：空对象 `{}` 不会被判定为有效，必须包含实际内容。
 * - 坐标必须包含有效的 `lat`/`lng` 数字
 * - 地址必须包含 `chinese`、`english` 或 `local` 字段，或为非空字符串
 * - 名称必须包含 `chinese`、`english` 或 `local` 字段，或为非空字符串
 * 
 * @param details 活动的 details 对象
 * @returns 如果已有完整位置信息返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * // 有效的位置信息
 * const slot1 = {
 *   details: {
 *     tripAdvisorId: "123456",
 *     location: { lat: 64.1419, lng: -21.9274 },
 *     address: { chinese: "冰岛雷克雅未克" }
 *   }
 * }
 * hasCompleteLocationInfo(slot1.details) // true
 * 
 * // 无效的位置信息（空对象）
 * const slot2 = {
 *   details: {
 *     location: {},  // 空对象
 *     address: {}    // 空对象
 *   }
 * }
 * hasCompleteLocationInfo(slot2.details) // false
 * 
 * // 无效的位置信息（位置字段为空字符串）
 * const slot3 = {
 *   details: {
 *     address: { chinese: "" }  // 空字符串
 *   }
 * }
 * hasCompleteLocationInfo(slot3.details) // false
 * ```
 */
export function hasCompleteLocationInfo(details: LocationDetails | null | undefined): boolean {
  if (!details) return false

  // 检查位置/坐标是否有有效内容（必须包含有效的 lat/lng 数字）
  const hasLoc = hasValidCoordinates(details.location) || hasValidCoordinates(details.coordinates)
  // 检查地址是否有有效内容（必须包含实际地址文本）
  const hasAddr = hasValidAddress(details.address)
  // 检查名称是否有有效内容（必须包含实际名称文本）
  const hasName = hasValidName(details.name)

  // 1. 外部数据源 (ID + 必须有位置数据)
  // 修正：后端以前只看ID，现在要求必须也有位置，防止前端拿到ID但没坐标无法画图
  if (details.tripAdvisorId && (hasLoc || hasAddr)) {
    return true
  }

  // 2. 地址 + 名称
  if (hasAddr && hasName) {
    return true
  }

  // 3. 坐标 + 名称
  if (hasLoc && hasName) {
    return true
  }

  // 4. 特殊兜底：有价格详情且有地址
  if (details.pricing?.detail && hasAddr) {
    return true
  }

  return false
}


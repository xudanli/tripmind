/**
 * 自动地理编码 Composable
 * 检测默认坐标值，并使用前端 API 自动修正
 */

import { ref } from 'vue'
import { searchPOI } from '@/services/externalAPI'
import type { TimeSlot } from '@/components/TravelDetail/ExperienceDay/types'
import { API_CONFIG } from '@/config/api'

/**
 * 检测坐标是否为默认值
 */
function isDefaultCoordinates(
  coordinates: { lat: number; lng: number } | null | undefined
): boolean {
  if (!coordinates) return true
  const { lat, lng } = coordinates
  // 检测常见的默认值：0,0 或 null
  return (
    (lat === 0 && lng === 0) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
}

/**
 * 从 TimeSlot 中提取搜索关键词
 */
function extractSearchQuery(slot: TimeSlot): string {
  // 优先级：title > activity > details.name
  return (
    slot.title ||
    slot.activity ||
    slot.details?.name?.chinese ||
    slot.details?.name?.english ||
    ''
  )
}

/**
 * 从 TimeSlot 中提取地址信息
 */
function extractAddress(slot: TimeSlot): string {
  return (
    slot.details?.address?.chinese ||
    slot.details?.address?.english ||
    (typeof slot.location === 'string' ? slot.location : '') ||
    ''
  )
}

/**
 * 使用 POI 搜索 API 获取坐标
 */
async function geocodeViaPOI(
  query: string,
  destination?: string,
  category?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    // 映射活动类型到 POI 类别
    const categoryMap: Record<string, string> = {
      attraction: 'attraction',
      restaurant: 'restaurant',
      meal: 'restaurant',
      hotel: 'accommodation',
      accommodation: 'accommodation',
      shopping: 'shopping',
    }

    const poiType = category ? (categoryMap[category] as 'attraction' | 'restaurant' | 'hotel' | 'shopping' | 'all') || 'attraction' : 'attraction'

    console.log('[AutoGeocode] 使用 POI 搜索获取坐标:', { query, destination, poiType })

    const results = await searchPOI({
      query,
      destination: destination || undefined,
      type: poiType,
      limit: 1,
    })

    if (results && results.length > 0) {
      const firstResult = results[0]
      if (firstResult) {
        // POISearchResult 使用 latitude 和 longitude
        if (
          typeof firstResult.latitude === 'number' &&
          typeof firstResult.longitude === 'number'
        ) {
          const coords = {
            lat: firstResult.latitude,
            lng: firstResult.longitude,
          }

          if (!isDefaultCoordinates(coords)) {
            console.log('[AutoGeocode] POI 搜索成功，获取到坐标:', coords)
            return coords
          }
        }
      }
    }

    console.log('[AutoGeocode] POI 搜索未找到有效坐标')
    return null
  } catch (error) {
    console.warn('[AutoGeocode] POI 搜索失败:', error)
    return null
  }
}

/**
 * 使用 Mapbox Geocoding API 获取坐标
 */
async function geocodeViaMapbox(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!API_CONFIG.MAPBOX_ACCESS_TOKEN) {
    console.log('[AutoGeocode] Mapbox API key 未配置，跳过地理编码')
    return null
  }

  try {
    console.log('[AutoGeocode] 使用 Mapbox 地理编码:', { query })

    const response = await fetch(
      `${API_CONFIG.MAPBOX_API_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?limit=1&language=en&access_token=${API_CONFIG.MAPBOX_ACCESS_TOKEN}`
    )

    if (!response.ok) {
      console.warn('[AutoGeocode] Mapbox API 请求失败:', response.status)
      return null
    }

    const data = await response.json()
    const feature = Array.isArray(data.features) ? data.features[0] : null

    if (!feature || !Array.isArray(feature.center) || feature.center.length < 2) {
      console.log('[AutoGeocode] Mapbox 未找到有效结果')
      return null
    }

    const [lng, lat] = feature.center
    const coords = { lat: Number(lat), lng: Number(lng) }

    if (!isDefaultCoordinates(coords)) {
      console.log('[AutoGeocode] Mapbox 地理编码成功，获取到坐标:', coords)
      return coords
    }

    console.log('[AutoGeocode] Mapbox 地理编码返回默认坐标')
    return null
  } catch (error) {
    console.warn('[AutoGeocode] Mapbox 地理编码失败:', error)
    return null
  }
}

/**
 * 自动地理编码 Composable
 */
export function useAutoGeocode() {
  const isGeocoding = ref(false)
  const geocodingErrors = ref<Map<string, string>>(new Map())

  /**
   * 修正单个 TimeSlot 的坐标
   */
  const correctSlotCoordinates = async (
    slot: TimeSlot,
    destination?: string
  ): Promise<{ lat: number; lng: number } | null> => {
    // 检查坐标是否有效
    const currentCoords = slot.coordinates || slot.details?.coordinates

    if (!isDefaultCoordinates(currentCoords)) {
      // 坐标已有效，无需修正
      return currentCoords || null
    }

    const slotKey = slot.id || `${slot.time}-${slot.title || slot.activity}`
    isGeocoding.value = true

    try {
      // 提取搜索关键词
      const query = extractSearchQuery(slot)
      const address = extractAddress(slot)

      if (!query) {
        console.warn('[AutoGeocode] 无法提取搜索关键词，跳过地理编码')
        return null
      }

      // 构建搜索查询：优先使用地址，否则使用标题
      const searchQuery = address || query

      console.log('[AutoGeocode] 开始修正坐标:', {
        slotKey,
        query: searchQuery,
        destination,
        category: slot.type || slot.category,
      })

      // 策略1：优先使用 POI 搜索（更准确，包含上下文）
      let coords = await geocodeViaPOI(searchQuery, destination, slot.type || slot.category)

      // 策略2：如果 POI 搜索失败，使用 Mapbox 地理编码
      if (!coords) {
        coords = await geocodeViaMapbox(searchQuery)
      }

      if (coords && !isDefaultCoordinates(coords)) {
        console.log('[AutoGeocode] 坐标修正成功:', { slotKey, coords })
        geocodingErrors.value.delete(slotKey)
        return coords
      } else {
        console.warn('[AutoGeocode] 无法获取有效坐标:', { slotKey, query })
        geocodingErrors.value.set(slotKey, '无法获取有效坐标')
        return null
      }
    } catch (error: any) {
      const errorMsg = error?.message || '未知错误'
      console.error('[AutoGeocode] 坐标修正失败:', { slotKey, error: errorMsg })
      geocodingErrors.value.set(slotKey, errorMsg)
      return null
    } finally {
      isGeocoding.value = false
    }
  }

  /**
   * 批量修正多个 TimeSlot 的坐标
   */
  const correctMultipleSlots = async (
    slots: TimeSlot[],
    destination?: string
  ): Promise<Map<string, { lat: number; lng: number }>> => {
    const results = new Map<string, { lat: number; lng: number }>()

    // 并行处理，但限制并发数（避免过多 API 请求）
    const BATCH_SIZE = 3
    for (let i = 0; i < slots.length; i += BATCH_SIZE) {
      const batch = slots.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (slot) => {
          const coords = await correctSlotCoordinates(slot, destination)
          const slotKey = slot.id || `${slot.time}-${slot.title || slot.activity}`
          if (coords) {
            results.set(slotKey, coords)
          }
          return { slot, coords }
        })
      )

      // 记录批次结果
      batchResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const slot = batch[index]
          if (slot) {
            const slotKey = slot.id || `${slot.time}-${slot.title || slot.activity}`
            console.warn('[AutoGeocode] 批次处理失败:', { slotKey, error: result.reason })
          }
        }
      })

      // 批次间稍作延迟，避免 API 限流
      if (i + BATCH_SIZE < slots.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return results
  }

  return {
    isGeocoding,
    geocodingErrors,
    correctSlotCoordinates,
    correctMultipleSlots,
    isDefaultCoordinates,
  }
}


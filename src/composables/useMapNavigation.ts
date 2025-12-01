/**
 * 地图导航相关的 Composable
 * 统一处理地图跳转逻辑，支持国内/国外、iOS/Android/WeChat 等不同场景
 */

import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { MAP_URLS } from '@/config/urls'
import { DEFAULT_VALUES } from '@/utils/travelConstants'
import type { TimeSlot } from '@/components/TravelDetail/ExperienceDay/types'

/**
 * 国家关键词（用于判断是否为中国目的地）
 */
const COUNTRY_KEYWORDS = {
  CHINA: ['中国', 'China', '中华人民共和国', 'PRC'],
}

/**
 * 检测用户设备类型
 */
function detectDevice() {
  const ua = navigator.userAgent
  return {
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isWeChat: /MicroMessenger/i.test(ua),
    isMobile: /iPhone|iPad|iPod|Android/i.test(ua),
  }
}

/**
 * 判断是否为中国目的地
 */
function isChinaDestination(destination?: string): boolean {
  if (!destination) return false
  return COUNTRY_KEYWORDS.CHINA.some(keyword => 
    destination.includes(keyword)
  )
}

/**
 * 获取地址文本（根据语言和用户偏好）
 */
function getAddressText(
  slot: TimeSlot,
  shouldShowChineseOnly: boolean = false,
  locale: string = 'zh-CN'
): string {
  if (shouldShowChineseOnly) {
    // 中国国籍+中国目的地：只使用中文地址
    return (
      slot.details?.address?.chinese ||
      (typeof slot.location === 'string' ? slot.location : '') ||
      slot.details?.name?.chinese ||
      slot.title ||
      slot.activity ||
      ''
    )
  }

  // 其他情况：根据当前语言优先选择
  const isChinese = locale === 'zh-CN'
  return (
    (isChinese
      ? (slot.details?.address?.chinese || slot.details?.address?.english)
      : (slot.details?.address?.english || slot.details?.address?.chinese)) ||
    (typeof slot.location === 'string' ? slot.location : '') ||
    slot.details?.name?.english ||
    slot.title ||
    slot.activity ||
    ''
  )
}

/**
 * 地图导航 Composable
 */
export function useMapNavigation() {
  const { t, locale } = useI18n()

  /**
   * 打开地图导航
   * @param slot 时间段数据
   * @param destination 目的地（用于判断是否为中国）
   * @param shouldShowChineseOnly 是否只显示中文地址
   */
  const openMap = (
    slot: TimeSlot,
    destination?: string,
    shouldShowChineseOnly: boolean = false
  ): void => {
    // 获取地址文本
    const address = getAddressText(slot, shouldShowChineseOnly, locale.value)

    if (!address) {
      message.warning(t('travelDetail.experienceDay.noAddressInfo') || '暂无地址信息')
      return
    }

    // 判断是否为中国目的地
    const isChina = isChinaDestination(destination)
    
    // 检测设备类型
    const device = detectDevice()
    
    // 构建查询地址
    const query = encodeURIComponent(address)

    if (isChina) {
      // 中国目的地优先使用国内地图
      if (device.isIOS) {
        // iOS 优先尝试高德地图，回退到 Apple Maps
        window.open(`${MAP_URLS.GAODE_IOS}${query}`, '_blank')
        // 如果高德地图未安装，会在几秒后自动回退到浏览器打开
        setTimeout(() => {
          window.open(`${MAP_URLS.APPLE_MAPS}${query}`, '_blank')
        }, DEFAULT_VALUES.MAP_FALLBACK_DELAY || 2000)
      } else if (device.isAndroid) {
        // Android 优先使用高德地图，回退到百度地图
        window.open(`${MAP_URLS.GAODE_ANDROID}${query}`, '_blank')
        setTimeout(() => {
          window.open(`${MAP_URLS.BAIDU_ANDROID}${query}`, '_blank')
        }, DEFAULT_VALUES.MAP_FALLBACK_DELAY || 2000)
      } else if (device.isWeChat) {
        // 微信内使用腾讯地图
        const region = destination || DEFAULT_VALUES.CHINA_REGION_DEFAULT || '中国'
        window.open(`${MAP_URLS.TENCENT_WECHAT}${query}&region=${region}`, '_blank')
      } else {
        // 桌面端使用高德地图网页版
        window.open(`${MAP_URLS.GAODE_WEB}${query}`, '_blank')
      }
    } else {
      // 海外目的地使用 Google Maps
      if (device.isIOS) {
        // iOS 使用 Apple Maps（海外场景）
        window.open(`${MAP_URLS.APPLE_MAPS}${query}`, '_blank')
      } else if (device.isAndroid) {
        // Android 使用 Google Maps
        window.open(`${MAP_URLS.GOOGLE_MAPS}${query}`, '_blank')
      } else {
        // 桌面端使用 Google Maps
        window.open(`${MAP_URLS.GOOGLE_MAPS}${query}`, '_blank')
      }
    }
  }

  return {
    openMap,
    detectDevice,
    isChinaDestination,
    getAddressText,
  }
}


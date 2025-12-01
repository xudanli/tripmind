/**
 * 时间段操作相关的 Composable
 * 提取所有交互操作逻辑，如导航、预订、联系等
 */

import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useMapNavigation } from './useMapNavigation'
import type { TimeSlot } from '@/components/TravelDetail/ExperienceDay/types'

/**
 * 时间段操作 Composable
 */
export function useSlotActions(
  slot: TimeSlot,
  destination?: string,
  shouldShowChineseOnly: boolean = false
) {
  const { t } = useI18n()
  const { openMap } = useMapNavigation()

  /**
   * 处理地图导航
   */
  const handleNavigate = (): void => {
    openMap(slot, destination, shouldShowChineseOnly)
  }

  /**
   * 处理预订链接
   */
  const handleBook = (): void => {
    // 优先使用 bookingLinks
    if (slot.bookingLinks && slot.bookingLinks.length > 0) {
      const firstLink = slot.bookingLinks[0]
      if (firstLink && firstLink.url) {
        window.open(firstLink.url, '_blank', 'noopener,noreferrer')
        return
      }
    }

    // 如果没有预订链接，显示提示
    message.info(t('travelDetail.experienceDay.noBookingLink') || '暂无预订链接')
  }

  /**
   * 处理联系方式
   */
  const handleContact = (): void => {
    const contactInfo = 
      slot.details?.recommendations?.bookingInfo ||
      slot.details?.accessibility ||
      ''

    if (!contactInfo) {
      message.info(t('travelDetail.experienceDay.noContactInfo') || '暂无联系方式')
      return
    }

    // 尝试提取电话号码或邮箱
    const phoneMatch = contactInfo.match(/(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)
    const emailMatch = contactInfo.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)

    if (phoneMatch) {
      window.location.href = `tel:${phoneMatch[0].replace(/\s+/g, '')}`
    } else if (emailMatch) {
      window.location.href = `mailto:${emailMatch[0]}`
    } else {
      // 如果没有找到联系方式，显示完整信息
      message.info(contactInfo)
    }
  }

  /**
   * 处理图片错误
   */
  const handleImageError = (): void => {
    // 可以在这里添加图片加载失败的日志记录
    console.warn('[TimeSlotCard] Image load failed for slot:', slot.title || slot.activity)
  }

  return {
    handleNavigate,
    handleBook,
    handleContact,
    handleImageError,
  }
}


/**
 * 图片懒加载 Composable
 * 使用 IntersectionObserver 实现，只有当元素进入视口时才触发加载
 * 防止 API 配额耗尽
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface UseLazyLoadOptions {
  /**
   * 根边距，用于提前触发加载
   * 例如 '100px' 表示元素距离视口 100px 时就开始加载
   */
  rootMargin?: string
  /**
   * 触发阈值，0-1 之间
   * 例如 0.1 表示元素 10% 可见时触发
   */
  threshold?: number | number[]
  /**
   * 是否只触发一次（触发后自动停止观察）
   */
  once?: boolean
}

/**
 * 懒加载 Composable
 * @param target 目标元素的 ref
 * @param options 配置选项
 * @returns shouldLoad - 是否应该加载
 */
export function useLazyLoad(
  target: Ref<HTMLElement | null>,
  options: UseLazyLoadOptions = {}
): { shouldLoad: Ref<boolean> } {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    once = true,
  } = options

  const shouldLoad = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) {
      // 如果元素不存在，直接允许加载（可能是 SSR 场景）
      shouldLoad.value = true
      return
    }

    // 检查浏览器是否支持 IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      // 不支持时直接加载（降级处理）
      shouldLoad.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          shouldLoad.value = true

          // 如果设置了 once，触发后立即停止观察
          if (once && observer && target.value) {
            observer.unobserve(target.value)
            observer.disconnect()
            observer = null
          }
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(target.value)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return { shouldLoad }
}


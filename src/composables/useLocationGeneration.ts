/**
 * 异步位置信息生成 Composable
 * 
 * 用于管理异步批量位置信息生成任务，包括：
 * - 发起异步任务
 * - 轮询任务状态
 * - 获取任务结果
 * - 显示进度
 */

import { ref, onUnmounted, type Ref } from 'vue'
import {
  generateLocationBatchAsync,
  getLocationJobStatus,
  getLocationJobResult,
  type BatchActivity,
  type BatchLocationResult,
  type JobStatusData
} from '@/services/locationAPI'

export interface UseLocationGenerationOptions {
  /** 进度回调函数 */
  onProgress?: (progress: number) => void
  /** 完成回调函数 */
  onComplete?: (results: BatchLocationResult[]) => void
  /** 错误回调函数 */
  onError?: (error: string) => void
  /** 轮询间隔（毫秒），默认 2000ms */
  pollInterval?: number
  /** 是否自动开始轮询，默认 true */
  autoPoll?: boolean
}

/**
 * 根据进度动态调整轮询间隔
 * 
 * 初始阶段（0-50%）：较长间隔（3-5秒）
 * 后期阶段（50-100%）：较短间隔（1-2秒）
 */
function getPollInterval(progress: number, baseInterval: number): number {
  if (progress < 50) {
    return Math.max(baseInterval * 1.5, 3000) // 至少 3 秒
  } else {
    return Math.min(baseInterval, 2000) // 最多 2 秒
  }
}

/**
 * 异步位置信息生成 Composable
 * 
 * @param options 配置选项
 * @returns 生成函数、状态和取消函数
 * 
 * @example
 * ```typescript
 * const {
 *   generateAsync,
 *   cancel,
 *   isGenerating,
 *   progress,
 *   jobId
 * } = useLocationGeneration({
 *   onProgress: (progress) => {
 *     console.log(`生成进度: ${progress}%`)
 *   },
 *   onComplete: (results) => {
 *     console.log('生成完成:', results)
 *   },
 *   onError: (error) => {
 *     console.error('生成失败:', error)
 *   }
 * })
 * 
 * // 发起异步任务
 * await generateAsync(activities)
 * ```
 */
export function useLocationGeneration(options: UseLocationGenerationOptions = {}) {
  const {
    onProgress,
    onComplete,
    onError,
    pollInterval: basePollInterval = 2000,
    autoPoll = true
  } = options

  const isGenerating = ref(false)
  const progress = ref(0)
  const jobId = ref<string | null>(null)
  const currentJobStatus = ref<JobStatusData | null>(null)

  let pollTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 停止轮询
   */
  const stopPolling = () => {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  /**
   * 轮询任务状态
   */
  const pollJobStatus = async (targetJobId: string): Promise<BatchLocationResult[]> => {
    try {
      const jobStatus = await getLocationJobStatus(targetJobId)
      currentJobStatus.value = jobStatus

      // 更新进度
      if (jobStatus.progress !== undefined) {
        progress.value = jobStatus.progress
        onProgress?.(jobStatus.progress)
      }

      // 任务完成
      if (jobStatus.status === 'completed') {
        stopPolling()
        isGenerating.value = false

        // 优先使用状态响应中的 result 字段（如果存在），避免额外请求
        let results: BatchLocationResult[] = []
        if (jobStatus.result && jobStatus.result.length > 0) {
          results = jobStatus.result
          console.log('[useLocationGeneration] 从任务状态响应中获取结果')
        } else {
          // 如果状态响应中没有结果，调用结果接口
          results = await getLocationJobResult(targetJobId)
          console.log('[useLocationGeneration] 从结果接口获取结果')
        }
        
        onComplete?.(results)
        return results
      }

      // 任务失败
      if (jobStatus.status === 'failed') {
        stopPolling()
        isGenerating.value = false
        const error = jobStatus.error || '任务执行失败'
        onError?.(error)
        throw new Error(error)
      }

      // 任务不存在
      if (jobStatus.status === 'not_found') {
        stopPolling()
        isGenerating.value = false
        const error = '任务不存在，可能已过期'
        onError?.(error)
        throw new Error(error)
      }

      // 继续轮询（如果任务还在进行中）
      if (['waiting', 'active', 'delayed', 'paused'].includes(jobStatus.status)) {
        if (autoPoll) {
          const currentProgress = jobStatus.progress || 0
          const interval = getPollInterval(currentProgress, basePollInterval)
          
          pollTimer = setTimeout(() => {
            pollJobStatus(targetJobId)
          }, interval)
        }
      } else {
        // 未知状态，停止轮询
        stopPolling()
        isGenerating.value = false
        const error = `未知任务状态: ${jobStatus.status}`
        onError?.(error)
        throw new Error(error)
      }
    } catch (error: any) {
      stopPolling()
      isGenerating.value = false
      const errorMessage = error instanceof Error ? error.message : '查询任务状态失败'
      onError?.(errorMessage)
      throw error
    }

    // 如果任务未完成，返回空数组（实际结果会在轮询完成后通过回调返回）
    return []
  }

  /**
   * 发起异步生成任务
   */
  const generateAsync = async (activities: BatchActivity[]): Promise<BatchLocationResult[]> => {
    try {
      isGenerating.value = true
      progress.value = 0
      jobId.value = null
      currentJobStatus.value = null

      // 1. 发起异步任务
      const newJobId = await generateLocationBatchAsync({ activities })
      jobId.value = newJobId

      console.log('[useLocationGeneration] 异步任务已入队:', {
        jobId: newJobId,
        activitiesCount: activities.length
      })

      // 2. 开始轮询（如果启用自动轮询）
      if (autoPoll) {
        return await pollJobStatus(newJobId)
      } else {
        // 如果不自动轮询，只返回空数组，需要手动调用 pollJobStatus
        return []
      }
    } catch (error: any) {
      isGenerating.value = false
      const errorMessage = error instanceof Error ? error.message : '发起异步任务失败'
      onError?.(errorMessage)
      throw error
    }
  }

  /**
   * 手动轮询任务状态（当 autoPoll 为 false 时使用）
   */
  const pollStatus = async (): Promise<BatchLocationResult[]> => {
    if (!jobId.value) {
      throw new Error('没有活动的任务')
    }
    return await pollJobStatus(jobId.value)
  }

  /**
   * 取消任务（停止轮询，但无法取消后端任务）
   */
  const cancel = () => {
    stopPolling()
    isGenerating.value = false
    console.log('[useLocationGeneration] 任务已取消（仅停止前端轮询）')
  }

  /**
   * 清理资源
   */
  onUnmounted(() => {
    stopPolling()
  })

  return {
    /** 发起异步生成任务 */
    generateAsync,
    /** 手动轮询任务状态 */
    pollStatus,
    /** 取消任务（停止轮询） */
    cancel,
    /** 是否正在生成 */
    isGenerating,
    /** 当前进度（0-100） */
    progress,
    /** 当前任务 ID */
    jobId,
    /** 当前任务状态 */
    currentJobStatus
  }
}


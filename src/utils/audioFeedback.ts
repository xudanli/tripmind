/**
 * 音频反馈工具
 * 提供各种交互音效反馈
 */

export enum SoundType {
  // 灵感相关
  INSPIRATION_EXTEND = 'extend',          // 延展灵感
  INSPIRATION_SUCCESS = 'success',        // 灵感成功生成
  INSPIRATION_HOVER = 'hover',            // 悬停灵感卡片
  
  // 行程相关
  TRIP_CONVERT = 'convert',               // 转换为行程
  TRIP_CREATE = 'create',                 // 创建行程
  TRIP_COMPLETE = 'complete',             // 行程完成
  
  // 交互相关
  CLICK_SOFT = 'click-soft',              // 软点击
  CLICK_HARD = 'click-hard',              // 硬点击
  PAGE_ENTER = 'enter',                   // 页面进入
  SECTION_ENTER = 'section',              // 区域进入
  
  // 旅伴相关
  COMPANION_JOIN = 'companion',           // 旅伴加入
  COMPANION_MESSAGE = 'message',          // 收到消息
}

/**
 * 音效配置
 */
const SOUND_CONFIG: Record<SoundType, {
  frequency: number
  duration: number
  type: OscillatorType
  volume: number
}> = {
  // 基础音效（使用 Web Audio API 生成）
  [SoundType.INSPIRATION_EXTEND]: {
    frequency: 800,
    duration: 300,
    type: 'sine' as OscillatorType,
    volume: 0.3
  },
  [SoundType.INSPIRATION_SUCCESS]: {
    frequency: 600,
    duration: 200,
    type: 'sine' as OscillatorType,
    volume: 0.4
  },
  [SoundType.TRIP_CONVERT]: {
    frequency: 400,
    duration: 400,
    type: 'triangle' as OscillatorType,
    volume: 0.35
  },
  [SoundType.TRIP_CREATE]: {
    frequency: 600,
    duration: 300,
    type: 'sawtooth' as OscillatorType,
    volume: 0.3
  },
  [SoundType.CLICK_SOFT]: {
    frequency: 1000,
    duration: 100,
    type: 'sine' as OscillatorType,
    volume: 0.2
  },
  [SoundType.CLICK_HARD]: {
    frequency: 800,
    duration: 150,
    type: 'square' as OscillatorType,
    volume: 0.25
  },
  [SoundType.SECTION_ENTER]: {
    frequency: 500,
    duration: 250,
    type: 'sine' as OscillatorType,
    volume: 0.15
  },
  [SoundType.COMPANION_MESSAGE]: {
    frequency: 700,
    duration: 150,
    type: 'triangle' as OscillatorType,
    volume: 0.3
  },
  // 补充缺失的音效类型
  [SoundType.INSPIRATION_HOVER]: {
    frequency: 900,
    duration: 100,
    type: 'sine' as OscillatorType,
    volume: 0.15
  },
  [SoundType.PAGE_ENTER]: {
    frequency: 600,
    duration: 300,
    type: 'sine' as OscillatorType,
    volume: 0.2
  },
  [SoundType.COMPANION_JOIN]: {
    frequency: 650,
    duration: 200,
    type: 'triangle' as OscillatorType,
    volume: 0.3
  },
  [SoundType.TRIP_COMPLETE]: {
    frequency: 550,
    duration: 350,
    type: 'sine' as OscillatorType,
    volume: 0.35
  }
}

/**
 * 生成音效的 Web Audio API 工具
 */
class AudioFeedbackManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    // 懒加载 AudioContext（需用户交互）
    if (typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined') {
      // 监听用户交互后初始化
      const initAudio = () => {
        if (!this.audioContext && typeof window.AudioContext !== 'undefined') {
          try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          } catch (error) {
            console.warn('AudioContext not supported:', error)
          }
        }
      }
      
      // 在首次用户交互时初始化
      window.addEventListener('click', initAudio, { once: true })
      window.addEventListener('touchstart', initAudio, { once: true })
    }
  }

  /**
   * 启用/禁用音频反馈
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * 播放指定类型的音效
   */
  play(soundType: SoundType) {
    if (!this.enabled) return

    const config = SOUND_CONFIG[soundType]
    if (!config) {
      console.warn(`Unknown sound type: ${soundType}`)
      return
    }

    // 如果 AudioContext 还未初始化，尝试初始化
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    try {
      this.generateTone(config)
    } catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  /**
   * 生成音调
   */
  private generateTone(config: {
    frequency: number
    duration: number
    type: OscillatorType
    volume: number
  }) {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    // 连接节点
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // 配置振荡器
    oscillator.type = config.type
    oscillator.frequency.value = config.frequency

    // 配置音量（淡入淡出避免爆音）
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(
      config.volume,
      this.audioContext.currentTime + 0.01
    )
    gainNode.gain.linearRampToValueAtTime(
      0,
      this.audioContext.currentTime + config.duration / 1000
    )

    // 播放
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + config.duration / 1000)
  }

  /**
   * 播放序列音效（多个音调组合）
   */
  playSequence(tones: { frequency: number; duration: number; volume: number }[]) {
    if (!this.enabled || !this.audioContext) return

    tones.forEach((tone, index) => {
      setTimeout(() => {
        this.generateTone({
          frequency: tone.frequency,
          duration: tone.duration,
          type: 'sine',
          volume: tone.volume
        })
      }, index * 50)
    })
  }
}

// 单例实例
const audioManager = new AudioFeedbackManager()

/**
 * 导出音频反馈函数
 */
export const playSound = (soundType: SoundType) => {
  audioManager.play(soundType)
}

export const setAudioEnabled = (enabled: boolean) => {
  audioManager.setEnabled(enabled)
}

export default audioManager

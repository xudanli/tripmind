import { API_CONFIG } from '@/config/api'

interface PexelsVideoFile {
  id: number
  quality: 'sd' | 'hd' | 'hls'
  file_type: string
  width: number
  height: number
  fps?: number
  link: string
}

interface PexelsVideoPicture {
  id: number
  picture: string
  nr: number
}

interface PexelsVideo {
  id: number
  url: string
  duration: number
  image: string
  video_files: PexelsVideoFile[]
  video_pictures: PexelsVideoPicture[]
  user?: {
    id: number
    name: string
    url: string
  }
}

interface PexelsVideoSearchResponse {
  page: number
  per_page: number
  total_results: number
  url: string
  videos: PexelsVideo[]
}

interface PexelsPhotoSrc {
  original: string
  large2x: string
  large: string
  medium: string
  small: string
  portrait: string
  landscape: string
  tiny: string
}

export interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  alt?: string
  photographer?: string
  photographer_url?: string
  src: PexelsPhotoSrc
}

interface PexelsPhotoSearchResponse {
  page: number
  per_page: number
  total_results: number
  photos: PexelsPhoto[]
}

export interface InspirationVideo {
  id: number
  title: string
  duration: number
  previewImage: string
  downloadUrl: string
  width: number
  height: number
  sourceUrl: string
  photographer?: string
  photographerUrl?: string
}

const DEFAULT_HEADERS = () => ({
  Authorization: API_CONFIG.PEXELS_API_KEY || ''
})

const isLocalHttpOrigin = () => {
  if (typeof window === 'undefined') return false
  const origin = window.location.origin || ''
  return origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')
}

const hasPexelsKey = () => {
  if (!API_CONFIG.PEXELS_API_KEY) {
    console.warn('[Pexels] API key 未配置，跳过视频检索。')
    return false
  }
  return true
}

/**
 * 从 Pexels 搜索旅行相关视频。默认返回匹配度最高的一个视频。
 */
export async function searchPexelsVideos(
  keyword: string,
  options: { perPage?: number; orientation?: 'portrait' | 'landscape' | 'square' } = {}
): Promise<InspirationVideo[]> {
  if (!hasPexelsKey() || isLocalHttpOrigin()) {
    if (isLocalHttpOrigin()) {
      console.info('[Pexels] 检测到本地开发环境，跳过 Pexels 视频检索以避免 CORS。')
    }
    return []
  }
  const params = new URLSearchParams({
    query: keyword,
    per_page: String(options.perPage ?? 3),
    ...(options.orientation ? { orientation: options.orientation } : {})
  })

  try {
    const response = await fetch(`${API_CONFIG.PEXELS_API_URL}/videos/search?${params.toString()}`, {
      headers: DEFAULT_HEADERS()
    })

    if (!response.ok) {
      console.warn('[Pexels] 请求失败:', response.status, response.statusText)
      return []
    }

    const data = (await response.json()) as PexelsVideoSearchResponse
    return (data.videos || []).map(mapVideoToInspiration)
  } catch (error) {
    console.error('[Pexels] 搜索视频出错:', error)
    return []
  }
}

function mapVideoToInspiration(video: PexelsVideo): InspirationVideo {
  const fileCandidates = video.video_files.filter((file) => file.file_type === 'video/mp4')
  const sorted = [...fileCandidates].sort((a, b) => {
    // 排序偏好：优先高清（hd），再按宽度接近 1280
    const qualityScore = (q: 'sd' | 'hd' | 'hls') => (q === 'hd' ? 2 : q === 'sd' ? 1 : 0)
    const scoreDiff = qualityScore(b.quality) - qualityScore(a.quality)
    if (scoreDiff !== 0) return scoreDiff
    const targetWidth = 1280
    return Math.abs(a.width - targetWidth) - Math.abs(b.width - targetWidth)
  })

  const bestFile = sorted[0] ?? video.video_files[0]
  const preview = video.video_pictures?.[0]?.picture || video.image

  return {
    id: video.id,
    title: video.user?.name ? `${video.user.name} on Pexels` : 'Pexels Video',
    duration: video.duration,
    previewImage: preview,
    downloadUrl: bestFile?.link ?? '',
    width: bestFile?.width ?? 720,
    height: bestFile?.height ?? 1280,
    sourceUrl: video.url,
    photographer: video.user?.name,
    photographerUrl: video.user?.url
  }
}

export async function searchPexelsPhotos(
  keyword: string,
  options: { per_page?: number; orientation?: 'portrait' | 'landscape' | 'squarish' } = {}
): Promise<PexelsPhoto[]> {
  if (!hasPexelsKey() || isLocalHttpOrigin()) {
    if (isLocalHttpOrigin()) {
      console.info('[Pexels] 检测到本地开发环境，跳过 Pexels 图片检索以避免 CORS。')
    }
    return []
  }

  const perPage = options.per_page ?? 10
  const orientation =
    options.orientation === 'squarish' ? 'square' : options.orientation
  const params = new URLSearchParams({
    query: keyword,
    per_page: String(perPage),
    ...(orientation ? { orientation } : {})
  })

  try {
    const response = await fetch(`${API_CONFIG.PEXELS_API_URL}/search?${params.toString()}`, {
      headers: DEFAULT_HEADERS()
    })

    if (!response.ok) {
      console.warn('[Pexels] 图片请求失败:', response.status, response.statusText)
      return []
    }

    const data = (await response.json()) as PexelsPhotoSearchResponse
    return data.photos || []
  } catch (error) {
    console.error('[Pexels] 搜索图片出错:', error)
    return []
  }
}


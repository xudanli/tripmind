interface PreparationContext {
  destinationName?: string | null
  rawDestination?: string | null
  country?: string | null
  locale?: string | null
  firstSlot?: Record<string, any> | null
}

export interface PreparationTaskLink {
  label: string
  url: string
}

export interface PreparationTaskDefinition {
  key: string
  title: string
  category: 'preparation' | string
  destinationLabel: string
  links?: PreparationTaskLink[]
}

type Language = 'zh' | 'en'

interface PreparationTaskContent {
  title: string
  links?: PreparationTaskLink[]
}

interface PreparationProfile {
  id: string
  displayName: string
  keywords: string[]
  buildTasks: (context: PreparationContext, language: Language) => PreparationTaskContent[]
}

const sanitize = (value?: string | null): string => {
  if (!value) return ''
  return value
    .replace(/\s+/g, ' ')
    .trim()
}

const lowerText = (value?: string | null): string => sanitize(value).toLowerCase()

const NORMALIZE_INVALID_PATTERNS = /(未指定目的地|待定|unknown|tbd|not specified)/i

const antarcticProfile: PreparationProfile = {
  id: 'antarctica',
  displayName: 'Antarctic Expedition',
  keywords: [
    'antarctica',
    'antarctic',
    '南极',
    '南极洲',
    '南極',
    '南极圈',
    'antarctic peninsula',
    '阿根廷湾',
    'argentine islands',
    'southern ocean',
  ],
  buildTasks: (context, language) => {
    const hubCity = '乌斯怀亚 (Ushuaia)'
    const backupHub = '智利彭塔阿雷纳斯 (Punta Arenas)'
    const destinationLabel =
      sanitize(context.destinationName) ||
      sanitize(context.rawDestination) ||
      (language === 'en' ? 'Antarctica' : '南极')

    if (language === 'en') {
      return [
        {
          title: `Confirm entry requirements for Argentina/Chile and secure necessary visas or ESTA equivalents before travelling to ${destinationLabel}.`,
          links: [
            { label: 'Argentina Migration (official)', url: 'https://www.argentina.gob.ar/interior/migraciones' },
            { label: 'Chile Consular Services', url: 'https://tramites.minrel.gov.cl/' },
            { label: 'IATA Travel Centre', url: 'https://www.iatatravelcentre.com/' },
          ],
        },
        {
          title: `Book international flights that connect to ${hubCity} or ${backupHub}; most Antarctic cruises depart from these ports.`,
          links: [
            { label: 'Aerolineas Argentinas (Official Booking)', url: 'https://www.aerolineas.com.ar/en-ar' },
            { label: 'LATAM Airlines', url: 'https://www.latamairlines.com/' },
            { label: 'Skyscanner Flight Search', url: 'https://www.skyscanner.com/' },
          ],
        },
        {
          title: 'Reserve an Antarctic expedition cruise or expedition flight at least 6–12 months in advance and review the operator’s equipment checklist.',
          links: [
            { label: 'IAATO - Find a Member Operator', url: 'https://iaato.org/travel-to-antarctica/find-a-member-operator/' },
          ],
        },
        {
          title: 'Purchase travel insurance that explicitly covers polar-region medical evacuation and extreme weather delays.',
          links: [
            { label: 'IAATO - Travel Insurance Guidance', url: 'https://iaato.org/travel-to-antarctica/travel-insurance/' },
          ],
        },
        {
          title: 'Prepare specialist cold-weather gear: waterproof outer layers, insulated boots, mid-layer thermal clothing, gloves, goggles and UV protection.',
          links: [
            { label: 'IAATO Packing List', url: 'https://iaato.org/travel-to-antarctica/packing-list/' },
          ],
        },
        {
          title: 'Schedule a health check and pack seasickness tablets plus essential medication; many operators require a medical certificate.',
          links: [
            { label: 'CDC Traveler Health - Antarctica', url: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/antarctica' },
          ],
        },
      ]
    }

    return [
      {
        title: `确认阿根廷或智利的入境政策，提前办理签证/电子许可后再前往 ${destinationLabel}。`,
        links: [
          { label: '阿根廷移民局', url: 'https://www.argentina.gob.ar/interior/migraciones' },
          { label: '智利外交部领事事务', url: 'https://tramites.minrel.gov.cl/' },
          { label: 'IATA 入境政策查询', url: 'https://www.iatatravelcentre.com/' },
        ],
      },
        {
          title: `预订飞往 ${hubCity} 或 ${backupHub} 的国际航班，南极邮轮通常从此出发。`,
          links: [
            { label: '阿根廷航空官网', url: 'https://www.aerolineas.com.ar/en-ar' },
            { label: 'LATAM 航空', url: 'https://www.latamairlines.com/' },
            { label: '天巡 (Skyscanner) 机票搜索', url: 'https://www.skyscanner.com.cn/' },
          ],
        },
      {
        title: '至少提前 6-12 个月锁定南极邮轮或包机行程，并仔细阅读运营方的装备要求。',
        links: [
          { label: 'IAATO 官方会员列表', url: 'https://iaato.org/travel-to-antarctica/find-a-member-operator/' },
        ],
      },
      {
        title: '购买包含极地搜救与天气延误保障的旅行保险。',
        links: [
          { label: 'IAATO 旅行保险指南', url: 'https://iaato.org/travel-to-antarctica/travel-insurance/' },
        ],
      },
      {
        title: '准备专业御寒装备：防水冲锋衣、保暖分层、保暖靴、防风手套、墨镜与高倍防晒。',
        links: [
          { label: 'IAATO 官方行前打包清单', url: 'https://iaato.org/travel-to-antarctica/packing-list/' },
        ],
      },
      {
        title: '安排健康体检并携带晕船药/常用药物，部分运营方需提供健康证明。',
        links: [
          { label: 'CDC 南极旅行健康建议', url: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/antarctica' },
        ],
      },
    ]
  },
}

const genericInternationalProfile: PreparationProfile = {
  id: 'international',
  displayName: 'International Trip',
  keywords: [],
  buildTasks: (context, language) => {
    const destinationLabel =
      sanitize(context.destinationName) ||
      sanitize(context.rawDestination) ||
      (language === 'en' ? 'the destination' : '目的地')

    if (language === 'en') {
      return [
        {
          title: `Check passport validity and visa requirements for travelling to ${destinationLabel}.`,
          links: [
            { label: 'IATA Travel Centre', url: 'https://www.iatatravelcentre.com/' },
          ],
        },
        {
          title: `Book long-haul flights or trains to ${destinationLabel} and confirm baggage rules.`,
          links: [
            { label: 'Official Airline Guide (OAG) baggage info', url: 'https://www.oag.com/baggage-allowance' },
          ],
        },
        {
          title: 'Reserve accommodation for the first and last nights to secure a flexible base.',
          links: [
            { label: 'Official UNWTO tourism portal', url: 'https://www.unwto.org/tourism-data/unwto-tourism-dashboard' },
          ],
        },
        {
          title: 'Purchase travel insurance and prepare emergency contacts or embassy information.',
          links: [
            { label: 'U.S. State Dept. Smart Traveler', url: 'https://travel.state.gov/content/travel/en/international-travel.html' },
          ],
        },
        {
          title: 'Create a packing list based on local climate and planned activities.',
          links: [
            { label: 'World Meteorological Organization Climate Guide', url: 'https://public.wmo.int/en/our-mandate/climate' },
          ],
        },
      ]
    }

    return [
      {
        title: `确认护照有效期及前往 ${destinationLabel} 是否需要签证/入境许可。`,
        links: [
          { label: 'IATA 入境政策查询', url: 'https://www.iatatravelcentre.com/' },
        ],
      },
      {
        title: `预订往返 ${destinationLabel} 的核心交通（机票/火车），并关注托运行李政策。`,
        links: [
          { label: 'OAG 行李政策汇总', url: 'https://www.oag.com/baggage-allowance' },
        ],
      },
      {
        title: '提前锁定首晚及末晚住宿，确保行程有灵活的落脚点。',
        links: [
          { label: '联合国世界旅游组织数据', url: 'https://www.unwto.org/tourism-data/unwto-tourism-dashboard' },
        ],
      },
      {
        title: '购买旅行保险，记录大使馆/紧急联系人信息。',
        links: [
          { label: '外交部领事服务网', url: 'https://cs.mfa.gov.cn/' },
        ],
      },
      {
        title: '根据当地气候与活动，准备详细的行前打包清单。',
        links: [
          { label: '世界气象组织气候信息', url: 'https://public.wmo.int/en/our-mandate/climate' },
        ],
      },
    ]
  },
}

const PROFILES: PreparationProfile[] = [antarcticProfile]

const detectProfile = (context: PreparationContext): PreparationProfile | null => {
  const haystackParts = [
    context.destinationName,
    context.rawDestination,
    context.country,
    context.firstSlot?.location,
    context.firstSlot?.title,
    context.firstSlot?.activity,
    context.firstSlot?.details?.name?.english,
    context.firstSlot?.details?.name?.chinese,
    context.firstSlot?.details?.address?.english,
    context.firstSlot?.details?.address?.chinese,
  ]
  const haystack = lowerText(haystackParts.filter(Boolean).join(' '))

  if (!haystack || NORMALIZE_INVALID_PATTERNS.test(haystack)) {
    return null
  }

  for (const profile of PROFILES) {
    if (
      profile.keywords.length > 0 &&
      profile.keywords.some(keyword => haystack.includes(keyword.toLowerCase()))
    ) {
      return profile
    }
  }

  return null
}

export const buildPreparationTasks = (
  context: PreparationContext
): PreparationTaskDefinition[] => {
  const language: Language = context.locale?.toLowerCase().startsWith('en') ? 'en' : 'zh'

  if (!context.destinationName && !context.rawDestination && !context.firstSlot) {
    return []
  }

  const profile = detectProfile(context) || genericInternationalProfile
  const destinationLabel =
    sanitize(context.destinationName) ||
    sanitize(context.rawDestination) ||
    sanitize(context.firstSlot?.location) ||
    (language === 'en' ? 'Destination' : '目的地')

  const tasks = profile.buildTasks(context, language)

  const normalizedDestination = encodeURIComponent(
    sanitize(context.destinationName || context.rawDestination || profile.id).toLowerCase()
  )

  return tasks
    .map(task => ({
      title: sanitize(task.title),
      links: task.links?.map(link => ({
        label: sanitize(link.label),
        url: link.url.trim(),
      })).filter(link => link.label && link.url),
    }))
    .filter(task => task.title.length > 0)
    .map((task, index) => ({
      key: `${profile.id}-${normalizedDestination}-${index}`,
      title: task.title,
      category: 'preparation',
      destinationLabel,
      links: task.links && task.links.length ? task.links : undefined,
    }))
}



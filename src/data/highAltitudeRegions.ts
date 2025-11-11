export type AltitudeCategory = 'extreme' | 'high' | 'medium'

export interface HighAltitudeRegion {
  id: string
  name: string
  aliases?: string[]
  country: string
  region?: string
  altitudeRange: string
  category: AltitudeCategory
  approxElevation?: number
  notes?: string
}

export const HIGH_ALTITUDE_REGIONS: HighAltitudeRegion[] = [
  {
    id: 'cn-xizang',
    name: '西藏自治区',
    aliases: ['西藏', 'Tibet Autonomous Region', 'Tibet'],
    country: '中国',
    altitudeRange: '平均海拔 4000m 以上',
    category: 'extreme',
    notes: '世界屋脊，大部分地区海拔超过 4000 米。'
  },
  {
    id: 'cn-lasa',
    name: '拉萨',
    aliases: ['Lhasa'],
    country: '中国',
    region: '西藏',
    altitudeRange: '约 3650m',
    category: 'extreme',
    approxElevation: 3650,
    notes: '进藏首站，多数游客第一站。'
  },
  {
    id: 'cn-ali',
    name: '阿里地区',
    aliases: ['Ngari'],
    country: '中国',
    region: '西藏',
    altitudeRange: '4500m 以上',
    category: 'extreme',
    notes: '被称为“世界屋脊的屋脊”，自然环境严酷。'
  },
  {
    id: 'cn-everest-base-camp',
    name: '珠穆朗玛峰大本营（北坡）',
    aliases: ['EBC', 'Everest Base Camp', '珠峰大本营'],
    country: '中国',
    region: '西藏',
    altitudeRange: '约 5200m',
    category: 'extreme',
    approxElevation: 5200,
    notes: '游客可到达的最近距离，属于超高海拔地区。'
  },
  {
    id: 'cn-namco',
    name: '纳木错',
    aliases: ['Nam Co', 'Namtso'],
    country: '中国',
    region: '西藏',
    altitudeRange: '约 4718m',
    category: 'extreme',
    notes: '西藏“三大圣湖”之一，常见于高原行程。'
  },
  {
    id: 'cn-yamdrok',
    name: '羊卓雍措',
    aliases: ['Yamdrok Yumtso'],
    country: '中国',
    region: '西藏',
    altitudeRange: '约 4441m',
    category: 'extreme',
    notes: '西藏“三大圣湖”之一，多数游客会在此停留。'
  },
  {
    id: 'cn-manasa',
    name: '玛旁雍错',
    aliases: ['Manasarovar'],
    country: '中国',
    region: '西藏',
    altitudeRange: '约 4588m',
    category: 'extreme',
    notes: '邻近冈仁波齐，朝圣路线的重要湖泊。'
  },
  {
    id: 'cn-kailash',
    name: '冈仁波齐',
    aliases: ['Mount Kailash'],
    country: '中国',
    region: '西藏',
    altitudeRange: '峰顶 6656m，塔钦约 4600m',
    category: 'extreme',
    approxElevation: 4600,
    notes: '神山转山起点塔钦海拔极高，需充分适应。'
  },
  {
    id: 'cn-naqu',
    name: '那曲',
    aliases: ['Nagqu'],
    country: '中国',
    region: '西藏',
    altitudeRange: '4500m 以上',
    category: 'extreme',
    notes: '西藏北部高寒草原，以超高海拔著称。'
  },
  {
    id: 'cn-qinghai-plateau',
    name: '青海高原地区',
    aliases: ['青海', 'Qinghai Plateau'],
    country: '中国',
    altitudeRange: '平均 3000m 以上',
    category: 'extreme',
    notes: '涵盖可可西里、玉树等地区，海拔普遍较高。'
  },
  {
    id: 'cn-yushu',
    name: '玉树',
    aliases: ['Yushu'],
    country: '中国',
    region: '青海',
    altitudeRange: '3700m 以上',
    category: 'extreme',
    approxElevation: 3700,
    notes: '青海南部重要城市，高海拔且气候寒冷。'
  },
  {
    id: 'cn-hoh-xil',
    name: '可可西里',
    aliases: ['Hoh Xil'],
    country: '中国',
    region: '青海',
    altitudeRange: '4500m 以上',
    category: 'extreme',
    notes: '中国最大无人区之一，生态环境严苛。'
  },
  {
    id: 'cn-golmud',
    name: '格尔木',
    aliases: ['Golmud'],
    country: '中国',
    region: '青海',
    altitudeRange: '约 2800m',
    category: 'high',
    approxElevation: 2800,
    notes: '青藏线重要节点，常用作进藏前适应地。'
  },
  {
    id: 'cn-daocheng-yading',
    name: '稻城亚丁',
    aliases: ['Daocheng Yading'],
    country: '中国',
    region: '四川',
    altitudeRange: '2900m - 4700m',
    category: 'high',
    notes: '入口香格里拉镇约 2900m，景区核心接近 4600m。'
  },
  {
    id: 'cn-seda',
    name: '色达',
    aliases: ['Sertar'],
    country: '中国',
    region: '四川',
    altitudeRange: '3800m 以上',
    category: 'extreme',
    notes: '海拔接近 4000m，冬季极寒，需防范高反。'
  },
  {
    id: 'cn-siguniang',
    name: '四姑娘山',
    aliases: ['Mount Siguniang'],
    country: '中国',
    region: '四川',
    altitudeRange: '游客中心约 2900m，部分景点 3500m+',
    category: 'high',
    notes: '川西知名雪山，进山需关注海拔梯度。'
  },
  {
    id: 'cn-ganzi',
    name: '甘孜州',
    aliases: ['Ganzi Prefecture'],
    country: '中国',
    region: '四川',
    altitudeRange: '3300m 以上',
    category: 'high',
    notes: '川西核心地区，城镇海拔普遍较高。'
  },
  {
    id: 'cn-aba',
    name: '阿坝州',
    aliases: ['Aba Prefecture'],
    country: '中国',
    region: '四川',
    altitudeRange: '约 3300m',
    category: 'high',
    notes: '川西北重要目的地，需预留适应时间。'
  },
  {
    id: 'cn-zhagana',
    name: '扎尕那',
    aliases: ['Zhagana'],
    country: '中国',
    region: '甘肃',
    altitudeRange: '3000m - 3300m',
    category: 'high',
    notes: '位于甘南山地，海拔较高但自然环境优美。'
  },
  {
    id: 'cn-shangri-la',
    name: '香格里拉',
    aliases: ['Shangri-La', 'Diqing'],
    country: '中国',
    region: '云南',
    altitudeRange: '约 3300m',
    category: 'high',
    notes: '云南迪庆州府，常作为丽江进藏前的适应点。'
  },
  {
    id: 'cn-deqin',
    name: '德钦·梅里雪山',
    aliases: ['Deqin', "Feilai Temple", 'Meili Snow Mountain'],
    country: '中国',
    region: '云南',
    altitudeRange: '约 3400m',
    category: 'high',
    notes: '飞来寺观景台约 3400 米，适合逐步上升。'
  },
  {
    id: 'cn-yulong',
    name: '玉龙雪山',
    aliases: ['Yulong Snow Mountain'],
    country: '中国',
    region: '云南',
    altitudeRange: '景区最高点 4506m',
    category: 'high',
    notes: '索道终点海拔超过 4500 米，需氧气与保暖装备。'
  },
  {
    id: 'cn-lijiang',
    name: '丽江古城',
    aliases: ['Lijiang'],
    country: '中国',
    region: '云南',
    altitudeRange: '约 2400m',
    category: 'medium',
    notes: '中高海拔，适合作为上高原前的过渡。'
  },
  {
    id: 'cn-kunming',
    name: '昆明',
    aliases: ['Kunming'],
    country: '中国',
    region: '云南',
    altitudeRange: '约 1890m',
    category: 'medium',
    notes: '春城气候宜人，多数人无明显高反。'
  },
  {
    id: 'cn-xining',
    name: '西宁',
    aliases: ['Xining'],
    country: '中国',
    region: '青海',
    altitudeRange: '约 2260m',
    category: 'medium',
    notes: '青海省会，是前往青藏高原的重要中转。'
  },
  {
    id: 'cn-qilian',
    name: '祁连县',
    aliases: ['Qilian'],
    country: '中国',
    region: '青海',
    altitudeRange: '约 2700m',
    category: 'high',
    notes: '接近高海拔区，夏季草原风光优美。'
  },
  {
    id: 'cn-zhangye',
    name: '张掖',
    aliases: ['Zhangye'],
    country: '中国',
    region: '甘肃',
    altitudeRange: '约 1500m',
    category: 'medium',
    notes: '七彩丹霞所在地，海拔较为温和。'
  },
  {
    id: 'cn-dunhuang',
    name: '敦煌',
    aliases: ['Dunhuang'],
    country: '中国',
    region: '甘肃',
    altitudeRange: '约 1100m',
    category: 'medium',
    notes: '丝路重镇，海拔相对较低但气候干燥。'
  },
  {
    id: 'cn-jiayuguan',
    name: '嘉峪关',
    aliases: ['Jiayuguan'],
    country: '中国',
    region: '甘肃',
    altitudeRange: '约 1500m - 1700m',
    category: 'medium',
    notes: '长城关隘之一，夏季为避暑胜地。'
  },
  {
    id: 'bo-la-paz',
    name: '拉巴斯',
    aliases: ['La Paz'],
    country: '玻利维亚',
    altitudeRange: '约 3600m 以上',
    category: 'extreme',
    notes: '世界海拔最高的行政首都。'
  },
  {
    id: 'bo-titicaca',
    name: '的的喀喀湖',
    aliases: ['Lake Titicaca'],
    country: '秘鲁 / 玻利维亚',
    altitudeRange: '约 3800m',
    category: 'extreme',
    notes: '世界上海拔最高的大型淡水湖。'
  },
  {
    id: 'pe-cusco',
    name: '库斯科',
    aliases: ['Cusco'],
    country: '秘鲁',
    altitudeRange: '约 3400m',
    category: 'high',
    notes: '前往马丘比丘的门户城市。'
  },
  {
    id: 'pe-machupicchu',
    name: '马丘比丘',
    aliases: ['Machu Picchu'],
    country: '秘鲁',
    altitudeRange: '约 2430m',
    category: 'high',
    notes: '世界文化遗产，海拔较高需分层适应。'
  },
  {
    id: 'ec-quito',
    name: '基多',
    aliases: ['Quito'],
    country: '厄瓜多尔',
    altitudeRange: '约 2850m',
    category: 'high',
    notes: '安第斯山脉城市，气候凉爽。'
  },
  {
    id: 'co-bogota',
    name: '波哥大',
    aliases: ['Bogotá'],
    country: '哥伦比亚',
    altitudeRange: '约 2640m',
    category: 'high',
    notes: '安第斯高原大都市，需要轻微适应。'
  },
  {
    id: 'np-kathmandu',
    name: '加德满都',
    aliases: ['Kathmandu'],
    country: '尼泊尔',
    altitudeRange: '约 1400m',
    category: 'medium',
    notes: '喜马拉雅门户，多数游客在此停留。'
  },
  {
    id: 'np-pokhara',
    name: '博卡拉',
    aliases: ['Pokhara'],
    country: '尼泊尔',
    altitudeRange: '约 800m',
    category: 'medium',
    notes: '安纳普尔纳徒步前的休整城市。'
  },
  {
    id: 'np-abc',
    name: '安纳普尔纳大本营',
    aliases: ['Annapurna Base Camp', 'ABC'],
    country: '尼泊尔',
    altitudeRange: '约 4130m',
    category: 'extreme',
    notes: '受欢迎的徒步终点，需循序渐进上升。'
  },
  {
    id: 'np-everest-south-base',
    name: '珠穆朗玛峰南坡大本营',
    aliases: ['Everest South Base Camp'],
    country: '尼泊尔',
    altitudeRange: '约 5364m',
    category: 'extreme',
    notes: '尼泊尔经典徒步路线终点，海拔极高。'
  },
  {
    id: 'in-leh',
    name: '列城（拉达克）',
    aliases: ['Leh', 'Ladakh'],
    country: '印度',
    altitudeRange: '约 3500m',
    category: 'extreme',
    notes: '印度北部高原，常见高反，需要循序渐进。'
  },
  {
    id: 'in-manali',
    name: '马纳利',
    aliases: ['Manali'],
    country: '印度',
    altitudeRange: '约 2000m',
    category: 'high',
    notes: '印度喜马拉雅山麓城市，适合作为高原适应站。'
  },
  {
    id: 'bt-thimphu',
    name: '廷布',
    aliases: ['Thimphu'],
    country: '不丹',
    altitudeRange: '约 2300m',
    category: 'medium',
    notes: '不丹首都，高山峡谷环境。'
  },
  {
    id: 'tz-kilimanjaro',
    name: '乞力马扎罗山',
    aliases: ['Kilimanjaro'],
    country: '坦桑尼亚',
    altitudeRange: '峰顶 5895m，起点约 1800m',
    category: 'extreme',
    notes: '非洲之巅，典型的高山登顶路线。'
  },
  {
    id: 'et-addis',
    name: '亚的斯亚贝巴',
    aliases: ['Addis Ababa'],
    country: '埃塞俄比亚',
    altitudeRange: '约 2400m',
    category: 'high',
    notes: '非洲屋脊上的首都城市。'
  },
  {
    id: 'ch-jungfraujoch',
    name: '少女峰',
    aliases: ['Jungfraujoch'],
    country: '瑞士',
    altitudeRange: '游客可达 3454m',
    category: 'high',
    notes: '欧洲最高火车站，长时间停留需注意头晕。'
  }
]

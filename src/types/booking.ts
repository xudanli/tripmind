/**
 * 国际行程订票信息类型定义
 * 基于国际标准（IATA、ICAO）和常见订票平台格式
 */

/**
 * 航班订票信息
 */
export interface FlightBooking {
  id: string
  type: 'flight'
  // 基本信息
  airline: string // 航空公司名称
  airlineCode: string // IATA代码，如 "CA", "UA", "LH"
  flightNumber: string // 航班号，如 "CA123"
  
  // 航程信息
  departure: {
    airport: string // 机场名称，如 "北京首都国际机场"
    airportCode: string // IATA代码，如 "PEK"
    city: string // 城市名称，如 "北京"
    date: string // 出发日期，ISO格式 "2025-11-05"
    time: string // 出发时间，如 "14:30"
    terminal?: string // 航站楼，如 "T3"
    gate?: string // 登机口，如 "A12"
  }
  
  arrival: {
    airport: string // 机场名称
    airportCode: string // IATA代码
    city: string // 城市名称
    date: string // 到达日期
    time: string // 到达时间
    terminal?: string // 航站楼
  }
  
  // 乘客信息
  passengers: Array<{
    name: string // 乘客姓名
    seat?: string // 座位号，如 "12A"
    class: 'economy' | 'premium_economy' | 'business' | 'first' // 舱位等级
  }>
  
  // 预订信息
  booking: {
    confirmationCode: string // 预订确认码/PNR，如 "ABC123"
    ticketNumber?: string // 票号（13位）
    bookingReference?: string // 预订参考号
    bookingDate?: string // 预订日期
    bookingPlatform?: string // 预订平台，如 "Expedia", "Booking.com"
  }
  
  // 行李信息
  baggage?: {
    carryOn?: {
      allowed: boolean
      weight?: string // 如 "7kg"
      dimensions?: string // 如 "55x40x20cm"
    }
    checked?: {
      allowed: boolean
      weight?: string // 如 "23kg"
      pieces?: number // 件数
      price?: number // 超重费用
    }
  }
  
  // 其他信息
  status?: 'confirmed' | 'pending' | 'cancelled' | 'changed'
  checkInAvailable?: boolean // 是否可办理登机
  checkInDeadline?: string // 登机截止时间
  notes?: string[] // 备注信息
}

/**
 * 酒店订票信息
 */
export interface HotelBooking {
  id: string
  type: 'hotel'
  // 基本信息
  hotelName: string // 酒店名称
  chain?: string // 酒店集团，如 "Marriott", "Hilton"
  
  // 地址信息
  address: {
    street?: string
    city: string
    country: string
    postalCode?: string
    coordinates?: { lat: number; lng: number }
  }
  
  // 入住信息
  checkIn: {
    date: string // 入住日期
    time: string // 入住时间，如 "15:00"
  }
  
  checkOut: {
    date: string // 退房日期
    time: string // 退房时间，如 "11:00"
  }
  
  // 房间信息
  rooms: Array<{
    type: string // 房型，如 "标准双人间"
    guests: number // 入住人数
    beds?: string // 床型，如 "1张大床" 或 "2张单人床"
    amenities?: string[] // 设施，如 ["WiFi", "早餐", "海景"]
  }>
  
  // 预订信息
  booking: {
    confirmationCode: string // 预订确认码
    bookingReference?: string
    bookingDate?: string
    bookingPlatform?: string
    totalPrice?: number // 总价
    currency?: string // 货币代码
    cancellationPolicy?: string // 取消政策
  }
  
  // 联系信息
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  
  status?: 'confirmed' | 'pending' | 'cancelled'
  notes?: string[]
}

/**
 * 活动/景点订票信息
 */
export interface ActivityBooking {
  id: string
  type: 'activity'
  // 基本信息
  activityName: string // 活动名称
  category?: string // 类别，如 "景点", "体验", "演出"
  
  // 地址信息
  location?: {
    name: string
    address?: string
    coordinates?: { lat: number; lng: number }
  }
  
  // 时间信息
  date: string // 活动日期
  time?: string // 活动时间，如 "14:00-16:00"
  duration?: string // 持续时间，如 "2小时"
  
  // 参与者信息
  participants: number // 参与人数
  tickets: Array<{
    type: string // 票型，如 "成人票", "儿童票"
    quantity: number // 数量
    price?: number // 单价
  }>
  
  // 预订信息
  booking: {
    confirmationCode: string
    bookingReference?: string
    bookingDate?: string
    bookingPlatform?: string
    totalPrice?: number
    currency?: string
  }
  
  // 其他信息
  meetingPoint?: string // 集合地点
  cancellationPolicy?: string
  status?: 'confirmed' | 'pending' | 'cancelled'
  notes?: string[]
}

/**
 * 交通订票信息（火车、巴士、租车等）
 */
export interface TransportationBooking {
  id: string
  type: 'train' | 'bus' | 'car_rental' | 'ferry'
  
  // 基本信息
  provider: string // 服务商，如 "Eurostar", "Hertz"
  serviceName?: string // 服务名称，如 "TGV高速列车"
  
  // 出发信息
  departure: {
    station?: string // 车站/站点名称
    stationCode?: string // 车站代码
    address?: string // 地址（租车取车点）
    date: string
    time: string
  }
  
  // 到达信息
  arrival: {
    station?: string
    stationCode?: string
    address?: string // 地址（租车还车点）
    date: string
    time?: string // 到达时间（如果适用）
  }
  
  // 乘客/使用者信息
  passengers?: number // 乘客数量
  vehicleType?: string // 车型（租车）
  
  // 预订信息
  booking: {
    confirmationCode: string
    bookingReference?: string
    bookingDate?: string
    bookingPlatform?: string
    totalPrice?: number
    currency?: string
  }
  
  status?: 'confirmed' | 'pending' | 'cancelled'
  notes?: string[]
}

/**
 * 统一的订票信息类型
 */
export type BookingInfo = 
  | FlightBooking 
  | HotelBooking 
  | ActivityBooking 
  | TransportationBooking

/**
 * 行程中的订票信息集合
 */
export interface ItineraryBookings {
  travelId: string
  flights: FlightBooking[]
  hotels: HotelBooking[]
  activities: ActivityBooking[]
  transportations: TransportationBooking[]
  lastUpdated?: string
}



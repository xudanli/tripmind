<template>
  <a-card :bordered="false" class="booking-card">
    <template #title>
      <span>📋 {{ t('travelDetail.bookingInfo.title') || '订票信息' }}</span>
    </template>
    
    <div class="booking-sections">
      <!-- 航班信息 -->
      <div v-if="bookings.flights.length > 0" class="booking-section">
        <h4 class="section-title">✈️ {{ t('travelDetail.bookingInfo.flights') || '航班' }}</h4>
        <div v-for="flight in bookings.flights" :key="flight.id" class="booking-item">
          <div class="booking-item-header">
            <div class="booking-item-main">
              <span class="booking-airline">{{ flight.airline }} {{ flight.flightNumber }}</span>
              <span class="booking-route">
                {{ flight.departure.airportCode }} → {{ flight.arrival.airportCode }}
              </span>
            </div>
            <a-tag :color="getStatusColor(flight.status)">
              {{ getStatusText(flight.status) }}
            </a-tag>
          </div>
          <div class="booking-item-details">
            <div class="booking-detail-row">
              <span class="detail-label">出发：</span>
              <span>{{ formatDateTime(flight.departure.date, flight.departure.time) }} {{ flight.departure.airport }}</span>
              <span v-if="flight.departure.terminal" class="detail-meta">T{{ flight.departure.terminal }}</span>
              <span v-if="flight.departure.gate" class="detail-meta">Gate {{ flight.departure.gate }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">到达：</span>
              <span>{{ formatDateTime(flight.arrival.date, flight.arrival.time) }} {{ flight.arrival.airport }}</span>
              <span v-if="flight.arrival.terminal" class="detail-meta">T{{ flight.arrival.terminal }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">确认码：</span>
              <span class="booking-code">{{ flight.booking.confirmationCode }}</span>
              <a-button type="link" size="small" @click="copyToClipboard(flight.booking.confirmationCode)">
                {{ t('common.copy') || '复制' }}
              </a-button>
            </div>
            <div v-if="flight.passengers.length > 0" class="booking-detail-row">
              <span class="detail-label">乘客：</span>
              <span>{{ flight.passengers.map(p => p.name).join('、') }}</span>
            </div>
          </div>
          <div class="booking-item-actions">
            <a-button type="link" size="small" @click="openBookingLink(flight)">
              {{ t('travelDetail.bookingInfo.viewBooking') || '查看预订' }}
            </a-button>
            <a-button type="link" size="small" @click="editBooking(flight)">
              {{ t('common.edit') || '编辑' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 酒店信息 -->
      <div v-if="bookings.hotels.length > 0" class="booking-section">
        <h4 class="section-title">🏨 {{ t('travelDetail.bookingInfo.hotels') || '酒店' }}</h4>
        <div v-for="hotel in bookings.hotels" :key="hotel.id" class="booking-item">
          <div class="booking-item-header">
            <div class="booking-item-main">
              <span class="booking-name">{{ hotel.hotelName }}</span>
            </div>
            <a-tag :color="getStatusColor(hotel.status)">
              {{ getStatusText(hotel.status) }}
            </a-tag>
          </div>
          <div class="booking-item-details">
            <div class="booking-detail-row">
              <span class="detail-label">入住：</span>
              <span>{{ formatDateTime(hotel.checkIn.date, hotel.checkIn.time) }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">退房：</span>
              <span>{{ formatDateTime(hotel.checkOut.date, hotel.checkOut.time) }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">地址：</span>
              <span>{{ hotel.address.city }}, {{ hotel.address.country }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">确认码：</span>
              <span class="booking-code">{{ hotel.booking.confirmationCode }}</span>
              <a-button type="link" size="small" @click="copyToClipboard(hotel.booking.confirmationCode)">
                {{ t('common.copy') || '复制' }}
              </a-button>
            </div>
          </div>
          <div class="booking-item-actions">
            <a-button type="link" size="small" @click="openBookingLink(hotel)">
              {{ t('travelDetail.bookingInfo.viewBooking') || '查看预订' }}
            </a-button>
            <a-button type="link" size="small" @click="editBooking(hotel)">
              {{ t('common.edit') || '编辑' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 活动/景点信息 -->
      <div v-if="bookings.activities.length > 0" class="booking-section">
        <h4 class="section-title">🎫 {{ t('travelDetail.bookingInfo.activities') || '活动' }}</h4>
        <div v-for="activity in bookings.activities" :key="activity.id" class="booking-item">
          <div class="booking-item-header">
            <div class="booking-item-main">
              <span class="booking-name">{{ activity.activityName }}</span>
            </div>
            <a-tag :color="getStatusColor(activity.status)">
              {{ getStatusText(activity.status) }}
            </a-tag>
          </div>
          <div class="booking-item-details">
            <div class="booking-detail-row">
              <span class="detail-label">日期：</span>
              <span>{{ formatDateTime(activity.date, activity.time) }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">确认码：</span>
              <span class="booking-code">{{ activity.booking.confirmationCode }}</span>
              <a-button type="link" size="small" @click="copyToClipboard(activity.booking.confirmationCode)">
                {{ t('common.copy') || '复制' }}
              </a-button>
            </div>
          </div>
          <div class="booking-item-actions">
            <a-button type="link" size="small" @click="openBookingLink(activity)">
              {{ t('travelDetail.bookingInfo.viewBooking') || '查看预订' }}
            </a-button>
            <a-button type="link" size="small" @click="editBooking(activity)">
              {{ t('common.edit') || '编辑' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 火车信息 -->
      <div v-if="bookings.transportations.filter(t => t.type === 'train').length > 0" class="booking-section">
        <h4 class="section-title">🚂 {{ t('travelDetail.bookingInfo.train') || '火车' }}</h4>
        <div v-for="transport in bookings.transportations.filter(t => t.type === 'train')" :key="transport.id" class="booking-item">
          <div class="booking-item-header">
            <div class="booking-item-main">
              <span class="booking-name">{{ transport.provider }} {{ transport.serviceName }}</span>
              <span class="booking-route">
                {{ transport.departure.station }} → {{ transport.arrival.station }}
              </span>
            </div>
            <a-tag :color="getStatusColor(transport.status)">
              {{ getStatusText(transport.status) }}
            </a-tag>
          </div>
          <div class="booking-item-details">
            <div class="booking-detail-row">
              <span class="detail-label">出发：</span>
              <span>{{ formatDateTime(transport.departure.date, transport.departure.time) }} {{ transport.departure.station }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">到达：</span>
              <span>{{ transport.arrival.station }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">确认码：</span>
              <span class="booking-code">{{ transport.booking.confirmationCode }}</span>
              <a-button type="link" size="small" @click="copyToClipboard(transport.booking.confirmationCode)">
                {{ t('common.copy') || '复制' }}
              </a-button>
            </div>
          </div>
          <div class="booking-item-actions">
            <a-button type="link" size="small" @click="openBookingLink(transport)">
              {{ t('travelDetail.bookingInfo.viewBooking') || '查看预订' }}
            </a-button>
            <a-button type="link" size="small" @click="editBooking(transport)">
              {{ t('common.edit') || '编辑' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 巴士信息 -->
      <div v-if="bookings.transportations.filter(t => t.type === 'bus').length > 0" class="booking-section">
        <h4 class="section-title">🚌 {{ t('travelDetail.bookingInfo.bus') || '巴士' }}</h4>
        <div v-for="transport in bookings.transportations.filter(t => t.type === 'bus')" :key="transport.id" class="booking-item">
          <div class="booking-item-header">
            <div class="booking-item-main">
              <span class="booking-name">{{ transport.provider }}</span>
              <span class="booking-route">
                {{ transport.departure.station }} → {{ transport.arrival.station }}
              </span>
            </div>
            <a-tag :color="getStatusColor(transport.status)">
              {{ getStatusText(transport.status) }}
            </a-tag>
          </div>
          <div class="booking-item-details">
            <div class="booking-detail-row">
              <span class="detail-label">出发：</span>
              <span>{{ formatDateTime(transport.departure.date, transport.departure.time) }} {{ transport.departure.station }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">到达：</span>
              <span>{{ transport.arrival.station }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">确认码：</span>
              <span class="booking-code">{{ transport.booking.confirmationCode }}</span>
              <a-button type="link" size="small" @click="copyToClipboard(transport.booking.confirmationCode)">
                {{ t('common.copy') || '复制' }}
              </a-button>
            </div>
          </div>
          <div class="booking-item-actions">
            <a-button type="link" size="small" @click="openBookingLink(transport)">
              {{ t('travelDetail.bookingInfo.viewBooking') || '查看预订' }}
            </a-button>
            <a-button type="link" size="small" @click="editBooking(transport)">
              {{ t('common.edit') || '编辑' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 租车信息 -->
      <div v-if="bookings.transportations.filter(t => t.type === 'car_rental').length > 0" class="booking-section">
        <h4 class="section-title">🚗 {{ t('travelDetail.bookingInfo.carRental') || '租车' }}</h4>
        <div v-for="transport in bookings.transportations.filter(t => t.type === 'car_rental')" :key="transport.id" class="booking-item">
          <div class="booking-item-header">
            <div class="booking-item-main">
              <span class="booking-name">{{ transport.provider }} {{ transport.vehicleType }}</span>
            </div>
            <a-tag :color="getStatusColor(transport.status)">
              {{ getStatusText(transport.status) }}
            </a-tag>
          </div>
          <div class="booking-item-details">
            <div class="booking-detail-row">
              <span class="detail-label">取车：</span>
              <span>{{ formatDateTime(transport.departure.date, transport.departure.time) }} {{ transport.departure.address }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">还车：</span>
              <span>{{ formatDateTime(transport.arrival.date, transport.arrival.time) }} {{ transport.arrival.address }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">确认码：</span>
              <span class="booking-code">{{ transport.booking.confirmationCode }}</span>
              <a-button type="link" size="small" @click="copyToClipboard(transport.booking.confirmationCode)">
                {{ t('common.copy') || '复制' }}
              </a-button>
            </div>
          </div>
          <div class="booking-item-actions">
            <a-button type="link" size="small" @click="openBookingLink(transport)">
              {{ t('travelDetail.bookingInfo.viewBooking') || '查看预订' }}
            </a-button>
            <a-button type="link" size="small" @click="editBooking(transport)">
              {{ t('common.edit') || '编辑' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 轮渡信息 -->
      <div v-if="bookings.transportations.filter(t => t.type === 'ferry').length > 0" class="booking-section">
        <h4 class="section-title">⛴️ {{ t('travelDetail.bookingInfo.ferry') || '轮渡' }}</h4>
        <div v-for="transport in bookings.transportations.filter(t => t.type === 'ferry')" :key="transport.id" class="booking-item">
          <div class="booking-item-header">
            <div class="booking-item-main">
              <span class="booking-name">{{ transport.provider }}</span>
              <span class="booking-route">
                {{ transport.departure.station }} → {{ transport.arrival.station }}
              </span>
            </div>
            <a-tag :color="getStatusColor(transport.status)">
              {{ getStatusText(transport.status) }}
            </a-tag>
          </div>
          <div class="booking-item-details">
            <div class="booking-detail-row">
              <span class="detail-label">出发：</span>
              <span>{{ formatDateTime(transport.departure.date, transport.departure.time) }} {{ transport.departure.station }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">到达：</span>
              <span>{{ transport.arrival.station }}</span>
            </div>
            <div class="booking-detail-row">
              <span class="detail-label">确认码：</span>
              <span class="booking-code">{{ transport.booking.confirmationCode }}</span>
              <a-button type="link" size="small" @click="copyToClipboard(transport.booking.confirmationCode)">
                {{ t('common.copy') || '复制' }}
              </a-button>
            </div>
          </div>
          <div class="booking-item-actions">
            <a-button type="link" size="small" @click="openBookingLink(transport)">
              {{ t('travelDetail.bookingInfo.viewBooking') || '查看预订' }}
            </a-button>
            <a-button type="link" size="small" @click="editBooking(transport)">
              {{ t('common.edit') || '编辑' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="totalBookings === 0" class="booking-empty">
        <p>{{ t('travelDetail.bookingInfo.empty') || '暂无订票信息' }}</p>
        <a-button type="primary" @click="showAddModal = true">
          {{ t('travelDetail.bookingInfo.addBooking') || '添加订票信息' }}
        </a-button>
      </div>

      <!-- 添加按钮 -->
      <div v-if="totalBookings > 0" class="booking-add-btn">
        <a-button type="dashed" block @click="showAddModal = true">
          <plus-outlined /> {{ t('travelDetail.bookingInfo.addBooking') || '添加订票信息' }}
        </a-button>
      </div>
    </div>

    <!-- 添加/编辑订票信息弹窗 -->
    <a-modal
      v-model:open="showAddModal"
      :title="editingBooking ? (t('travelDetail.bookingInfo.editBooking') || '编辑订票信息') : (t('travelDetail.bookingInfo.addBooking') || '添加订票信息')"
      width="600px"
      @ok="handleSaveBooking"
      @cancel="handleCancelEdit"
    >
      <a-form :model="formData" layout="vertical">
        <a-form-item label="类型">
          <a-select v-model:value="formData.type" @change="handleTypeChange">
            <a-select-option value="flight">{{ t('travelDetail.bookingInfo.flights') || '航班' }}</a-select-option>
            <a-select-option value="hotel">{{ t('travelDetail.bookingInfo.hotels') || '酒店' }}</a-select-option>
            <a-select-option value="activity">{{ t('travelDetail.bookingInfo.activities') || '活动' }}</a-select-option>
            <a-select-option value="train">{{ t('travelDetail.bookingInfo.train') || '火车' }}</a-select-option>
            <a-select-option value="bus">{{ t('travelDetail.bookingInfo.bus') || '巴士' }}</a-select-option>
            <a-select-option value="car_rental">{{ t('travelDetail.bookingInfo.carRental') || '租车' }}</a-select-option>
            <a-select-option value="ferry">{{ t('travelDetail.bookingInfo.ferry') || '轮渡' }}</a-select-option>
          </a-select>
        </a-form-item>

        <!-- 航班表单 -->
        <template v-if="formData.type === 'flight'">
          <a-form-item label="航空公司">
            <a-input v-model:value="formData.airline" placeholder="如：中国国际航空" />
          </a-form-item>
          <a-form-item label="航班号">
            <a-input v-model:value="formData.flightNumber" placeholder="如：CA123" />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="出发机场">
                <a-input v-model:value="formData.departureAirport" placeholder="如：PEK" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="到达机场">
                <a-input v-model:value="formData.arrivalAirport" placeholder="如：NRT" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="出发日期">
                <a-date-picker v-model:value="formData.departureDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="出发时间">
                <a-time-picker v-model:value="formData.departureTime" style="width: 100%" format="HH:mm" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="确认码/PNR">
            <a-input v-model:value="formData.confirmationCode" placeholder="如：ABC123" />
          </a-form-item>
        </template>

        <!-- 酒店表单 -->
        <template v-if="formData.type === 'hotel'">
          <a-form-item label="酒店名称">
            <a-input v-model:value="formData.hotelName" />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="入住日期">
                <a-date-picker v-model:value="formData.checkInDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="退房日期">
                <a-date-picker v-model:value="formData.checkOutDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="确认码">
            <a-input v-model:value="formData.confirmationCode" />
          </a-form-item>
        </template>

        <!-- 活动表单 -->
        <template v-if="formData.type === 'activity'">
          <a-form-item label="活动名称">
            <a-input v-model:value="formData.activityName" />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="活动日期">
                <a-date-picker v-model:value="formData.activityDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="活动时间">
                <a-time-picker v-model:value="formData.activityTime" style="width: 100%" format="HH:mm" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="确认码">
            <a-input v-model:value="formData.confirmationCode" />
          </a-form-item>
        </template>

        <!-- 火车表单 -->
        <template v-if="formData.type === 'train'">
          <a-form-item label="服务商/铁路公司">
            <a-input v-model:value="formData.provider" placeholder="如：Eurostar、中国铁路" />
          </a-form-item>
          <a-form-item label="车次/服务名称">
            <a-input v-model:value="formData.serviceName" placeholder="如：TGV、G123" />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="出发车站">
                <a-input v-model:value="formData.departureStation" placeholder="如：北京南" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="到达车站">
                <a-input v-model:value="formData.arrivalStation" placeholder="如：上海虹桥" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="出发日期">
                <a-date-picker v-model:value="formData.departureDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="出发时间">
                <a-time-picker v-model:value="formData.departureTime" style="width: 100%" format="HH:mm" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="确认码/预订号">
            <a-input v-model:value="formData.confirmationCode" placeholder="如：ABC123" />
          </a-form-item>
        </template>

        <!-- 巴士表单 -->
        <template v-if="formData.type === 'bus'">
          <a-form-item label="巴士公司">
            <a-input v-model:value="formData.provider" placeholder="如：FlixBus、Greyhound" />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="出发站点">
                <a-input v-model:value="formData.departureStation" placeholder="如：中央车站" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="到达站点">
                <a-input v-model:value="formData.arrivalStation" placeholder="如：终点站" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="出发日期">
                <a-date-picker v-model:value="formData.departureDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="出发时间">
                <a-time-picker v-model:value="formData.departureTime" style="width: 100%" format="HH:mm" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="确认码">
            <a-input v-model:value="formData.confirmationCode" placeholder="如：ABC123" />
          </a-form-item>
        </template>

        <!-- 租车表单 -->
        <template v-if="formData.type === 'car_rental'">
          <a-form-item label="租车公司">
            <a-input v-model:value="formData.provider" placeholder="如：Hertz、Avis、神州租车" />
          </a-form-item>
          <a-form-item label="车型">
            <a-input v-model:value="formData.vehicleType" placeholder="如：经济型、SUV" />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="取车地点">
                <a-input v-model:value="formData.departureAddress" placeholder="如：机场店" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="还车地点">
                <a-input v-model:value="formData.arrivalAddress" placeholder="如：市区店" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="取车日期">
                <a-date-picker v-model:value="formData.departureDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="还车日期">
                <a-date-picker v-model:value="formData.arrivalDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="确认码">
            <a-input v-model:value="formData.confirmationCode" placeholder="如：ABC123" />
          </a-form-item>
        </template>

        <!-- 轮渡表单 -->
        <template v-if="formData.type === 'ferry'">
          <a-form-item label="轮渡公司">
            <a-input v-model:value="formData.provider" placeholder="如：Stena Line、DFDS" />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="出发港口">
                <a-input v-model:value="formData.departureStation" placeholder="如：多佛港" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="到达港口">
                <a-input v-model:value="formData.arrivalStation" placeholder="如：加来港" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="出发日期">
                <a-date-picker v-model:value="formData.departureDate" style="width: 100%" format="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="出发时间">
                <a-time-picker v-model:value="formData.departureTime" style="width: 100%" format="HH:mm" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="确认码">
            <a-input v-model:value="formData.confirmationCode" placeholder="如：ABC123" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelListStore } from '@/stores/travelList'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { ItineraryBookings, BookingInfo } from '@/types/booking'
import dayjs, { type Dayjs } from 'dayjs'
import { DEFAULT_CONFIG } from '@/config/defaults'

interface Props {
  travelId?: string
}

const props = withDefaults(defineProps<Props>(), {
  travelId: ''
})

const { t } = useI18n()
const travelListStore = useTravelListStore()

// 订票信息数据
const bookings = ref<ItineraryBookings>({
  travelId: props.travelId || '',
  flights: [],
  hotels: [],
  activities: [],
  transportations: []
})

const totalBookings = computed(() => {
  return bookings.value.flights.length + 
         bookings.value.hotels.length + 
         bookings.value.activities.length + 
         bookings.value.transportations.length
})

// 弹窗状态
const showAddModal = ref(false)
const editingBooking = ref<BookingInfo | null>(null)

// 表单数据
const formData = ref<any>({
  type: 'flight',
  airline: '',
  flightNumber: '',
  departureAirport: '',
  arrivalAirport: '',
  departureDate: null,
  departureTime: null,
  hotelName: '',
  checkInDate: null,
  checkOutDate: null,
  activityName: '',
  activityDate: null,
  activityTime: null,
  provider: '',
  serviceName: '',
  departureStation: '',
  arrivalStation: '',
  departureAddress: '',
  arrivalAddress: '',
  arrivalDate: null as Dayjs | null,
  vehicleType: '',
  confirmationCode: ''
})

// 加载订票信息
const loadBookings = () => {
  if (!props.travelId) return
  
  const travel = travelListStore.getTravel(props.travelId)
  if (travel?.data?.bookings) {
    bookings.value = {
      travelId: props.travelId,
      flights: travel.data.bookings.flights || [],
      hotels: travel.data.bookings.hotels || [],
      activities: travel.data.bookings.activities || [],
      transportations: travel.data.bookings.transportations || []
    }
  }
}

// 保存订票信息
const saveBookings = () => {
  if (!props.travelId) return
  
  travelListStore.updateTravel(props.travelId, {
    data: {
      ...travelListStore.getTravel(props.travelId)?.data,
      bookings: bookings.value
    }
  })
}

// 格式化日期时间
const formatDateTime = (date: string, time?: string) => {
  if (!date) return ''
  const d = new Date(date)
  const dateStr = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  return time ? `${dateStr} ${time}` : dateStr
}

// 获取状态颜色
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'confirmed': return 'green'
    case 'pending': return 'orange'
    case 'cancelled': return 'red'
    default: return 'default'
  }
}

// 获取状态文本
const getStatusText = (status?: string) => {
  switch (status) {
    case 'confirmed': return t('travelDetail.bookingInfo.status.confirmed') || '已确认'
    case 'pending': return t('travelDetail.bookingInfo.status.pending') || '待确认'
    case 'cancelled': return t('travelDetail.bookingInfo.status.cancelled') || '已取消'
    default: return t('travelDetail.bookingInfo.status.unknown') || '未知'
  }
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    message.success(t('common.copied') || '已复制到剪贴板')
  }).catch(() => {
    message.error(t('common.copyFailed') || '复制失败')
  })
}

// 打开预订链接
const openBookingLink = (booking: BookingInfo) => {
  // 根据预订平台打开链接
  if (booking.booking.bookingPlatform) {
    // 这里可以根据平台生成链接
    console.log('Open booking:', booking)
  }
}

// 编辑订票信息
const editBooking = (booking: BookingInfo) => {
  editingBooking.value = booking
  // 填充表单数据
  formData.value.type = booking.type
  formData.value.confirmationCode = booking.booking.confirmationCode
  
  if (booking.type === 'flight') {
    formData.value.airline = booking.airline
    formData.value.flightNumber = booking.flightNumber
    formData.value.departureAirport = booking.departure.airportCode
    formData.value.arrivalAirport = booking.arrival.airportCode
    formData.value.departureDate = booking.departure.date ? dayjs(booking.departure.date) : null
    formData.value.departureTime = booking.departure.time ? dayjs(booking.departure.time, 'HH:mm') : null
  } else if (booking.type === 'hotel') {
    formData.value.hotelName = booking.hotelName
    formData.value.checkInDate = booking.checkIn.date ? dayjs(booking.checkIn.date) : null
    formData.value.checkOutDate = booking.checkOut.date ? dayjs(booking.checkOut.date) : null
  } else if (booking.type === 'activity') {
    formData.value.activityName = booking.activityName
    formData.value.activityDate = booking.date ? dayjs(booking.date) : null
    formData.value.activityTime = booking.time ? dayjs(booking.time, 'HH:mm') : null
  } else if (booking.type === 'train' || booking.type === 'bus' || booking.type === 'ferry' || booking.type === 'car_rental') {
    formData.value.provider = booking.provider
    formData.value.serviceName = booking.serviceName || ''
    formData.value.departureStation = booking.departure.station || ''
    formData.value.arrivalStation = booking.arrival.station || ''
    formData.value.departureAddress = booking.departure.address || ''
    formData.value.arrivalAddress = booking.arrival.address || ''
    formData.value.departureDate = booking.departure.date ? dayjs(booking.departure.date) : null
    formData.value.departureTime = booking.departure.time ? dayjs(booking.departure.time, 'HH:mm') : null
    formData.value.arrivalDate = booking.arrival.date ? dayjs(booking.arrival.date) : null
    if (booking.type === 'car_rental') {
      formData.value.vehicleType = booking.vehicleType || ''
    }
  }
  
  showAddModal.value = true
}

// 处理类型变化
const handleTypeChange = () => {
  // 重置表单数据
  Object.keys(formData.value).forEach(key => {
    if (key !== 'type') {
      formData.value[key] = ''
    }
  })
}

// 保存订票信息
const handleSaveBooking = () => {
  if (!formData.value.confirmationCode) {
    message.warning(t('travelDetail.bookingInfo.confirmationCodeRequired') || '请输入确认码')
    return
  }

  // 根据类型创建订票信息对象
  let newBooking: BookingInfo | null = null

  if (formData.value.type === 'flight') {
    if (!formData.value.airline || !formData.value.flightNumber || !formData.value.departureDate) {
      message.warning(t('travelDetail.bookingInfo.incompleteInfo') || '请填写完整信息')
      return
    }
    
    newBooking = {
      id: editingBooking.value?.id || `flight_${Date.now()}`,
      type: 'flight',
      airline: formData.value.airline,
      airlineCode: '', // 可以从航空公司名称推断
      flightNumber: formData.value.flightNumber,
      departure: {
        airport: formData.value.departureAirport,
        airportCode: formData.value.departureAirport,
        city: '',
        date: formData.value.departureDate ? formData.value.departureDate.format('YYYY-MM-DD') : '',
        time: formData.value.departureTime ? formData.value.departureTime.format('HH:mm') : ''
      },
      arrival: {
        airport: formData.value.arrivalAirport,
        airportCode: formData.value.arrivalAirport,
        city: '',
        date: formData.value.departureDate ? formData.value.departureDate.format('YYYY-MM-DD') : '',
        time: ''
      },
      passengers: [],
      booking: {
        confirmationCode: formData.value.confirmationCode,
        bookingPlatform: ''
      },
      status: 'confirmed'
    }
    
    if (editingBooking.value) {
      const index = bookings.value.flights.findIndex(f => f.id === editingBooking.value!.id)
      if (index !== -1) {
        bookings.value.flights[index] = newBooking as any
      }
    } else {
      bookings.value.flights.push(newBooking as any)
    }
  } else if (formData.value.type === 'hotel') {
    newBooking = {
      id: editingBooking.value?.id || `hotel_${Date.now()}`,
      type: 'hotel',
      hotelName: formData.value.hotelName,
      address: {
        city: '',
        country: ''
      },
      checkIn: {
        date: formData.value.checkInDate ? formData.value.checkInDate.format('YYYY-MM-DD') : '',
        time: '15:00'
      },
      checkOut: {
        date: formData.value.checkOutDate ? formData.value.checkOutDate.format('YYYY-MM-DD') : '',
        time: '11:00'
      },
      rooms: [],
      booking: {
        confirmationCode: formData.value.confirmationCode
      },
      status: 'confirmed'
    }
    
    if (editingBooking.value) {
      const index = bookings.value.hotels.findIndex(h => h.id === editingBooking.value!.id)
      if (index !== -1) {
        bookings.value.hotels[index] = newBooking as any
      }
    } else {
      bookings.value.hotels.push(newBooking as any)
    }
  } else if (formData.value.type === 'activity') {
    newBooking = {
      id: editingBooking.value?.id || `activity_${Date.now()}`,
      type: 'activity',
      activityName: formData.value.activityName,
      date: formData.value.activityDate ? formData.value.activityDate.format('YYYY-MM-DD') : '',
      time: formData.value.activityTime ? formData.value.activityTime.format('HH:mm') : '',
      participants: DEFAULT_CONFIG.TRIP.DEFAULT_PARTICIPANTS,
      tickets: [],
      booking: {
        confirmationCode: formData.value.confirmationCode
      },
      status: 'confirmed'
    }
    
    if (editingBooking.value) {
      const index = bookings.value.activities.findIndex(a => a.id === editingBooking.value!.id)
      if (index !== -1) {
        bookings.value.activities[index] = newBooking as any
      }
    } else {
      bookings.value.activities.push(newBooking as any)
    }
  } else if (formData.value.type === 'train' || formData.value.type === 'bus' || formData.value.type === 'ferry') {
    // 火车、巴士、轮渡
    if (!formData.value.provider || !formData.value.departureDate) {
      message.warning(t('travelDetail.bookingInfo.incompleteInfo') || '请填写完整信息')
      return
    }
    
    newBooking = {
      id: editingBooking.value?.id || `${formData.value.type}_${Date.now()}`,
      type: formData.value.type as 'train' | 'bus' | 'ferry',
      provider: formData.value.provider,
      serviceName: formData.value.serviceName || '',
      departure: {
        station: formData.value.departureStation || '',
        date: formData.value.departureDate ? formData.value.departureDate.format('YYYY-MM-DD') : '',
        time: formData.value.departureTime ? formData.value.departureTime.format('HH:mm') : ''
      },
      arrival: {
        station: formData.value.arrivalStation || '',
        date: formData.value.departureDate ? formData.value.departureDate.format('YYYY-MM-DD') : '',
        time: ''
      },
      booking: {
        confirmationCode: formData.value.confirmationCode,
        bookingPlatform: ''
      },
      status: 'confirmed'
    }
    
    if (editingBooking.value) {
      const index = bookings.value.transportations.findIndex(t => t.id === editingBooking.value!.id)
      if (index !== -1) {
        bookings.value.transportations[index] = newBooking as any
      }
    } else {
      bookings.value.transportations.push(newBooking as any)
    }
  } else if (formData.value.type === 'car_rental') {
    // 租车
    if (!formData.value.provider || !formData.value.departureDate) {
      message.warning(t('travelDetail.bookingInfo.incompleteInfo') || '请填写完整信息')
      return
    }
    
    newBooking = {
      id: editingBooking.value?.id || `car_rental_${Date.now()}`,
      type: 'car_rental',
      provider: formData.value.provider,
      vehicleType: formData.value.vehicleType || '',
      departure: {
        address: formData.value.departureAddress || '',
        date: formData.value.departureDate ? formData.value.departureDate.format('YYYY-MM-DD') : '',
        time: ''
      },
      arrival: {
        address: formData.value.arrivalAddress || '',
        date: formData.value.arrivalDate ? formData.value.arrivalDate.format('YYYY-MM-DD') : (formData.value.departureDate ? formData.value.departureDate.format('YYYY-MM-DD') : ''),
        time: ''
      },
      booking: {
        confirmationCode: formData.value.confirmationCode,
        bookingPlatform: ''
      },
      status: 'confirmed'
    }
    
    if (editingBooking.value) {
      const index = bookings.value.transportations.findIndex(t => t.id === editingBooking.value!.id)
      if (index !== -1) {
        bookings.value.transportations[index] = newBooking as any
      }
    } else {
      bookings.value.transportations.push(newBooking as any)
    }
  }

  if (newBooking) {
    saveBookings()
    message.success(editingBooking.value 
      ? (t('common.saveSuccess') || '保存成功')
      : (t('travelDetail.bookingInfo.addSuccess') || '添加成功'))
    handleCancelEdit()
  }
}

// 取消编辑
const handleCancelEdit = () => {
  showAddModal.value = false
  editingBooking.value = null
  formData.value = {
    type: 'flight',
    airline: '',
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    departureDate: null,
    departureTime: null,
    hotelName: '',
    checkInDate: null,
    checkOutDate: null,
    activityName: '',
    activityDate: null,
    activityTime: null,
    provider: '',
    serviceName: '',
    departureStation: '',
    arrivalStation: '',
    departureAddress: '',
    arrivalAddress: '',
    arrivalDate: null,
    vehicleType: '',
    confirmationCode: ''
  }
}

onMounted(() => {
  loadBookings()
})
</script>

<style scoped>
.booking-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.booking-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.booking-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.booking-item {
  padding: 0.75rem;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.booking-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.booking-item-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.booking-airline,
.booking-name {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.booking-route {
  font-size: 0.8rem;
  color: #666;
}

.booking-item-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.booking-detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.detail-label {
  color: #999;
  min-width: 60px;
}

.detail-meta {
  color: #666;
  font-size: 0.8rem;
}

.booking-code {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1890ff;
  background: #f0f9ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.booking-item-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

.booking-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
}

.booking-add-btn {
  margin-top: 0.5rem;
}
</style>


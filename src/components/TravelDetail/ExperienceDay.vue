<template>
  <div class="experience-journey">
    <!-- 封面层（Hero Section）- 与其他模式保持一致 -->
    <div class="hero-section inspiration-hero">
      <div class="hero-cover">
        <img :src="coverImage" :alt="inspirationTitle" />
        <div class="hero-content">
          <!-- 主标题 -->
          <h1 class="hero-title">{{ inspirationTitle }}</h1>
          
          <!-- 旅行目的地 -->
          <p v-if="destination" class="hero-destination">{{ destination }}</p>
          
          <!-- 核心哲学语句 -->
          <p v-if="coreInsight" class="hero-core-insight">{{ coreInsight }}</p>
          
          <!-- 支持文本 -->
          <p v-if="supportingText" class="hero-supporting-text">{{ supportingText }}</p>
          
          <!-- 底部描述段落 -->
          <div v-if="journeyBackground" class="hero-footer-content">
            <p class="hero-description">{{ journeyBackground }}</p>
          </div>
          
          <!-- 底部图标 -->
          <div class="hero-footer-icons">
            <div class="footer-icon notification-icon" @click="handleShowVisaTips">
              <span>✈️</span>
              <span class="notification-badge" v-if="hasVisaInfo">1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 行程时间线 -->
    <section class="itinerary-timeline">
      <a-timeline>
        <a-timeline-item 
          v-for="(day, index) in itineraryDays" 
          :key="day.date || index"
          color="blue"
        >
          <template #dot>
            <calendar-outlined :style="{ fontSize: '16px' }" />
          </template>
          <div class="day-card">
            <div class="day-header">
              <div class="day-info">
                <h3 class="day-title">{{ day.theme || `${t('travelDetail.experienceDay.day')} ${day.day}` }}</h3>
                <span class="day-date">{{ day.date }}</span>
                <a-tag v-if="day.mood" :color="getMoodColor(day.mood)">{{ day.mood }}</a-tag>
      </div>
        </div>
            <!-- 每日行程摘要 -->
            <p v-if="getDaySummary(day)" class="day-description">{{ getDaySummary(day) }}</p>
            
            <!-- 时间段活动 -->
            <div class="time-slots">
              <div 
                v-for="(slot, slotIndex) in day.timeSlots" 
                :key="slotIndex"
                class="time-slot"
              >
                <div class="slot-time">{{ slot.time }}</div>
                <div class="slot-content">
                  <!-- Header 行：时间点 + 标题 + 位置 -->
                  <div class="slot-header-new">
                    <div class="slot-header-main">
                      <div class="slot-title-section">
                        <h4 class="slot-title-main">
                      {{ slot.title || slot.activity }}
                    </h4>
                        <p v-if="slot.details?.name?.english" class="slot-title-sub">
                          {{ slot.details.name.english }}
                        </p>
                      </div>
                    <div class="slot-actions">
            <a-button 
              type="text" 
                        size="small" 
                        @click="openEditModal(day.day, slotIndex, slot)"
                        class="edit-btn"
                      >
                        <edit-outlined />
            </a-button>
    </div>
        </div>
                  </div>

                  <!-- 活动摘要 -->
                  <div v-if="getActivitySummary(slot)" class="slot-summary">
                    <p class="summary-text">{{ getActivitySummary(slot) }}</p>
                  </div>

                  <!-- 关键指标一行化（胶囊 Chips） -->
                  <div v-if="slot.details || slot.duration || slot.cost" class="slot-chips-row">
                    <!-- ⏱ 预计停留 -->
                    <span v-if="slot.details?.recommendations?.suggestedDuration || slot.duration" class="slot-chip">
                      <span class="chip-icon">⏱</span>
                      {{ t('travelDetail.experienceDay.estimatedStay') }}：{{ slot.details?.recommendations?.suggestedDuration || `${slot.duration}–${slot.duration + DEFAULT_VALUES.DURATION_BUFFER}${t('travelDetail.experienceDay.minutes')}` }}
                    </span>
                    <!-- ⭐ 评分 -->
                    <span 
                      v-if="slot.details?.rating" 
                      class="slot-chip slot-rating-chip rating-clickable"
                      @click="handleRatingClick(slot)"
                      :title="t('travelDetail.experienceDay.clickToViewReviews') || '点击查看评论'"
                    >
                      <span class="chip-icon">⭐</span>
                      <span class="slot-rating-score">{{ slot.details.rating.score }}</span>
                      <span v-if="slot.details.rating.reviewCount" class="slot-rating-count">（{{ formatReviewCount(slot.details.rating.reviewCount) }}{{ t('travelDetail.experienceDay.reviews') }}）</span>
                      <span v-if="getRatingPlatform(slot)" class="slot-rating-platform"> · {{ getRatingPlatform(slot) }}</span>
                    </span>
                    <!-- 🍂 季节提示 -->
                    <span v-if="slot.details?.recommendations?.seasonal" class="slot-chip slot-seasonal-chip">
                      <span class="chip-icon">🍂</span>
                      {{ t('travelDetail.experienceDay.seasonalTip') }}：{{ slot.details.recommendations.seasonal }}
                    </span>
                  </div>
                  
                  <!-- 信息块（2列栅格） -->
                  <div v-if="slot.details" class="slot-info-grid">
                    <!-- 左列：到达/操作信息 -->
                    <div class="slot-info-column">
                      <!-- 交通 -->
                      <div v-if="slot.details.transportation" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">🚌</span> {{ t('travelDetail.experienceDay.transportation') }}
                        </h5>
                        <p class="slot-info-text">
                          <span v-if="slot.details.transportation.fromStation?.walkTime">
                            {{ t('travelDetail.experienceDay.walking') }}{{ slot.details.transportation.fromStation.walkTime }}{{ t('travelDetail.experienceDay.minutes') }}{{ t('travelDetail.experienceDay.minutesReachable') }}
                          </span>
                          <span v-else-if="!slot.details.transportation.fromStation?.walkTime && (!slot.details.transportation.busLines || !slot.details.transportation.busLines.length)">
                            {{ t('travelDetail.experienceDay.walkingNotReachable') }}
                          </span>
                          <span v-if="slot.details.transportation.busLines && slot.details.transportation.busLines.length">
                            <span v-if="slot.details.transportation.fromStation?.walkTime"> · </span>
                            {{ t('travelDetail.experienceDay.bus') }}{{ slot.details.transportation.busLines.join('/') }}{{ t('travelDetail.experienceDay.route') }}
                          </span>
                          <span v-if="slot.details.transportation.parking">
                            <span v-if="slot.details.transportation.fromStation?.walkTime || (slot.details.transportation.busLines && slot.details.transportation.busLines.length)"> · </span>
                            {{ slot.details.transportation.parking }}
                          </span>
                        </p>
                      </div>
                      
                      <!-- Booking链接（所有需要预订的活动） -->
                      <div v-if="slot.bookingLinks && slot.bookingLinks.length > 0" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">🔗</span> 预订链接
                        </h5>
                        <div class="booking-links-display">
                          <a 
                            v-for="(link, linkIndex) in slot.bookingLinks" 
                            :key="linkIndex"
                            :href="link.url" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="booking-link-card"
                          >
                            <link-outlined class="booking-link-icon" />
                            <span class="booking-link-name">{{ link.name || '预订链接' }}</span>
                            <span class="booking-link-arrow">→</span>
                          </a>
                        </div>
                      </div>
                      
                      <!-- 预订 -->
                      <div v-if="slot.details.recommendations?.bookingRequired !== undefined" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">📅</span> {{ t('travelDetail.experienceDay.booking') }}
                        </h5>
                        <p class="slot-info-text">
                          {{ slot.details.recommendations.bookingRequired ? `${t('travelDetail.experienceDay.bookingRequired')}${slot.details.recommendations.bookingAdvance || t('travelDetail.experienceDay.bookingAdvanceDefault')}` : t('travelDetail.experienceDay.noBookingRequired') }}
                        </p>
                      </div>
                      
                      <!-- 开放时间 -->
                      <div v-if="slot.details.openingHours" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">🕘</span> {{ t('travelDetail.experienceDay.openingHours') }}
                        </h5>
                        <p class="slot-info-text">
                          <span v-if="slot.details.openingHours.days">{{ slot.details.openingHours.days }} </span>
                          <span v-if="slot.details.openingHours.hours">
                            {{ formatOpeningHours(slot.details.openingHours.hours) }}
                          </span>
                        </p>
                      </div>
                      
                      <!-- 位置 -->
                      <div v-if="slot.location || slot.details?.address" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">📍</span> {{ t('travelDetail.experienceDay.location') }}
                        </h5>
                        <p class="slot-info-text">
                          <template v-if="shouldShowChineseOnly">
                            <!-- 中国国籍+中国目的地：只显示中文地址 -->
                            <span v-if="slot.details?.address?.chinese">
                              {{ slot.details.address.chinese }}
                              <span v-if="slot.details.address.landmark"> · {{ slot.details.address.landmark }}</span>
                            </span>
                            <span v-else-if="slot.location">{{ slot.location }}</span>
                          </template>
                          <template v-else-if="locale.value === 'zh-CN'">
                            <!-- 中文模式：优先显示中文地址 -->
                            <span v-if="slot.details?.address?.chinese">
                              {{ slot.details.address.chinese }}
                              <span v-if="slot.details.address.landmark"> · {{ slot.details.address.landmark }}</span>
                            </span>
                            <span v-else-if="slot.details?.address?.english">
                              {{ slot.details.address.english }}
                              <span v-if="slot.details.address.landmark"> · {{ slot.details.address.landmark }}</span>
                            </span>
                            <span v-else-if="slot.location">{{ slot.location }}</span>
                          </template>
                          <template v-else>
                            <!-- 英文模式：优先显示英文地址 -->
                            <span v-if="slot.details?.address?.english">
                              {{ slot.details.address.english }}
                              <span v-if="slot.details.address.landmark"> · {{ slot.details.address.landmark }}</span>
                            </span>
                            <span v-else-if="slot.details?.address?.chinese">
                              {{ slot.details.address.chinese }}
                              <span v-if="slot.details.address.landmark"> · {{ slot.details.address.landmark }}</span>
                            </span>
                            <span v-else-if="slot.location">{{ slot.location }}</span>
                          </template>
                        </p>
                      </div>
                    </div>
                    
                    <!-- 右列：体验/建议 -->
                    <div class="slot-info-column">
                      <!-- 行前建议（合并穿搭和其他建议） -->
                      <div v-if="slot.details.recommendations?.dressCode || slot.details.recommendations?.bestTime || slot.details.recommendations?.suitableFor" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">💡</span> {{ t('travelDetail.experienceDay.preTripAdvice') }}
                        </h5>
                        <p class="slot-info-text">
                          <span v-if="slot.details.recommendations.dressCode">{{ t('travelDetail.experienceDay.dressCode') }}：{{ slot.details.recommendations.dressCode }}</span>
                          <span v-if="slot.details.recommendations.bestTime">
                            <span v-if="slot.details.recommendations.dressCode"> · </span>
                            {{ t('travelDetail.experienceDay.bestTime') }}：{{ slot.details.recommendations.bestTime }}
                          </span>
                          <span v-if="slot.details.recommendations.suitableFor">
                            <span v-if="slot.details.recommendations.dressCode || slot.details.recommendations.bestTime"> · </span>
                            {{ t('travelDetail.experienceDay.suitableFor') }}：{{ slot.details.recommendations.suitableFor }}
                          </span>
                        </p>
                      </div>
                      
                      <!-- 费用详情 -->
                      <div v-if="slot.details.pricing && hasValidPricing(slot.details.pricing)" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">💵</span> {{ t('travelDetail.experienceDay.pricingDetails') }}
                        </h5>
                        <p class="slot-info-text">
                          <span v-if="slot.details.pricing.general">
                            {{ t('travelDetail.experienceDay.transportationCost') }}：{{ formatCurrency(slot.details.pricing.general, getSlotCurrency(slot)) }}
                            <span v-if="slot.details.pricing.description">（{{ slot.details.pricing.description }}）</span>
                          </span>
                          <span v-if="slot.details.pricing.detail?.children && slot.details.pricing.detail.children.price > 0">
                            <span v-if="slot.details.pricing.general"> · </span>
                            {{ t('travelDetail.experienceDay.children') }}{{ formatCurrency(slot.details.pricing.detail.children.price, getSlotCurrency(slot)) }}
                            <span v-if="slot.details.pricing.detail.children.ageRange">（{{ slot.details.pricing.detail.children.ageRange }}）</span>
                          </span>
                          <span v-if="slot.details.pricing.detail?.groupDiscount && slot.details.pricing.detail.groupDiscount.minPeople > 0 && slot.details.pricing.detail.groupDiscount.percentage < 100">
                            <span v-if="slot.details.pricing.general || (slot.details.pricing.detail?.children && slot.details.pricing.detail.children.price > 0)"> · </span>
                            {{ slot.details.pricing.detail.groupDiscount.minPeople }}{{ t('travelDetail.experienceDay.peoplePlus') }} {{ 100 - slot.details.pricing.detail.groupDiscount.percentage }}{{ t('travelDetail.experienceDay.discount') }}
                          </span>
                        </p>
                      </div>
                      
                      <!-- 不适合人群 -->
                      <div v-if="slot.details.recommendations?.notSuitableFor" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">⚠️</span> {{ t('travelDetail.experienceDay.notSuitableFor') }}
                        </h5>
                        <p class="slot-info-text">{{ slot.details.recommendations.notSuitableFor }}</p>
                      </div>
                      
                      <!-- 注意事项 -->
                      <div v-if="slot.details?.recommendations?.specialNotes && slot.details.recommendations.specialNotes.length" class="slot-info-item">
                        <h5 class="slot-info-label">
                          <span class="info-icon">📌</span> {{ t('travelDetail.experienceDay.notes') }}
                        </h5>
                        <ul class="slot-detail-list">
                          <li v-for="(note, noteIndex) in slot.details.recommendations.specialNotes" :key="noteIndex">{{ note }}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 操作条 -->
                  <div class="slot-actions-bar">
                    <a-button 
                      type="text" 
                      size="small" 
                      class="slot-action-btn slot-action-primary"
                      @click="handleNavigate(slot)"
                    >
                      <span>📍</span> {{ t('travelDetail.experienceDay.navigate') }}
                    </a-button>
                    <a-button 
                      v-if="slot.details?.recommendations?.bookingRequired"
                      type="text" 
                      size="small" 
                      class="slot-action-btn"
                      @click="handleBook(slot)"
                    >
                      <span>🗓</span> {{ t('travelDetail.experienceDay.book') }}
                    </a-button>
                    <a-button 
                      type="text" 
                      size="small" 
                      class="slot-action-btn"
                      @click="handleContact(slot)"
                    >
                      <span>📞</span> {{ t('travelDetail.experienceDay.contact') }}
                    </a-button>
                    <a-button 
                      type="text" 
                      size="small" 
                      class="slot-action-btn"
                      @click="toggleDetails(day.day, slotIndex)"
                    >
                      <span>↧</span> {{ expandedDetails[`${day.day}-${slotIndex}`] ? t('travelDetail.experienceDay.collapse') : t('travelDetail.experienceDay.more') }}
                    </a-button>
                  </div>
                  
                  <!-- 信息来源 -->
                  <div v-if="slot.details" class="slot-source-info">
                    <span class="source-text">{{ t('travelDetail.experienceDay.informationSource') }}：{{ getSourceInfo(slot) }}</span>
                    <span v-if="slot.details.lastUpdated" class="source-text"> · {{ t('travelDetail.experienceDay.updated') }}：{{ formatDate(slot.details.lastUpdated) }}</span>
                  </div>
                  
                  <!-- 折叠详情 -->
                  <div v-if="expandedDetails[`${day.day}-${slotIndex}`]" class="slot-expanded-details">
                    <!-- 当地名称 -->
                    <div v-if="slot.details?.name?.local" class="slot-detail-section">
                      <h5 class="slot-detail-label">{{ t('travelDetail.experienceDay.localName') }}</h5>
                      <p class="slot-detail-text">{{ slot.details.name.local }}</p>
                    </div>
                    
                    <!-- 详细说明 -->
                    <div v-if="slot.details?.description" class="slot-detail-section">
                      <h5 class="slot-detail-label">{{ t('travelDetail.experienceDay.detailedDescription') }}</h5>
                      <p class="slot-detail-text" v-if="slot.details.description.cuisine">{{ t('travelDetail.experienceDay.cuisineType') }}：{{ slot.details.description.cuisine }}</p>
                      <p class="slot-detail-text" v-if="slot.details.description.specialty">{{ t('travelDetail.experienceDay.specialty') }}：{{ slot.details.description.specialty }}</p>
                      <p class="slot-detail-text" v-if="slot.details.description.atmosphere">{{ t('travelDetail.experienceDay.atmosphere') }}：{{ slot.details.description.atmosphere }}</p>
                    </div>
                    
                    <!-- 礼貌用语 -->
                    <div v-if="slot.localTip" class="slot-detail-section">
                      <h5 class="slot-detail-label">{{ t('travelDetail.experienceDay.politePhrases') }}</h5>
                      <p class="slot-detail-text">{{ slot.localTip }}</p>
                    </div>
                  </div>
                  


                  <div class="slot-meta">
                    <a-tag
                      v-if="slot.type || slot.category" 
                      size="small"
                      :color="getActivityTypeColor(slot.type || slot.category)"
                    >
                      {{ getActivityTypeLabel(slot.type || slot.category) }}
                    </a-tag>
                    <span v-if="slot.duration" class="slot-duration">{{ t('travelDetail.experienceDay.duration') }}：{{ slot.duration }}{{ t('travelDetail.experienceDay.minutes') }}</span>
                    <span v-if="slot.cost" class="slot-cost">
                      {{ t('travelDetail.experienceDay.cost') }}：{{ formatCurrency(slot.cost, getSlotCurrency(slot)) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-timeline-item>
      </a-timeline>
    </section>

    <!-- 旅行建议 -->
    <section v-if="recommendations" class="recommendations-section">
      <h3 class="section-title">{{ t('travelDetail.experienceDay.travelSuggestions') }}</h3>
      <div class="recommendations-grid">
        <div v-if="recommendations.bestTimeToVisit" class="recommendation-card">
          <h4>{{ t('travelDetail.experienceDay.bestTimeToVisit') }}</h4>
          <p>{{ recommendations.bestTimeToVisit }}</p>
    </div>
        <div v-if="recommendations.weatherAdvice" class="recommendation-card">
          <h4>{{ t('travelDetail.experienceDay.weatherAdvice') }}</h4>
          <p>{{ recommendations.weatherAdvice }}</p>
        </div>
        <div v-if="recommendations.packingTips && recommendations.packingTips.length" class="recommendation-card">
          <h4>{{ t('travelDetail.experienceDay.packingTips') }}</h4>
          <ul>
            <li v-for="(tip, index) in recommendations.packingTips" :key="index">{{ tip }}</li>
        </ul>
        </div>
        <div v-if="recommendations.localTips && recommendations.localTips.length" class="recommendation-card">
          <h4>{{ t('travelDetail.experienceDay.localTips') }}</h4>
          <ul>
            <li v-for="(tip, index) in recommendations.localTips" :key="index">{{ tip }}</li>
        </ul>
            </div>
          </div>
    </section>
    
    <!-- 编辑活动弹窗 -->
    <a-modal
      v-model:open="editModalVisible"
      title="编辑活动"
      width="600px"
      :ok-text="t('travelDetail.experienceDay.save')"
      :cancel-text="t('travelDetail.experienceDay.cancel')"
      @ok="handleSaveEdit"
      @cancel="handleCancelEdit"
    >
      <div class="edit-modal-content">
        <div class="edit-form-item">
          <label class="edit-form-label">{{ t('travelDetail.experienceDay.activityName') }}</label>
          <a-input
            v-model:value="editingData.title" 
            :placeholder="t('travelDetail.experienceDay.activityName')"
          />
        </div>
        
        <div class="edit-form-item">
          <label class="edit-form-label">{{ t('travelDetail.experienceDay.activityDescription') }}</label>
          <a-textarea
            v-model:value="editingData.notes" 
            :placeholder="t('travelDetail.experienceDay.activityDescription')"
            :auto-size="{ minRows: 3, maxRows: 6 }"
          />
        </div>
        
        <div class="edit-form-item">
          <label class="edit-form-label">{{ t('travelDetail.experienceDay.activityType') }}</label>
          <a-select 
            v-model:value="editingData.type" 
            :placeholder="t('travelDetail.experienceDay.activityType')"
            style="width: 100%"
          >
            <a-select-option value="attraction">{{ t('travelDetail.experienceDay.attraction') }}</a-select-option>
            <a-select-option value="restaurant">{{ t('travelDetail.experienceDay.restaurant') }}</a-select-option>
            <a-select-option value="accommodation">{{ t('travelDetail.experienceDay.accommodation') }}</a-select-option>
            <a-select-option value="shopping">{{ t('travelDetail.experienceDay.shopping') }}</a-select-option>
            <a-select-option value="transport">{{ t('travelDetail.experienceDay.transport') }}</a-select-option>
          </a-select>
        </div>
        
        <div class="edit-form-item">
          <label class="edit-form-label">{{ t('travelDetail.experienceDay.cost') }}</label>
          <a-input-number 
            v-model:value="editingData.cost" 
            :min="0"
            :precision="2"
            :placeholder="t('travelDetail.experienceDay.cost')"
            style="width: 100%"
          >
            <template #addonBefore>{{ editingSlot ? getSlotCurrency(getCurrentSlot()).symbol : getOverallCurrency().symbol }}</template>
          </a-input-number>
          <div class="form-item-hint" style="margin-top: 4px; font-size: 12px; color: #999;">
            {{ editingSlot ? 
              `${t('travelDetail.currencyHint') || '使用'}${getSlotCurrency(getCurrentSlot()).name}${t('travelDetail.record') || '记录'}` :
              `${t('travelDetail.currencyHint') || '使用'}${getOverallCurrency().name}${t('travelDetail.record') || '记录'}` 
            }}
          </div>
        </div>
        
        <!-- Booking链接管理 -->
        <div class="edit-form-item">
          <div class="booking-links-header">
            <label class="edit-form-label">🔗 预订链接</label>
            <a-button 
              type="dashed" 
              size="small" 
              @click="addBookingLink"
            >
              <template #icon><plus-outlined /></template>
              添加链接
            </a-button>
          </div>
          <div v-if="editingData.bookingLinks.length === 0" class="booking-links-empty">
            <span style="color: #999; font-size: 12px;">暂无预订链接</span>
          </div>
          <div v-else class="booking-links-list">
            <div 
              v-for="(link, linkIndex) in editingData.bookingLinks" 
              :key="linkIndex"
              class="booking-link-item"
            >
              <a-input 
                v-model:value="link.name" 
                placeholder="链接名称（如：Booking.com、官网预订等）"
                style="flex: 1; margin-right: 8px;"
              />
              <a-input 
                v-model:value="link.url" 
                placeholder="https://..."
                style="flex: 2; margin-right: 8px;"
              />
              <a-button 
                type="text" 
                danger 
                size="small"
                @click="removeBookingLink(linkIndex)"
              >
                <template #icon><delete-outlined /></template>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTravelListStore } from '@/stores/travelList'
import { CalendarOutlined, EditOutlined, EnvironmentOutlined, DownOutlined, PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons-vue'
import { getCurrencyForDestination, formatCurrency, type CurrencyInfo } from '@/utils/currency'
import { getLocalLanguageForDestination, type LocalLanguageInfo } from '@/utils/localLanguage'
import { getRatingPlatformForDestination, getRatingPlatformName } from '@/utils/ratingPlatform'
import { Modal, message } from 'ant-design-vue'
import { getVisaInfo } from '@/config/visa'
import { getUserNationalityCode, getUserPermanentResidencyCode } from '@/config/userProfile'
import { PRESET_COUNTRIES } from '@/constants/countries'
import {
  COUNTRY_KEYWORDS,
  MAP_URLS,
  BOOKING_PLATFORMS,
  DEFAULT_VALUES,
  MOOD_COLORS,
  ACTIVITY_TYPE_COLORS,
} from '@/utils/travelConstants'

const route = useRoute()
const { t, locale } = useI18n()
const travelListStore = useTravelListStore()

// 基础数据
const travel = computed(() => travelListStore.getTravel(route.params.id as string))

// 检查数据是否为行程计划格式（有days数组）
const itineraryData = computed(() => {
  const data = travel.value?.data
  // 如果直接是行程计划格式（有days数组）
  if (data?.days && Array.isArray(data.days)) {
    return data
  }
  // 如果存储在plannerItinerary中
  if (data?.plannerItinerary?.days && Array.isArray(data.plannerItinerary.days)) {
    return data.plannerItinerary
  }
  // 如果存储在itineraryData中
  if (data?.itineraryData?.days && Array.isArray(data.itineraryData.days)) {
    return data.itineraryData
  }
  return null
})

// 封面层数据 - 灵感卡片风格
const inspirationTitle = computed(() => {
  // 优先使用灵感模式的标题
  if (travel.value?.data?.title) return travel.value.data.title
  if (itineraryData.value?.title) return itineraryData.value.title
  return travel.value?.title || t('travelDetail.experienceDay.defaultInspirationTitle')
})

const destination = computed(() => {
  // 优先级：1. travel.location (用户选择的目的地) 2. data.selectedLocation 3. itineraryData.destination 4. data.location
  const dest = travel.value?.location || 
               travel.value?.data?.selectedLocation || 
               itineraryData.value?.destination || 
               travel.value?.data?.location ||
               travel.value?.data?.destination
  // 过滤掉"待定"等无效值
  if (dest && dest !== '待定' && dest.trim() !== '') {
    // 如果包含国家信息，格式化显示
    const country = travel.value?.data?.currentCountry || 
                   itineraryData.value?.country ||
                   travel.value?.data?.locationCountries?.[dest]
    // 如果目的地本身不包含国家信息，且我们有国家信息，则添加
    if (country && !dest.includes(country) && !dest.includes('(')) {
      return `${dest} · ${country}`
    }
    return dest
  }
  // 尝试从行程数据中提取目的地信息
  if (itineraryData.value?.days && itineraryData.value.days.length > 0) {
    // 从第一天的活动位置中提取
    const firstDay = itineraryData.value.days[0]
    if (firstDay?.timeSlots && firstDay.timeSlots.length > 0) {
      const firstSlot = firstDay.timeSlots[0]
      const slotLocation = firstSlot?.details?.address?.chinese || 
                          firstSlot?.details?.address?.english ||
                          firstSlot?.location
      if (slotLocation) {
        // 尝试提取城市或国家名称
        const locationMatch = slotLocation.match(/([^·,，]+?)(?:·|,|，|$)/)
        if (locationMatch && locationMatch[1]) {
          return locationMatch[1].trim()
        }
      }
    }
  }
  return ''
})

// 判断目的地是否是中国
const isDestinationChina = computed(() => {
  const destStr = destination.value || ''
  return COUNTRY_KEYWORDS.CHINA.some(keyword => destStr.includes(keyword))
})

// 判断用户国籍是否是中国
const isUserNationalityChina = computed(() => {
  const nationalityCode = getUserNationalityCode()
  return nationalityCode === 'CN'
})

// 判断是否应该只显示中文地址（用户国籍是中国且目的地也是中国）
const shouldShowChineseOnly = computed(() => {
  return isUserNationalityChina.value && isDestinationChina.value
})

// 核心哲学语句
const coreInsight = computed(() => {
  return travel.value?.data?.coreInsight || 
         travel.value?.data?.narrative?.threshold ||
         travel.value?.data?.narrative?.stillness ||
         t('travelDetail.experienceDay.defaultCoreInsight')
})

// 支持文本
const supportingText = computed(() => {
  return travel.value?.data?.narrative?.mirror ||
         travel.value?.data?.cognitiveTriggers?.questions?.[0] ||
         t('travelDetail.experienceDay.defaultSupportingText')
})

// 底部描述段落
const journeyBackground = computed(() => {
  return travel.value?.data?.journeyBackground ||
         travel.value?.data?.summary ||
         travel.value?.data?.aiMessage ||
         itineraryData.value?.summary ||
         ''
})

const itinerarySummary = computed(() => {
  return itineraryData.value?.summary || travel.value?.description || ''
})

const duration = computed(() => {
  return itineraryData.value?.duration || travel.value?.duration || null
})

// 封面图片（与其他模式保持一致）
const coverImage = computed(() => {
  const img = travel.value?.coverImage || travel.value?.data?.coverImage
  if (img) {
    return img
  }
  // 如果没有封面图片，使用默认图片
  const dest = destination.value || ''
  if (dest) {
    return `https://source.unsplash.com/1600x450/?${encodeURIComponent(dest)}`
  }
  return 'https://source.unsplash.com/1600x450/?travel'
})

// 行程天数数据
const itineraryDays = computed(() => {
  if (!itineraryData.value?.days) return []
  return itineraryData.value.days.map((day: any) => ({
    ...day,
    timeSlots: day.timeSlots || day.activities || []
  }))
})

// 旅行建议
const recommendations = computed(() => {
  return itineraryData.value?.recommendations || null
})

// 获取每个活动对应的货币信息（根据活动的具体位置）
const getSlotCurrency = (slot: any): CurrencyInfo => {
  // 1. 优先使用活动的位置信息
  const slotLocation = slot.details?.address?.chinese || 
                       slot.details?.address?.english || 
                       slot.location ||
                       ''
  
  if (slotLocation) {
    const currency = getCurrencyForDestination(slotLocation)
    // 如果匹配成功（不是默认的 CNY），返回该币种
    if (currency.code !== 'CNY') {
      return currency
    }
    
    // 如果包含中国相关关键词，返回人民币
    if (COUNTRY_KEYWORDS.CHINA.some(keyword => slotLocation.includes(keyword))) {
      return getCurrencyForDestination('中国')
    }
  }
  
  // 2. 如果没有活动位置，使用行程整体的货币信息
  return getOverallCurrency()
}

// 行程整体货币信息（用于总费用等全局显示）
const getOverallCurrency = (): CurrencyInfo => {
  // 1. 优先使用明确的国家信息（最准确）
  const explicitCountry = travel.value?.data?.currentCountry ||
                  travel.value?.data?.locationCountries?.[travel.value?.location || ''] ||
                  travel.value?.data?.locationCountries?.[travel.value?.data?.selectedLocation || '']
  
  if (explicitCountry && explicitCountry.trim()) {
    const currency = getCurrencyForDestination(explicitCountry.trim())
    // 如果匹配成功（不是默认的 CNY），直接返回
    if (currency.code !== 'CNY' || COUNTRY_KEYWORDS.CHINA.some(keyword => explicitCountry.includes(keyword))) {
      return currency
    }
  }
  
  // 2. 从 destination 字符串中提取国家（如 "北京 (中国)"、"Paris, France"）
  const destString = destination.value || 
               travel.value?.location || 
               travel.value?.data?.selectedLocation ||
                     itineraryData.value?.destination ||
                     ''
  
  if (destString) {
    const currency = getCurrencyForDestination(destString)
    // 如果匹配成功（不是默认的 CNY），返回该币种
    if (currency.code !== 'CNY') {
      return currency
    }
    
    // 如果 destination 中包含中国相关关键词，返回人民币
    if (COUNTRY_KEYWORDS.CHINA.some(keyword => destString.includes(keyword))) {
      return getCurrencyForDestination('中国')
    }
  }
  
  // 3. 默认返回人民币（如果没有匹配到其他国家）
  return { code: 'CNY', symbol: '¥', name: '人民币' }
}

// 货币信息（兼容旧代码，使用整体货币）
const currencyInfo = computed<CurrencyInfo>(() => {
  return getOverallCurrency()
})

// 获取评分平台信息（用于自动推断）
const getRatingPlatform = (slot: any): string => {
  // 如果已有平台信息，直接使用
  if (slot.details?.rating?.platform) {
    return slot.details.rating.platform
  }
  
  // 否则根据目的地自动推断
  const dest = destination.value || 
               slot.location || 
               travel.value?.location ||
               travel.value?.data?.selectedLocation
  
  if (dest) {
    const platformInfo = getRatingPlatformForDestination(dest)
    // 根据当前语言返回对应名称
    return locale.value.startsWith('en') ? platformInfo.nameEn : platformInfo.name
  }
  
  // 默认返回 TripAdvisor
  return t('travelDetail.experienceDay.defaultRatingPlatform')
}

// 获取评分平台代码（用于生成链接）
const getRatingPlatformCode = (slot: any): string => {
  // 如果已有平台代码，直接使用
  if (slot.details?.rating?.platformCode) {
    return slot.details.rating.platformCode
  }
  
  // 如果已有平台名称，尝试从平台名称推断代码
  if (slot.details?.rating?.platform) {
    const platformName = slot.details.rating.platform
    const platformNameLower = platformName.toLowerCase()
    // 根据平台名称匹配代码（中文和英文都检查）
    if (platformName.includes('大众点评') || platformNameLower.includes('dianping')) {
      return 'dianping'
    } else if (platformNameLower.includes('tripadvisor') || platformName.includes('猫途鹰')) {
      return 'tripadvisor'
    } else if (platformName.includes('食べログ') || platformNameLower.includes('tabelog')) {
      return 'tabelog'
    } else if (platformNameLower.includes('naver') || platformName.includes('네이버')) {
      return 'naver'
    }
  }
  
  // 否则根据目的地自动推断
  const dest = destination.value || 
               slot.location || 
               travel.value?.location ||
               travel.value?.data?.selectedLocation
  
  if (dest) {
    const platformInfo = getRatingPlatformForDestination(dest)
    return platformInfo.code
  }
  
  // 默认返回 tripadvisor
  return 'tripadvisor'
}

// 处理评分点击，跳转到对应平台
const handleRatingClick = (slot: any) => {
  // 获取平台代码
  const platformCode = getRatingPlatformCode(slot)
  
  // 根据平台选择合适语言的活动名称
  let activityName = ''
  
  switch (platformCode) {
    case 'dianping':
      // 大众点评：使用中文名称
      activityName = slot.details?.name?.chinese || 
                     slot.title || 
                     slot.activity ||
                     slot.details?.name?.english ||
                     ''
      break
    case 'tabelog':
      // 食べログ：优先使用日文，其次中文，最后英文
      activityName = slot.details?.name?.japanese ||
                     slot.details?.name?.chinese || 
                     slot.title || 
                     slot.activity ||
                     slot.details?.name?.english ||
                     ''
      break
    case 'naver':
      // Naver：优先使用韩文，其次中文，最后英文
      activityName = slot.details?.name?.korean ||
                     slot.details?.name?.chinese || 
                     slot.title || 
                     slot.activity ||
                     slot.details?.name?.english ||
                     ''
      break
    case 'tripadvisor':
    default:
      // TripAdvisor和其他平台：优先使用英文名称，其次中文
      activityName = slot.details?.name?.english || 
                     slot.details?.name?.chinese || 
                     slot.title || 
                     slot.activity ||
                     ''
      break
  }
  
  if (!activityName) {
    message.warning(t('travelDetail.experienceDay.activityNameRequired') || '无法获取活动名称')
    return
  }
  
  // 根据平台代码生成URL
  let url = ''
  const encodedName = encodeURIComponent(activityName)
  
  switch (platformCode) {
    case 'dianping':
      // 大众点评搜索（使用中文）
      url = `${BOOKING_PLATFORMS.DIANPING}${encodedName}`
      break
    case 'tripadvisor':
      // TripAdvisor搜索（使用英文）
      url = `${BOOKING_PLATFORMS.TRIPADVISOR}${encodedName}`
      break
    case 'tabelog':
      // 食べログ搜索（日本，使用日文或中文）
      url = `https://tabelog.com/tw/search/?sa=&sk=${encodedName}`
      break
    case 'naver':
      // Naver搜索（韩国，使用韩文或中文）
      url = `https://search.naver.com/search.naver?query=${encodedName}`
      break
    default:
      // 默认使用 TripAdvisor（使用英文）
      url = `${BOOKING_PLATFORMS.TRIPADVISOR}${encodedName}`
  }
  
  // 在新窗口打开
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 总费用（使用当地货币）
const totalCost = computed(() => {
  if (!itineraryData.value?.totalCost && !itineraryDays.value.length) return null
  
  // 如果有总费用，使用整体货币信息格式化
  if (itineraryData.value?.totalCost) {
    return formatCurrency(itineraryData.value.totalCost, getOverallCurrency())
  }
  
  // 否则计算所有活动的费用总和
  // 注意：如果活动跨越多个国家，这里使用整体货币作为默认显示
  // 后续可以优化为显示多币种汇总
  const total = itineraryDays.value.reduce((sum, day) => {
    const dayCost = (day.timeSlots || []).reduce((daySum: number, slot: any) => {
      return daySum + (slot.cost || 0)
    }, 0)
    return sum + dayCost
  }, 0)
  
  return total > 0 ? formatCurrency(total, getOverallCurrency()) : null
})

// 编辑状态
const editModalVisible = ref(false)
const editingSlot = ref<{ day: number; slotIndex: number } | null>(null)
const editingData = ref<{
  title: string
  notes: string
  type: string
  cost: number | null
  bookingLinks: Array<{ name: string; url: string }>
}>({
  title: '',
  notes: '',
  type: 'attraction',
  cost: null,
  bookingLinks: [],
})

// 获取当前正在编辑的活动
const getCurrentSlot = () => {
  if (!editingSlot.value || !itineraryData.value?.days) return null
  const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === editingSlot.value!.day)
  if (dayIndex === -1) return null
  return itineraryData.value.days[dayIndex].timeSlots?.[editingSlot.value.slotIndex] || null
}

// 详细信息展开状态
const expandedDetails = ref<Record<string, boolean>>({})

// 切换详细信息显示
const toggleDetails = (day: number, slotIndex: number) => {
  const key = `${day}-${slotIndex}`
  expandedDetails.value[key] = !expandedDetails.value[key]
}

// 打开编辑弹窗
const openEditModal = (day: number, slotIndex: number, slot: any) => {
  editingSlot.value = { day, slotIndex }
  editingData.value = {
    title: slot.title || slot.activity || '',
    notes: slot.notes || '',
    type: slot.type || slot.category || 'attraction',
    cost: slot.cost || null,
    bookingLinks: slot.bookingLinks || [],
  }
  editModalVisible.value = true
}

// 取消编辑
const handleCancelEdit = () => {
  editModalVisible.value = false
  editingSlot.value = null
  editingData.value = {
      title: '',
    notes: '',
    type: 'attraction',
    cost: null,
    bookingLinks: [],
  }
}

// 保存编辑
const handleSaveEdit = () => {
  if (!editingSlot.value || !itineraryData.value?.days) return
  
  const day = editingSlot.value.day
  const slotIndex = editingSlot.value.slotIndex
  
  const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === day)
  if (dayIndex === -1) return
  
  const slot = itineraryData.value.days[dayIndex].timeSlots?.[slotIndex]
  if (!slot) return
  
  // 更新数据
  slot.title = editingData.value.title
  slot.activity = editingData.value.title
  slot.notes = editingData.value.notes
  slot.type = editingData.value.type
  slot.category = editingData.value.type
  slot.cost = editingData.value.cost
  slot.bookingLinks = editingData.value.bookingLinks || []
  
  // 保存到 store
  if (travel.value) {
    travelListStore.updateTravel(travel.value.id, {
      data: itineraryData.value,
    })
    message.success('活动已更新')
  }
  
  handleCancelEdit()
}

// 添加Booking链接
const addBookingLink = () => {
  editingData.value.bookingLinks.push({ name: '', url: '' })
}

// 删除Booking链接
const removeBookingLink = (index: number) => {
  editingData.value.bookingLinks.splice(index, 1)
}

// 获取当地语言名称（这里需要调用翻译 API，暂时返回空）
const getLocalLanguageName = (location: string): string | null => {
  if (!location) return null
  
  // 暂时从目的地推断当地语言
  const languageInfo = getLocalLanguageForDestination(destination.value || location)
  
  // 这里应该调用翻译 API 将 location 翻译成当地语言
  // 暂时返回空，后续可以集成翻译服务
  return null
}

// 获取活动类型标签
const getActivityTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'attraction': t('travelDetail.experienceDay.attraction'),
    'restaurant': t('travelDetail.experienceDay.restaurant'),
    'accommodation': t('travelDetail.experienceDay.accommodation'),
    'shopping': t('travelDetail.experienceDay.shopping'),
    'transport': t('travelDetail.experienceDay.transport'),
  }
  return typeMap[type] || type
}

// 获取活动类型颜色
const getActivityTypeColor = (type: string): string => {
  return ACTIVITY_TYPE_COLORS[type] || 'default'
}

// 导航功能
const handleNavigate = (slot: any) => {
  // 根据当前语言和用户国籍/目的地选择对应语言的地址
  let address = ''
  if (shouldShowChineseOnly.value) {
    // 中国国籍+中国目的地：只使用中文地址
    address = slot.details?.address?.chinese || slot.location || slot.details?.name?.chinese || slot.title || slot.activity
  } else {
    // 其他情况：根据当前语言优先选择
    const isChinese = locale.value === 'zh-CN'
    address = (isChinese 
      ? (slot.details?.address?.chinese || slot.details?.address?.english)
      : (slot.details?.address?.english || slot.details?.address?.chinese)) ||
                    slot.location ||
                    slot.details?.name?.english ||
                    slot.title ||
                    slot.activity
  }
  
  if (!address) {
    message.warning(t('travelDetail.experienceDay.noAddressInfo'))
    return
  }
  
  // 判断是否为中国目的地
  const isChina = COUNTRY_KEYWORDS.CHINA.some(keyword => 
    destination.value?.includes(keyword) || false
  )
  
  // 检测用户设备，优先使用系统地图应用
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  const isWeChat = /MicroMessenger/i.test(navigator.userAgent)
  
  // 构建查询地址
  const query = encodeURIComponent(address)
  
  if (isChina) {
    // 中国目的地优先使用国内地图
    if (isIOS) {
      // iOS 优先尝试高德地图，回退到 Apple Maps
      window.open(`${MAP_URLS.GAODE_IOS}${query}`, '_blank')
      // 如果高德地图未安装，会在几秒后自动回退到浏览器打开
      setTimeout(() => {
        window.open(`${MAP_URLS.APPLE_MAPS}${query}`, '_blank')
      }, DEFAULT_VALUES.MAP_FALLBACK_DELAY)
    } else if (isAndroid) {
      // Android 优先使用高德地图，回退到百度地图
      window.open(`${MAP_URLS.GAODE_ANDROID}${query}`, '_blank')
      setTimeout(() => {
        window.open(`${MAP_URLS.BAIDU_ANDROID}${query}`, '_blank')
      }, DEFAULT_VALUES.MAP_FALLBACK_DELAY)
    } else if (isWeChat) {
      // 微信内使用腾讯地图
      window.open(`${MAP_URLS.TENCENT_WECHAT}${query}&region=${destination.value || DEFAULT_VALUES.CHINA_REGION_DEFAULT}`, '_blank')
    } else {
      // 桌面端使用高德地图网页版
      window.open(`${MAP_URLS.GAODE_WEB}${query}`, '_blank')
    }
  } else {
    // 海外目的地使用 Google Maps
    if (isIOS) {
      // iOS 使用 Apple Maps（海外场景）
      window.open(`${MAP_URLS.APPLE_MAPS}${query}`, '_blank')
    } else if (isAndroid) {
      // Android 使用 Google Maps
      window.open(`${MAP_URLS.GOOGLE_MAPS}${query}`, '_blank')
    } else {
      // 桌面端使用 Google Maps
      window.open(`${MAP_URLS.GOOGLE_MAPS}${query}`, '_blank')
    }
  }
}

// 预订功能
const handleBook = (slot: any) => {
  const activityName = slot.details?.name?.english || slot.title || slot.activity
  const bookingInfo = slot.details?.recommendations?.bookingAdvance || t('travelDetail.experienceDay.bookingAdvancePrefix')
  
  // 判断是否为中国目的地（用于显示大众点评）
  const isChina = COUNTRY_KEYWORDS.CHINA.some(keyword => 
    destination.value?.includes(keyword) || false
  )
  
  Modal.info({
    title: `${t('travelDetail.experienceDay.book')} ${activityName || t('travelDetail.experienceDay.attraction')}`,
    content: h('div', { style: { padding: '8px 0' } }, [
      h('p', { style: { margin: '8px 0', color: '#666' } }, `${t('travelDetail.experienceDay.bookingSuggestion')}：`),
      h('p', { style: { margin: '4px 0' } }, `· ${bookingInfo}`),
      h('p', { style: { margin: '8px 0', marginTop: '16px', color: '#666' } }, `${t('travelDetail.experienceDay.commonBookingPlatforms')}：`),
      h('div', { style: { marginTop: '8px' } }, [
        h('a', {
          href: `${BOOKING_PLATFORMS.TRIPADVISOR}${encodeURIComponent(activityName || '')}`,
          target: '_blank',
          style: { 
            display: 'block', 
            margin: '4px 0', 
            color: '#0071e3',
            textDecoration: 'none'
          },
          onClick: (e: Event) => {
            e.stopPropagation()
          }
        }, `🌐 ${t('travelDetail.experienceDay.defaultRatingPlatform')}`),
        h('a', {
          href: `${BOOKING_PLATFORMS.BOOKING_COM}${encodeURIComponent(activityName || '')}`,
          target: '_blank',
          style: { 
            display: 'block', 
            margin: '4px 0', 
            color: '#0071e3',
            textDecoration: 'none'
          },
          onClick: (e: Event) => {
            e.stopPropagation()
          }
        }, `🏨 ${t('travelDetail.experienceDay.bookingComLabel')}`),
        isChina ? h('a', {
          href: `${BOOKING_PLATFORMS.DIANPING}${encodeURIComponent(activityName || '')}`,
          target: '_blank',
          style: { 
            display: 'block', 
            margin: '4px 0', 
            color: '#0071e3',
            textDecoration: 'none'
          },
          onClick: (e: Event) => {
            e.stopPropagation()
          }
        }, `🍽️ ${t('travelDetail.experienceDay.dianpingLabel')}`) : null
      ].filter(Boolean))
    ]),
    okText: t('travelDetail.experienceDay.close'),
    width: 400
  })
}

// 联系功能
const handleContact = (slot: any) => {
  const activityName = slot.details?.name?.chinese || slot.details?.name?.english || slot.title || slot.activity
  // 根据当前语言和用户国籍/目的地选择对应语言的地址
  let address = ''
  if (shouldShowChineseOnly.value) {
    // 中国国籍+中国目的地：只使用中文地址
    address = slot.details?.address?.chinese || slot.location
  } else {
    // 其他情况：根据当前语言优先选择
    const isChinese = locale.value === 'zh-CN'
    address = (isChinese 
      ? (slot.details?.address?.chinese || slot.details?.address?.english)
      : (slot.details?.address?.english || slot.details?.address?.chinese)) || 
                    slot.location
  }
  
  // 检查是否有联系方式（电话、邮箱等）
  const hasContact = slot.details?.contact?.phone || 
                     slot.details?.contact?.email ||
                     slot.details?.contact?.website
  
  const content = hasContact ? h('div', { style: { padding: '8px 0' } }, [
    slot.details.contact.phone ? h('div', { style: { margin: '8px 0' } }, [
      h('strong', { style: { color: '#666' } }, `${t('travelDetail.experienceDay.phone')}：`),
      h('a', {
        href: `tel:${slot.details.contact.phone}`,
        style: { 
          color: '#0071e3',
          textDecoration: 'none',
          marginLeft: '8px'
        }
      }, slot.details.contact.phone)
    ]) : null,
    slot.details.contact.email ? h('div', { style: { margin: '8px 0' } }, [
      h('strong', { style: { color: '#666' } }, `${t('travelDetail.experienceDay.email')}：`),
      h('a', {
        href: `mailto:${slot.details.contact.email}`,
        style: { 
          color: '#0071e3',
          textDecoration: 'none',
          marginLeft: '8px'
        }
      }, slot.details.contact.email)
    ]) : null,
    slot.details.contact.website ? h('div', { style: { margin: '8px 0' } }, [
      h('strong', { style: { color: '#666' } }, `${t('travelDetail.experienceDay.website')}：`),
      h('a', {
        href: slot.details.contact.website,
        target: '_blank',
        style: { 
          color: '#0071e3',
          textDecoration: 'none',
          marginLeft: '8px'
        }
      }, slot.details.contact.website)
    ]) : null
  ].filter(Boolean)) : h('div', { style: { padding: '8px 0', color: '#666' } }, [
    h('p', { style: { margin: '8px 0' } }, t('travelDetail.experienceDay.noContactInfo')),
    address ? h('p', { style: { margin: '8px 0', marginTop: '16px' } }, [
      h('strong', `${t('travelDetail.experienceDay.address')}：`),
      address
    ]) : null
  ])
  
  Modal.info({
    title: `${t('travelDetail.experienceDay.contact')} ${activityName || t('travelDetail.experienceDay.attraction')}`,
    content,
    okText: t('travelDetail.experienceDay.close'),
    width: 400
  })
}

// 获取情绪颜色
const getMoodColor = (mood: string) => {
  return MOOD_COLORS[mood] || 'default'
}

// 格式化评分数量（添加千分位）
const formatReviewCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}千`
  }
  return count.toString()
}

// 格式化开放时间（统一为24小时制）
const formatOpeningHours = (hours: string): string => {
  if (!hours) return ''
  // 将12小时制转换为24小时制，如 "9:00 AM - 5:00 PM" -> "09:00–17:00"
  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi
  let formatted = hours
  formatted = formatted.replace(timeRegex, (match, hour, minute, period) => {
    let h = parseInt(hour, 10)
    if (period.toUpperCase() === 'PM' && h !== 12) {
      h += 12
    } else if (period.toUpperCase() === 'AM' && h === 12) {
      h = 0
    }
    return `${h.toString().padStart(2, '0')}:${minute}`
  })
  // 替换常见的分隔符
  formatted = formatted.replace(/\s*-\s*/g, '–')
  formatted = formatted.replace(/\s*to\s*/gi, '–')
  formatted = formatted.replace(/\s*至\s*/g, '–')
  return formatted
}

// 检查价格数据是否有效
const hasValidPricing = (pricing: any): boolean => {
  if (!pricing) return false
  // 如果有有效的一般价格，返回true
  if (pricing.general && pricing.general > 0) return true
  // 如果有有效的儿童价格，返回true
  if (pricing.detail?.children?.price && pricing.detail.children.price > 0) return true
  return false
}

// 获取信息来源
const getSourceInfo = (slot: any): string => {
  if (slot.details?.rating?.platform) {
    return slot.details.rating.platform
  }
  if (slot.details?.source) {
    return slot.details.source
  }
  return t('travelDetail.experienceDay.defaultSource')
}

// 格式化日期
const formatDate = (date: string | Date): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取每日行程摘要（优先级：summary > 其他描述）
const getDaySummary = (day: any): string | null => {
  if (!day) return null
  
  // 优先使用 summary 字段（每日摘要）
  if (day.summary && day.summary.trim()) {
    return day.summary.trim()
  }
  
  // 如果没有 summary，尝试从第一个活动获取描述作为备选
  // 但这不应该优先，因为这是活动描述而不是每日摘要
  // 这里保留作为兜底，但优先显示每日的 summary
  
  return null
}

// 获取活动摘要（优先级：summary > notes > description）
const getActivitySummary = (slot: any): string | null => {
  if (!slot) return null
  
  // 优先使用 summary 字段
  if (slot.summary && slot.summary.trim()) {
    return slot.summary.trim()
  }
  
  // 其次使用 notes 字段
  if (slot.notes && slot.notes.trim()) {
    return slot.notes.trim()
  }
  
  // 再次使用 details.description 中的内容
  if (slot.details?.description) {
    const desc = slot.details.description
    const parts: string[] = []
    
    if (desc.specialty) parts.push(`${t('travelDetail.experienceDay.specialty')}：${desc.specialty}`)
    if (desc.atmosphere) parts.push(`${t('travelDetail.experienceDay.atmosphere')}：${desc.atmosphere}`)
    if (desc.highlights && desc.highlights.length) {
      parts.push(`${t('travelDetail.experienceDay.highlights')}：${desc.highlights.slice(0, 2).join('、')}`)
    }
    
    if (parts.length > 0) {
      return parts.join('。')
    }
  }
  
  return null
}

// 获取目的地国家代码
const destinationCountryCode = computed(() => {
  const dest = destination.value || 
               travel.value?.location ||
               travel.value?.data?.selectedLocation ||
               itineraryData.value?.destination ||
               ''
  
  if (!dest) return null
  
  // 尝试从PRESET_COUNTRIES中匹配国家
  for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
    if (dest.includes(country.name) || dest.includes(code)) {
      return code
    }
  }
  
  return null
})

// 获取签证信息
const visaInfo = computed(() => {
  const countryCode = destinationCountryCode.value
  if (!countryCode) return null
  
  const nationalityCode = getUserNationalityCode()
  const permanentResidencyCode = getUserPermanentResidencyCode()
  
  const visaInfos = getVisaInfo(countryCode, nationalityCode, permanentResidencyCode)
  if (visaInfos.length === 0) return null
  
  return visaInfos[0]
})

// 检查是否有签证信息
const hasVisaInfo = computed(() => {
  return !!visaInfo.value
})

// 显示签证建议
const handleShowVisaTips = () => {
  if (!visaInfo.value) {
    Modal.info({
      title: '✈️ ' + (t('travelDetail.visaGuide') || '签证指引'),
      content: h('div', { style: { padding: '8px 0' } }, [
        h('p', { style: { margin: '8px 0', color: '#666' } }, t('travelDetail.noVisaInfo') || '暂无签证信息，请确保已设置目的地和国籍信息')
      ])
    })
    return
  }
  
  const info = visaInfo.value
  const visaStatusTitle = getVisaStatusTitle(info.visaType)
  const visaStatusClass = getVisaStatusClass(info.visaType)
  
  // 构建签证建议内容
  const content: any[] = [
    // 签证状态
    h('div', {
      key: 'status',
      style: {
        padding: '16px',
        borderRadius: '8px',
        background: visaStatusClass === 'visa-free' ? '#f6ffed' : 
                    visaStatusClass === 'visa-convenient' ? '#e6f7ff' : 
                    '#fff7e6',
        border: `1px solid ${visaStatusClass === 'visa-free' ? '#b7eb8f' : 
                                  visaStatusClass === 'visa-convenient' ? '#91d5ff' : 
                                  '#ffd591'}`,
        marginBottom: '16px'
      }
    }, [
      h('div', {
        style: {
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#1d1d1f'
        }
      }, visaStatusTitle),
      h('div', {
        style: {
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.6'
        }
      }, info.description || `${info.destinationName}对${info.applicableTo}${info.visaType === 'visa-free' ? '免签入境' : '需要签证'}`)
    ]),
    
    // 停留期限
    info.duration ? h('div', {
      key: 'duration',
      style: {
        padding: '12px',
        background: '#fafafa',
        borderRadius: '6px',
        marginBottom: '16px',
        fontSize: '14px'
      }
    }, [
      h('span', { style: { color: '#666' } }, '停留期限：'),
      h('span', { 
        style: { 
          fontWeight: 600, 
          color: '#1890ff',
          marginLeft: '8px'
        } 
      }, `${info.duration}天`)
    ]) : null,
    
    // 具体建议
    h('div', {
      key: 'tips',
      style: {
        padding: '12px',
        background: '#fff',
        borderRadius: '6px',
        fontSize: '13px',
        lineHeight: '1.8'
      }
    }, getVisaActionTips(info.visaType))
  ].filter(Boolean)
  
  Modal.info({
    title: '✈️ ' + (t('travelDetail.visaGuide') || '签证指引'),
    width: 600,
    content: h('div', { 
      style: { 
        padding: '8px 0', 
        maxHeight: '60vh', 
        overflowY: 'auto' 
      } 
    }, content)
  })
}

// 获取签证状态标题
const getVisaStatusTitle = (visaType: string): string => {
  const typeMap: Record<string, string> = {
    'visa-free': '✅ 免签入境',
    'visa-on-arrival': '🛬 落地签',
    'e-visa': '💻 电子签证',
    'visa-required': '⚠️ 需要提前申请签证',
    'permanent-resident-benefit': '🪪 永久居民便利政策'
  }
  return typeMap[visaType] || '签证信息'
}

// 获取签证状态样式类
const getVisaStatusClass = (visaType: string): string => {
  if (visaType === 'visa-free') return 'visa-free'
  if (visaType === 'visa-on-arrival' || visaType === 'e-visa') return 'visa-convenient'
  return 'visa-required'
}

// 获取签证行动建议
const getVisaActionTips = (visaType: string): any => {
  const tips: any[] = []
  
  if (visaType === 'visa-free') {
    tips.push(
      h('p', { style: { margin: '0 0 8px 0', fontWeight: 500 } }, '出行建议：'),
      h('ul', { style: { margin: 0, paddingLeft: '20px' } }, [
        h('li', { style: { margin: '4px 0', color: '#666' } }, '确保护照有效期至少6个月以上'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '准备往返机票或前往下一目的地的机票'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '准备足够的旅行资金证明'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '建议购买旅行保险')
      ])
    )
  } else if (visaType === 'visa-required') {
    tips.push(
      h('p', { style: { margin: '0 0 8px 0', fontWeight: 500 } }, '申请建议：'),
      h('ul', { style: { margin: 0, paddingLeft: '20px' } }, [
        h('li', { style: { margin: '4px 0', color: '#666' } }, '提前准备所需材料（护照、照片、申请表等）'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '预约使领馆或签证中心'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '预留充足的审核时间'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '关注签证政策变化')
      ])
    )
  } else if (visaType === 'e-visa') {
    tips.push(
      h('p', { style: { margin: '0 0 8px 0', fontWeight: 500 } }, '申请建议：'),
      h('ul', { style: { margin: 0, paddingLeft: '20px' } }, [
        h('li', { style: { margin: '4px 0', color: '#666' } }, '访问目的地官方电子签证网站'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '在线填写申请表并上传所需材料'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '支付签证费用'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '等待审核通过后打印电子签证')
      ])
    )
  } else if (visaType === 'visa-on-arrival') {
    tips.push(
      h('p', { style: { margin: '0 0 8px 0', fontWeight: 500 } }, '出行建议：'),
      h('ul', { style: { margin: 0, paddingLeft: '20px' } }, [
        h('li', { style: { margin: '4px 0', color: '#666' } }, '提前准备护照照片'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '准备足够的现金支付签证费'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '确认所需材料清单'),
        h('li', { style: { margin: '4px 0', color: '#666' } }, '预留足够的办理时间')
      ])
    )
  }
  
  return tips.length > 0 ? tips : null
}

</script>

<style scoped>
/* Apple 风格设计 - 旅行详情页 */

.experience-journey {
  min-height: 100vh;
  background: #f5f5f7;
  color: #1d1d1f;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 1. 封面层 - 与其他模式保持一致 */
.inspiration-hero {
  margin-bottom: 2rem;
}

.inspiration-hero .hero-cover {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 450px;
}

.inspiration-hero .hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inspiration-hero .hero-content {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.85), rgba(56, 239, 125, 0.85));
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  backdrop-filter: blur(10px);
}

/* 顶部图标 */
.hero-top-icons {
  position: absolute;
  top: 2rem;
  right: 2rem;
  display: flex;
  gap: 0.75rem;
  z-index: 3;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.globe-icon {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.location-icon {
  background: #2196F3;
}

/* 灵感模式内容样式 */
.inspiration-hero .hero-content {
  text-align: center;
  align-items: center;
}

@media (max-width: 768px) {
  .inspiration-hero .hero-content {
    padding: 2rem 1.5rem;
  }
}

/* 心理原型徽章 */
.archetype-badge {
  display: inline-flex;
  align-items: center;
    gap: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.archetype-icon {
  font-size: 1.5rem;
}

.archetype-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.archetype-name {
  font-size: 1rem;
  font-weight: 600;
}

.archetype-conflict {
  font-size: 0.85rem;
  opacity: 0.8;
  font-style: italic;
}


/* 主标题 - 灵感模式样式 */
.inspiration-hero .hero-title {
  font-size: 3rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: white;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .inspiration-hero .hero-title {
    font-size: 2rem;
  }
}

/* 旅行目的地 - 灵感模式样式 */
.inspiration-hero .hero-destination {
  font-size: 1.25rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .inspiration-hero .hero-destination {
    font-size: 1.1rem;
  }
}

/* 核心哲学语句 - 灵感模式样式 */
.inspiration-hero .hero-core-insight {
  font-size: 1.5rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.25);
}

@media (max-width: 768px) {
  .inspiration-hero .hero-core-insight {
    font-size: 1.25rem;
  }
}

/* 支持文本 - 灵感模式样式 */
.inspiration-hero .hero-supporting-text {
  font-size: 1.1rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .inspiration-hero .hero-supporting-text {
    font-size: 1rem;
  }
}


/* 底部描述段落样式已在上面定义，此处删除重复 */

/* 底部图标 - 灵感模式样式 */
.inspiration-hero .hero-footer-icons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 1rem;
}

.inspiration-hero .footer-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.inspiration-hero .footer-icon:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.inspiration-hero .notification-icon {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  position: relative;
}

.inspiration-hero .notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  background: #ff3b30;
  border-radius: 50%;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  border: 2px solid #ffffff;
}

.duration-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  margin-top: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 行程时间线 */
.traveler-profile {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.profile-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.profile-item:last-child {
  border-bottom: none;
}

.profile-label {
  font-size: 0.9rem;
  opacity: 0.7;
}

.profile-value {
  font-size: 1rem;
  font-weight: 500;
}

/* 2. 行程时间线 - Apple 风格 */
.itinerary-timeline {
  max-width: 1024px;
  margin: 0 auto;
  background: #ffffff;
}

@media (max-width: 768px) {
  .itinerary-timeline {
    padding: 80px 24px;
  }
}

.day-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .day-card {
    padding: 24px;
    margin-bottom: 24px;
  }
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.day-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.day-title {
  font-size: 32px;
  font-weight: 300;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0;
  color: #1d1d1f;
  font-family: 'Source Han Serif SC', 'Noto Serif SC', serif;
}

@media (max-width: 768px) {
  .day-title {
    font-size: 28px;
    line-height: 1.2;
  }
}

.day-date {
  font-size: 15px;
  font-weight: 400;
  color: #6e6e73;
  letter-spacing: -0.01em;
}

.day-description {
  font-size: 17px;
  line-height: 1.58;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  margin: 0 0 32px 0;
  font-weight: 400;
  font-family: 'Noto Sans SC', sans-serif;
}

@media (max-width: 768px) {
  .day-description {
    font-size: 15px;
    line-height: 1.47;
    margin-bottom: 24px;
  }
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-slot {
  display: flex;
  gap: 20px;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.time-slot:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .time-slot {
  flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
}

.slot-time {
  font-size: 17px;
  font-weight: 600;
  min-width: 80px;
  color: #0071e3;
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .slot-time {
    font-size: 15px;
    min-width: auto;
  }
}

.slot-content {
  flex: 1;
}

/* 新设计：Header 行 */
.slot-header-new {
  margin-bottom: 12px;
}

.slot-header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.slot-title-section {
  flex: 1;
}

.slot-title-main {
  font-size: 24px;
  font-weight: 300;
  line-height: 1.2;
  letter-spacing: -0.015em;
  margin: 0 0 4px 0;
  color: #1d1d1f;
  font-family: 'Source Han Serif SC', 'Noto Serif SC', serif;
}

.slot-title-sub {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: #666666;
  margin: 0;
  letter-spacing: -0.01em;
  font-family: 'Outfit', 'Work Sans', sans-serif;
}

/* 活动摘要 */
.slot-summary {
  margin: 12px 0 16px 0;
  padding: 12px 16px;
  background: #f9f9fb;
  border-radius: 12px;
  border-left: 3px solid #0071e3;
}

.summary-text {
  font-size: 14px;
  line-height: 1.65;
  color: #424245;
  margin: 0;
  letter-spacing: -0.005em;
  font-family: 'Noto Sans SC', sans-serif;
}

.slot-location-new {
  font-size: 14px;
  font-weight: 400;
  color: #666666;
  letter-spacing: -0.01em;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.slot-location-new :deep(.anticon) {
  font-size: 18px;
}

/* 关键指标一行化（胶囊 Chips） */
.slot-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}

.slot-chip {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  padding: 6px 12px;
  height: 30px;
  background: #f5f5f7;
  border-radius: 16px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}

.chip-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.chip-note {
  font-size: 11px;
  color: #6e6e73;
  margin-left: 4px;
}

.slot-rating-chip.rating-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.slot-rating-chip.rating-clickable:hover {
  background: rgba(0, 113, 227, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.15);
}

.slot-rating-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.slot-rating-score {
  font-weight: 700;
  color: #ff9500;
}

.slot-rating-count {
  font-weight: 400;
  color: #86868b;
}

.slot-rating-platform {
  font-size: 12px;
  font-weight: 400;
  color: #86868b;
  margin-left: 2px;
}

/* 状态徽章 */
.slot-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 9999px;
  white-space: nowrap;
}

.slot-badge-info {
  background: #E8F1FF;
  color: #1A73E8;
}

.slot-badge-success {
  background: #E8F6EF;
  color: #16A34A;
}

.slot-badge-warning {
  background: #FFF4E5;
  color: #D97706;
}

/* 信息块（2列栅格） */
.slot-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 20px;
  margin-bottom: 16px;
}

.slot-info-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.slot-info-item {
  margin: 0;
  min-height: 32px;
}

.slot-info-label {
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  margin: 0 0 6px 0;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  font-family: 'Noto Sans SC', sans-serif;
}

.slot-info-text {
  font-size: 14px;
  line-height: 1.65;
  color: #1d1d1f;
  margin: 0;
  letter-spacing: -0.005em;
  font-family: 'Noto Sans SC', sans-serif;
}

.info-icon {
  font-size: 14px;
  margin-right: 4px;
}

/* 一句话体验文案 */
.slot-experience-text {
  font-size: 14px;
  line-height: 1.5;
  color: #86868b;
  margin: 0 0 16px 0;
  font-style: italic;
  letter-spacing: -0.01em;
}

/* 操作条 */
.slot-actions-bar {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

.slot-action-btn {
  font-size: 14px;
  color: #0071e3;
  padding: 4px 8px;
  height: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.slot-action-btn:hover {
  background: rgba(0, 113, 227, 0.08);
}

.slot-action-primary {
  font-weight: 500;
}

/* 信息来源 */
.slot-source-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  font-size: 11px;
  color: #86868b;
  line-height: 1.5;
}

.source-text {
  color: #86868b;
}

/* 折叠详情 */
.slot-expanded-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.slot-detail-section {
  margin-bottom: 16px;
}

.slot-detail-section:last-child {
  margin-bottom: 0;
}

.slot-detail-label {
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
  font-family: 'Noto Sans SC', sans-serif;
}

.slot-detail-text {
  font-size: 14px;
  line-height: 1.5;
  color: #1d1d1f;
  margin: 0 0 8px 0;
  letter-spacing: -0.005em;
  font-family: 'Noto Sans SC', sans-serif;
}

.slot-detail-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.slot-detail-list li {
  font-size: 14px;
  line-height: 1.5;
  color: #1d1d1f;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
  letter-spacing: -0.005em;
  font-family: 'Noto Sans SC', sans-serif;
}

.slot-detail-list li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: #0071e3;
  font-weight: 600;
}

@media (max-width: 768px) {
  .slot-info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .slot-chips-row {
    gap: 8px;
  }
  
  .slot-chip {
    font-size: 12px;
    padding: 5px 10px;
    height: 28px;
    border-radius: 14px;
  }
  
  .slot-title-main {
    font-size: 21px;
  }
  
  .slot-title-sub {
    font-size: 15px;
  }
  
  .slot-chips-row {
    gap: 6px;
  }
  
  .slot-chip {
    font-size: 13px;
    padding: 3px 6px;
  }
  
  .slot-badge {
    font-size: 11px;
    padding: 5px 8px;
  }
}

@media (max-width: 768px) {
  .slot-title {
    font-size: 19px;
  }
  
  .slot-title-languages {
    font-size: 0.95em;
  }
  
  .slot-title-local {
    font-size: 0.85em;
  }
}

.slot-location {
  font-size: 15px;
  font-weight: 400;
  color: #6e6e73;
  letter-spacing: -0.01em;
  margin: 0 0 12px 0;
}

/* 紧凑详情样式 */
.compact-details {
  margin: 16px 0;
  padding: 16px 18px;
  background: rgba(0, 113, 227, 0.05);
  border-radius: 12px;
  border-left: 4px solid #0071e3;
  backdrop-filter: blur(10px);
}

.compact-details-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compact-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #1d1d1f;
  padding: 2px 0;
}

.compact-detail-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
  line-height: 1.2;
  width: 20px;
  text-align: center;
}

.compact-detail-label {
  font-weight: 600;
  color: #0071e3;
  min-width: 36px;
  flex-shrink: 0;
  letter-spacing: -0.01em;
  font-size: 13px;
}

.compact-detail-value {
  flex: 1;
  color: #424245;
  letter-spacing: -0.005em;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.6;
}

.compact-detail-local {
  color: #86868b;
  font-size: 12px;
}

.compact-detail-landmark {
  color: #0071e3;
  font-weight: 500;
}

.compact-detail-rating {
  color: #ff9500;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.01em;
}

.compact-detail-seasonal {
  color: #0071e3;
  font-weight: 500;
}

.compact-detail-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 113, 227, 0.15);
}

.compact-detail-description-text {
  font-size: 14px;
  line-height: 1.7;
  color: #1d1d1f;
  margin: 0;
  letter-spacing: -0.01em;
  font-weight: 400;
}

@media (max-width: 768px) {
  .compact-details {
    padding: 14px 16px;
    margin: 12px 0;
    border-left-width: 3px;
  }
  
  .compact-details-grid {
    gap: 9px;
  }
  
  .compact-detail-item {
    font-size: 12px;
    gap: 7px;
    padding: 1px 0;
  }
  
  .compact-detail-icon {
    font-size: 13px;
    width: 18px;
  }
  
  .compact-detail-label {
    min-width: 32px;
    font-size: 12px;
  }
  
  .compact-detail-value {
    font-size: 12px;
    line-height: 1.55;
  }
  
  .compact-detail-local {
    font-size: 11px;
  }
  
  .compact-detail-rating {
    font-size: 13px;
  }
  
  .compact-detail-description {
    margin-top: 10px;
    padding-top: 10px;
  }
  
  .compact-detail-description-text {
    font-size: 13px;
    line-height: 1.65;
  }
}

.slot-notes {
  font-size: 17px;
  line-height: 1.58;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  margin: 0 0 12px 0;
  font-weight: 400;
}

@media (max-width: 768px) {
  .slot-notes {
    font-size: 15px;
    line-height: 1.47;
  }
}

.slot-tip {
  background: rgba(255, 204, 0, 0.12);
  padding: 12px 16px;
  border-radius: 10px;
  margin: 0 0 12px 0;
  font-size: 15px;
  line-height: 1.47;
  color: #1d1d1f;
}

.tip-label {
  font-weight: 600;
  margin-right: 4px;
}

.slot-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.slot-duration,
.slot-cost {
  font-size: 13px;
  font-weight: 400;
  color: #6e6e73;
  letter-spacing: -0.01em;
}

/* 3. 旅行建议 - Apple 风格 */
.recommendations-section {
  padding: 120px 40px;
  max-width: 1024px;
  margin: 0 auto;
  background: #f5f5f7;
}

@media (max-width: 768px) {
  .recommendations-section {
    padding: 80px 24px;
  }
}

.section-title {
  font-size: 48px;
  font-weight: 300;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 64px 0;
  text-align: center;
  color: #1d1d1f;
  font-family: 'Source Han Serif SC', 'Noto Serif SC', serif;
}

@media (max-width: 768px) {
  .section-title {
    font-size: 36px;
    margin-bottom: 48px;
  }
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.recommendation-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 32px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.recommendation-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .recommendation-card {
    padding: 24px;
  }
}

.recommendation-card h4 {
  font-size: 21px;
  font-weight: 300;
  line-height: 1.3;
  letter-spacing: -0.015em;
  margin: 0 0 16px 0;
  color: #1d1d1f;
  font-family: 'Source Han Serif SC', 'Noto Serif SC', serif;
}

@media (max-width: 768px) {
  .recommendation-card h4 {
    font-size: 19px;
  }
}

.recommendation-card p {
  font-size: 17px;
  line-height: 1.58;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  margin: 0;
  font-weight: 400;
  font-family: 'Noto Sans SC', sans-serif;
}

@media (max-width: 768px) {
  .recommendation-card p {
    font-size: 15px;
    line-height: 1.47;
  }
}

.recommendation-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendation-card li {
  padding: 8px 0;
  font-size: 17px;
  line-height: 1.58;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  position: relative;
  padding-left: 20px;
  font-weight: 400;
}

.recommendation-card li::before {
  content: '•';
}

/* 编辑功能样式 */
.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slot-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-btn {
  color: #0071e3;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

/* 编辑弹窗样式 */
.edit-modal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.edit-form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-form-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

/* Booking链接管理样式 */
.booking-links-section {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.booking-links-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.booking-links-title {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

.booking-links-empty {
  text-align: center;
  padding: 12px;
  color: #999;
  font-size: 12px;
}

.booking-links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.booking-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Booking链接展示样式 */
.booking-links-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.booking-link-card {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  text-decoration: none;
  color: #1d1d1f;
  transition: all 0.2s;
  gap: 8px;
}

.booking-link-card:hover {
  border-color: #0071e3;
  background: #f0f7ff;
  color: #0071e3;
  transform: translateX(2px);
}

.booking-link-icon {
  font-size: 14px;
  color: #0071e3;
}

.booking-link-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.booking-link-arrow {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.booking-link-card:hover .booking-link-arrow {
  transform: translateX(2px);
  color: #0071e3;
}

/* 当地语言显示 */
.local-name {
  color: #6e6e73;
  font-size: 0.9em;
  margin-left: 4px;
}

/* 详细信息样式 */
.slot-details {
  margin-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 12px;
}

.details-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  height: auto;
  color: #0071e3;
  font-size: 14px;
}

.details-toggle:hover {
  color: #0077ed;
}

.details-content {
  margin-top: 12px;
  padding: 16px;
  background: #f9f9fb;
  border-radius: 12px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1d1d1f;
  letter-spacing: -0.01em;
}

.detail-text {
  font-size: 14px;
  line-height: 1.6;
  color: #6e6e73;
}

.detail-text p {
  margin: 4px 0;
}

.detail-english {
  color: #86868b;
  font-size: 13px;
}

.detail-landmark {
  color: #0071e3;
  font-weight: 500;
}

.detail-holiday {
  color: #f56300;
}

.detail-price {
  font-weight: 600;
  color: #1d1d1f;
  font-size: 15px;
}

.detail-rating {
  font-size: 18px;
  font-weight: 700;
  color: #ff9500;
}

.detail-seasonal {
  color: #28a745;
  font-weight: 500;
}

.detail-notes,
.detail-highlights {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
}

.detail-notes li,
.detail-highlights li {
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.detail-notes li::before,
.detail-highlights li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #0071e3;
}

@media (max-width: 768px) {
  .recommendation-card li {
    font-size: 15px;
    line-height: 1.47;
    padding-left: 18px;
  }
}


.narrative-section {
  margin-bottom: 3rem;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

.narrative-stages {
  display: grid;
  gap: 2rem;
  margin-top: 2rem;
}

.narrative-stage {
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
}

.narrative-label {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  opacity: 0.9;
}

.narrative-text {
    font-size: 1rem;
  line-height: 1.8;
  opacity: 0.85;
}

.awakening-moment {
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.echo-title {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.awakening-text {
  font-size: 1.3rem;
  line-height: 2;
  margin-bottom: 1rem;
}

.entrance-text {
  font-size: 1.1rem;
  opacity: 0.9;
}

.letter-section {
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.letter-content {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 1rem;
  line-height: 2;
  white-space: pre-wrap;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.echo-statement {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.statement-text {
  font-size: 1.2rem;
  line-height: 2;
  font-style: italic;
  opacity: 0.9;
}

/* Timeline 组件样式覆盖 - Apple 风格 */
.itinerary-timeline :deep(.ant-timeline) {
  padding-left: 0;
}

.itinerary-timeline :deep(.ant-timeline-item) {
  padding-bottom: 32px;
}

.itinerary-timeline :deep(.ant-timeline-item-tail) {
  border-left: 2px solid rgba(0, 0, 0, 0.08);
  left: 16px;
}

.itinerary-timeline :deep(.ant-timeline-item-head) {
  background: #ffffff;
  border-color: #0071e3;
  width: 32px;
  height: 32px;
  left: 0;
  top: 4px;
}

.itinerary-timeline :deep(.ant-timeline-item-head-custom) {
  left: 0;
  width: 32px;
  height: 32px;
  background: #0071e3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.2);
}

.itinerary-timeline :deep(.ant-timeline-item-head-custom svg) {
  color: #ffffff;
  font-size: 16px;
}

.itinerary-timeline :deep(.ant-timeline-item-content) {
  margin-left: 56px;
  top: 0;
}

@media (max-width: 768px) {
  .itinerary-timeline :deep(.ant-timeline-item-content) {
    margin-left: 48px;
  }
}

/* Tag 组件样式覆盖 - Apple 风格 */
.day-info :deep(.ant-tag) {
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
  border: none;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}

.slot-meta :deep(.ant-tag) {
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.01em;
  border: none;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}
</style>
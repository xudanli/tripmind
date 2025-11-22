<template>
  <div class="experience-journey">
    <!-- 行程时间线 -->
    <section class="itinerary-timeline">
      <a-timeline>
        <a-timeline-item 
          v-for="day in itineraryDays"
          :key="day.id || day.date || day.day"
          color="blue"
        >
          <template #dot>
            <calendar-outlined :style="{ fontSize: '16px' }" />
          </template>

          <DayCard
            :day="day"
            :summary="getDaySummary(day)"
          >
            <template #slots>
              <TimeSlotCard
                v-for="(slot, slotIndex) in day.timeSlots"
                :key="getSlotKey(day.day, slotIndex, slot)"
                :day="day"
                :slot="slot"
                :cover="getSlotCover(day.day, slotIndex, slot)"
                :currency="getSlotCurrency(slot)"
                :platform="getRatingPlatform(slot)"
                :expanded="isSlotExpanded(day.day, slotIndex, slot)"
                :is-inspiration-mode="travel?.mode === 'inspiration' || travel?.mode === 'classic'"
                :is-planner-mode="travel?.mode === 'planner'"
                @navigate="handleNavigate(slot)"
                @book="handleBook(slot)"
                @search="openSearchModal(day.day, slotIndex, slot)"
                @contact="handleContact(slot)"
                @edit="handleEdit(day.day, slotIndex, slot)"
                @remove="handleDeleteSlot(day.day, slotIndex)"
                @preview="openImagePreview(day.day, slotIndex, slot)"
                @rating-click="handleRatingClick(slot)"
                @toggle="toggleDetailsByKey(getSlotKey(day.day, slotIndex, slot))"
                @image-error="markImageError(day.day, slotIndex, slot)"
                :loading="isImageLoading(day.day, slotIndex, slot)"
              />

                <a-button 
                  type="dashed" 
                  size="small" 
                  class="add-slot-btn"
                @click="handleAddSlot(day.day, (day.timeSlots || []).length)"
                >
                <span>➕</span>{{ t('travelDetail.experienceDay.addActivity') }}
                </a-button>
            </template>
          </DayCard>
        </a-timeline-item>
      </a-timeline>
    </section>

    <!-- 心理流程阶段总览 -->
    <section v-if="mentalFlowStages" class="mental-flow-section">
      <h3 class="section-title">{{ t('travelDetail.experienceDay.mentalFlowStages') || '心理流程阶段' }}</h3>
      <div class="mental-flow-grid">
        <div
          v-for="(stage, key) in mentalFlowStages"
          :key="key"
          class="mental-flow-card"
        >
          <h4 class="stage-title">{{ getStageName(key) }}</h4>
          <div v-if="stage.theme" class="stage-theme">
            <span class="stage-label">{{ t('travelDetail.experienceDay.theme') || '主题' }}：</span>
            {{ stage.theme }}
          </div>
          <div v-if="stage.activities && stage.activities.length" class="stage-activities">
            <span class="stage-label">{{ t('travelDetail.experienceDay.activities') || '活动' }}：</span>
            <ul>
              <li v-for="(activity, idx) in stage.activities" :key="idx">{{ activity }}</li>
            </ul>
          </div>
          <div v-if="stage.emotionalGoal" class="stage-emotional">
            <span class="stage-label">{{ t('travelDetail.experienceDay.emotionalGoal') || '情感目标' }}：</span>
            {{ stage.emotionalGoal }}
          </div>
          <div v-if="stage.symbolicElement" class="stage-symbolic">
            <span class="stage-label">{{ t('travelDetail.experienceDay.symbolicElement') || '象征元素' }}：</span>
            {{ stage.symbolicElement }}
          </div>
        </div>
      </div>
    </section>


    <!-- 认知触发器和疗愈设计 -->
    <section v-if="cognitiveTriggers || healingDesign" class="cognitive-healing-section">
      <h3 class="section-title">{{ t('travelDetail.experienceDay.cognitiveHealing') || '认知与疗愈' }}</h3>
      
      <!-- 认知触发器 -->
      <div v-if="cognitiveTriggers" class="cognitive-triggers-card">
        <h4 class="subsection-title">{{ t('travelDetail.experienceDay.cognitiveTriggers') || '认知触发器' }}</h4>
        <div v-if="cognitiveTriggers.questions && cognitiveTriggers.questions.length" class="trigger-group">
          <span class="trigger-label">{{ t('travelDetail.experienceDay.questions') || '问题' }}：</span>
          <ul class="trigger-list">
            <li v-for="(question, idx) in cognitiveTriggers.questions" :key="idx">{{ question }}</li>
          </ul>
        </div>
        <div v-if="cognitiveTriggers.rituals && cognitiveTriggers.rituals.length" class="trigger-group">
          <span class="trigger-label">{{ t('travelDetail.experienceDay.rituals') || '仪式' }}：</span>
          <ul class="trigger-list">
            <li v-for="(ritual, idx) in cognitiveTriggers.rituals" :key="idx">{{ ritual }}</li>
          </ul>
        </div>
        <div v-if="cognitiveTriggers.moments && cognitiveTriggers.moments.length" class="trigger-group">
          <span class="trigger-label">{{ t('travelDetail.experienceDay.moments') || '时刻' }}：</span>
          <ul class="trigger-list">
            <li v-for="(moment, idx) in cognitiveTriggers.moments" :key="idx">{{ moment }}</li>
          </ul>
        </div>
      </div>
      
      <!-- 疗愈设计 -->
      <div v-if="healingDesign" class="healing-design-card">
        <h4 class="subsection-title">{{ t('travelDetail.experienceDay.healingDesign') || '疗愈设计' }}</h4>
        <div class="healing-grid">
          <div v-if="healingDesign.sound" class="healing-item">
            <span class="healing-icon">🔊</span>
            <span class="healing-label">{{ t('travelDetail.experienceDay.sound') || '声音' }}：</span>
            {{ healingDesign.sound }}
          </div>
          <div v-if="healingDesign.scent" class="healing-item">
            <span class="healing-icon">🌸</span>
            <span class="healing-label">{{ t('travelDetail.experienceDay.scent') || '气味' }}：</span>
            {{ healingDesign.scent }}
          </div>
          <div v-if="healingDesign.light" class="healing-item">
            <span class="healing-icon">💡</span>
            <span class="healing-label">{{ t('travelDetail.experienceDay.light') || '光线' }}：</span>
            {{ healingDesign.light }}
          </div>
          <div v-if="healingDesign.texture" class="healing-item">
            <span class="healing-icon">✨</span>
            <span class="healing-label">{{ t('travelDetail.experienceDay.texture') || '质感' }}：</span>
            {{ healingDesign.texture }}
          </div>
          <div v-if="healingDesign.space" class="healing-item">
            <span class="healing-icon">🏛️</span>
            <span class="healing-label">{{ t('travelDetail.experienceDay.space') || '空间' }}：</span>
            {{ healingDesign.space }}
          </div>
          <div v-if="healingDesign.rhythm" class="healing-item">
            <span class="healing-icon">🎵</span>
            <span class="healing-label">{{ t('travelDetail.experienceDay.rhythm') || '节奏' }}：</span>
            {{ healingDesign.rhythm }}
          </div>
          <div v-if="healingDesign.community" class="healing-item">
            <span class="healing-icon">👥</span>
            <span class="healing-label">{{ t('travelDetail.experienceDay.community') || '社群' }}：</span>
            {{ healingDesign.community }}
          </div>
            </div>
          </div>
    </section>
    
    <!-- 编辑活动弹窗 -->
    <a-modal
      v-model:open="editModalVisible"
      title="编辑活动"
      width="800px"
      :ok-text="t('travelDetail.experienceDay.save')"
      :cancel-text="t('travelDetail.experienceDay.cancel')"
      @ok="handleSaveEdit"
      @cancel="handleCancelEdit"
      :body-style="{ maxHeight: '70vh', overflowY: 'auto' }"
    >
      <div class="edit-modal-content">
        <a-collapse v-model:activeKey="editFormActiveKeys" :bordered="false">
          <!-- 基础信息 -->
          <a-collapse-panel key="basic" header="基础信息">
            <div class="edit-form-item">
              <label class="edit-form-label">时间</label>
              <a-input
                v-model:value="editingData.time" 
                placeholder="HH:mm"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">{{ t('travelDetail.experienceDay.activityName') }}</label>
              <a-input
                v-model:value="editingData.title" 
                :placeholder="t('travelDetail.experienceDay.activityName')"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">中文名称</label>
              <a-input
                v-model:value="editingData.nameChinese" 
                placeholder="中文名称"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">英文名称</label>
              <a-input
                v-model:value="editingData.nameEnglish" 
                placeholder="English Name"
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
              <label class="edit-form-label">类别</label>
              <a-input
                v-model:value="editingData.category" 
                placeholder="类别"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">时长（分钟）</label>
              <a-input-number 
                v-model:value="editingData.duration" 
                :min="0"
                :placeholder="时长"
                style="width: 100%"
              />
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
            
            <div class="edit-form-item">
              <label class="edit-form-label">位置</label>
              <a-input
                v-model:value="editingData.location" 
                placeholder="位置"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">评分</label>
              <a-input-number 
                v-model:value="editingData.rating" 
                :min="0"
                :max="5"
                :step="0.1"
                :precision="1"
                placeholder="评分 (0-5)"
                style="width: 100%"
              />
            </div>
          </a-collapse-panel>
          
          <!-- 详细信息 -->
          <a-collapse-panel key="details" header="详细信息">
            <div class="edit-form-item">
              <label class="edit-form-label">交通信息</label>
              <a-textarea
                v-model:value="editingData.transportation" 
                :rows="3"
                placeholder="交通信息"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">开放时间</label>
              <a-textarea
                v-model:value="editingData.openingHours" 
                :rows="3"
                placeholder="开放时间"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">票价详情</label>
              <a-textarea
                v-model:value="editingData.pricingDetail" 
                :rows="3"
                placeholder="票价详情"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">预订信息</label>
              <a-textarea
                v-model:value="editingData.bookingInfo" 
                :rows="3"
                placeholder="预订信息"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">游览建议</label>
              <a-textarea
                v-model:value="editingData.visitTips" 
                :rows="3"
                placeholder="游览建议"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">无障碍设施</label>
              <a-textarea
                v-model:value="editingData.accessibility" 
                :rows="3"
                placeholder="无障碍设施"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">穿搭建议</label>
              <a-textarea
                v-model:value="editingData.outfitSuggestions" 
                :rows="3"
                placeholder="穿搭建议"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">当地文化提示</label>
              <a-textarea
                v-model:value="editingData.culturalTips" 
                :rows="3"
                placeholder="当地文化提示"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">景点介绍</label>
              <a-textarea
                v-model:value="editingData.scenicIntro" 
                :rows="4"
                placeholder="景点介绍"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">亮点</label>
              <a-textarea
                v-model:value="editingData.highlights" 
                :rows="4"
                placeholder="亮点（每行一个）"
              />
            </div>
            
            <div class="edit-form-item">
              <label class="edit-form-label">备注</label>
              <a-textarea
                v-model:value="editingData.notes" 
                :rows="4"
                placeholder="备注"
              />
            </div>
          </a-collapse-panel>
          
          <!-- 预订链接 -->
          <a-collapse-panel key="booking" header="预订链接">
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
          </a-collapse-panel>
        </a-collapse>
      </div>
    </a-modal>
    
    <!-- 搜索附近POI模态框 -->
    <a-modal
      v-model:open="searchModalVisible"
      :title="t('travelDetail.experienceDay.searchNearby') || '搜索附近'"
      width="900px"
      :footer="null"
      :mask-closable="false"
      :body-style="{ maxHeight: '720px', overflowY: 'auto' }"
    >
      <div class="poi-search-container">
        <!-- 搜索位置信息 -->
        <div class="search-location-info">
          <div class="location-display">
            <span class="location-icon">📍</span>
            <span class="location-text">
              {{ searchLocation.name }}
              <span v-if="searchLocation.address" class="location-address"> · {{ searchLocation.address }}</span>
            </span>
          </div>
        </div>

        <!-- 类别选择 -->
        <div class="category-selector">
          <div class="category-label">{{ t('travelDetail.experienceDay.searchCategory') || '搜索类别' }}：</div>
          <a-radio-group v-model:value="selectedSearchCategory" @change="handleCategoryChange">
            <a-radio-button value="restaurant">
              <span>🍽️</span> {{ t('travelDetail.experienceDay.restaurant') }}
            </a-radio-button>
            <a-radio-button value="attraction">
              <span>🏛️</span> {{ t('travelDetail.experienceDay.attraction') }}
            </a-radio-button>
            <a-radio-button value="accommodation">
              <span>🏨</span> {{ t('travelDetail.experienceDay.accommodation') }}
            </a-radio-button>
            <a-radio-button value="gas_station">
              <span>⛽</span> {{ t('travelDetail.experienceDay.gasStation') || '加油站' }}
            </a-radio-button>
            <a-radio-button value="ev_charging">
              <span>🔌</span> {{ t('travelDetail.experienceDay.evCharging') || '充电桩' }}
            </a-radio-button>
            <a-radio-button value="rest_area">
              <span>🛋️</span> {{ t('travelDetail.experienceDay.restArea') || '休息站' }}
            </a-radio-button>
          </a-radio-group>
        </div>

        <!-- 搜索状态 -->
        <div v-if="searching" class="search-status">
          <a-spin :spinning="true" />
          <span style="margin-left: 8px;">{{ t('travelDetail.experienceDay.searching') || '正在搜索...' }}</span>
        </div>

        <!-- 搜索结果 -->
        <div v-if="!searching && searchResults.length > 0" class="search-results">
          <div class="results-header">
            <span class="results-count">{{ t('travelDetail.experienceDay.foundResults') || '找到' }} {{ searchResults.length }} {{ t('travelDetail.experienceDay.results') || '个结果' }}</span>
          </div>
          <div class="results-list">
            <div 
              v-for="(poi, index) in searchResults" 
              :key="index"
              class="poi-result-card"
            >
              <!-- POI照片 -->
              <div v-if="poi.photo" class="poi-photo">
                <img :src="poi.photo" :alt="poi.name.chinese || poi.name.english" />
              </div>
              
              <!-- POI信息 -->
              <div class="poi-info">
                <div class="poi-header">
                  <h4 class="poi-name">
                    <span v-if="poi.name.local" class="local-name">{{ poi.name.local }}</span>
                    <span v-if="poi.name.chinese" class="chinese-name">{{ poi.name.chinese }}</span>
                    <span v-if="poi.name.english" class="english-name">{{ poi.name.english }}</span>
                  </h4>
                  <a-tag v-if="poi.rating" :color="poi.rating.score >= 4 ? 'green' : poi.rating.score >= 3 ? 'orange' : 'red'">
                    ⭐ {{ poi.rating.score }}
                  </a-tag>
                </div>
                
                <div class="poi-address">
                  <span class="address-icon">📍</span>
                  <div class="address-lines">
                    <span
                      v-for="(line, lineIndex) in getPOIAddressLines(poi)"
                      :key="lineIndex"
                      class="address-line"
                      :class="`address-line-${line.type}`"
                    >
                      {{ line.text }}
                    </span>
                    <span v-if="getPOIAddressLines(poi).length === 0">{{ '地址未知' }}</span>
                  </div>
                  <span v-if="poi.distance" class="distance-badge">{{ poi.distance }}</span>
                </div>
                
                <div class="poi-recommendation">
                  <span class="recommendation-icon">💡</span>
                  <span>{{ poi.recommendation }}</span>
                </div>
                
                <div class="poi-meta">
                  <span v-if="poi.estimatedDuration" class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <span class="meta-label">{{ durationLabel.value }}：</span>
                    {{ poi.estimatedDuration }}
                  </span>
                  <span v-if="poi.pricing?.general" class="meta-item">
                    <span class="meta-icon">💰</span>
                    {{ formatCurrency(poi.pricing.general, (() => {
                      const unit = poi.pricing.unit || getSearchLocationCurrency.value?.code || 'CNY'
                      return getCurrencyByCode(unit) || getSearchLocationCurrency.value || { code: 'CNY', symbol: '¥', name: '人民币' }
                    })()) }}
                  </span>
                  <span v-if="poi.openingHours?.hours" class="meta-item">
                    <span class="meta-icon">🕐</span>
                    <span class="meta-label">营业时间：</span>
                    {{ poi.openingHours.hours }}
                  </span>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="poi-actions">
                <a-button 
                  type="primary" 
                  size="small"
                  @click="addPOIToItinerary(poi)"
                >
                  {{ t('travelDetail.experienceDay.addToItinerary') || '添加到行程' }}
                </a-button>
                <a-button 
                  type="text" 
                  size="small"
                  @click="viewPOIDetails(poi)"
                >
                  {{ t('travelDetail.experienceDay.viewDetails') || '查看详情' }}
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-if="!searching && searchResults.length === 0 && hasSearched" class="no-results">
          <a-empty 
            :description="noResultsDescription"
          />
        </div>
      </div>
    </a-modal>
    
    <!-- 图片预览模态框 -->
    <ImagePreviewModal
      v-model:open="previewVisible"
      :media="previewMedia"
      :index="previewCurrentIndex"
      @update:index="value => (previewCurrentIndex = value)"
      @set-cover="setAsCover"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, ref, h, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTravelListStore } from '@/stores/travelList'
import { CalendarOutlined, EditOutlined, EnvironmentOutlined, DownOutlined, PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons-vue'
import { getCurrencyForDestination, getCurrencyByCode, formatCurrency, type CurrencyInfo } from '@/utils/currency'
import { getLocalLanguageForDestination, type LocalLanguageInfo } from '@/utils/localLanguage'
import { getRatingPlatformForDestination, getRatingPlatformName } from '@/utils/ratingPlatform'
import { Modal, message } from 'ant-design-vue'
import { getVisaInfo } from '@/config/visa'
import { getUserNationalityCode, getUserPermanentResidencyCode, getUserLocationCode } from '@/config/userProfile'
import { PRESET_COUNTRIES } from '@/constants/countries'
import { getActivityImage, getActivityImagesList, generateSearchQuery } from '@/services/unsplashAPI'
import { searchPexelsVideos, type InspirationVideo } from '@/services/pexelsAPI'
import { searchNearbyPOI, type POIResult, type POICategory } from '@/services/poiSearchAPI'
import {
  COUNTRY_KEYWORDS,
  MAP_URLS,
  BOOKING_PLATFORMS,
  DEFAULT_VALUES,
  MOOD_COLORS,
  ACTIVITY_TYPE_COLORS,
} from '@/utils/travelConstants'
import DayCard from './ExperienceDay/DayCard.vue'
import TimeSlotCard from './ExperienceDay/TimeSlotCard.vue'
import ImagePreviewModal from './ExperienceDay/ImagePreviewModal.vue'
import { useItineraryModals, type PreviewMediaItem } from './ExperienceDay/useItineraryModals'
import { getActivitySummary as formatSlotSummary } from './ExperienceDay/slotFormatters'
import { buildPreparationTasks } from '@/utils/preparationChecklist'
import { fetchTransportInsights, type MapboxCoordinates } from '@/services/locationInsights'
import { TRANSPORT_MODE_OPTIONS, normalizeTransportModes } from '@/utils/transportModes'

const transportModeOptions = TRANSPORT_MODE_OPTIONS

const route = useRoute()
const { t, locale } = useI18n()
const travelListStore = useTravelListStore()

// 基础数据
const travel = computed(() => travelListStore.getTravel(route.params.id as string))

// 检查数据是否为行程计划格式（有days数组）
const itineraryData = computed(() => {
  const data = travel.value?.data
  if (!data) {
    console.log('⚠️ travel.value?.data 不存在')
    return null
  }
  
  const hasBackendId = !!data.backendItineraryId
  
  console.log('🔍 [ExperienceDay] 检查数据格式:', {
    hasBackendId,
    hasDays: !!data.days,
    hasPlannerItinerary: !!data.plannerItinerary,
    hasItineraryData: !!data.itineraryData,
    itineraryDataDays: data.itineraryData?.days?.length,
    dataKeys: Object.keys(data)
  })
  
  // 如果有 backendItineraryId，优先使用后端数据（itineraryData）
  if (hasBackendId && data.itineraryData?.days && Array.isArray(data.itineraryData.days) && data.itineraryData.days.length > 0) {
    console.log('✅ [后端数据优先] 从 data.itineraryData.days 获取行程数据，天数:', data.itineraryData.days.length)
    return data.itineraryData
  }
  
  // 如果没有 backendItineraryId，按原优先级读取
  // 优先级1: 如果直接是行程计划格式（有days数组）- 新生成的灵感行程通常是这种格式
  if (data.days && Array.isArray(data.days) && data.days.length > 0) {
    console.log('✅ 从 data.days 获取行程数据，天数:', data.days.length)
    return data
  }
  // 优先级2: 如果存储在itineraryData中（后端返回的格式）
  if (data.itineraryData?.days && Array.isArray(data.itineraryData.days) && data.itineraryData.days.length > 0) {
    console.log('✅ 从 data.itineraryData.days 获取行程数据，天数:', data.itineraryData.days.length)
    return data.itineraryData
  }
  // 优先级3: 如果存储在plannerItinerary中
  if (data.plannerItinerary?.days && Array.isArray(data.plannerItinerary.days) && data.plannerItinerary.days.length > 0) {
    console.log('✅ 从 data.plannerItinerary.days 获取行程数据，天数:', data.plannerItinerary.days.length)
    return data.plannerItinerary
  }
  
  console.log('⚠️ 未找到行程数据（days数组）', {
    dataStructure: JSON.stringify(data, null, 2).substring(0, 500)
  })
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
const extractPrimarySlot = (): any | null => {
  const day = itineraryData.value?.days?.[0]
  if (!day || !Array.isArray(day.timeSlots)) return null
  return day.timeSlots.find((slot: any) => slot && typeof slot === 'object') || null
}

const preferredSafetyLocaleKeys = computed(() => {
  const current = (locale.value || 'zh-CN').toLowerCase()
  const keys = new Set<string>()
  const push = (value?: string) => {
    if (!value) return
    const normalized = value.trim().toLowerCase()
    if (normalized) keys.add(normalized)
  }

  push(current)
  if (current.includes('-')) {
    push(current.split('-')[0])
  }
  if (current === 'zh-cn') push('zh')
  if (current === 'en-us') push('en')

  push('zh-cn')
  push('en-us')
  push('zh')
  push('en')

  return Array.from(keys)
})

const safetyNoticeText = computed(() => {
  const data: any = travel.value?.data
  if (!data) return ''

  const notices = data.safetyNotices
  if (notices && typeof notices === 'object' && !Array.isArray(notices)) {
    for (const key of preferredSafetyLocaleKeys.value) {
      const value = notices[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
  }

  if (typeof data.safetyNotice === 'string' && data.safetyNotice.trim()) {
    return data.safetyNotice.trim()
  }

  return ''
})

const coreInsight = computed(() => {
  const data: any = travel.value?.data
  if (safetyNoticeText.value) {
    return safetyNoticeText.value
  }
  return (
    data?.coreInsight ||
    data?.narrative?.threshold ||
    data?.narrative?.stillness ||
    t('travelDetail.experienceDay.defaultCoreInsight')
  )
})

const supportingText = computed(() => {
  const slot = extractPrimarySlot()
  if (slot?.summary && typeof slot.summary === 'string' && slot.summary.trim()) {
    return slot.summary.trim()
  }
  if (itineraryData.value?.summary && typeof itineraryData.value.summary === 'string') {
    return itineraryData.value.summary.trim()
  }
  const fallback =
    travel.value?.data?.narrative?.mirror ||
    (Array.isArray(travel.value?.data?.journeyBackground)
      ? travel.value?.data?.journeyBackground.join(' ')
      : travel.value?.data?.journeyBackground) ||
    travel.value?.data?.aiMessage ||
    travel.value?.description ||
    ''

  return fallback || t('travelDetail.experienceDay.defaultSupportingText')
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
  if (!itineraryData.value?.days) {
    console.log('⚠️ [ExperienceDay] itineraryData.value?.days 不存在')
    return []
  }
  
  const days = itineraryData.value.days.map((day: any) => {
    // 确保 timeSlots 存在
    const timeSlots = day.timeSlots || day.activities || []
    console.log(`📅 [ExperienceDay] Day ${day.day}: ${timeSlots.length} 个活动`)
    
    return {
      ...day,
      timeSlots: timeSlots.map((slot: any) => {
        // 确保每个 slot 都有必要的字段
        return {
          ...slot,
          // 确保 details 存在（如果后端已经返回了位置信息）
          details: slot.details || {},
          // 确保 coordinates 存在
          coordinates: slot.coordinates || slot.location || {},
          // 确保 title 和 activity 存在
          title: slot.title || slot.activity || '',
          activity: slot.activity || slot.title || ''
        }
      })
    }
  })
  
  console.log(`✅ [ExperienceDay] 总共 ${days.length} 天，${days.reduce((sum, d) => sum + d.timeSlots.length, 0)} 个活动`)
  return days
})

const primaryDay = computed(() => {
  if (!itineraryDays.value.length) return null
  return itineraryDays.value[0] || null
})

const primarySlot = computed(() => {
  return extractPrimarySlot()
})

// 活动图片存储
const activityImages = ref<Map<string, string>>(new Map())
const activityMediaList = ref<Map<string, PreviewMediaItem[]>>(new Map()) // 存储每个活动的多媒体（图片/视频）
const activityVideoCache = ref<Map<string, InspirationVideo | null>>(new Map())
const imageLoading = ref<Set<string>>(new Set())
const imageErrors = ref<Set<string>>(new Set())
const preparationTasksAppliedKey = ref<string | null>(null)

const createImageItem = (url: string): PreviewMediaItem => ({
  type: 'image',
  src: url,
})

const createVideoItem = (video: InspirationVideo): PreviewMediaItem => ({
  type: 'video',
  src: video.downloadUrl,
  poster: video.previewImage,
  meta: video,
})

// 获取活动的唯一键
const getSlotKey = (day: number, slotIndex: number, slot: any): string => {
  if (slot?.id) return String(slot.id)
  if (slot?.uuid) return String(slot.uuid)
  const base = slot?.title || slot?.activity || slot?.time || slotIndex
  return `${day}-${slotIndex}-${base}`
}

// 获取活动图片URL
const getSlotImage = (day: number, slotIndex: number, slot: any): string | null => {
  const key = getSlotKey(day, slotIndex, slot)
  return activityImages.value.get(key) || null
}

// 获取活动的多张图片
const getSlotMediaList = (day: number, slotIndex: number, slot: any): PreviewMediaItem[] => {
  const key = getSlotKey(day, slotIndex, slot)
  return activityMediaList.value.get(key) || []
}

// 打开图片/视频预览
const openImagePreview = async (day: number, slotIndex: number, slot: any) => {
  const key = getSlotKey(day, slotIndex, slot)

  const ensureCurrentImage = () => {
    const currentImage = getSlotImage(day, slotIndex, slot)
    return currentImage ? [createImageItem(currentImage)] : []
}

  if (!activityMediaList.value.has(key)) {
    const mediaItems: PreviewMediaItem[] = []
  
    try {
      const images = await getActivityImagesList(slot, destination.value, {
        orientation: 'landscape',
        size: 'regular',
        count: 9,
      })
      if (images.length) {
        mediaItems.push(...images.map(createImageItem))
      }
    } catch (error) {
      console.warn('加载图片列表失败:', error)
    }

    if (!mediaItems.length) {
      mediaItems.push(...ensureCurrentImage())
    }

    if (!activityVideoCache.value.has(key)) {
      try {
        const query = generateSearchQuery(slot, destination.value)
        if (query) {
          const [video] = await searchPexelsVideos(query, { perPage: 1, orientation: 'landscape' })
          const newVideoCache = new Map(activityVideoCache.value)
          newVideoCache.set(key, video || null)
          activityVideoCache.value = newVideoCache
      } else {
          const newVideoCache = new Map(activityVideoCache.value)
          newVideoCache.set(key, null)
          activityVideoCache.value = newVideoCache
        }
      } catch (error) {
        console.warn('加载视频失败:', error)
        const newVideoCache = new Map(activityVideoCache.value)
        newVideoCache.set(key, null)
        activityVideoCache.value = newVideoCache
      }
    }

    const cachedVideo = activityVideoCache.value.get(key)
    if (cachedVideo && cachedVideo.downloadUrl) {
      mediaItems.push(createVideoItem(cachedVideo))
    }

    if (!mediaItems.length) {
      return
    }

    const newMediaMap = new Map(activityMediaList.value)
    newMediaMap.set(key, mediaItems)
    activityMediaList.value = newMediaMap
  }

  const mediaList = activityMediaList.value.get(key) || []
  if (!mediaList.length) return

  const currentCoverImage = getSlotImage(day, slotIndex, slot)
  let initialIndex = 0
  if (currentCoverImage) {
    const coverIndex = mediaList.findIndex(item => item.type === 'image' && item.src === currentCoverImage)
    if (coverIndex >= 0) {
      initialIndex = coverIndex
    }
  }
  
  previewMedia.value = [...mediaList]
  previewCurrentIndex.value = initialIndex
  currentPreviewDay.value = day
  currentPreviewSlotIndex.value = slotIndex
  currentPreviewSlot.value = slot
  previewVisible.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  previewVisible.value = false
  previewMedia.value = []
  previewCurrentIndex.value = 0
  currentPreviewDay.value = null
  currentPreviewSlotIndex.value = null
  currentPreviewSlot.value = null
}

// 设置当前图片为封面
const setAsCover = async () => {
  if (currentPreviewDay.value === null || currentPreviewSlotIndex.value === null || !currentPreviewSlot.value) {
    return
  }
  
  const selectedItem = previewMedia.value[previewCurrentIndex.value]
  if (!selectedItem) {
    message.warning(t('travelDetail.experienceDay.noImageSelected') || '请先选择一张图片')
    return
  }
  
  if (selectedItem.type === 'video') {
    message.warning(t('travelDetail.experienceDay.videoNotSupportedForCover') || '视频无法设置为封面')
    return
  }

  const selectedImage = selectedItem.src
  
  const day = currentPreviewDay.value
  const slotIndex = currentPreviewSlotIndex.value
  const slot = currentPreviewSlot.value
  const key = getSlotKey(day, slotIndex, slot)
  
  // 先更新内存中的封面图片（立即生效）
  // 使用新的 Map 实例确保 Vue 能检测到变化
  const newActivityImages = new Map(activityImages.value)
  newActivityImages.set(key, selectedImage)
  activityImages.value = newActivityImages
  
  // 确保图片列表包含这张图片（如果不在列表中，添加到列表开头）
  const currentMediaList = activityMediaList.value.get(key) || []
  const hasImage = currentMediaList.some(item => item.type === 'image' && item.src === selectedImage)
  if (!hasImage) {
    const newMediaList: PreviewMediaItem[] = [createImageItem(selectedImage), ...currentMediaList]
    const newActivityMediaList = new Map(activityMediaList.value)
    newActivityMediaList.set(key, newMediaList)
    activityMediaList.value = newActivityMediaList
  }
  
  // 保存到行程数据中
  if (travel.value && itineraryData.value) {
    try {
      const updatedData = { ...travel.value.data }
      let days = updatedData.days || updatedData.plannerItinerary?.days || updatedData.itineraryData?.days
      
      if (days && days[day] && days[day].timeSlots && days[day].timeSlots[slotIndex]) {
        // 确保 days 数组是可变的
        if (updatedData.days) {
          updatedData.days = [...updatedData.days]
        } else if (updatedData.plannerItinerary) {
          updatedData.plannerItinerary = { ...updatedData.plannerItinerary, days: [...updatedData.plannerItinerary.days] }
          days = updatedData.plannerItinerary.days
        } else if (updatedData.itineraryData) {
          updatedData.itineraryData = { ...updatedData.itineraryData, days: [...updatedData.itineraryData.days] }
          days = updatedData.itineraryData.days
        }
        
        // 确保 timeSlots 数组也是可变的
        days[day] = { ...days[day] }
        days[day].timeSlots = [...days[day].timeSlots]
        
        // 更新 slot 的图片信息（确保 slot 对象也是新的引用）
        const targetSlot = { ...days[day].timeSlots[slotIndex] }
        if (!targetSlot.details) {
          targetSlot.details = {}
        } else {
          targetSlot.details = { ...targetSlot.details }
        }
        if (!targetSlot.details.images) {
          targetSlot.details.images = {}
        } else {
          targetSlot.details.images = { ...targetSlot.details.images }
        }
        targetSlot.details.images.cover = selectedImage
        
        // 更新数组中的 slot
        days[day].timeSlots[slotIndex] = targetSlot
        
        // 保存到 store
        travelListStore.updateTravel(travel.value.id, {
          data: updatedData
        })
        
        // 等待响应式更新完成
        await nextTick()
        
        // 再次确保封面图片已更新（使用新的 Map 实例）
        const finalActivityImages = new Map(activityImages.value)
        finalActivityImages.set(key, selectedImage)
        activityImages.value = finalActivityImages
        
        message.success(t('travelDetail.experienceDay.coverImageSet') || '已设置为封面图片')
      }
    } catch (error) {
      console.error('保存封面图片失败:', error)
      message.error(t('travelDetail.experienceDay.coverImageSetFailed') || '设置封面图片失败')
    }
  }
}

// 检查图片是否加载失败
const hasImageError = (day: number, slotIndex: number, slot: any): boolean => {
  const key = getSlotKey(day, slotIndex, slot)
  return imageErrors.value.has(key)
}

// 加载活动图片
const loadActivityImage = async (day: number, slotIndex: number, slot: any) => {
  const key = getSlotKey(day, slotIndex, slot)
  
  // 如果已经有图片或正在加载，跳过
  if (activityImages.value.has(key) || imageLoading.value.has(key)) {
    return
  }
  
  // 优先从保存的数据中加载封面图片
  const savedCoverImage = slot.details?.images?.cover
  if (savedCoverImage) {
    activityImages.value.set(key, savedCoverImage)
    return
  }
  
  imageLoading.value.add(key)
  
  try {
    const imageUrl = await getActivityImage(slot, destination.value, {
      orientation: 'landscape',
      size: 'regular'
    })
    
    if (imageUrl) {
      activityImages.value.set(key, imageUrl)
    } else {
      imageErrors.value.add(key)
    }
  } catch (error) {
    console.warn(`加载活动图片失败 (${key}):`, error)
    imageErrors.value.add(key)
  } finally {
    imageLoading.value.delete(key)
  }
}

// 批量加载所有活动图片
const loadAllActivityImages = async () => {
  if (!itineraryDays.value.length) {
    console.log('⚠️ 行程天数数据为空，无法加载图片')
    return
  }
  
  if (!destination.value) {
    console.log('⚠️ 目的地信息为空，无法加载图片')
    return
  }
  
  const allSlots: Array<{ day: number; slotIndex: number; slot: any }> = []
  
  itineraryDays.value.forEach((day: any) => {
    if (day.timeSlots && day.timeSlots.length > 0) {
      day.timeSlots.forEach((slot: any, slotIndex: number) => {
        allSlots.push({ day: day.day || 0, slotIndex, slot })
      })
    }
  })
  
  if (allSlots.length === 0) {
    console.log('⚠️ 没有找到活动数据，无法加载图片')
    return
  }
  
  console.log(`📸 开始加载 ${allSlots.length} 个活动的图片，目的地: ${destination.value}`)
  
  // 分批加载，避免一次性请求过多
  const batchSize = 5
  for (let i = 0; i < allSlots.length; i += batchSize) {
    const batch = allSlots.slice(i, i + batchSize)
    await Promise.all(
      batch.map(({ day, slotIndex, slot }) => loadActivityImage(day, slotIndex, slot))
    )
    // 批次之间添加延迟，避免请求过快
    if (i + batchSize < allSlots.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  console.log(`✅ 图片加载完成，成功加载 ${activityImages.value.size} 张图片`)
}

const INVALID_DESTINATION_PATTERN = /(未指定目的地|待定|unknown|not specified|tbd)/i

const getPrimaryDestinationName = (): string => {
  const itineraryDest =
    itineraryData.value?.destination ||
    travel.value?.data?.selectedLocation ||
    travel.value?.location ||
    travel.value?.data?.location ||
    ''

  if (itineraryDest && !INVALID_DESTINATION_PATTERN.test(itineraryDest)) {
    return itineraryDest
  }

  const slot = primarySlot.value
  const slotCandidates = [
    slot?.details?.name?.chinese,
    slot?.details?.name?.english,
    slot?.details?.address?.chinese,
    slot?.details?.address?.english,
    slot?.location,
    slot?.title,
    slot?.activity,
  ]

  const candidate = slotCandidates.find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  )

  if (candidate && !INVALID_DESTINATION_PATTERN.test(candidate)) {
    return candidate
  }

  return itineraryDest
}

const buildPreparationKey = (travelId: string, destinationName: string): string => {
  const normalized = encodeURIComponent(destinationName.trim().toLowerCase())
  return `${travelId}::${normalized || 'unknown'}`
}

const ensurePreparationTasks = () => {
  const travelId = travel.value?.id
  if (!travelId) return

  const itinerary = itineraryData.value
  if (!itinerary || !Array.isArray(itinerary.days) || itinerary.days.length === 0) return

  const destinationName = getPrimaryDestinationName()
  if (!destinationName || INVALID_DESTINATION_PATTERN.test(destinationName)) return

  const key = buildPreparationKey(travelId, destinationName)
  if (preparationTasksAppliedKey.value === key) {
    return
  }

  const language = locale.value || 'zh-CN'
  const generatedTasks = buildPreparationTasks({
    destinationName,
    rawDestination: itinerary.destination,
    country: travel.value?.data?.currentCountry || itinerary.country || null,
    locale: language,
    firstSlot: primarySlot.value,
  })

  if (!generatedTasks.length) {
    preparationTasksAppliedKey.value = key
    return
  }

  const travelEntry = travelListStore.getTravel(travelId)
  if (!travelEntry) {
    return
  }

  const existingTasks: any[] = Array.isArray(travelEntry.data?.tasks)
    ? [...travelEntry.data.tasks]
    : []
  const existingKeys = new Set(
    existingTasks
      .map(task => (task?.autoKey || task?.metaKey || task?.id || '') as string)
      .filter(Boolean)
  )

  const existingTaskMap = new Map(
    existingTasks
      .filter(task => task?.autoKey)
      .map(task => [String(task.autoKey), task])
  )

  let tasksUpdated = false

  generatedTasks.forEach(generated => {
    const existing = existingTaskMap.get(generated.key)
    if (existing) {
      const hasLinks =
        Array.isArray(existing.links) && existing.links.some((link: any) => link?.url)
      if (!hasLinks && generated.links && generated.links.length) {
        existing.links = generated.links
        tasksUpdated = true
      }
      if (
        typeof existing.title === 'string' &&
        existing.title.trim() !== generated.title.trim()
      ) {
        existing.title = generated.title.trim()
        tasksUpdated = true
      }
    }
  })

  const tasksToAdd = generatedTasks.filter(task => !existingKeys.has(task.key))

  const now = Date.now()
  const preparedTasks = tasksToAdd.map((task, index) => ({
    id: `task_auto_${task.key}_${now + index}`,
    title: task.title,
    completed: false,
    createdAt: now + index,
    autoGenerated: true,
    autoKey: task.key,
    category: task.category,
    destination: task.destinationLabel,
    links: task.links,
  }))

  if (preparedTasks.length || tasksUpdated) {
    const updatedData = {
      ...travelEntry.data,
      tasks: [...preparedTasks, ...existingTasks],
    }

    travelListStore.updateTravel(travelId, {
      data: updatedData,
    })
  }

  preparationTasksAppliedKey.value = key
}

// 监听行程数据变化，重新加载图片
watch(
  [() => itineraryDays.value, () => travel.value?.id, () => destination.value],
  ([newDays, travelId, dest]) => {
    // 确保有行程数据、行程ID和目的地
    if (newDays && newDays.length > 0 && travelId && dest) {
      // 清除旧的图片数据
      activityImages.value.clear()
      activityMediaList.value.clear()
      activityVideoCache.value.clear()
      imageLoading.value.clear()
      imageErrors.value.clear()
      // 延迟加载，确保数据完全加载
      setTimeout(() => {
        if (itineraryDays.value && itineraryDays.value.length > 0 && destination.value) {
          loadAllActivityImages()
        }
      }, 300)
    }
  },
  { deep: true, immediate: true }
)

watch(
  [
    () => travel.value?.id,
    () => travel.value?.updatedAt,
    () => itineraryData.value?.destination,
    () => itineraryData.value?.summary,
    () => itineraryDays.value.length,
  ],
  () => {
    ensurePreparationTasks()
  },
  { immediate: true }
)

// 组件挂载时加载图片
onMounted(() => {
  // 延迟加载，确保数据已准备好
  setTimeout(() => {
    if (itineraryDays.value && itineraryDays.value.length > 0 && destination.value) {
      loadAllActivityImages()
    }
  }, 500)
})

// 心理流程阶段
const mentalFlowStages = computed(() => {
  return travel.value?.data?.mentalFlowStages || null
})

// 认知触发器
const cognitiveTriggers = computed(() => {
  return travel.value?.data?.cognitiveTriggers || null
})

// 疗愈设计
const healingDesign = computed(() => {
  return travel.value?.data?.healingDesign || null
})

// 获取阶段名称
const getStageName = (key: string) => {
  const stageNames: Record<string, string> = {
    'summon': t('travelDetail.experienceDay.stageSummon') || '召唤',
    'reflection': t('travelDetail.experienceDay.stageReflection') || '映照',
    'awakening': t('travelDetail.experienceDay.stageAwakening') || '觉醒',
    'internalization': t('travelDetail.experienceDay.stageInternalization') || '沉淀',
    'transformation': t('travelDetail.experienceDay.stageTransformation') || '转化'
  }
  return stageNames[key] || key
}

// 获取每个活动对应的货币信息（根据活动的具体位置）
const resolveCurrencyByCode = (code: unknown): CurrencyInfo | null => {
  if (!code) return null
  if (typeof code === 'object' && code && 'code' in (code as any)) {
    return resolveCurrencyByCode((code as any).code)
  }
  const str = String(code).trim()
  if (!str) return null
  const upper = str.toUpperCase()
  return getCurrencyByCode(upper) || null
}

const getSlotCurrency = (slot: any): CurrencyInfo => {
  // 0. 如果有明确的币种代码，优先使用
  const explicitCode =
    slot?.costCurrency ||
    slot?.currency ||
    slot?.details?.currency ||
    slot?.details?.currencyCode ||
    slot?.details?.pricing?.currency ||
    slot?.details?.pricing?.currencyCode

  const explicitCurrency = resolveCurrencyByCode(explicitCode)
  if (explicitCurrency) {
    return explicitCurrency
  }

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

const extractSlotDescription = (slot: any): string => {
  const segments = new Set<string>()

  const tryAdd = (value: unknown) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) {
        segments.add(trimmed)
      }
    }
  }

  tryAdd(slot.summary)
  tryAdd(slot.description)
  tryAdd(slot.narration)
  tryAdd(slot.details?.transportation?.enhancedSummary)

  const detailDescription = slot.details?.description
  if (detailDescription && typeof detailDescription === 'object') {
    Object.values(detailDescription).forEach(tryAdd)
  }

  return Array.from(segments).join('\n')
}

// 行程整体货币信息（用于总费用等全局显示）
const getOverallCurrency = (): CurrencyInfo => {
  // 0. 明确的币种代码
  const explicitCode =
    travel.value?.data?.currencyCode ||
    travel.value?.currency ||
    travel.value?.data?.currency ||
    itineraryData.value?.currencyCode

  const explicitCurrency = resolveCurrencyByCode(explicitCode)
  if (explicitCurrency) {
    return explicitCurrency
  }

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
  
  // 3. 遍历行程中的活动位置尝试推断
  if (itineraryData.value?.days && itineraryData.value.days.length) {
    for (const day of itineraryData.value.days) {
      const slots = Array.isArray(day?.timeSlots) ? day.timeSlots : []
      for (const slot of slots) {
        const locationText =
          slot?.details?.address?.chinese ||
          slot?.details?.address?.english ||
          slot?.location ||
          ''
        if (locationText) {
          const currency = getCurrencyForDestination(locationText)
          if (currency.code !== 'CNY') {
            return currency
          }
        }
        const slotCurrency = resolveCurrencyByCode(
          slot?.costCurrency ||
            slot?.currency ||
            slot?.details?.pricing?.currency ||
            slot?.details?.pricing?.currencyCode
        )
        if (slotCurrency) {
          return slotCurrency
        }
      }
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

// 编辑状态、搜索与预览状态
const {
  editModalVisible,
  editingSlot,
  editingData,
  searchModalVisible,
  searching,
  searchResults,
  selectedSearchCategory,
  hasSearched,
  searchLocation,
  currentSearchContext,
  durationLabelKey,
  previewVisible,
  previewMedia,
  previewCurrentIndex,
  currentPreviewDay,
  currentPreviewSlotIndex,
  currentPreviewSlot,
} = useItineraryModals()

// 编辑表单折叠面板的展开状态
const editFormActiveKeys = ref<string[]>(['basic', 'details', 'booking'])

const durationLabel = computed(() => {
  const key = durationLabelKey.value
  const translated = t(key)
  return translated || t('travelDetail.experienceDay.estimatedStay')
})

// 获取搜索位置的货币（根据位置地址推断）
const getSearchLocationCurrency = computed(() => {
  try {
    if (!searchLocation.value.name && !searchLocation.value.address) {
      const overall = getOverallCurrency()
      return overall || { code: 'CNY', symbol: '¥', name: '人民币' }
    }
    
    // 从位置名称或地址中提取国家信息
    const locationText = `${searchLocation.value.name} ${searchLocation.value.address || ''}`
    const currency = getCurrencyForDestination(locationText)
    
    // 如果识别到非人民币，使用该货币；否则使用整体货币
    if (currency && currency.code && currency.code !== 'CNY') {
      return currency
    }
    
    const overall = getOverallCurrency()
    return overall || { code: 'CNY', symbol: '¥', name: '人民币' }
  } catch (error) {
    console.warn('获取搜索位置货币失败:', error)
    return { code: 'CNY', symbol: '¥', name: '人民币' }
  }
})

const searchLocationLatitude = computed(() => {
  const slot = currentSearchContext.value?.slot
  const slotCoords = slot ? getSlotCoords(slot) : null
  if (slotCoords && typeof slotCoords.lat === 'number' && !Number.isNaN(slotCoords.lat)) {
    return slotCoords.lat
  }
  const locCoords = searchLocation.value?.coordinates
  if (locCoords && typeof locCoords.lat === 'number' && !Number.isNaN(locCoords.lat)) {
    return locCoords.lat
  }
  return null
})

const isRemoteSearchLocation = computed(() => {
  const text = `${searchLocation.value?.name || ''} ${searchLocation.value?.address || ''}`.toLowerCase()
  const remoteKeywords = ['南极', '北极', '极地', 'antarctic', 'arctic', '无人区', 'polar', '冰原', '冰川', 'ocean', 'sea', 'desert']
  const keywordMatched = remoteKeywords.some((keyword) => text.includes(keyword.toLowerCase()))
  const lat = searchLocationLatitude.value
  const isExtremeLatitude = typeof lat === 'number' && Math.abs(lat) >= 60
  return keywordMatched || isExtremeLatitude
})

const noResultsDescription = computed(() => {
  if (isRemoteSearchLocation.value) {
    return (
      t('travelDetail.experienceDay.noResultsRemote') ||
      '当前地点位于偏远或极地地区，附近几乎没有公开设施，可尝试选择最近的城市或缩小搜索范围。'
    )
  }
  return (
    t('travelDetail.experienceDay.noResultsDefault') ||
    t('travelDetail.experienceDay.noResults') ||
    '未找到相关结果，可以尝试切换类别或调整搜索位置。'
  )
})

interface LocationNameInfo {
  local?: string
  english?: string
  chinese?: string
}

interface LocationAddressInfo {
  local?: string
  english?: string
  chinese?: string
  landmark?: string
}

interface LocationFormatOptions {
  name?: LocationNameInfo | null
  address?: LocationAddressInfo | null
  fallback?: string | null
}

type LocationLineType = 'localName' | 'localAddress' | 'english' | 'chinese' | 'landmark' | 'fallback'

interface LocationLineEntry {
  text: string
  type: LocationLineType
}

const formatLocationLines = ({ name, address, fallback }: LocationFormatOptions): LocationLineEntry[] => {
  const lines: LocationLineEntry[] = []
  const pushLine = (value?: string | null, type: LocationLineType = 'fallback') => {
    if (!value) return
    const normalized = value.trim()
    if (!normalized) return
    if (!lines.some(line => line.text === normalized)) {
      lines.push({ text: normalized, type })
    }
  }

  pushLine(name?.local, 'localName')
  pushLine(name?.english, 'english')

  pushLine(address?.local, 'localAddress')

  if (address?.english) {
    pushLine(address.landmark ? `${address.english} · ${address.landmark}` : address.english, 'english')
  }

  if (!address?.english) {
    pushLine(address?.chinese ? (address.landmark ? `${address.chinese} · ${address.landmark}` : address.chinese) : null, 'chinese')
  }

  if (address?.english && address?.chinese) {
    pushLine(address.chinese, 'chinese')
  }

  if (address?.landmark && !lines.some(line => line.text.includes(address.landmark!))) {
    pushLine(address.landmark, 'landmark')
  }

  if (!lines.length) {
    pushLine(fallback, 'fallback')
  }

  return lines
}

const getSlotLocationLines = (slot: any): LocationLineEntry[] => {
  return formatLocationLines({
    name: slot?.details?.name || null,
    address: slot?.details?.address || null,
    fallback: slot?.location || null,
  })
}

const getPOIAddressLines = (poi: POIResult): LocationLineEntry[] => {
  return formatLocationLines({
    name: null,
    address: poi.address || null,
    fallback: poi.address?.english || poi.address?.chinese || null,
  })
}

// 获取当前正在编辑的活动
const getCurrentSlot = () => {
  if (!editingSlot.value || !itineraryData.value?.days) return null
  const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === editingSlot.value!.day)
  if (dayIndex === -1) return null
  return itineraryData.value.days[dayIndex].timeSlots?.[editingSlot.value.slotIndex] || null
}

// 详细信息展开状态
const expandedDetails = ref<Record<string, boolean>>({})

const isSlotExpanded = (day: number, slotIndex: number, slot: any): boolean => {
  // planner 模式默认展开详细信息
  if (travel.value?.mode === 'planner') {
    return true
  }
  const key = getSlotKey(day, slotIndex, slot)
  return !!expandedDetails.value[key]
}

const toggleDetailsByKey = (key: string) => {
  expandedDetails.value[key] = !expandedDetails.value[key]
}

const isImageLoading = (day: number, slotIndex: number, slot: any): boolean => {
  const key = getSlotKey(day, slotIndex, slot)
  return imageLoading.value.has(key)
}

const getSlotCover = (day: number, slotIndex: number, slot: any): string | null => {
  if (hasImageError(day, slotIndex, slot)) {
    return null
  }
  return getSlotImage(day, slotIndex, slot)
}

const markImageError = (day: number, slotIndex: number, slot: any) => {
  const key = getSlotKey(day, slotIndex, slot)
  imageErrors.value.add(key)
  imageLoading.value.delete(key)
  activityImages.value.delete(key)
}

// 打开编辑弹窗
const handleEdit = (day: number, slotIndex: number, slot: any) => {
  const key = getSlotKey(day, slotIndex, slot)
  const payload = {
    key,
    day,
    slotIndex,
    slot
  }
  try {
    console.log('🧾 [ExperienceDay] 活动节点明细:', JSON.stringify(payload, null, 2))
  } catch {
    console.log('🧾 [ExperienceDay] 活动节点对象:', payload)
  }

  editingSlot.value = { day, slotIndex }

  const descriptionText = extractSlotDescription(slot)
  const reminderText = typeof slot.notes === 'string' ? slot.notes.trim() : ''
  
  const notesPieces: string[] = []
  if (descriptionText) notesPieces.push(descriptionText)
  if (reminderText) {
    // 避免重复添加描述
    if (!descriptionText || !descriptionText.includes(reminderText)) {
      notesPieces.push(reminderText)
    }
  }
  const combinedNotes = notesPieces.join('\n')

  const existingTransportModes = normalizeTransportModes(slot.details?.transportation?.options as any)

  // 提取坐标
  const coords = slot.coordinates || slot.details?.coordinates || null
  const coordinates = coords && typeof coords.lat === 'number' && typeof coords.lng === 'number'
    ? { lat: coords.lat, lng: coords.lng }
    : null

  editingData.value = {
    // 基础字段
    time: slot.time || '',
    title: slot.title || slot.activity || '',
    activity: slot.activity || slot.title || '',
    type: slot.type || slot.category || 'attraction',
    category: slot.category || slot.type || 'attraction',
    duration: slot.duration || null,
    cost: slot.cost || null,
    location: slot.location || '',
    coordinates: coordinates,
    
    // details 对象中的字段
    nameChinese: slot.details?.name?.chinese || '',
    nameEnglish: slot.details?.name?.english || '',
    rating: slot.details?.rating || null,
    transportation: slot.details?.transportation || '',
    openingHours: slot.details?.openingHours || '',
    pricingDetail: slot.details?.pricing?.detail || '',
    bookingInfo: slot.details?.recommendations?.bookingInfo || '',
    visitTips: slot.details?.recommendations?.visitTips || '',
    outfitSuggestions: slot.details?.recommendations?.outfitSuggestions || '',
    culturalTips: slot.details?.recommendations?.culturalTips || '',
    accessibility: slot.details?.accessibility || '',
    scenicIntro: slot.details?.description?.scenicIntro || '',
    highlights: Array.isArray(slot.details?.description?.highlights) 
      ? slot.details.description.highlights.join('\n')
      : (typeof slot.details?.description?.highlights === 'string' ? slot.details.description.highlights : ''),
    notes: combinedNotes || reminderText || '',
    
    // 其他字段
    bookingLinks: slot.bookingLinks || [],
    transportModes: existingTransportModes,
  }
  editModalVisible.value = true
}

// 删除活动
const handleDeleteSlot = (day: number, slotIndex: number) => {
  if (!itineraryData.value?.days) {
    message.error('无法删除：行程数据不存在')
    return
  }
  
  const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === day)
  if (dayIndex === -1) {
    message.error('无法删除：找不到对应的行程日期')
    return
  }
  
  const slot = itineraryData.value.days[dayIndex].timeSlots?.[slotIndex]
  if (!slot) {
    message.error('无法删除：找不到对应的活动')
    return
  }
  
  Modal.confirm({
    title: t('travelDetail.experienceDay.confirmDelete') || '确认删除',
    content: t('travelDetail.experienceDay.confirmDeleteContent') || `确定要删除活动"${slot.title || slot.activity || '未命名活动'}"吗？`,
    okText: t('travelDetail.experienceDay.confirm') || '确定',
    cancelText: t('travelDetail.experienceDay.cancel') || '取消',
    onOk: async () => {
      itineraryData.value.days[dayIndex].timeSlots.splice(slotIndex, 1)

      await recalculateTransportAfterChange(dayIndex, slotIndex)
      
      // 保存到 store
      if (travel.value) {
        travelListStore.updateTravel(travel.value.id, {
          data: itineraryData.value,
        })
        message.success(t('travelDetail.experienceDay.deleteSuccess') || '活动已删除')
      }
    }
  })
}

const recalculateTransportAfterChange = async (dayIndex: number, startSlotIndex: number) => {
  const days = itineraryData.value?.days
  if (!days || !days[dayIndex]) return
  const language = locale.value || 'zh-CN'
  const dayData = days[dayIndex]
  if (!Array.isArray(dayData.timeSlots)) return

  for (let idx = startSlotIndex; idx < dayData.timeSlots.length; idx++) {
    const slot = dayData.timeSlots[idx]
    if (!slot) continue

    const previousSlot = findPreviousSlot(dayIndex, idx)
    const previousLabel = getSlotLabel(previousSlot)
    const originLabel =
      previousLabel || destination.value || travel.value?.location || ''
    const destinationLabel = getSlotLabel(slot)
    if (!destinationLabel) continue

    const originCoords = getSlotCoords(previousSlot) || undefined
    const destinationCoords = getSlotCoords(slot) || undefined

    try {
      const transportData = await fetchTransportInsights({
        origin: originLabel || destination.value || '',
        destination: destinationLabel,
        language,
        originCoords,
        destinationCoords,
      })

      if (!slot.details || typeof slot.details !== 'object') slot.details = {}
      if (!slot.details.transportation || typeof slot.details.transportation !== 'object') {
        slot.details.transportation = {}
      }
      const transport = slot.details.transportation as Record<string, any>

      if (!slot.details.operational || typeof slot.details.operational !== 'object') {
        slot.details.operational = {}
      }
      const operational = slot.details.operational as Record<string, any>

      if (transportData) {
        if (transportData.summary) {
          transport.enhancedSummary = transportData.summary
        }
        const normalizedModes = normalizeTransportModes(transportData.options as any)
        if (normalizedModes.length) {
          transport.options = normalizedModes
        } else {
          delete transport.options
        }

        transport.metrics = {
          ...(transport.metrics || {}),
          estimatedMinutes: transportData.bestDurationMinutes ?? null,
          distanceKm: transportData.distanceKm ?? null,
          bestLabel: transportData.bestLabel ?? null,
          originLabel: previousLabel || null,
          destinationLabel,
          originCoords: transportData.originCoords ?? null,
          destinationCoords: transportData.destinationCoords ?? null,
        }

        operational.transportSource = transportData.source
        operational.transportFetchedAt = transportData.fetchedAt
        if (transportData.distanceKm !== undefined) {
          operational.transportDistanceKm = transportData.distanceKm
        }
        if (transportData.bestDurationMinutes !== undefined) {
          operational.transportDurationMinutes = transportData.bestDurationMinutes
        }
      } else {
        if (transport.metrics) {
          transport.metrics.originLabel = previousLabel || null
          transport.metrics.estimatedMinutes = null
          transport.metrics.distanceKm = null
        }
        delete transport.enhancedSummary
        delete transport.options
      }
    } catch (error) {
      console.warn('[ExperienceDay] Failed to refresh transport after deletion:', error)
    }
  }
}

const findPreviousSlot = (dayIndex: number, slotIndex: number): any | null => {
  const days = itineraryData.value?.days
  if (!days) return null

  const currentDay = days[dayIndex]
  if (currentDay?.timeSlots && slotIndex > 0) {
    const prev = currentDay.timeSlots[slotIndex - 1]
    if (prev) return prev
  }

  for (let prevDayIndex = dayIndex - 1; prevDayIndex >= 0; prevDayIndex--) {
    const prevDay = days[prevDayIndex]
    if (prevDay?.timeSlots && prevDay.timeSlots.length) {
      return prevDay.timeSlots[prevDay.timeSlots.length - 1]
    }
  }
  return null
}

const getSlotLabel = (slot: any): string => {
  if (!slot) return ''
  const name = slot.details?.name
  const candidates = [
    typeof name?.chinese === 'string' ? name.chinese : '',
    typeof name?.english === 'string' ? name.english : '',
    typeof slot.location === 'string' ? slot.location : '',
    typeof slot.title === 'string' ? slot.title : '',
    typeof slot.activity === 'string' ? slot.activity : '',
  ]
  return candidates.find((value) => value && value.trim().length > 0)?.trim() || ''
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const getSlotCoords = (slot: any): MapboxCoordinates | null => {
  if (!slot) return null
  const geo = slot.details?.geo
  const geoLat = toNumber(geo?.lat)
  const geoLng = toNumber(geo?.lng)
  if (geoLat !== null && geoLng !== null) return { lat: geoLat, lng: geoLng }

  const coords = Array.isArray(slot?.coordinates) ? slot.coordinates : null
  if (coords && coords.length >= 2) {
    const lat = toNumber(coords[0])
    const lng = toNumber(coords[1])
    if (lat !== null && lng !== null) return { lat, lng }
  }

  const detailsCoords = slot.details?.coordinates
  const detailsLat = toNumber(detailsCoords?.lat)
  const detailsLng = toNumber(detailsCoords?.lng)
  if (detailsLat !== null && detailsLng !== null) return { lat: detailsLat, lng: detailsLng }

  return null
}

// 添加活动
const handleAddSlot = (day: number, insertIndex: number) => {
  if (!itineraryData.value?.days) {
    message.error('无法添加：行程数据不存在')
    return
  }
  
  const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === day)
  if (dayIndex === -1) {
    message.error('无法添加：找不到对应的行程日期')
    return
  }
  
  const timeSlots = itineraryData.value.days[dayIndex].timeSlots || []
  
  // 计算新活动的时间
  let newTime = '10:00'
  if (insertIndex > 0 && timeSlots[insertIndex - 1]) {
    // 如果插入位置之前有活动，使用前一个活动的时间加30分钟
    const prevSlot = timeSlots[insertIndex - 1]
    const prevTime = prevSlot.time || '10:00'
    const [hours, minutes] = prevTime.split(':').map(Number)
    const nextTime = new Date(2000, 0, 1, hours, minutes + 30)
    newTime = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}`
  } else if (timeSlots.length > 0 && timeSlots[timeSlots.length - 1]) {
    // 如果插入到末尾，使用最后一个活动的时间加30分钟
    const lastSlot = timeSlots[timeSlots.length - 1]
    const lastTime = lastSlot.time || '10:00'
    const [hours, minutes] = lastTime.split(':').map(Number)
    const nextTime = new Date(2000, 0, 1, hours, minutes + 30)
    newTime = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}`
  }
  
  // 创建新活动
  const newSlot = {
    time: newTime,
    title: t('travelDetail.experienceDay.newActivity') || '新活动',
    activity: t('travelDetail.experienceDay.newActivity') || '新活动',
    location: '',
    type: 'attraction',
    category: 'attraction',
    duration: '30分钟',
    notes: '',
    cost: 0,
    details: {}
  }
  
  // 插入到指定位置
  timeSlots.splice(insertIndex, 0, newSlot)
  
  // 保存到 store
  if (travel.value) {
    travelListStore.updateTravel(travel.value.id, {
      data: itineraryData.value,
    })
    message.success(t('travelDetail.experienceDay.addSuccess') || '活动已添加')
    
    // 自动打开编辑弹窗
    handleEdit(day, insertIndex, newSlot)
  }
}

// 打开搜索模态框
const openSearchModal = async (day: number, slotIndex: number, slot: any) => {
  currentSearchContext.value = { day, slotIndex, slot }
  
  // 设置搜索位置
  const locationName = slot.details?.name?.chinese || slot.details?.name?.english || slot.location || slot.title || '当前位置'
  const locationAddress = slot.details?.address?.chinese || slot.details?.address?.english || slot.location
  const slotCoords = getSlotCoords(slot)
  searchLocation.value = {
    name: locationName,
    address: locationAddress,
    coordinates: slotCoords || undefined
  }
  
  // 重置搜索状态
  searchResults.value = []
  hasSearched.value = false
  selectedSearchCategory.value = 'restaurant'
  
  // 打开模态框并自动搜索
  searchModalVisible.value = true
  await performSearch()
}

// 执行搜索
const performSearch = async () => {
  if (!searchLocation.value.name) {
    message.warning('搜索位置信息不完整')
    return
  }
  
  searching.value = true
  hasSearched.value = false
  searchResults.value = []
  
  console.log(`🔍 [UI] 开始搜索${selectedSearchCategory.value}，位置: ${searchLocation.value.name}`)
  
  try {
    const results = await searchNearbyPOI(
      searchLocation.value,
      selectedSearchCategory.value,
      {
        language: locale.value,
        radius: 5,
        maxResults: 5
      }
    )
    
    console.log(`✅ [UI] 搜索完成，获得 ${results.length} 个结果`)
    searchResults.value = results
    hasSearched.value = true
    
    if (results.length === 0) {
      console.warn(`⚠️ [UI] 未找到结果，类别: ${selectedSearchCategory.value}`)
      message.info(noResultsDescription.value)
    }
  } catch (error) {
    console.error('❌ [UI] 搜索失败:', error)
    console.error('❌ [UI] 错误详情:', error instanceof Error ? error.stack : error)
    message.error(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
    hasSearched.value = true // 即使失败也标记为已搜索，显示"无结果"
  } finally {
    searching.value = false
    console.log(`🏁 [UI] 搜索状态更新完成`)
  }
}

// 处理类别改变
const handleCategoryChange = () => {
  performSearch()
}

// 添加POI到行程
const addPOIToItinerary = (poi: POIResult) => {
  if (!currentSearchContext.value || !itineraryData.value?.days) {
    message.error('无法添加：行程数据不存在')
    return
  }
  
  const { day, slotIndex, slot } = currentSearchContext.value
  const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === day)
  
  if (dayIndex === -1) {
    message.error('无法添加：找不到对应的行程日期')
    return
  }
  
  // 创建新的时间槽
  const timeSlots = itineraryData.value.days[dayIndex].timeSlots || []
  
  // 计算新时间槽的时间（插入到当前槽之后）
  const currentSlot = timeSlots[slotIndex]
  const currentTime = currentSlot?.time || '12:00'
  const [hours, minutes] = currentTime.split(':').map(Number)
  const nextTime = new Date(2000, 0, 1, hours, minutes + 30) // 30分钟后
  const nextTimeStr = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}`
  
  const newSlot = {
    time: nextTimeStr,
    title: poi.name.chinese || poi.name.english || poi.name.local || '新地点',
    activity: poi.name.chinese || poi.name.english || poi.name.local || '',
    location: poi.address.chinese || poi.address.english || poi.address.local || '',
    type: poi.category === 'restaurant' ? 'restaurant' : poi.category === 'attraction' ? 'attraction' : 'activity',
    category: poi.category,
    duration: poi.estimatedDuration || '30分钟',
    notes: poi.recommendation || '',
    cost: poi.pricing?.general ? (typeof poi.pricing.general === 'number' ? poi.pricing.general : parseFloat(String(poi.pricing.general)) || 0) : 0,
    coordinates: poi.coordinates,
    details: {
      name: poi.name,
      address: poi.address,
      coordinates: poi.coordinates,
      rating: poi.rating ? {
        score: poi.rating.score,
        platform: poi.rating.platform,
        reviewCount: poi.rating.reviewCount
      } : undefined,
      pricing: poi.pricing,
      openingHours: poi.openingHours,
      contact: poi.contact,
      photo: poi.photo ? [poi.photo] : undefined,
      recommendations: {
        description: poi.recommendation
      }
    }
  }
  
  // 插入到当前槽之后
  timeSlots.splice(slotIndex + 1, 0, newSlot)
  
  // 保存到store
  travelListStore.updateTravel(route.params.id as string, {
    ...itineraryData.value
  })
  
  message.success('已添加到行程')
  searchModalVisible.value = false
}

// 查看POI详情
const viewPOIDetails = (poi: POIResult) => {
  const addressLines = getPOIAddressLines(poi)

  Modal.info({
    title: poi.name.chinese || poi.name.english || poi.name.local || 'POI详情',
    width: 600,
    bodyStyle: { maxHeight: '720px', overflowY: 'auto' },
    content: h('div', { style: { padding: '16px 0' } }, [
      poi.photo ? h('img', {
        src: poi.photo,
        style: { width: '100%', borderRadius: '8px', marginBottom: '16px' }
      }) : null,
      h('div', { style: { marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' } }, [
        h('strong', '地址：'),
        ...addressLines.map(line => h('span', line.text)),
        addressLines.length === 0 ? h('span', '地址未知') : null
      ]),
      poi.distance ? h('div', { style: { marginBottom: '12px' } }, [
        h('strong', '距离：'),
        poi.distance
      ]) : null,
      poi.recommendation ? h('div', { style: { marginBottom: '12px' } }, [
        h('strong', '推荐理由：'),
        poi.recommendation
      ]) : null,
      poi.rating ? h('div', { style: { marginBottom: '12px' } }, [
        h('strong', '评分：'),
        `⭐ ${poi.rating.score}${poi.rating.platform ? ` (${poi.rating.platform})` : ''}${poi.rating.reviewCount ? ` · ${poi.rating.reviewCount}条评论` : ''}`
      ]) : null,
      poi.openingHours?.hours ? h('div', { style: { marginBottom: '12px' } }, [
        h('strong', '营业时间：'),
        poi.openingHours.hours
      ]) : null,
      poi.pricing?.general ? h('div', { style: { marginBottom: '12px' } }, [
        h('strong', '价格：'),
        formatCurrency(poi.pricing.general, (() => {
          const unit = poi.pricing.unit || getSearchLocationCurrency.value?.code || 'CNY'
          return getCurrencyByCode(unit) || getSearchLocationCurrency.value || { code: 'CNY', symbol: '¥', name: '人民币' }
        })())
      ]) : null,
      poi.estimatedDuration ? h('div', { style: { marginBottom: '12px' } }, [
        h('strong', `${durationLabel.value}：`),
        poi.estimatedDuration
      ]) : null,
      poi.contact?.phone ? h('div', { style: { marginBottom: '12px' } }, [
        h('strong', '电话：'),
        h('a', { href: `tel:${poi.contact.phone}`, style: { color: '#0071e3' } }, poi.contact.phone)
      ]) : null,
      poi.contact?.website ? h('div', { style: { marginBottom: '12px' } }, [
        h('strong', '网站：'),
        h('a', { href: poi.contact.website, target: '_blank', style: { color: '#0071e3' } }, poi.contact.website)
      ]) : null,
    ])
  })
}

// 取消编辑
const handleCancelEdit = () => {
  editModalVisible.value = false
  editingSlot.value = null
  editingData.value = {
    // 基础字段
    time: '',
    title: '',
    activity: '',
    type: 'attraction',
    category: 'attraction',
    duration: null,
    cost: null,
    location: '',
    coordinates: null,
    
    // details 对象中的字段
    nameChinese: '',
    nameEnglish: '',
    rating: null,
    transportation: '',
    openingHours: '',
    pricingDetail: '',
    bookingInfo: '',
    visitTips: '',
    outfitSuggestions: '',
    culturalTips: '',
    accessibility: '',
    scenicIntro: '',
    highlights: '',
    notes: '',
    
    // 其他字段
    bookingLinks: [],
    transportModes: [],
  }
}

// 保存编辑
const handleSaveEdit = async () => {
  if (!editingSlot.value || !itineraryData.value?.days) return
  
  const day = editingSlot.value.day
  const slotIndex = editingSlot.value.slotIndex
  
  const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === day)
  if (dayIndex === -1) return
  
  const slot = itineraryData.value.days[dayIndex].timeSlots?.[slotIndex]
  if (!slot) return
  
  // 更新基础字段
  slot.time = editingData.value.time
  slot.title = editingData.value.title
  slot.activity = editingData.value.activity || editingData.value.title
  slot.type = editingData.value.type
  slot.category = editingData.value.category || editingData.value.type
  slot.duration = editingData.value.duration
  slot.cost = editingData.value.cost
  slot.location = editingData.value.location
  slot.coordinates = editingData.value.coordinates
  slot.bookingLinks = editingData.value.bookingLinks || []

  // 更新 details 对象
  if (!slot.details) {
    slot.details = {}
  }
  
  // 更新名称
  if (!slot.details.name) {
    slot.details.name = {}
  }
  if (editingData.value.nameChinese) {
    slot.details.name.chinese = editingData.value.nameChinese
  }
  if (editingData.value.nameEnglish) {
    slot.details.name.english = editingData.value.nameEnglish
  }
  
  // 更新其他 details 字段
  if (editingData.value.rating !== null) {
    slot.details.rating = editingData.value.rating
  }
  if (editingData.value.transportation) {
    slot.details.transportation = editingData.value.transportation
  }
  if (editingData.value.openingHours) {
    slot.details.openingHours = editingData.value.openingHours
  }
  if (editingData.value.pricingDetail) {
    if (!slot.details.pricing) {
      slot.details.pricing = {}
    }
    slot.details.pricing.detail = editingData.value.pricingDetail
  }
  if (editingData.value.bookingInfo) {
    if (!slot.details.recommendations) {
      slot.details.recommendations = {}
    }
    slot.details.recommendations.bookingInfo = editingData.value.bookingInfo
  }
  if (editingData.value.visitTips) {
    if (!slot.details.recommendations) {
      slot.details.recommendations = {}
    }
    slot.details.recommendations.visitTips = editingData.value.visitTips
  }
  if (editingData.value.outfitSuggestions) {
    if (!slot.details.recommendations) {
      slot.details.recommendations = {}
    }
    slot.details.recommendations.outfitSuggestions = editingData.value.outfitSuggestions
  }
  if (editingData.value.culturalTips) {
    if (!slot.details.recommendations) {
      slot.details.recommendations = {}
    }
    slot.details.recommendations.culturalTips = editingData.value.culturalTips
  }
  if (editingData.value.accessibility) {
    slot.details.accessibility = editingData.value.accessibility
  }
  if (editingData.value.scenicIntro) {
    if (!slot.details.description) {
      slot.details.description = {}
    }
    slot.details.description.scenicIntro = editingData.value.scenicIntro
  }
  if (editingData.value.highlights) {
    if (!slot.details.description) {
      slot.details.description = {}
    }
    slot.details.description.highlights = editingData.value.highlights.split('\n').filter(Boolean)
  }
  if (editingData.value.notes) {
    slot.notes = editingData.value.notes
    slot.details.notes = editingData.value.notes
  }
  
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

// 判断是否为交通或住宿类型
const isTransportOrAccommodation = (slot: any): boolean => {
  const type = (slot.type || slot.category || '').toLowerCase()
  const title = (slot.title || slot.activity || '').toLowerCase()
  return type === 'transport' || type === 'accommodation' || 
         title.includes('机场') || title.includes('airport') ||
         title.includes('酒店') || title.includes('hotel') ||
         title.includes('交通') || title.includes('transport') ||
         slot.details?.transportation // 如果有交通信息，也认为是交通类型
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

const getTransportModeLabel = (value: string): string => {
  const option = transportModeOptions.find(opt => opt.value === value)
  return option?.label || value
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
  
  // 判断活动类型
  const isTransport = isTransportOrAccommodation(slot) && 
    ((slot.type || slot.category || '').toLowerCase() === 'transport' ||
     (slot.title || slot.activity || '').toLowerCase().includes('机场') ||
     (slot.title || slot.activity || '').toLowerCase().includes('airport') ||
     (slot.title || slot.activity || '').toLowerCase().includes('航班') ||
     (slot.title || slot.activity || '').toLowerCase().includes('flight'))
  
  const isAccommodation = isTransportOrAccommodation(slot) && 
    ((slot.type || slot.category || '').toLowerCase() === 'accommodation' ||
     (slot.title || slot.activity || '').toLowerCase().includes('酒店') ||
     (slot.title || slot.activity || '').toLowerCase().includes('hotel'))
  
  // 判断是否为中国目的地（用于显示大众点评）
  const isChina = COUNTRY_KEYWORDS.CHINA.some(keyword => 
    destination.value?.includes(keyword) || false
  )
  
  // 根据活动类型生成不同的标题和链接
  let title = ''
  let bookingLinks: any[] = []
  
  if (isTransport) {
    // 交通/机票类型
    title = `${t('travelDetail.experienceDay.book')} ${activityName || t('travelDetail.experienceDay.flight')}`
    
    // 获取出发地和目的地
    const originCode = getUserLocationCode()
    const originName = originCode ? (PRESET_COUNTRIES[originCode as keyof typeof PRESET_COUNTRIES]?.name || '') : ''
    const destName = destination.value || ''
    
    // 构建机票预订链接（包含出发地和目的地）
    const buildFlightUrl = (platform: string, origin: string, dest: string): string => {
      const originEncoded = encodeURIComponent(origin)
      const destEncoded = encodeURIComponent(dest)
      
      switch (platform) {
        case 'skyscanner':
          // Skyscanner: /flights/from/origin/to/dest/
          return origin && dest 
            ? `https://www.skyscanner.com/transport/flights/${originEncoded}/${destEncoded}/`
            : `https://www.skyscanner.com/transport/flights/`
        case 'google':
          // Google Flights: ?q=Flights from ORIGIN to DEST
          return origin && dest
            ? `https://www.google.com/travel/flights?q=Flights%20from%20${originEncoded}%20to%20${destEncoded}`
            : `https://www.google.com/travel/flights?q=Flights%20to%20${destEncoded}`
        case 'expedia':
          // Expedia: ?originCity=ORIGIN&destinationCity=DEST
          return origin && dest
            ? `https://www.expedia.com/Flights-Search?originCity=${originEncoded}&destinationCity=${destEncoded}`
            : dest
            ? `https://www.expedia.com/Flights-Search?destinationCity=${destEncoded}`
            : `https://www.expedia.com/Flights-Search`
        case 'kayak':
          // Kayak: /flights/ORIGIN/DEST/
          return origin && dest
            ? `https://www.kayak.com/flights/${originEncoded}/${destEncoded}/`
            : dest
            ? `https://www.kayak.com/flights/-/${destEncoded}/`
            : `https://www.kayak.com/flights/`
        default:
          return ''
      }
    }
    
    bookingLinks = [
      h('a', {
        href: buildFlightUrl('skyscanner', originName, destName),
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
      }, `✈️ ${t('travelDetail.experienceDay.skyscanner')}${originName && destName ? ` (${originName} → ${destName})` : ''}`),
      h('a', {
        href: buildFlightUrl('google', originName, destName),
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
      }, `🔍 ${t('travelDetail.experienceDay.googleFlights')}${originName && destName ? ` (${originName} → ${destName})` : ''}`),
      h('a', {
        href: buildFlightUrl('expedia', originName, destName),
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
      }, `✈️ ${t('travelDetail.experienceDay.expedia')}${originName && destName ? ` (${originName} → ${destName})` : ''}`),
      h('a', {
        href: buildFlightUrl('kayak', originName, destName),
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
      }, `🎫 ${t('travelDetail.experienceDay.kayak')}${originName && destName ? ` (${originName} → ${destName})` : ''}`)
    ]
  } else if (isAccommodation) {
    // 住宿类型
    title = `${t('travelDetail.experienceDay.book')} ${activityName || t('travelDetail.experienceDay.hotel')}`
    bookingLinks = [
      h('a', {
        href: `${BOOKING_PLATFORMS.BOOKING_COM}${encodeURIComponent(activityName || destination.value || '')}`,
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
      h('a', {
        href: `${BOOKING_PLATFORMS.AGODA}${encodeURIComponent(destination.value || '')}`,
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
      }, `🏨 ${t('travelDetail.experienceDay.agoda')}`),
      h('a', {
        href: `${BOOKING_PLATFORMS.AIRBNB}${encodeURIComponent(activityName || destination.value || '')}`,
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
      }, `🏠 ${t('travelDetail.experienceDay.airbnb')}`)
    ]
  } else {
    // 景点/活动类型
    title = `${t('travelDetail.experienceDay.book')} ${activityName || t('travelDetail.experienceDay.attraction')}`
    bookingLinks = [
      h('a', {
        href: `${BOOKING_PLATFORMS.BOOKING_COM}${encodeURIComponent(activityName || destination.value || '')}`,
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
        href: `${BOOKING_PLATFORMS.GETYOURGUIDE}${encodeURIComponent(activityName || '')}`,
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
      }, `🎫 ${t('travelDetail.experienceDay.getYourGuide')}`),
      h('a', {
        href: `${BOOKING_PLATFORMS.VIATOR}${encodeURIComponent(activityName || '')}`,
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
      }, `🎯 ${t('travelDetail.experienceDay.viator')}`)
    ]
    
    // 中国目的地添加大众点评
    if (isChina) {
      bookingLinks.push(
        h('a', {
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
        }, `🍽️ ${t('travelDetail.experienceDay.dianpingLabel')}`)
      )
    }
  }
  
  Modal.info({
    title: title,
    content: h('div', { style: { padding: '8px 0' } }, [
      h('p', { style: { margin: '8px 0', color: '#666' } }, `${t('travelDetail.experienceDay.bookingSuggestion')}：`),
      h('p', { style: { margin: '4px 0' } }, `· ${bookingInfo}`),
      h('p', { style: { margin: '8px 0', marginTop: '16px', color: '#666' } }, `${t('travelDetail.experienceDay.commonBookingPlatforms')}：`),
      h('div', { style: { marginTop: '8px' } }, bookingLinks)
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

// 获取信息来源
const getSourceInfo = (slot: any): string => {
  const sources: string[] = []
  
  if (slot.details?.rating?.platform) {
    sources.push(slot.details.rating.platform)
  }
  if (slot.details?.source) {
    sources.push(slot.details.source)
  }
  if (slot.details?.officialWebsite) {
    sources.push(t('travelDetail.experienceDay.officialWebsite') || '官方网站')
  }
  if (slot.details?.sourceUrl) {
    sources.push(t('travelDetail.experienceDay.sourceLink') || '来源链接')
  }
  
  if (sources.length === 0) {
  return t('travelDetail.experienceDay.defaultSource')
  }
  
  return sources.join('、')
}

// 获取信息来源链接
const getSourceLinks = (slot: any): Array<{ label: string; url: string }> => {
  const links: Array<{ label: string; url: string }> = []
  
  if (slot.details?.officialWebsite) {
    links.push({
      label: t('travelDetail.experienceDay.officialWebsite') || '官方网站',
      url: slot.details.officialWebsite
    })
  }
  if (slot.details?.sourceUrl) {
    links.push({
      label: t('travelDetail.experienceDay.sourceLink') || '来源链接',
      url: slot.details.sourceUrl
    })
  }
  if (slot.details?.rating?.platformUrl) {
    links.push({
      label: slot.details.rating.platform || '评分平台',
      url: slot.details.rating.platformUrl
    })
  }
  
  return links
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

// 获取每日行程摘要 - 灵感模式不显示文本内容
const getDaySummary = (day: any): string | null => {
  // 如果是灵感模式，不返回任何文本内容
  if (travel.value?.mode === 'inspiration' || travel.value?.mode === 'classic') {
    return null
  }
  
  if (!day) return null
  
  const summaryCandidates: Array<string | null | undefined> = [
    day.summary,
    day.details?.summary,
    day.details?.overview,
    day.details?.narrative?.stageIntro,
    day.details?.narrative?.overview,
    day.details?.narrative?.callToAdventure,
    day.coreInsight,
  ]

  for (const candidate of summaryCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  const firstSlot =
    Array.isArray(day.timeSlots) && day.timeSlots.length > 0 ? day.timeSlots[0] : null
  if (firstSlot) {
    const slotSummary = formatSlotSummary(firstSlot, t)
    if (slotSummary && slotSummary.trim()) {
      return slotSummary.trim()
    }
    const scenicIntro = firstSlot.details?.description?.scenicIntro
    if (typeof scenicIntro === 'string' && scenicIntro.trim()) {
      return scenicIntro.trim()
    }
  }
  
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

// 获取目的地国家代码（改进的提取逻辑，参考BudgetManager）
// 统一的提取国家代码函数（支持别名和城市名）
const extractCountryCodeFromText = (text: string): string | null => {
  if (!text || text === '待定') return null
  
  const textLower = text.toLowerCase()
  
  // 国家别名映射（包含城市名等）
  const countryAliases: Record<string, string[]> = {
    'US': ['alaska', '阿拉斯加', 'fairbanks', '费尔班克斯', 'usa', 'united states', '美国', 'america'],
    'JP': ['japan', '日本'],
    'KR': ['korea', 'south korea', '韩国', '首尔', 'seoul'],
    'TH': ['thailand', '泰国', '曼谷', 'bangkok'],
    'SG': ['singapore', '新加坡'],
    'MY': ['malaysia', '马来西亚', '吉隆坡', 'kuala lumpur'],
    'ID': ['indonesia', '印尼', '印度尼西亚', '巴厘岛', 'bali', '雅加达', 'jakarta'],
    'PH': ['philippines', '菲律宾', '马尼拉', 'manila'],
    'VN': ['vietnam', '越南', '河内', 'hanoi'],
    'AU': ['australia', '澳大利亚', '悉尼', 'sydney', '墨尔本', 'melbourne'],
    'CA': ['canada', '加拿大', '温哥华', 'vancouver', '多伦多', 'toronto'],
    'NZ': ['new zealand', '新西兰', '奥克兰', 'auckland'],
    'GB': ['united kingdom', 'uk', '英国', 'britain', '伦敦', 'london'],
    'FR': ['france', '法国', '巴黎', 'paris'],
    'DE': ['germany', '德国', '柏林', 'berlin', '慕尼黑', 'munich'],
    'IT': ['italy', '意大利', '罗马', 'rome', '米兰', 'milan'],
    'ES': ['spain', '西班牙', '马德里', 'madrid', '巴塞罗那', 'barcelona'],
    'FI': ['finland', '芬兰', '赫尔辛基', 'helsinki'],
    'IS': ['iceland', '冰岛', 'reykjavik', '雷克雅未克'],
    'TW': ['taiwan', '台湾', '台北', 'taipei'],
    'HK': ['hong kong', '香港'],
    'MO': ['macau', 'macao', '澳门']
  }
  
  // 首先检查别名（包含城市名）
  for (const [code, aliases] of Object.entries(countryAliases)) {
    if (aliases.some(alias => textLower.includes(alias.toLowerCase()))) {
      console.log(`✅ 从别名匹配到国家代码: ${code} (文本: ${text})`)
      return code
    }
  }
  
  // 然后检查国家名称和代码
  for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
    // 匹配国家名称（中文）
    if (textLower.includes(country.name.toLowerCase())) {
      console.log(`✅ 从国家名称匹配到代码: ${code} (文本: ${text})`)
      return code
    }
    
    // 匹配国家代码
    if (textLower.includes(code.toLowerCase())) {
      console.log(`✅ 从国家代码匹配: ${code} (文本: ${text})`)
      return code
    }
  }
  
  return null
}

const destinationCountryCode = computed(() => {
  if (!travel.value) {
    console.log('⚠️ travel.value 为空，无法提取国家代码')
    return null
  }
  
  const data = travel.value.data as any
  console.log('🔍 提取国家代码，travel.location:', travel.value.location, 'destination.value:', destination.value)
  
  // 1. 从 location 字段提取（新生成的行程通常在这里）
  if (travel.value.location && travel.value.location !== '待定') {
    const code = extractCountryCodeFromText(travel.value.location)
    if (code) {
      console.log(`✅ 从 travel.location 提取到国家代码: ${code}`)
      return code
    }
  }
  
  // 2. 从 destination 字段提取
  if (travel.value.destination) {
    const code = extractCountryCodeFromText(travel.value.destination)
    if (code) return code
  }
  
  // 3. 从 data 中的 selectedLocation 提取（新生成的灵感行程通常在这里）
  const dataDestination = data?.selectedLocation || data?.destination
  if (dataDestination && dataDestination !== '待定') {
    const code = extractCountryCodeFromText(dataDestination)
    if (code) {
      console.log(`✅ 从 data.selectedLocation 提取到国家代码: ${code}`)
      return code
    }
  }
  
  // 4. 从 destination computed 值提取
  const dest = destination.value
  if (dest && dest !== '待定') {
    const code = extractCountryCodeFromText(dest)
    if (code) {
      console.log(`✅ 从 destination.value 提取到国家代码: ${code}`)
      return code
    }
  }
  
  // 5. 从 itineraryData 中提取
  if (itineraryData.value?.destination) {
    const code = extractCountryCodeFromText(itineraryData.value.destination)
    if (code) {
      console.log(`✅ 从 itineraryData.destination 提取到国家代码: ${code}`)
      return code
    }
  }
  
  // 6. 从 days 数组中的 locations 提取
  if (itineraryData.value?.days && Array.isArray(itineraryData.value.days)) {
    for (const day of itineraryData.value.days) {
      if (day.location) {
        const code = extractCountryCodeFromText(day.location)
        if (code) return code
      }
      // 也从 timeSlots 中提取
      if (day.timeSlots && Array.isArray(day.timeSlots)) {
        for (const slot of day.timeSlots) {
          if (slot.location) {
            const code = extractCountryCodeFromText(slot.location)
            if (code) return code
          }
          // 从地址中提取
          if (slot.details?.address?.english) {
            const code = extractCountryCodeFromText(slot.details.address.english)
            if (code) return code
          }
          if (slot.details?.address?.chinese) {
            const code = extractCountryCodeFromText(slot.details.address.chinese)
            if (code) return code
          }
        }
      }
    }
  }
  
  console.log('⚠️ 未能提取到国家代码，已尝试所有数据源')
  return null
})

// 获取签证信息
const visaInfo = computed(() => {
  const countryCode = destinationCountryCode.value
  if (!countryCode) {
    console.log('⚠️ 签证信息：无法获取目的地国家代码')
    return null
  }
  
  const nationalityCode = getUserNationalityCode()
  const permanentResidencyCode = getUserPermanentResidencyCode()
  
  console.log('🔍 签证信息查询:', {
    destinationCountry: countryCode,
    nationalityCode,
    permanentResidencyCode
  })
  
  const visaInfos = getVisaInfo(countryCode, nationalityCode, permanentResidencyCode)
  console.log('📋 查询到的签证信息:', visaInfos)
  
  if (visaInfos.length === 0) {
    console.log('⚠️ 未找到签证信息，可能原因：1) 目的地国家代码不在数据库中 2) 用户国籍未设置 3) 该目的地对该国籍无签证数据')
    return null
  }
  
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
    
    // 申请链接（如果有）
    info.applicationUrl ? h('div', {
      key: 'application-link',
      style: {
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'center'
      }
    }, [
      h('a', {
        href: info.applicationUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: '#1890ff',
          color: '#fff',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 500,
          transition: 'all 0.3s ease'
        },
        onMouseenter: (e: any) => {
          e.target.style.background = '#40a9ff'
        },
        onMouseleave: (e: any) => {
          e.target.style.background = '#1890ff'
        }
      }, [
        h('span', '🔗'),
        h('span', info.visaType === 'e-visa' ? (t('travelDetail.visaGuideActions.applyEvisa') || '在线申请电子签证') : (t('travelDetail.visaGuideActions.applyVisa') || '申请签证'))
      ])
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

/* 活动图片容器 */
.slot-image-container {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 16px;
  overflow: hidden;
  background: #f5f5f7;
  height: 260px;
  position: relative;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.slot-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.slot-image:hover {
  transform: scale(1.02);
  opacity: 0.95;
}

.slot-image-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 113, 227, 0.1);
  border-top-color: #0071e3;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .slot-image-container {
    margin-bottom: 12px;
    border-radius: 12px;
    height: 220px;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border-width: 2px;
  }
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

/* 内部轨道预览（主界面显示） */
.internal-track-preview {
  margin: 12px 0 16px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  border-radius: 12px;
  border-left: 3px solid #722ed1;
}

.internal-track-preview-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.6;
}

.preview-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.preview-label {
  font-weight: 600;
  color: #722ed1;
  font-size: 14px;
  flex-shrink: 0;
}

.preview-text {
  color: #555;
  font-size: 14px;
  flex: 1;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .internal-track-preview {
    padding: 10px 12px;
    margin: 10px 0 12px 0;
  }
  
  .preview-icon {
    font-size: 14px;
  }
  
  .preview-label,
  .preview-text {
    font-size: 13px;
  }
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
  font-size: 16px;
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


.add-slot-btn {
  width: 100%;
  border-color: #d9d9d9;
  color: #666;
  transition: all 0.3s ease;
}

.add-slot-btn:hover {
  border-color: #0071e3;
  color: #0071e3;
  background: rgba(0, 113, 227, 0.04);
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

.source-link {
  color: #1890ff;
  text-decoration: none;
  margin-left: 4px;
}

.source-link:hover {
  text-decoration: underline;
}

.location-local-name {
  font-weight: 600;
  color: #333;
}

.location-address-local {
  color: #666;
}

.location-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.location-line {
  color: #333;
  word-break: break-word;
}

.location-line-localName {
  font-weight: 600;
  color: #222;
}

.location-line-english {
  color: #2f54eb;
}

.location-line-localAddress {
  color: #595959;
}

.location-line-chinese {
  color: #595959;
}

.location-line-landmark {
  color: #722ed1;
}

.location-line-fallback {
  color: #8c8c8c;
}

.transportation-info {
  line-height: 1.6;
}

.outfit-suggestions-text,
.cultural-tips-text {
  line-height: 1.7;
  color: #555;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  overflow: visible;
  text-overflow: clip; /* 不使用 ellipsis，确保完整显示 */
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
  .slot-title-main {
    font-size: 21px;
  }
  
  .slot-title-sub {
    font-size: 15px;
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

.booking-suggestion {
  margin-top: 8px;
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

/* 内部轨迹样式 */
.internal-track-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9ff;
  border-left: 3px solid #722ed1;
  border-radius: 4px;
}

.internal-track-icon {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.internal-track-content {
  margin-top: 0.75rem;
}

.internal-track-item {
  margin-bottom: 0.75rem;
}

.internal-track-item:last-child {
  margin-bottom: 0;
}

.internal-track-label {
  font-weight: 600;
  color: #722ed1;
  font-size: 0.9rem;
}

.internal-track-text {
  margin-top: 0.25rem;
  color: #555;
  line-height: 1.6;
  font-size: 0.9rem;
}

/* 心理流程阶段样式 */
.mental-flow-section {
  margin-top: 3rem;
  padding: 2rem;
  background: #fafafa;
  border-radius: 8px;
}

.mental-flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.mental-flow-card {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.stage-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #722ed1;
  margin-bottom: 1rem;
}

.stage-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.stage-theme,
.stage-emotional,
.stage-symbolic {
  margin-top: 0.75rem;
  color: #555;
  line-height: 1.6;
}

.stage-activities {
  margin-top: 0.75rem;
}

.stage-activities ul {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
  color: #555;
}

.stage-activities li {
  margin-bottom: 0.25rem;
}

/* 认知和疗愈样式 */
.cognitive-healing-section {
  margin-top: 3rem;
  padding: 2rem;
  background: #fafafa;
  border-radius: 8px;
}

.cognitive-triggers-card,
.healing-design-card {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.cognitive-triggers-card:last-child,
.healing-design-card:last-child {
  margin-bottom: 0;
}

.trigger-group {
  margin-bottom: 1.5rem;
}

.trigger-group:last-child {
  margin-bottom: 0;
}

.trigger-label {
  font-weight: 600;
  color: #666;
  font-size: 0.95rem;
  display: block;
  margin-bottom: 0.5rem;
}

.trigger-list {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
  color: #555;
}

.trigger-list li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.healing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.healing-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9ff;
  border-radius: 4px;
  color: #555;
}

.healing-icon {
  font-size: 1.2rem;
}

.healing-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
}

/* 图片预览模态框 */
.image-preview-modal :deep(.ant-modal-content) {
  padding: 0;
  background: #000;
}

.image-preview-modal :deep(.ant-modal-close) {
  color: #fff;
  top: 16px;
  right: 16px;
  z-index: 1000;
}

.image-preview-modal :deep(.ant-modal-close:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.image-preview-container {
  position: relative;
  width: 100%;
  min-height: 60vh;
  max-height: 85vh;
  background: #000;
  display: flex;
  flex-direction: column;
}

.preview-image-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 0;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: calc(85vh - 200px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

.preview-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.preview-nav-btn {
  color: #fff;
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.preview-nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.preview-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 24px;
  font-weight: bold;
}

.preview-info {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.preview-counter {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.preview-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.set-cover-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border: none;
  color: white;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(17, 153, 142, 0.3);
}

.set-cover-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.4);
  background: linear-gradient(135deg, #0d7a70 0%, #2dd66a 100%);
}

.set-cover-btn:active {
  transform: translateY(0);
}

.cover-icon {
  font-size: 16px;
}

.cover-text {
  font-size: 14px;
}

.preview-thumbnails {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  overflow-x: auto;
  justify-content: center;
  flex-shrink: 0;
}

.preview-thumbnail {
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.preview-thumbnail:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.preview-thumbnail.active {
  border-color: #0071e3;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.3);
}

.preview-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .image-preview-container {
    min-height: 50vh;
    max-height: 80vh;
  }
  
  .preview-image-wrapper {
    padding: 12px;
  }
  
  .preview-image {
    max-height: calc(80vh - 180px);
  }
  
  .preview-controls {
    padding: 12px 16px;
  }
  
  .preview-nav-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .preview-actions {
    padding: 10px 16px;
  }
  
  .set-cover-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .cover-icon {
    font-size: 14px;
  }
  
  .cover-text {
    font-size: 12px;
  }
  
  .preview-thumbnails {
    padding: 10px 12px;
    gap: 6px;
  }
  
  .preview-thumbnail {
    width: 60px;
    height: 45px;
  }
}

/* POI搜索相关样式 */
.poi-search-container {
  padding: 8px 0;
  max-height: 100%;
  overflow-y: auto;
}

.search-location-info {
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.location-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-icon {
  font-size: 18px;
}

.location-text {
  font-weight: 500;
  color: #333;
}

.location-address {
  color: #666;
  font-size: 14px;
}

.category-selector {
  margin-bottom: 20px;
}

.category-label {
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

.search-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.search-results {
  margin-top: 20px;
}

.results-header {
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  padding: 8px 0;
}

.results-count {
  font-weight: 500;
  color: #333;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(800px - 200px); /* 减去其他元素的高度 */
  overflow-y: auto;
  padding-right: 4px;
}

.poi-result-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s;
}

.poi-result-card:hover {
  border-color: #722ed1;
  box-shadow: 0 2px 8px rgba(114, 46, 209, 0.1);
}

.poi-photo {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
}

.poi-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poi-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.poi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.poi-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.local-name {
  font-size: 18px;
  color: #722ed1;
}

.chinese-name,
.english-name {
  font-size: 14px;
  color: #666;
}


.poi-address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #666;
  font-size: 14px;
  flex-wrap: wrap;
}

.address-icon {
  font-size: 16px;
  line-height: 1;
  margin-top: 2px;
}

.address-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.address-line {
  color: #555;
  word-break: break-word;
}

.address-line-localName,
.address-line-localAddress {
  color: #333;
}

.address-line-english {
  color: #2f54eb;
}

.address-line-chinese {
  color: #595959;
}

.address-line-landmark {
  color: #722ed1;
}

.address-line-fallback {
  color: #8c8c8c;
}

.distance-badge {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.poi-recommendation {
  display: flex;
  gap: 8px;
  color: #555;
  font-size: 14px;
  line-height: 1.6;
}

.recommendation-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.poi-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 13px;
}

.meta-icon {
  font-size: 14px;
}

.meta-label {
  color: #888;
  font-size: 12px;
  margin-right: 2px;
}

.poi-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.no-results {
  padding: 40px 0;
}
</style>
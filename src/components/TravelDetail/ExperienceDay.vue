<template>
  <div class="experience-journey">
    <!-- 封面层（Hero Layer）- 灵感卡片风格 -->
    <section class="hero-layer" :style="heroBackgroundStyle">
      <!-- 顶部图标 -->
      <div class="hero-top-icons">
        <div class="icon-circle globe-icon">
          <span>🌐</span>
      </div>
        <div class="icon-circle location-icon">
          <span>📍</span>
        </div>
      </div>
      
      <div class="hero-content">
        <!-- 主标题 -->
        <h1 class="hero-title">{{ inspirationTitle }}</h1>
        
        <!-- 编辑图标 -->
        <div class="edit-icon-wrapper">
          <div class="edit-icon">✏️</div>
    </div>
    
        <!-- 地点标签 -->
        <div class="location-tag" v-if="destination">
          <span class="location-icon-small">📍</span>
          <span>{{ destination }}</span>
        </div>
        
        <!-- 核心哲学语句 -->
        <p v-if="coreInsight" class="hero-core-insight">{{ coreInsight }}</p>
        
        <!-- 支持文本 -->
        <p v-if="supportingText" class="hero-supporting-text">{{ supportingText }}</p>
        
        <!-- 操作按钮 -->
        <div class="hero-actions">
          <button class="btn-primary">一键生成行程</button>
          <button class="btn-secondary">加入灵感夹</button>
        </div>
      </div>

      <!-- 底部描述段落 -->
      <div class="hero-footer">
        <p v-if="journeyBackground" class="hero-description">{{ journeyBackground }}</p>
        
        <!-- 底部动画和图标 -->
        <div class="hero-footer-icons">
          <div class="footer-icon chevron-icon">⌄</div>
          <div class="footer-icon notification-icon">
            <span>💡</span>
            <span class="notification-badge">1</span>
              </div>
            </div>
          </div>
      
      <!-- 底部脉冲动画 -->
      <div class="pulsating-animation"></div>
    </section>
    
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
                <h3 class="day-title">{{ day.theme || `Day ${day.day}` }}</h3>
                <span class="day-date">{{ day.date }}</span>
                <a-tag v-if="day.mood" :color="getMoodColor(day.mood)">{{ day.mood }}</a-tag>
          </div>
        </div>
            <p v-if="day.summary" class="day-description">{{ day.summary }}</p>
            
            <!-- 时间段活动 -->
            <div class="time-slots">
              <div 
                v-for="(slot, slotIndex) in day.timeSlots" 
                :key="slotIndex"
                class="time-slot"
              >
                <div class="slot-time">{{ slot.time }}</div>
                <div class="slot-content">
                  <h4 class="slot-title">{{ slot.title || slot.activity }}</h4>
                  <p v-if="slot.location" class="slot-location">{{ slot.location }}</p>
                  <p v-if="slot.notes" class="slot-notes">{{ slot.notes }}</p>
                  <div v-if="slot.localTip" class="slot-tip">
                    <span class="tip-label">💡 提示：</span>
                    <span>{{ slot.localTip }}</span>
          </div>
                  <div class="slot-meta">
                    <a-tag v-if="slot.type" size="small">{{ slot.type }}</a-tag>
                    <span v-if="slot.duration" class="slot-duration">时长：{{ slot.duration }}分钟</span>
                    <span v-if="slot.cost" class="slot-cost">费用：¥{{ slot.cost }}</span>
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
      <h3 class="section-title">📋 旅行建议</h3>
      <div class="recommendations-grid">
        <div v-if="recommendations.bestTimeToVisit" class="recommendation-card">
          <h4>最佳旅行时间</h4>
          <p>{{ recommendations.bestTimeToVisit }}</p>
        </div>
        <div v-if="recommendations.weatherAdvice" class="recommendation-card">
          <h4>天气建议</h4>
          <p>{{ recommendations.weatherAdvice }}</p>
      </div>
        <div v-if="recommendations.packingTips && recommendations.packingTips.length" class="recommendation-card">
          <h4>打包提示</h4>
          <ul>
            <li v-for="(tip, index) in recommendations.packingTips" :key="index">{{ tip }}</li>
        </ul>
      </div>
        <div v-if="recommendations.localTips && recommendations.localTips.length" class="recommendation-card">
          <h4>当地提示</h4>
          <ul>
            <li v-for="(tip, index) in recommendations.localTips" :key="index">{{ tip }}</li>
        </ul>
      </div>
      </div>
    </section>
    
    <!-- 费用总计 -->
    <section v-if="totalCost" class="cost-section">
      <div class="cost-card">
        <h4>预计总费用</h4>
        <p class="cost-amount">¥{{ totalCost }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTravelListStore } from '@/stores/travelList'
import { CalendarOutlined } from '@ant-design/icons-vue'

const route = useRoute()
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
  return travel.value?.title || '在风中遇见自己'
})

const destination = computed(() => {
  const dest = itineraryData.value?.destination || travel.value?.location || travel.value?.data?.location
  if (dest) {
    // 如果包含国家信息，格式化显示
    const country = travel.value?.data?.currentCountry || ''
    return country ? `${dest} (${country})` : dest
  }
  return ''
})

// 核心哲学语句
const coreInsight = computed(() => {
  return travel.value?.data?.coreInsight || 
         travel.value?.data?.narrative?.threshold ||
         travel.value?.data?.narrative?.stillness ||
         '真正的自由，是在上升与降落之间找到内心的平衡'
})

// 支持文本
const supportingText = computed(() => {
  return travel.value?.data?.narrative?.mirror ||
         travel.value?.data?.cognitiveTriggers?.questions?.[0] ||
         '当放手被看见，视角会更轻，信任也会更靠近。'
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

const heroBackgroundStyle = computed(() => {
  const coverImage = travel.value?.coverImage || travel.value?.data?.coverImage
  if (coverImage) {
  return {
      backgroundImage: `url(${coverImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {}
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

// 总费用
const totalCost = computed(() => {
  return itineraryData.value?.totalCost || null
})

// 获取情绪颜色
const getMoodColor = (mood: string) => {
  const moodColors: Record<string, string> = {
    '探索': 'blue',
    '放松': 'green',
    '冒险': 'orange',
    '文化': 'purple',
    '美食': 'red',
    '自然': 'cyan',
    '艺术': 'magenta'
  }
  return moodColors[mood] || 'default'
}

</script>

<style scoped>
.experience-journey {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(76, 175, 80, 0.9) 0%, rgba(0, 150, 136, 0.95) 100%);
  color: #fff;
}

/* 1. 封面层 - 灵感卡片风格 */
.hero-layer {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 2rem;
}

.hero-layer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(76, 175, 80, 0.9) 0%, rgba(0, 150, 136, 0.95) 100%);
  z-index: 0;
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

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  margin: 4rem auto 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

/* 编辑图标 */
.edit-icon-wrapper {
  margin: 0.5rem 0 1rem;
}

.edit-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  opacity: 0.7;
}

/* 地点标签 */
.location-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1rem 0;
  font-size: 1rem;
}

.location-icon-small {
  color: #f44336;
  font-size: 1.2rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  color: #fff;
}

/* 核心哲学语句 */
.hero-core-insight {
  font-size: 1.5rem;
  line-height: 1.8;
  margin: 2rem 0 1rem;
  font-weight: 500;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

/* 支持文本 */
.hero-supporting-text {
  font-size: 1rem;
  line-height: 1.8;
  opacity: 0.95;
  margin-bottom: 2rem;
  color: #fff;
}

/* 操作按钮 */
.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn-primary {
  background: #f44336;
  color: #fff;
  border: none;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

.btn-secondary {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.8);
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

/* 底部描述段落 */
.hero-footer {
  position: relative;
  z-index: 2;
  margin-top: auto;
  padding: 2rem 0 4rem;
  text-align: center;
}

.hero-description {
  font-size: 0.95rem;
  line-height: 1.8;
    opacity: 0.9;
  text-align: justify;
  max-width: 800px;
  margin: 0 auto 2rem;
  padding: 0 2rem;
}

.hero-footer-icons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 0 2rem;
}

.footer-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.chevron-icon {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.notification-icon {
  background: #2196F3;
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: #f44336;
  border-radius: 50%;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
}

/* 脉冲动画 */
.pulsating-animation {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  z-index: 2;
}

.pulsating-animation::before,
.pulsating-animation::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.pulsating-animation::after {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
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

.itinerary-timeline {
  padding: 4rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.day-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.day-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.day-title {
  font-size: 1.8rem;
  margin: 0;
}

.day-date {
  font-size: 0.9rem;
  opacity: 0.7;
}

.day-description {
  font-size: 1rem;
  line-height: 1.8;
  opacity: 0.9;
  margin-bottom: 1.5rem;
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.time-slot {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border-left: 3px solid rgba(255, 255, 255, 0.3);
}

.slot-time {
  font-size: 1.2rem;
  font-weight: 600;
  min-width: 80px;
  color: #4fc3f7;
}

.slot-content {
  flex: 1;
}

.slot-title {
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.slot-location {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.slot-notes {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 0.75rem;
}

.slot-tip {
  background: rgba(255, 235, 59, 0.15);
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.tip-label {
  font-weight: 600;
}

.slot-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.slot-duration,
.slot-cost {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* 旅行建议 */
.recommendations-section {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.recommendation-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.recommendation-card h4 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #4fc3f7;
}

.recommendation-card p {
  line-height: 1.8;
    opacity: 0.9;
}

.recommendation-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendation-card li {
  padding: 0.5rem 0;
  line-height: 1.6;
  opacity: 0.9;
  position: relative;
  padding-left: 1.5rem;
}

.recommendation-card li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4fc3f7;
}

/* 费用总计 */
.cost-section {
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.cost-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cost-card h4 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
    opacity: 0.9;
}

.cost-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #4fc3f7;
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

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .stage-title {
    font-size: 2rem;
  }
  
  .location-map {
    grid-template-columns: 1fr;
  }

  .traveler-profile {
    text-align: center;
  }

  .profile-item {
  flex-direction: column;
  gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
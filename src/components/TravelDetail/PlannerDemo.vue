<template>
  <div class="planner-demo">
    <a-card title="🤖 AI 智能行程生成演示" class="demo-card">
      <div class="demo-content">
        <div class="demo-section">
          <h3>📝 输入你的旅行需求</h3>
          <a-form layout="vertical">
            <a-form-item label="目的地">
              <a-input 
                v-model:value="demoForm.destination" 
                placeholder="例如：日本东京"
                size="large"
              />
            </a-form-item>
            <a-form-item label="行程天数">
              <a-select 
                v-model:value="demoForm.duration" 
                size="large"
                style="width: 100%"
              >
                <a-select-option :value="3">3天</a-select-option>
                <a-select-option :value="5">5天</a-select-option>
                <a-select-option :value="7">7天</a-select-option>
                <a-select-option :value="10">10天</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="预算水平">
              <a-select 
                v-model:value="demoForm.budget" 
                size="large"
                style="width: 100%"
              >
                <a-select-option value="economy">经济型 (1000-3000元/天)</a-select-option>
                <a-select-option value="comfort">舒适型 (3000-6000元/天)</a-select-option>
                <a-select-option value="luxury">豪华型 (6000元+/天)</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="旅行偏好" :rules="[{ required: true, message: '请至少选择一项偏好' }]">
              <a-select 
                v-model:value="demoForm.preferences" 
                mode="multiple"
                size="large"
                style="width: 100%"
                placeholder="选择你的兴趣"
              >
                <a-select-option value="culture">🏛️ 文化历史</a-select-option>
                <a-select-option value="food">🍜 美食体验</a-select-option>
                <a-select-option value="nature">🌲 自然风光</a-select-option>
                <a-select-option value="shopping">🛍️ 购物娱乐</a-select-option>
                <a-select-option value="adventure">🏔️ 冒险探索</a-select-option>
                <a-select-option value="relaxation">🏖️ 休闲放松</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="旅行节奏">
              <a-select 
                v-model:value="demoForm.travelStyle" 
                size="large"
                style="width: 100%"
              >
                <a-select-option value="fast">⚡ 快节奏 - 紧凑安排</a-select-option>
                <a-select-option value="moderate">🚶 中等节奏 - 平衡安排</a-select-option>
                <a-select-option value="slow">🐌 慢节奏 - 悠闲安排</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </div>

        <div class="demo-actions">
          <a-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="generateDemoItinerary"
            class="generate-btn"
          >
            <template #icon>
              <rocket-outlined />
            </template>
            {{ loading ? 'AI 正在生成行程...' : '🚀 生成智能行程' }}
          </a-button>
        </div>

        <!-- AI 生成的行程展示 -->
        <div v-if="generatedItinerary" class="demo-result">
          <a-divider>✨ AI 生成的智能行程</a-divider>
          
          <div class="itinerary-header">
            <h2>{{ generatedItinerary.title }}</h2>
            <div class="itinerary-meta">
              <a-tag color="blue">{{ generatedItinerary.destination }}</a-tag>
              <a-tag color="green">{{ generatedItinerary.duration }}天</a-tag>
              <a-tag color="orange">¥{{ generatedItinerary.totalCost }}</a-tag>
            </div>
            <p class="itinerary-summary">{{ generatedItinerary.summary }}</p>
          </div>

          <div class="itinerary-days">
            <a-timeline>
              <a-timeline-item 
                v-for="(day, index) in generatedItinerary.days" 
                :key="index"
                color="blue"
              >
                <template #dot>
                  <calendar-outlined />
                </template>
                <div class="day-card">
                  <div class="day-header">
                    <h3>{{ day.title }}</h3>
                    <div class="day-stats">
                      <a-statistic 
                        title="时长" 
                        :value="day.stats.duration" 
                        suffix="小时" 
                        size="small"
                      />
                      <a-statistic 
                        title="费用" 
                        :value="day.stats.cost" 
                        prefix="¥" 
                        size="small"
                      />
                    </div>
                  </div>
                  <p class="day-description">{{ day.description }}</p>
                  
                  <div class="time-slots">
                    <div 
                      v-for="(slot, slotIndex) in day.timeSlots" 
                      :key="slotIndex"
                      class="time-slot"
                    >
                      <div class="slot-time">{{ slot.time }}</div>
                      <div class="slot-content">
                        <div class="slot-activity">
                          <span class="activity-icon">{{ slot.icon }}</span>
                          {{ slot.activity }}
                          <a-tag :color="slot.categoryColor" size="small">
                            {{ slot.category }}
                          </a-tag>
                        </div>
                        <div v-if="slot.location" class="slot-location">
                          <environment-outlined /> {{ slot.location }}
                        </div>
                        <div v-if="slot.notes" class="slot-notes">
                          <info-circle-outlined /> {{ slot.notes }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
          </div>

          <!-- AI 洞察和建议 -->
          <div class="ai-insights">
            <a-divider>🧠 AI 智能洞察</a-divider>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-card title="💡 优化建议" size="small">
                  <ul>
                    <li v-for="suggestion in generatedItinerary.aiInsights.optimizationSuggestions" :key="suggestion">
                      {{ suggestion }}
                    </li>
                  </ul>
                </a-card>
              </a-col>
              <a-col :span="12">
                <a-card title="🎯 备选活动" size="small">
                  <ul>
                    <li v-for="activity in generatedItinerary.aiInsights.alternativeActivities" :key="activity">
                      {{ activity }}
                    </li>
                  </ul>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </div>

        <!-- 错误提示 -->
        <a-alert
          v-if="error"
          :message="error"
          type="error"
          show-icon
          closable
          @close="error = null"
          style="margin-top: 1rem"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { useTravelStore } from '@/stores/travel'
// plannerAPI 已删除，使用本地类型定义
interface PlannerItineraryResponse {
  title: string
  destination: string
  duration: number
  totalCost: number
  summary: string
  days: any[]
  recommendations?: any
  aiInsights?: any
}
import { 
  RocketOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'

const travelStore = useTravelStore()

const demoForm = ref({
  destination: '',
  duration: 5,
  budget: 'comfort',
  preferences: [],
  travelStyle: 'moderate'
})

const loading = ref(false)
const error = ref<string | null>(null)
const generatedItinerary = ref<PlannerItineraryResponse | null>(null)

const generateDemoItinerary = async () => {
  if (!demoForm.value.destination) {
    message.warning('请输入目的地')
    return
  }

  if (demoForm.value.preferences.length === 0) {
    message.warning('请至少选择一项旅行偏好')
    return
  }

  loading.value = true
  error.value = null

  try {
    // 设置表单数据到 store
    travelStore.setPlannerData({
      destination: demoForm.value.destination,
      duration: demoForm.value.duration,
      budget: demoForm.value.budget,
      preferences: demoForm.value.preferences,
      travelStyle: demoForm.value.travelStyle
    })

    // 生成行程
    await travelStore.generateItinerary('planner')
    
    // 获取生成的行程数据
    const itinerary = travelStore.plannerItinerary
    if (itinerary) {
      generatedItinerary.value = itinerary
      message.success('AI 智能行程生成成功！')
    } else {
      throw new Error('行程生成失败')
    }
  } catch (err) {
    console.error('生成行程失败:', err)
    error.value = '生成行程失败，请重试'
    message.error('生成行程失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.planner-demo {
  padding: 1rem;
}

.demo-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.demo-content {
  max-width: 1000px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 2rem;
}

.demo-section h3 {
  color: #1890ff;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.demo-actions {
  text-align: center;
  margin: 2rem 0;
}

.generate-btn {
  height: 48px;
  font-size: 1.1rem;
  border-radius: 24px;
  padding: 0 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.demo-result {
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  border-radius: 12px;
  border: 1px solid #d6e4ff;
}

.itinerary-header {
  text-align: center;
  margin-bottom: 2rem;
}

.itinerary-header h2 {
  color: #1890ff;
  margin-bottom: 1rem;
}

.itinerary-meta {
  margin-bottom: 1rem;
}

.itinerary-meta .ant-tag {
  margin: 0 0.5rem;
  font-size: 0.9rem;
}

.itinerary-summary {
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
}

.day-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.day-header h3 {
  margin: 0;
  color: #333;
}

.day-stats {
  display: flex;
  gap: 1rem;
}

.day-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.time-slots {
  border-left: 3px solid #e8f4ff;
  padding-left: 1rem;
}

.time-slot {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.slot-time {
  width: 80px;
  font-weight: 600;
  color: #1890ff;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.slot-content {
  flex: 1;
  margin-left: 1rem;
}

.slot-activity {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.activity-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.slot-location,
.slot-notes {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.ai-insights {
  margin-top: 2rem;
}

.ai-insights ul {
  margin: 0;
  padding-left: 1.2rem;
}

.ai-insights li {
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .day-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .day-stats {
    margin-top: 0.5rem;
  }
  
  .time-slot {
    flex-direction: column;
  }
  
  .slot-time {
    width: auto;
    margin-bottom: 0.5rem;
  }
  
  .slot-content {
    margin-left: 0;
  }
}
</style>

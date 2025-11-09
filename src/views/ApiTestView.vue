<template>
  <div class="api-test-container">
    <!-- 头部 -->
    <div class="header">
      <h1>🧪 API 接口测试页面</h1>
      <p>测试情感旅行API的所有接口功能</p>
    </div>

    <!-- API配置信息 -->
    <a-card class="config-card" title="📡 API 配置信息">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="API Base URL">
          <a-tag color="blue">{{ apiConfig.BASE_URL }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="环境">
          <a-tag color="green">{{ apiConfig.ENVIRONMENT }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="调试模式">
          <a-tag color="orange">{{ apiConfig.DEBUG ? '开启' : '关闭' }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="连接状态">
          <a-space>
            <a-tag :color="connectionStatus.color">{{ connectionStatus.text }}</a-tag>
            <a-button 
              size="small" 
              type="primary" 
              :loading="connectionTestLoading"
              @click="checkConnectionStatus"
            >
              测试连接
            </a-button>
          </a-space>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 测试区域 -->
    <a-row :gutter="[16, 16]">
      <!-- 情感识别测试 -->
      <a-col :xs="24" :lg="12">
        <a-card title="🎭 情感识别测试" class="test-card">
          <a-textarea
            v-model:value="emotionTestInput"
            placeholder="输入你的情感描述，例如：最近工作压力很大，感觉很疲惫"
            :rows="3"
            style="margin-bottom: 16px"
          />
          <a-button
            type="primary"
            :loading="emotionTestLoading"
            @click="testEmotionDetection"
            block
          >
            测试情感识别
          </a-button>
          
          <div v-if="emotionTestResult" class="test-result">
            <a-divider />
            <h4>识别结果：</h4>
            <a-descriptions :column="1" size="small">
              <a-descriptions-item label="情感状态">
                <a-tag :color="getEmotionColor(emotionTestResult.emotion)">
                  {{ emotionTestResult.emotion }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="强度">
                <a-progress :percent="emotionTestResult.intensity * 20" size="small" />
              </a-descriptions-item>
              <a-descriptions-item label="关键词">
                <a-space wrap>
                  <a-tag v-for="keyword in emotionTestResult.metadata.keywords" :key="keyword">
                    {{ keyword }}
                  </a-tag>
                </a-space>
              </a-descriptions-item>
              <a-descriptions-item label="偏好">
                {{ emotionTestResult.metadata.preference }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </a-card>
      </a-col>

      <!-- 目的地匹配测试 -->
      <a-col :xs="24" :lg="12">
        <a-card title="🗺️ 目的地匹配测试" class="test-card">
          <a-space direction="vertical" style="width: 100%">
            <a-select
              v-model:value="destinationTestEmotion"
              placeholder="选择情感状态"
              style="width: 100%"
            >
              <a-select-option value="tired">疲惫</a-select-option>
              <a-select-option value="joyful">快乐</a-select-option>
              <a-select-option value="peaceful">平静</a-select-option>
              <a-select-option value="romantic">浪漫</a-select-option>
              <a-select-option value="adventurous">冒险</a-select-option>
            </a-select>
            
            <a-slider
              v-model:value="destinationTestIntensity"
              :min="1"
              :max="5"
              :marks="{ 1: '1', 3: '3', 5: '5' }"
            />
            <span>情感强度: {{ destinationTestIntensity }}</span>
          </a-space>
          
          <a-button
            type="primary"
            :loading="destinationTestLoading"
            @click="testDestinationMatching"
            block
            style="margin-top: 16px"
          >
            测试目的地匹配
          </a-button>
          
          <div v-if="destinationTestResult" class="test-result">
            <a-divider />
            <h4>匹配结果：</h4>
            <a-list
              :data-source="destinationTestResult"
              size="small"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      {{ item.destination_name }}
                      <a-tag color="green" style="margin-left: 8px">
                        匹配度: {{ Math.round(item.match_score * 100) }}%
                      </a-tag>
                    </template>
                    <template #description>
                      <a-space wrap>
                        <a-tag v-for="tag in item.emotional_tags" :key="tag" size="small">
                          {{ tag }}
                        </a-tag>
                      </a-space>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </a-card>
      </a-col>

      <!-- 叙述生成测试 -->
      <a-col :xs="24" :lg="12">
        <a-card title="📝 情绪化叙述测试" class="test-card">
          <a-space direction="vertical" style="width: 100%">
            <a-select
              v-model:value="narrativeTestEmotion"
              placeholder="选择情感状态"
              style="width: 100%"
            >
              <a-select-option value="romantic">浪漫</a-select-option>
              <a-select-option value="peaceful">平静</a-select-option>
              <a-select-option value="adventurous">冒险</a-select-option>
              <a-select-option value="nostalgic">怀旧</a-select-option>
            </a-select>
            
            <a-select
              v-model:value="narrativeTestTimeContext"
              placeholder="选择时间背景"
              style="width: 100%"
            >
              <a-select-option value="morning">早晨</a-select-option>
              <a-select-option value="afternoon">下午</a-select-option>
              <a-select-option value="evening">傍晚</a-select-option>
            </a-select>
            
            <a-input
              v-model:value="narrativeTestActivity"
              placeholder="输入活动描述"
            />
            
            <a-input
              v-model:value="narrativeTestLocation"
              placeholder="输入地点"
            />
          </a-space>
          
          <a-button
            type="primary"
            :loading="narrativeTestLoading"
            @click="testNarrativeGeneration"
            block
            style="margin-top: 16px"
          >
            测试叙述生成
          </a-button>
          
          <div v-if="narrativeTestResult" class="test-result">
            <a-divider />
            <h4>生成的叙述：</h4>
            <a-card size="small" style="background: #f8f9fa;">
              <p style="margin: 0; font-style: italic;">"{{ narrativeTestResult.narrative }}"</p>
            </a-card>
          </div>
        </a-card>
      </a-col>

      <!-- 旅行计划生成测试 -->
      <a-col :xs="24" :lg="12">
        <a-card title="✈️ 旅行计划生成测试" class="test-card">
          <a-space direction="vertical" style="width: 100%">
            <a-textarea
              v-model:value="planTestInput"
              placeholder="输入你的旅行需求，例如：想要一个浪漫的旅行"
              :rows="2"
            />
            
            <a-row :gutter="8">
              <a-col :span="12">
                <a-input-number
                  v-model:value="planTestDuration"
                  placeholder="天数"
                  :min="1"
                  :max="30"
                  style="width: 100%"
                />
              </a-col>
              <a-col :span="12">
                <a-select
                  v-model:value="planTestBudget"
                  placeholder="预算"
                  style="width: 100%"
                >
                  <a-select-option value="limited">有限</a-select-option>
                  <a-select-option value="comfort">舒适</a-select-option>
                  <a-select-option value="luxury">豪华</a-select-option>
                </a-select>
              </a-col>
            </a-row>
          </a-space>
          
          <a-button
            type="primary"
            :loading="planTestLoading"
            @click="testPlanGeneration"
            block
            style="margin-top: 16px"
          >
            测试计划生成
          </a-button>
          
          <div v-if="planTestResult" class="test-result">
            <a-divider />
            <h4>生成的计划：</h4>
            <a-descriptions :column="1" size="small">
              <a-descriptions-item label="情感分析">
                {{ planTestResult.emotionAnalysis.emotion }} (强度: {{ planTestResult.emotionAnalysis.intensity }})
              </a-descriptions-item>
              <a-descriptions-item label="节奏调整">
                {{ planTestResult.rhythmAdjustment.pattern_name }}
              </a-descriptions-item>
              <a-descriptions-item label="推荐目的地">
                <a-space wrap>
                  <a-tag v-for="rec in planTestResult.recommendations" :key="rec.destination">
                    {{ rec.destination }}
                  </a-tag>
                </a-space>
              </a-descriptions-item>
            </a-descriptions>
            
            <a-card size="small" style="background: #f0f2ff; margin-top: 8px;">
              <p style="margin: 0;">{{ planTestResult.narrative }}</p>
            </a-card>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 测试日志 -->
    <a-card title="📋 测试日志" class="log-card">
      <a-button @click="clearLogs" size="small" style="margin-bottom: 16px">
        清空日志
      </a-button>
      <div class="log-container">
        <div
          v-for="(log, index) in testLogs"
          :key="index"
          :class="['log-item', log.type]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import emotionalTravelAPI from '@/services/emotionalTravelAPI'
import { API_CONFIG } from '@/config/api'

// 配置信息
const apiConfig = computed(() => ({
  BASE_URL: API_CONFIG.BASE_URL,
  ENVIRONMENT: import.meta.env.VITE_APP_ENV,
  DEBUG: import.meta.env.VITE_DEBUG === 'true'
}))

// 连接状态
const connectionStatus = ref({ color: 'default', text: '未检测' })
const connectionTestLoading = ref(false)

// 情感识别测试
const emotionTestInput = ref('最近工作压力很大，感觉很疲惫')
const emotionTestLoading = ref(false)
const emotionTestResult = ref(null)

// 目的地匹配测试
const destinationTestEmotion = ref('tired')
const destinationTestIntensity = ref(3)
const destinationTestLoading = ref(false)
const destinationTestResult = ref([])

// 叙述生成测试
const narrativeTestEmotion = ref('romantic')
const narrativeTestTimeContext = ref('evening')
const narrativeTestActivity = ref('塞纳河游船')
const narrativeTestLocation = ref('巴黎')
const narrativeTestLoading = ref(false)
const narrativeTestResult = ref(null)

// 旅行计划生成测试
const planTestInput = ref('想要一个浪漫的旅行')
const planTestDuration = ref(5)
const planTestBudget = ref('comfort')
const planTestLoading = ref(false)
const planTestResult = ref(null)

// 测试日志
const testLogs = ref([])

// 添加日志
const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  testLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
}

// 清空日志
const clearLogs = () => {
  testLogs.value = []
}

// 获取情感颜色
const getEmotionColor = (emotion: string) => {
  const colors = {
    tired: 'default',
    joyful: 'gold',
    peaceful: 'blue',
    romantic: 'pink',
    adventurous: 'red',
    nostalgic: 'purple'
  }
  return colors[emotion] || 'default'
}

// 测试情感识别
const testEmotionDetection = async () => {
  emotionTestLoading.value = true
  addLog(`开始测试情感识别: "${emotionTestInput.value}"`)
  
  try {
    const response = await emotionalTravelAPI.detectEmotion({
      userInput: emotionTestInput.value
    })
    
    if (response.success) {
      emotionTestResult.value = response.data
      addLog(`情感识别成功: ${response.data.emotion}`, 'success')
      message.success('情感识别测试成功！')
    } else {
      throw new Error(response.message || 'API返回失败')
    }
  } catch (error: any) {
    addLog(`情感识别失败: ${error.message}`, 'error')
    message.error('情感识别测试失败！')
    console.error('Emotion detection test failed:', error)
  } finally {
    emotionTestLoading.value = false
  }
}

// 测试目的地匹配
const testDestinationMatching = async () => {
  destinationTestLoading.value = true
  addLog(`开始测试目的地匹配: ${destinationTestEmotion.value} (强度: ${destinationTestIntensity.value})`)
  
  try {
    const response = await emotionalTravelAPI.matchDestinations(
      destinationTestEmotion.value,
      destinationTestIntensity.value
    )
    
    if (response.success) {
      destinationTestResult.value = response.data
      addLog(`目的地匹配成功: 找到${response.data.length}个匹配项`, 'success')
      message.success('目的地匹配测试成功！')
    } else {
      throw new Error(response.message || 'API返回失败')
    }
  } catch (error: any) {
    addLog(`目的地匹配失败: ${error.message}`, 'error')
    message.error('目的地匹配测试失败！')
    console.error('Destination matching test failed:', error)
  } finally {
    destinationTestLoading.value = false
  }
}

// 测试叙述生成
const testNarrativeGeneration = async () => {
  narrativeTestLoading.value = true
  addLog(`开始测试叙述生成: ${narrativeTestEmotion.value} - ${narrativeTestActivity.value}`)
  
  try {
    const response = await emotionalTravelAPI.generateNarrative({
      emotion: narrativeTestEmotion.value,
      timeContext: narrativeTestTimeContext.value,
      activity: narrativeTestActivity.value,
      location: narrativeTestLocation.value
    })
    
    if (response.success) {
      narrativeTestResult.value = response.data
      addLog(`叙述生成成功`, 'success')
      message.success('叙述生成测试成功！')
    } else {
      throw new Error(response.message || 'API返回失败')
    }
  } catch (error: any) {
    addLog(`叙述生成失败: ${error.message}`, 'error')
    message.error('叙述生成测试失败！')
    console.error('Narrative generation test failed:', error)
  } finally {
    narrativeTestLoading.value = false
  }
}

// 测试旅行计划生成
const testPlanGeneration = async () => {
  planTestLoading.value = true
  addLog(`开始测试旅行计划生成: "${planTestInput.value}"`)
  
  try {
    const response = await emotionalTravelAPI.generateTravelPlan({
      userInput: planTestInput.value,
      preferences: {
        duration: planTestDuration.value,
        budget: planTestBudget.value,
        basePlan: {}
      }
    })
    
    if (response.success) {
      planTestResult.value = response.data
      addLog(`旅行计划生成成功`, 'success')
      message.success('旅行计划生成测试成功！')
    } else {
      throw new Error(response.message || 'API返回失败')
    }
  } catch (error: any) {
    addLog(`旅行计划生成失败: ${error.message}`, 'error')
    message.error('旅行计划生成测试失败！')
    console.error('Travel plan generation test failed:', error)
  } finally {
    planTestLoading.value = false
  }
}

// 检测API连接状态
const checkConnectionStatus = async () => {
  connectionTestLoading.value = true
  addLog('开始检测API连接状态...')
  
  try {
    const response = await emotionalTravelAPI.getEmotionalStates()
    if (response.success) {
      connectionStatus.value = { color: 'green', text: '连接正常' }
      addLog('API连接检测成功', 'success')
      message.success('API连接正常！')
    } else {
      connectionStatus.value = { color: 'red', text: '连接异常' }
      addLog('API连接检测失败', 'error')
      message.error('API连接异常！')
    }
  } catch (error: any) {
    connectionStatus.value = { color: 'red', text: '连接失败' }
    addLog(`API连接检测失败: ${error.message}`, 'error')
    message.error(`API连接失败: ${error.message}`)
  } finally {
    connectionTestLoading.value = false
  }
}

onMounted(() => {
  addLog('API测试页面已加载')
  checkConnectionStatus()
})
</script>

<style scoped>
.api-test-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  overflow-y: auto;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h1 {
  color: #1890ff;
  margin-bottom: 8px;
}

.test-card {
  height: 100%;
}

.test-result {
  margin-top: 16px;
}

.log-card {
  margin-top: 24px;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
}

.log-item {
  display: flex;
  margin-bottom: 4px;
  font-size: 12px;
}

.log-time {
  color: #666;
  margin-right: 8px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-item.success .log-message {
  color: #52c41a;
}

.log-item.error .log-message {
  color: #ff4d4f;
}

.log-item.info .log-message {
  color: #1890ff;
}

.config-card {
  margin-bottom: 24px;
}

/* 滚动优化 */
.api-test-container {
  scroll-behavior: smooth;
}

/* 确保卡片内容不会溢出 */
.test-card {
  overflow: hidden;
}

/* 响应式滚动 */
@media (max-width: 768px) {
  .api-test-container {
    padding: 16px;
  }
  
  .header {
    margin-bottom: 16px;
  }
  
  .config-card {
    margin-bottom: 16px;
  }
}
</style>

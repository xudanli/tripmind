<template>
  <div>
    <h3>{{ t('planner.completeTitle') }}</h3>
    <a-alert v-if="error" :message="error" type="error" show-icon closable @close="travelStore.setError(null)" style="margin-bottom:1rem" />
    <a-alert v-else-if="loading" message="AI 正在为你生成专属行程" description="基于你的需求，我们的 AI 旅行策划师正在为你制定详细的行程安排..." type="info" show-icon style="margin-bottom:1rem" />
    <a-alert v-else :message="t('planner.ready')" :description="t('planner.readyDescription')" type="success" show-icon style="margin-bottom:2rem" />

    <a-card class="summary-card">
      <h4>{{ t('planner.summaryTitle') }}</h4>
      <a-space direction="vertical" style="width:100%">
        <div><strong>目的地：</strong> {{ formData.destination }}</div>
        <div><strong>时长：</strong> {{ formData.duration }} 天</div>
        <div><strong>预算：</strong> {{ formData.budget }}</div>
        <div><strong>偏好：</strong>
          <a-tag v-for="pref in formData.preferences" :key="pref" color="blue">{{ pref }}</a-tag>
        </div>
        <div><strong>节奏：</strong> {{ formData.travelStyle }}</div>
        <div v-if="formData.customRequirements"><strong>自定义要求：</strong> {{ formData.customRequirements }}</div>
      </a-space>
    </a-card>

    <div style="margin-top:1rem; text-align:right">
      <a-button type="primary" size="large" :loading="loading" @click="handleSubmit">{{ loading ? t('common.loading') : t('planner.submit') }}</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useTravelStore } from '@/stores/travel'
import { useTravelListStore } from '@/stores/travelList'
import { createItinerary, convertFrontendDataToCreateRequest } from '@/services/itineraryAPI'

const { t } = useI18n()
const router = useRouter()
const travelStore = useTravelStore()
const travelListStore = useTravelListStore()

const formData = computed(()=> travelStore.plannerData)
const loading = computed(()=> travelStore.loading)
const error = computed(()=> travelStore.error)

const handleSubmit = async () => {
  try {
    console.log('📋 [Planner ConfirmStep] 提交规划请求:', formData.value)
    
    // 步骤 1: 生成行程
    console.log('🚀 [Planner ConfirmStep] 步骤 1/3: 开始生成行程...')
    await travelStore.generateItinerary('planner')
    console.log('✅ [Planner ConfirmStep] 步骤 1/3: 行程生成完成')
    
    // 步骤 2: 获取生成的行程数据
    console.log('📊 [Planner ConfirmStep] 步骤 2/3: 获取生成的行程数据...')
    const itineraryData = travelStore.itineraryData
    const plannerItinerary = travelStore.plannerItinerary
    if (!itineraryData && !plannerItinerary) {
      throw new Error('行程生成失败')
    }
    console.log('✅ [Planner ConfirmStep] 步骤 2/3: 行程数据获取成功', {
      destination: itineraryData?.destination,
      days: itineraryData?.days?.length || 0
    })
    
    // 步骤 3: 保存行程到后端数据库
    console.log('💾 [Planner ConfirmStep] 步骤 3/4: 保存行程到后端数据库...')
    let backendItineraryId: string | undefined
    try {
      if (itineraryData) {
        // 将前端数据转换为创建行程的API请求格式
        const createRequest = convertFrontendDataToCreateRequest(
          itineraryData as any,
          formData.value.destination,
          formData.value.startDate || new Date().toISOString().split('T')[0],
          formData.value.preferences ? {
            budget: formData.value.budget as any,
            travelStyle: formData.value.travelStyle as any
          } : undefined,
          'draft', // 默认保存为草稿状态
          'planner' // 模式标识
        )
        
        console.log('📤 [Planner ConfirmStep] 创建行程请求数据:', {
          destination: createRequest.destination,
          daysCount: createRequest.days,
          startDate: createRequest.startDate
        })
        
        // 调用创建行程接口
        const backendItinerary = await createItinerary(createRequest)
        backendItineraryId = backendItinerary.id
        console.log('✅ [Planner ConfirmStep] 步骤 3/4: 行程已保存到后端', {
          id: backendItineraryId,
          destination: backendItinerary.destination
        })
        message.success('行程已保存到数据库')
      } else {
        console.warn('⚠️ [Planner ConfirmStep] 没有 itineraryData，跳过保存到后端')
      }
    } catch (err: any) {
      console.error('❌ [Planner ConfirmStep] 步骤 3/4: 保存到后端失败', {
        error: err.message,
        stack: err.stack
      })
      message.warning('保存到数据库失败，已保存到本地。错误：' + (err.message || '未知错误'))
      // 保存到后端失败不影响整体流程，继续使用本地存储
    }
    
    // 步骤 4: 创建 Travel 并保存到本地列表
    console.log('💾 [Planner ConfirmStep] 步骤 4/4: 创建 Travel 并保存到本地列表...')
    const travelData: any = {
      // 保存后端行程ID（如果创建成功）
      backendItineraryId: backendItineraryId,
      // 保存行程数据
      itineraryData: itineraryData,
      plannerItinerary: plannerItinerary
    }
    
    const newTravel = travelListStore.createTravel({
      title: `${formData.value.destination}之旅`,
      location: formData.value.destination,
      description: `精心安排的${formData.value.duration}天${formData.value.destination}之旅`,
      mode: 'planner',
      status: 'active',
      duration: formData.value.duration,
      participants: 1,
      budget: itineraryData?.totalCost || 0,
      data: travelData
    })
    
    console.log('✅ [Planner ConfirmStep] 步骤 4/4: Travel 创建成功', {
      id: newTravel.id,
      title: newTravel.title,
      mode: newTravel.mode,
      backendItineraryId: backendItineraryId
    })
    
    console.log('🎉 [Planner ConfirmStep] 所有步骤完成，准备跳转到详情页')
    message.success('行程生成成功！')
    router.push(`/travel/${newTravel.id}`)
  } catch (err: any) {
    console.error('❌ [Planner ConfirmStep] 生成行程失败:', err)
    message.error('生成行程失败，请重试: ' + (err.message || '未知错误'))
  }
}
</script>


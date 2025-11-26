<template>
  <a-card :title="t('travelDetail.budgetManagement') || t('travelDetail.budget') || '预算管理'" class="sidebar-card" :bordered="false">
    <div class="budget-section">
      <a-progress 
        :percent="budgetPercent" 
        :show-info="true"
        :stroke-color="budgetColor"
        :status="budgetStatus"
      />
      <div class="budget-info">
        <div class="budget-item">
          <span class="budget-label">{{ t('travelDetail.budgetSpent') || '已花费' }}:</span>
          <span class="budget-value spent">{{ formatAmount(totalSpent) }}</span>
        </div>
        <div class="budget-item" v-if="activityCosts > 0">
          <span class="budget-label">{{ t('travelDetail.activityCosts') || '活动费用' }}:</span>
          <span class="budget-value activity">{{ formatAmount(activityCosts) }}</span>
        </div>
        <div class="budget-item">
          <span class="budget-label">{{ t('travelDetail.budgetTotal') || '总预算' }}:</span>
          <span class="budget-value total">{{ formatAmount(total) }}</span>
        </div>
        <div class="budget-item">
          <span class="budget-label">{{ t('travelDetail.budgetRemaining') || '剩余' }}:</span>
          <span class="budget-value remaining" :class="{ 'warning': remaining < total * 0.2 }">
            {{ formatAmount(remaining) }}
          </span>
        </div>
        <div class="budget-currency-info">
          <a-tag size="small" color="blue">{{ getDestinationCurrency.name }} ({{ getDestinationCurrency.code }})</a-tag>
        </div>
      </div>
      
      <div class="budget-actions">
        <a-button type="primary" block @click="showEditBudgetModal = true">
          <template #icon>
            <edit-outlined />
          </template>
          {{ t('travelDetail.editBudget') || '编辑预算' }}
        </a-button>
        <a-button type="default" block style="margin-top: 0.5rem" @click="handleAddExpense">
          <template #icon>
            <plus-outlined />
          </template>
          {{ t('travelDetail.addExpense') || '添加支出' }}
        </a-button>
      </div>
      
      <!-- 支出明细列表 -->
      <div class="expense-list">
        <div class="expense-list-header">
          <span class="expense-list-title">{{ t('travelDetail.expenseDetails') || '支出明细' }}</span>
          <span class="expense-count">({{ expenses.length }})</span>
        </div>
        <div v-if="expenses.length === 0" class="expense-empty">
          <file-text-outlined :style="{ fontSize: '32px', color: '#ccc' }" />
          <p>{{ t('travelDetail.noExpenses') || '暂无支出记录' }}</p>
        </div>
        <a-list v-else :dataSource="sortedExpenses" size="small" :bordered="false">
          <template #renderItem="{ item }">
            <a-list-item class="expense-item">
              <template #actions>
                <a-button type="text" size="small" @click="editExpense(item)">
                  <edit-outlined />
                </a-button>
                <a-button type="text" size="small" danger @click="deleteExpense(item.id)">
                  <delete-outlined />
                </a-button>
              </template>
              <a-list-item-meta>
                <template #title>
                  <div class="expense-title">{{ item.title }}</div>
                </template>
                <template #description>
                  <div class="expense-meta">
                    <span class="expense-date">{{ formatDate(item.date) }}</span>
                    <a-tag v-if="item.category" size="small" :color="getCategoryColor(item.category)">
                      {{ item.category }}
                    </a-tag>
                    <span v-if="item.location" class="expense-location">
                      <environment-outlined /> {{ item.location }}
                    </span>
                    <span v-if="item.payerName" class="expense-payer">
                      <user-outlined /> {{ item.payerName }}
                    </span>
                  </div>
                </template>
              </a-list-item-meta>
              <div class="expense-amount">
                {{ item.currencyCode && item.currencyCode !== getDestinationCurrency.code
                  ? formatCurrency(item.amount, getCurrencyByCode(item.currencyCode) || getDestinationCurrency)
                  : formatAmount(item.amount)
                }}
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
      
      <a-alert 
        v-if="budgetPercent >= 80"
        :message="t('travelDetail.budgetWarning') || '预算预警'"
        :description="budgetPercent >= 100 
          ? (t('travelDetail.budgetExceeded') || '预算已超支，请注意控制花费') 
          : (t('travelDetail.budgetWarningDesc', { percent: budgetPercent }) || `预算已使用${budgetPercent}%，请注意控制花费`)"
        :type="budgetPercent >= 100 ? 'error' : 'warning'"
        style="margin-top: 1rem"
        show-icon
      />
    </div>
    
    <!-- 编辑预算模态框 -->
    <a-modal
      v-model:open="showEditBudgetModal"
      :title="t('travelDetail.editBudget') || '编辑预算'"
      @ok="handleSaveBudget"
      :ok-text="t('common.confirm') || '确定'"
      :cancel-text="t('common.cancel') || '取消'"
    >
      <a-form :model="budgetForm" layout="vertical">
        <a-form-item :label="t('travelDetail.budgetTotal') || '总预算'">
          <a-input-number
            v-model:value="budgetForm.total"
            :min="0"
            :precision="0"
            style="width: 100%"
            :placeholder="t('travelDetail.budgetTotalPlaceholder') || '请输入总预算'"
          >
            <template #addonBefore>{{ getDestinationCurrency.symbol }}</template>
          </a-input-number>
          <div class="form-item-hint">
            {{ t('travelDetail.currencyHint') || `使用${getDestinationCurrency.name}记录` }}
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加/编辑支出模态框 -->
    <a-modal
      v-model:open="showAddExpenseModal"
      :title="editingExpense ? (t('travelDetail.editExpense') || '编辑支出') : (t('travelDetail.addExpense') || '添加支出')"
      @ok="handleSaveExpense"
      @cancel="handleCancelExpense"
      :ok-text="t('common.confirm') || '确定'"
      :cancel-text="t('common.cancel') || '取消'"
    >
      <a-form :model="expenseForm" layout="vertical">
        <a-form-item :label="t('travelDetail.expenseTitle') || '支出名称'" required>
          <a-input
            v-model:value="expenseForm.title"
            :placeholder="t('travelDetail.expenseTitlePlaceholder') || '例如：机票、酒店、餐饮等'"
          />
        </a-form-item>
        <a-form-item :label="t('travelDetail.expenseAmount') || '金额'" required>
          <a-row :gutter="8">
            <a-col :span="8">
              <a-select
                v-model:value="expenseForm.currencyCode"
                :placeholder="t('travelDetail.expenseCurrency') || '货币'"
                style="width: 100%"
              >
                <a-select-option
                  v-for="currency in allCurrencies"
                  :key="currency.code"
                  :value="currency.code"
                >
                  {{ currency.symbol }} {{ currency.code }}
                </a-select-option>
              </a-select>
            </a-col>
            <a-col :span="16">
              <a-input-number
                v-model:value="expenseForm.amount"
                :min="0"
                :precision="2"
                style="width: 100%"
                :placeholder="t('travelDetail.expenseAmountPlaceholder') || '请输入金额'"
              >
                <template #addonBefore>{{ selectedCurrency.symbol }}</template>
              </a-input-number>
            </a-col>
          </a-row>
          <div class="form-item-hint">
            {{ t('travelDetail.currencyHint') || `使用${selectedCurrency.name}记录` }}
          </div>
        </a-form-item>
        <a-form-item :label="t('travelDetail.expenseCategory') || '分类'">
          <a-select
            v-model:value="expenseForm.category"
            :placeholder="t('travelDetail.expenseCategoryPlaceholder') || '选择分类'"
            allow-clear
          >
            <a-select-option value="交通">交通</a-select-option>
            <a-select-option value="住宿">住宿</a-select-option>
            <a-select-option value="餐饮">餐饮</a-select-option>
            <a-select-option value="景点">景点</a-select-option>
            <a-select-option value="购物">购物</a-select-option>
            <a-select-option value="其他">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('travelDetail.expenseLocation') || '位置/商家'">
          <a-input
            v-model:value="expenseForm.location"
            :placeholder="t('travelDetail.expenseLocationPlaceholder') || '例如：Leonards Bakery'"
            :prefix="h(EnvironmentOutlined)"
          />
        </a-form-item>
        <a-form-item :label="t('travelDetail.expensePayer') || '付款人'">
          <a-select
            v-model:value="expenseForm.payerId"
            :placeholder="members.length === 0 ? (t('travelDetail.noMembers') || '暂无成员，请先添加旅伴') : (t('travelDetail.expensePayerPlaceholder') || '选择付款人')"
            allow-clear
            @change="handlePayerChange"
            :loading="members.length === 0"
            :disabled="members.length === 0"
          >
            <a-select-option
              v-for="member in members"
              :key="member.id"
              :value="member.id"
            >
              {{ member.name }}
              <a-tag v-if="member.role === 'owner'" color="gold" size="small" style="margin-left: 8px">
                {{ t('travelDetail.memberManagement.owner') || '所有者' }}
              </a-tag>
              <a-tag v-else-if="member.role === 'admin'" color="blue" size="small" style="margin-left: 8px">
                {{ t('travelDetail.memberManagement.admin') || '管理员' }}
              </a-tag>
            </a-select-option>
          </a-select>
          <div v-if="members.length === 0" class="form-item-hint" style="color: #999; font-size: 12px; margin-top: 4px;">
            {{ t('travelDetail.noMembersHint') || '请先在"旅伴"标签页添加成员' }}
          </div>
        </a-form-item>
        <a-form-item :label="t('travelDetail.expenseSplit') || '分摊'">
          <a-select
            v-model:value="expenseForm.splitType"
            :placeholder="t('travelDetail.expenseSplitPlaceholder') || '选择分摊方式'"
          >
            <a-select-option value="none">{{ t('travelDetail.expenseSplitNone') || '不分摊' }}</a-select-option>
            <a-select-option value="equal">{{ t('travelDetail.expenseSplitEqual') || '平均分摊' }}</a-select-option>
            <a-select-option value="custom">{{ t('travelDetail.expenseSplitCustom') || '自定义分摊' }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          v-if="expenseForm.splitType === 'custom'"
          :label="t('travelDetail.expenseSplitDetails') || '分摊详情'"
        >
          <div class="split-details">
            <div
              v-for="member in members"
              :key="member.id"
              class="split-item"
            >
              <span class="split-member">{{ member.name }}</span>
              <a-input-number
                v-model:value="expenseForm.splitDetails[member.id]"
                :min="0"
                :precision="2"
                style="width: 120px"
                :placeholder="t('travelDetail.expenseSplitAmount') || '金额'"
              >
                <template #addonBefore>{{ selectedCurrency.symbol }}</template>
              </a-input-number>
            </div>
          </div>
          <div v-if="splitTotalMismatch" class="split-error">
            {{ t('travelDetail.expenseSplitMismatch') || '分摊总额与费用金额不一致' }}
          </div>
        </a-form-item>
        <a-form-item :label="t('travelDetail.expenseDate') || '日期'">
          <a-date-picker
            v-model:value="expenseForm.date"
            style="width: 100%"
            format="YYYY-MM-DD"
            :placeholder="t('travelDetail.expenseDatePlaceholder') || '选择日期（可选）'"
          />
        </a-form-item>
        <a-form-item :label="t('travelDetail.expenseNotes') || '备注'">
          <a-textarea
            v-model:value="expenseForm.notes"
            :rows="3"
            :placeholder="t('travelDetail.expenseNotesPlaceholder') || '备注信息（可选）'"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { EditOutlined, PlusOutlined, DeleteOutlined, FileTextOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useTravelListStore } from '@/stores/travelList'
import { useTravelStore } from '@/stores/travel'
import { useUserStore } from '@/stores/user'
import { message, Modal } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { getCurrencyForDestination, formatCurrency, getAllCurrencies, getCurrencyByCode, type CurrencyInfo } from '@/utils/currency'
import { PRESET_COUNTRIES } from '@/constants/countries'
import { getExpenses, createExpense, updateExpense, deleteExpense as deleteExpenseAPI, type Expense as APIExpense, getMembers, type Member as APIMember } from '@/services/itineraryAPI'
// 使用原生Date处理日期，避免依赖dayjs
const formatDateSimple = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

const getTodayDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface Expense {
  id: string
  title: string
  amount: number
  currencyCode?: string // 货币代码
  category?: string
  location?: string // 位置/商家
  payerId?: string // 付款人ID
  payerName?: string // 付款人名称（用于显示）
  splitType?: 'none' | 'equal' | 'custom' // 分摊方式
  splitDetails?: Record<string, number> // 自定义分摊详情
  date: string
  notes?: string
  createdAt: number
}

interface Props {
  travelId?: string
  initialSpent?: number
  initialTotal?: number
}

const props = withDefaults(defineProps<Props>(), {
  travelId: '',
  initialSpent: 0,
  initialTotal: 0
})

const { t } = useI18n()
const travelListStore = useTravelListStore()
const travelStore = useTravelStore()
const userStore = useUserStore()

const total = ref(props.initialTotal || 0)
const expenses = ref<Expense[]>([])
const showEditBudgetModal = ref(false)
const showAddExpenseModal = ref(false)
const editingExpense = ref<Expense | null>(null)

const budgetForm = ref({
  total: props.initialTotal || 0
})

// 成员列表（用于付款人选择，从后端加载）
const members = ref<Array<{ id: string; name: string; email?: string; role: string }>>([])

// 加载成员列表
const loadMembers = async () => {
  if (!props.travelId) {
    members.value = []
    return
  }
  
  const travel = travelListStore.getTravel(props.travelId)
  const backendItineraryId = travel?.data?.backendItineraryId
  
  if (!backendItineraryId) {
    console.warn('[BudgetManager] 未找到 backendItineraryId，无法加载成员数据')
    members.value = []
    return
  }
  
  try {
    let apiMembers = await getMembers(backendItineraryId)
    
    // 检查是否已有 owner 角色成员
    const hasOwner = apiMembers.some(m => m.role === 'owner')
    
    // 如果后端返回空列表或没有 owner，确保至少包含创建者（owner）
    if (apiMembers.length === 0 || !hasOwner) {
      console.log('[BudgetManager] 后端成员列表为空或缺少 owner，添加创建者')
      const currentUser = userStore.user
      if (currentUser) {
        // 生成临时成员ID（基于行程ID和用户ID）
        const ownerId = `owner_${backendItineraryId}_${currentUser.id || 'default'}`
        const ownerMember: APIMember = {
          id: ownerId,
          name: currentUser.name || currentUser.nickname || currentUser.email || '我',
          email: currentUser.email,
          role: 'owner' as const,
          userId: currentUser.id,
          createdAt: travel?.createdAt || new Date().toISOString(),
          updatedAt: travel?.updatedAt || new Date().toISOString()
        }
        
        // 如果列表为空，直接添加；如果已有成员但缺少 owner，添加到开头
        if (apiMembers.length === 0) {
          apiMembers = [ownerMember]
        } else {
          apiMembers.unshift(ownerMember)
        }
      }
    }
    
    members.value = apiMembers.map((member: APIMember) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role
    }))
    console.log('[BudgetManager] 加载成员列表成功:', members.value.length)
    
    // 如果当前选择的付款人是 'current_user'，更新为实际的成员 ID
    if (expenseForm.value.payerId === 'current_user' && members.value.length > 0) {
      const defaultMember = currentUserMember.value
      expenseForm.value.payerId = defaultMember.id
      expenseForm.value.payerName = defaultMember.name
    }
  } catch (error: any) {
    console.warn('[BudgetManager] 加载成员列表失败，使用空列表:', error.message)
    members.value = []
  }
}

// 获取当前用户对应的成员（用于默认付款人）
const currentUserMember = computed(() => {
  if (members.value.length === 0) {
    return { id: 'current_user', name: '您' }
  }
  
  // 优先查找 owner 角色
  const owner = members.value.find(m => m.role === 'owner')
  if (owner) {
    return { id: owner.id, name: owner.name }
  }
  
  // 如果没有 owner，返回第一个成员
  return { id: members.value[0].id, name: members.value[0].name }
})

const expenseForm = ref({
  title: '',
  amount: 0,
  currencyCode: '', // 货币代码，默认使用目的地货币
  category: '',
  location: '', // 位置/商家
  payerId: 'current_user', // 付款人ID，默认当前用户
  payerName: '您', // 付款人名称，默认当前用户
  splitType: 'none' as 'none' | 'equal' | 'custom', // 分摊方式
  splitDetails: {} as Record<string, number>, // 自定义分摊详情
  date: null as Dayjs | null, // 使用dayjs日期对象
  notes: ''
})

// 所有可用货币列表
const allCurrencies = getAllCurrencies()

// 当前选择的货币
const selectedCurrency = computed((): CurrencyInfo => {
  if (expenseForm.value.currencyCode) {
    const currency = getCurrencyByCode(expenseForm.value.currencyCode)
    if (currency) return currency
  }
  return getDestinationCurrency.value
})

// 从左侧行程数据中提取活动费用
const extractCostsFromItinerary = () => {
  if (!props.travelId) return 0
  
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) return 0
  
  let totalCost = 0
  
  // 优先从 data.itineraryData.days 中提取（后端数据）
  const itineraryData = travel.data?.itineraryData
  if (itineraryData?.days && Array.isArray(itineraryData.days)) {
    itineraryData.days.forEach((day: any) => {
      if (day.timeSlots && Array.isArray(day.timeSlots)) {
        day.timeSlots.forEach((slot: any) => {
          // 支持多种费用字段
          if (typeof slot.cost === 'number' && slot.cost > 0) {
            totalCost += slot.cost
          } else if (slot.details?.pricing?.general && typeof slot.details.pricing.general === 'number') {
            totalCost += slot.details.pricing.general
          } else if (typeof slot.estimatedCost === 'number' && slot.estimatedCost > 0) {
            totalCost += slot.estimatedCost
          }
        })
      }
    })
  }
  
  // 如果没有从 itineraryData 获取到数据，尝试从 data.days 获取
  if (totalCost === 0 && travel.data?.days && Array.isArray(travel.data.days)) {
    travel.data.days.forEach((day: any) => {
      if (day.timeSlots && Array.isArray(day.timeSlots)) {
        day.timeSlots.forEach((slot: any) => {
          if (typeof slot.cost === 'number' && slot.cost > 0) {
            totalCost += slot.cost
          } else if (slot.details?.pricing?.general && typeof slot.details.pricing.general === 'number') {
            totalCost += slot.details.pricing.general
          } else if (typeof slot.estimatedCost === 'number' && slot.estimatedCost > 0) {
            totalCost += slot.estimatedCost
          }
        })
      }
    })
  }
  
  // 从Planner模式的行程数据中提取
  if (totalCost === 0 && travel.mode === 'planner') {
    const plannerItinerary = travel.data?.plannerItinerary || (travelStore as any).plannerItinerary
    if (plannerItinerary?.days) {
      plannerItinerary.days.forEach((day: any) => {
        // 优先使用day.stats.cost（这是每日汇总的费用）
        if (day.stats?.cost && typeof day.stats.cost === 'number') {
          totalCost += day.stats.cost
        } else if (day.timeSlots) {
          // 如果没有每日汇总，则从timeSlots中提取
          day.timeSlots.forEach((slot: any) => {
            if (typeof slot.estimatedCost === 'number' && slot.estimatedCost > 0) {
              totalCost += slot.estimatedCost
            } else if (typeof slot.cost === 'number' && slot.cost > 0) {
              totalCost += slot.cost
            }
          })
        }
      })
    }
    // 如果行程有总费用，使用总费用（避免重复计算）
    if (plannerItinerary?.totalCost && typeof plannerItinerary.totalCost === 'number') {
      totalCost = plannerItinerary.totalCost
    }
  }
  
  // 如果 itineraryData 有总费用字段，也考虑使用（但优先使用计算值）
  if (itineraryData?.totalCost && typeof itineraryData.totalCost === 'number' && totalCost === 0) {
    totalCost = itineraryData.totalCost
  }
  
  return totalCost
}

// 计算活动费用总和（用于显示和联动）
const activityCosts = computed(() => {
  return extractCostsFromItinerary()
})

// 计算总支出（手动添加的支出 + 活动费用）
const totalSpent = computed(() => {
  const manualExpenses = expenses.value.reduce((sum, exp) => sum + exp.amount, 0)
  const activityCostsValue = activityCosts.value
  return manualExpenses + activityCostsValue
})

// 按日期排序的支出列表
const sortedExpenses = computed(() => {
  return [...expenses.value].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime() // 最新的在前
  })
})

// 计算剩余预算
const remaining = computed(() => {
  return Math.max(0, total.value - totalSpent.value)
})

// 计算预算百分比
const budgetPercent = computed(() => {
  if (total.value === 0) return 0
  return Math.min(100, Math.round((totalSpent.value / total.value) * 100))
})

// 预算颜色
const budgetColor = computed(() => {
  const percent = budgetPercent.value
  if (percent < 50) return '#52c41a'
  if (percent < 80) return '#faad14'
  return '#ff4d4f'
})

// 预算状态
const budgetStatus = computed(() => {
  if (budgetPercent.value >= 100) return 'exception'
  if (budgetPercent.value >= 80) return 'active'
  return 'success'
})

// 提取目的地国家代码（与TravelDetailView中的逻辑一致）
const extractDestinationCountry = () => {
  if (!props.travelId) return null
  
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) return null
  
  const data = travel.data as any
  
  // 1. 从 location 字段提取
  if (travel.location) {
    for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
      if (travel.location.includes(country.name) || travel.location.includes(code)) {
        return code
      }
    }
  }
  
  // 2. 从 destination 字段提取
  if (travel.destination) {
    for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
      if (travel.destination.includes(country.name) || travel.destination.includes(code)) {
        return code
      }
    }
  }
  
  // 3. 从 itineraryData 或 plannerItinerary 中提取
  if (data?.itineraryData?.destination) {
    const destStr = data.itineraryData.destination
    for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
      if (destStr.includes(country.name) || destStr.includes(code)) {
        return code
      }
    }
  }
  
  // 4. 从 days 数组中的 locations 提取
  if (data?.days && Array.isArray(data.days)) {
    for (const day of data.days) {
      if (day.location) {
        const locStr = day.location
        for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
          if (locStr.includes(country.name) || locStr.includes(code)) {
            return code
          }
        }
      }
    }
  }
  
  return null
}

// 获取目的地货币信息
const getDestinationCurrency = computed((): CurrencyInfo => {
  if (!props.travelId) {
    return { code: 'CNY', symbol: '¥', name: '人民币' }
  }
  
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) {
    return { code: 'CNY', symbol: '¥', name: '人民币' }
  }
  
  // 1. 优先从国家代码获取（最准确）
  const countryCode = extractDestinationCountry()
  if (countryCode && PRESET_COUNTRIES[countryCode]) {
    const country = PRESET_COUNTRIES[countryCode]
    return getCurrencyForDestination(country.name)
  }
  
  // 2. 从location字段获取
  if (travel.location) {
    const currency = getCurrencyForDestination(travel.location)
    if (currency.code !== 'CNY') {
      return currency
    }
  }
  
  // 3. 从destination字段获取
  const destination = (travel.data as any)?.destination || 
                     (travel.data as any)?.selectedLocation ||
                     travel.location ||
                     travel.destination
  
  if (destination) {
    const currency = getCurrencyForDestination(destination)
    if (currency.code !== 'CNY') {
      return currency
    }
  }
  
  // 默认返回人民币
  return { code: 'CNY', symbol: '¥', name: '人民币' }
})

// 格式化金额（使用目的地货币）
const formatAmount = (amount: number) => {
  return formatCurrency(amount, getDestinationCurrency.value)
}

// 计算分摊总额
const splitTotal = computed(() => {
  if (expenseForm.value.splitType !== 'custom') return 0
  return Object.values(expenseForm.value.splitDetails || {}).reduce((sum, val) => sum + (val || 0), 0)
})

// 检查分摊总额是否匹配
const splitTotalMismatch = computed(() => {
  if (expenseForm.value.splitType !== 'custom' || !expenseForm.value.amount) return false
  return Math.abs(splitTotal.value - expenseForm.value.amount) > 0.01
})

// 处理付款人变化
const handlePayerChange = (payerId: string) => {
  if (!payerId) {
    expenseForm.value.payerName = ''
    return
  }
  
  const member = members.value.find(m => m.id === payerId)
  if (member) {
    expenseForm.value.payerName = member.name
  } else {
    expenseForm.value.payerName = ''
  }
}

// 打开添加费用模态框
const handleAddExpense = async () => {
  // 确保成员列表已加载
  if (members.value.length === 0 && props.travelId) {
    await loadMembers()
  }
  
  // 重置表单并设置默认值
  const defaultPayer = currentUserMember.value
  expenseForm.value = {
    title: '',
    amount: 0,
    currencyCode: getDestinationCurrency.value.code, // 默认使用目的地货币
    category: '',
    location: '',
    payerId: defaultPayer.id,
    payerName: defaultPayer.name,
    splitType: 'none',
    splitDetails: {},
    date: dayjs(), // 默认今天
    notes: ''
  }
  editingExpense.value = null
  showAddExpenseModal.value = true
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return formatDateSimple(dateStr)
}

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    '交通': 'blue',
    '住宿': 'purple',
    '餐饮': 'orange',
    '景点': 'green',
    '购物': 'pink',
    '其他': 'default'
  }
  return colorMap[category] || 'default'
}

// 加载预算和支出数据
const loadData = async () => {
  if (!props.travelId) return
  
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) return
  
  // 计算活动费用
  const activityCostsValue = extractCostsFromItinerary()
  
  // 如果总预算未设置（为0），且活动费用大于0，则自动设置为活动费用
  if ((!travel.budget || travel.budget === 0) && activityCostsValue > 0) {
    total.value = activityCostsValue
    budgetForm.value.total = activityCostsValue
    // 自动保存到store
    travelListStore.updateTravel(props.travelId, {
      budget: activityCostsValue
    })
    console.log('[BudgetManager] 自动设置总预算为活动费用总和:', activityCostsValue)
  } else {
    total.value = travel.budget || 0
    budgetForm.value.total = travel.budget || 0
  }
  
  // 必须从后端加载支出数据
  const backendItineraryId = travel.data?.backendItineraryId
  if (!backendItineraryId) {
    console.warn('[BudgetManager] 未找到 backendItineraryId，无法加载支出数据')
    expenses.value = []
    return
  }
  
  try {
    console.log('[BudgetManager] 从后端加载支出数据:', backendItineraryId)
    const result = await getExpenses(backendItineraryId)
    if (result.success && result.data) {
      // 转换后端数据格式到前端格式
      expenses.value = result.data.map(exp => ({
        id: exp.id,
        title: exp.title,
        amount: exp.amount,
        currencyCode: exp.currencyCode,
        category: exp.category,
        location: exp.location,
        payerId: exp.payerId,
        payerName: exp.payerName,
        splitType: exp.splitType,
        splitDetails: exp.splitDetails || undefined,
        date: exp.date,
        notes: exp.notes,
        createdAt: new Date(exp.createdAt).getTime()
      }))
      console.log('[BudgetManager] 从后端加载支出数据成功:', expenses.value.length)
    } else {
      expenses.value = []
    }
  } catch (error: any) {
    console.error('[BudgetManager] 从后端加载支出数据失败:', error)
    message.error(error.message || (t('travelDetail.expenseLoadFailed') || '加载支出数据失败'))
    expenses.value = []
  }
}

// 保存预算
const handleSaveBudget = () => {
  if (budgetForm.value.total < 0) {
    message.error(t('travelDetail.budgetInvalid') || '预算金额不能为负数')
    return
  }
  
  total.value = budgetForm.value.total
  
  // 保存到store
  if (props.travelId) {
    travelListStore.updateTravel(props.travelId, {
      budget: budgetForm.value.total
    })
    message.success(t('travelDetail.budgetSaved') || '预算已更新')
  }
  
  showEditBudgetModal.value = false
}

// 保存支出
const handleSaveExpense = async () => {
  if (!expenseForm.value.title || !expenseForm.value.amount || expenseForm.value.amount <= 0) {
    message.error(t('travelDetail.expenseInvalid') || '请填写完整的支出信息')
    return
  }
  
  // 检查自定义分摊总额
  if (expenseForm.value.splitType === 'custom' && splitTotalMismatch.value) {
    message.error(t('travelDetail.expenseSplitMismatch') || '分摊总额与费用金额不一致')
    return
  }
  
  // 转换日期格式
  const dateStr = expenseForm.value.date 
    ? expenseForm.value.date.format('YYYY-MM-DD')
    : getTodayDate()
  
  const travel = props.travelId ? travelListStore.getTravel(props.travelId) : null
  const backendItineraryId = travel?.data?.backendItineraryId
  
  if (!backendItineraryId) {
    message.error(t('travelDetail.noBackendItineraryId') || '无法保存支出：缺少行程ID')
    return
  }
  
  try {
    if (editingExpense.value) {
      // 编辑支出
      if (!editingExpense.value.id) {
        message.error(t('travelDetail.expenseIdMissing') || '支出ID缺失')
        return
      }
      
      // 构建更新数据，确保类型正确并清理空值
      const updateRequest: any = {
        title: expenseForm.value.title,
        amount: Number(expenseForm.value.amount), // 确保是数字类型
        date: dateStr
      }
      
      // 只添加有值的可选字段
      if (expenseForm.value.currencyCode || getDestinationCurrency.value.code) {
        updateRequest.currencyCode = expenseForm.value.currencyCode || getDestinationCurrency.value.code
      }
      if (expenseForm.value.category) {
        updateRequest.category = expenseForm.value.category
      }
      if (expenseForm.value.location) {
        updateRequest.location = expenseForm.value.location
      }
      
      // 处理付款人信息：如果 payerId 是临时生成的（以 owner_ 开头），只发送 payerName
      if (expenseForm.value.payerId) {
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(expenseForm.value.payerId)
        if (isValidUUID) {
          updateRequest.payerId = expenseForm.value.payerId
        }
      }
      if (expenseForm.value.payerName) {
        updateRequest.payerName = expenseForm.value.payerName
      }
      if (expenseForm.value.splitType && expenseForm.value.splitType !== 'none') {
        updateRequest.splitType = expenseForm.value.splitType
        if (expenseForm.value.splitType === 'custom' && expenseForm.value.splitDetails) {
          updateRequest.splitDetails = expenseForm.value.splitDetails
        }
      }
      if (expenseForm.value.notes) {
        updateRequest.notes = expenseForm.value.notes
      }
      
      const updatedExpense = await updateExpense(backendItineraryId, editingExpense.value.id, updateRequest)
      
      // 更新本地显示数据
      const index = expenses.value.findIndex(e => e.id === editingExpense.value!.id)
      if (index !== -1) {
        expenses.value[index] = {
          id: updatedExpense.id,
          title: updatedExpense.title,
          amount: updatedExpense.amount,
          currencyCode: updatedExpense.currencyCode,
          category: updatedExpense.category,
          location: updatedExpense.location,
          payerId: updatedExpense.payerId,
          payerName: updatedExpense.payerName,
          splitType: updatedExpense.splitType,
          splitDetails: updatedExpense.splitDetails || undefined,
          date: updatedExpense.date,
          notes: updatedExpense.notes,
          createdAt: new Date(updatedExpense.createdAt).getTime()
        }
      }
      message.success(t('travelDetail.expenseUpdated') || '支出已更新')
    } else {
      // 添加新支出
      // 构建请求数据，确保类型正确并清理空值
      const expenseRequest: any = {
        title: expenseForm.value.title,
        amount: Number(expenseForm.value.amount), // 确保是数字类型
        date: dateStr
      }
      
      // 只添加有值的可选字段
      if (expenseForm.value.currencyCode || getDestinationCurrency.value.code) {
        expenseRequest.currencyCode = expenseForm.value.currencyCode || getDestinationCurrency.value.code
      }
      if (expenseForm.value.category) {
        expenseRequest.category = expenseForm.value.category
      }
      if (expenseForm.value.location && expenseForm.value.location.trim()) {
        expenseRequest.location = expenseForm.value.location.trim()
      }
      
      // 处理付款人信息：payerId 必须是有效的UUID（成员的真实ID）
      // 如果 payerId 不是有效的UUID（临时生成的），则不发送 payerId，只发送 payerName
      const payerId = expenseForm.value.payerId || currentUserMember.value.id
      const payerName = expenseForm.value.payerName || currentUserMember.value.name
      
      // 检查 payerId 是否是有效的UUID格式（后端期望的成员ID格式）
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payerId)
      
      console.log('[BudgetManager] 创建支出 - 付款人信息:', {
        payerId,
        payerName,
        isValidUUID,
        members: members.value.map(m => ({ id: m.id, name: m.name, role: m.role }))
      })
      
      if (isValidUUID) {
        // 如果是有效的UUID（真实成员ID），发送 payerId 和 payerName
        expenseRequest.payerId = payerId
        if (payerName && payerName.trim()) {
          expenseRequest.payerName = payerName.trim()
        }
      } else {
        // 如果是临时生成的ID（如 owner_xxx），只发送 payerName，不发送 payerId
        // 后端可能不接受非UUID格式的 payerId
        if (payerName && payerName.trim()) {
          expenseRequest.payerName = payerName.trim()
        }
      }
      if (expenseForm.value.splitType && expenseForm.value.splitType !== 'none') {
        expenseRequest.splitType = expenseForm.value.splitType
        if (expenseForm.value.splitType === 'custom' && expenseForm.value.splitDetails) {
          // 清理 splitDetails：只保留有效的UUID作为key，并确保值是数字
          const cleanedSplitDetails: { [key: string]: number } = {}
          for (const [key, value] of Object.entries(expenseForm.value.splitDetails)) {
            // 只保留有效的UUID作为key
            const isValidKey = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)
            if (isValidKey && value !== null && value !== undefined) {
              cleanedSplitDetails[key] = typeof value === 'number' ? value : Number(value)
            }
          }
          if (Object.keys(cleanedSplitDetails).length > 0) {
            expenseRequest.splitDetails = cleanedSplitDetails
          }
        }
      }
      if (expenseForm.value.notes && expenseForm.value.notes.trim()) {
        expenseRequest.notes = expenseForm.value.notes.trim()
      }
      
      console.log('[BudgetManager] 创建支出请求数据:', {
        ...expenseRequest,
        amount: expenseRequest.amount,
        amountType: typeof expenseRequest.amount
      })
      
      const newExpense = await createExpense(backendItineraryId, expenseRequest)
      
      // 添加到本地显示数据
      expenses.value.push({
        id: newExpense.id,
        title: newExpense.title,
        amount: newExpense.amount,
        currencyCode: newExpense.currencyCode,
        category: newExpense.category,
        location: newExpense.location,
        payerId: newExpense.payerId,
        payerName: newExpense.payerName,
        splitType: newExpense.splitType,
        splitDetails: newExpense.splitDetails || undefined,
        date: newExpense.date,
        notes: newExpense.notes,
        createdAt: new Date(newExpense.createdAt).getTime()
      })
      message.success(t('travelDetail.expenseAdded') || '支出已添加')
    }
    
    // 更新总支出
    updateTotalSpent()
    
    // 重置表单
    handleCancelExpense()
  } catch (error: any) {
    console.error('[BudgetManager] 保存支出失败:', error)
    message.error(error.message || (t('travelDetail.expenseSaveFailed') || '保存支出失败'))
  }
}

// 取消编辑支出
const handleCancelExpense = () => {
  editingExpense.value = null
  const defaultPayer = currentUserMember.value
  expenseForm.value = {
    title: '',
    amount: 0,
    currencyCode: '',
    category: '',
    location: '',
    payerId: defaultPayer.id,
    payerName: defaultPayer.name,
    splitType: 'none',
    splitDetails: {},
    date: null,
    notes: ''
  }
  showAddExpenseModal.value = false
}

// 编辑支出
const editExpense = (expense: Expense) => {
  editingExpense.value = expense
  const defaultPayer = currentUserMember.value
  expenseForm.value = {
    title: expense.title,
    amount: expense.amount,
    currencyCode: expense.currencyCode || getDestinationCurrency.value.code,
    category: expense.category || '',
    location: expense.location || '',
    payerId: expense.payerId || defaultPayer.id,
    payerName: expense.payerName || defaultPayer.name,
    splitType: expense.splitType || 'none',
    splitDetails: expense.splitDetails || {},
    date: expense.date ? dayjs(expense.date) : null,
    notes: expense.notes || ''
  }
  showAddExpenseModal.value = true
}

// 删除支出
const deleteExpense = (expenseId: string) => {
  Modal.confirm({
    title: t('travelDetail.confirmDeleteExpense') || '确认删除',
    content: t('travelDetail.confirmDeleteExpenseContent') || '确定要删除这条支出记录吗？',
    okText: t('common.confirm') || '确定',
    okType: 'danger',
    cancelText: t('common.cancel') || '取消',
    onOk: async () => {
      const travel = props.travelId ? travelListStore.getTravel(props.travelId) : null
      const backendItineraryId = travel?.data?.backendItineraryId
      
      if (!backendItineraryId) {
        message.error(t('travelDetail.noBackendItineraryId') || '无法删除支出：缺少行程ID')
        return
      }
      
      if (!expenseId) {
        message.error(t('travelDetail.expenseIdMissing') || '支出ID缺失')
        return
      }
      
      try {
        await deleteExpenseAPI(backendItineraryId, expenseId)
        
        // 从本地显示数据中删除
        expenses.value = expenses.value.filter(e => e.id !== expenseId)
        updateTotalSpent()
        message.success(t('travelDetail.expenseDeleted') || '支出已删除')
      } catch (error: any) {
        console.error('[BudgetManager] 删除支出失败:', error)
        message.error(error.message || (t('travelDetail.expenseDeleteFailed') || '删除支出失败'))
      }
    }
  })
}


// 更新总支出到store
const updateTotalSpent = () => {
  if (!props.travelId) return
  
  travelListStore.updateTravel(props.travelId, {
    spent: totalSpent.value
  })
}

// 监听travelId变化
watch(() => props.travelId, async () => {
  if (props.travelId) {
    await loadData()
    await loadMembers()
  } else {
    members.value = []
  }
}, { immediate: true })

// 监听成员列表变化，确保付款人选择器能正确显示
watch(members, (newMembers) => {
  // 如果成员列表更新了，且当前选择的付款人不在列表中，更新为默认成员
  if (newMembers.length > 0 && expenseForm.value.payerId) {
    const currentPayerExists = newMembers.some(m => m.id === expenseForm.value.payerId)
    if (!currentPayerExists) {
      const defaultMember = currentUserMember.value
      expenseForm.value.payerId = defaultMember.id
      expenseForm.value.payerName = defaultMember.name
    }
  }
}, { deep: true })

// 监听props变化
watch(() => [props.initialSpent, props.initialTotal], () => {
  total.value = props.initialTotal || 0
  budgetForm.value.total = props.initialTotal || 0
})

// 监听行程数据变化，自动更新总预算和支出
const updateBudgetFromActivities = () => {
  if (!props.travelId) return
  
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) return
  
  const activityCostsValue = extractCostsFromItinerary()
  
  // 如果总预算未设置或为0，且活动费用大于0，自动更新总预算
  if ((!total.value || total.value === 0) && activityCostsValue > 0) {
    total.value = activityCostsValue
    budgetForm.value.total = activityCostsValue
    // 自动保存到store
    travelListStore.updateTravel(props.travelId, {
      budget: activityCostsValue
    })
    console.log('[BudgetManager] 活动费用变化，自动更新总预算:', activityCostsValue)
  }
  // 如果总预算已设置，但活动费用大于总预算，给出提示（但不自动修改，让用户决定）
  else if (total.value > 0 && activityCostsValue > total.value) {
    console.warn('[BudgetManager] 活动费用超过总预算:', {
      activityCosts: activityCostsValue,
      totalBudget: total.value
    })
  }
}

// 监听行程数据变化（itineraryData.days）
watch(() => {
  const travel = props.travelId ? travelListStore.getTravel(props.travelId) : null
  return travel?.data?.itineraryData?.days
}, () => {
  if (props.travelId) {
    updateBudgetFromActivities()
  }
}, { deep: true })

// 监听行程数据变化（data.days）
watch(() => {
  const travel = props.travelId ? travelListStore.getTravel(props.travelId) : null
  return travel?.data?.days
}, () => {
  if (props.travelId) {
    updateBudgetFromActivities()
  }
}, { deep: true })

// 监听plannerItinerary变化
watch(() => travelStore.plannerItinerary, () => {
  if (props.travelId) {
    updateBudgetFromActivities()
  }
}, { deep: true })

onMounted(async () => {
  if (props.travelId) {
    await loadData()
    await loadMembers()
  }
})
</script>

<style scoped>
.sidebar-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.budget-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.budget-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-label {
  font-size: 0.9rem;
  color: #666;
}

.budget-value {
  font-weight: 600;
  font-size: 1rem;
}

.budget-value.spent {
  color: #1890ff;
}

.budget-value.total {
  color: #333;
}

.budget-value.remaining {
  color: #52c41a;
}

.budget-value.warning {
  color: #ff4d4f;
}

.budget-value.activity {
  color: #1890ff;
}

.budget-actions {
  margin-top: 0.5rem;
}

.budget-currency-info {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.form-item-hint {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #999;
}

.expense-list {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.expense-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.expense-list-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
}

.expense-count {
  font-size: 0.85rem;
  color: #999;
}

.expense-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
}

.expense-empty p {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.expense-item {
  padding: 0.5rem 0;
}

.expense-title {
  font-weight: 500;
  color: #333;
}

.expense-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.expense-date {
  font-size: 0.8rem;
  color: #999;
}

.expense-amount {
  font-weight: 600;
  color: #1890ff;
  font-size: 1rem;
}

:deep(.ant-list-item-action) {
  margin-left: 0.5rem;
}

.split-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 4px;
}

.split-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.split-member {
  flex: 1;
  font-size: 0.9rem;
  color: #666;
}

.split-error {
  margin-top: 0.5rem;
  color: #ff4d4f;
  font-size: 0.85rem;
}

.expense-location,
.expense-payer {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #999;
  margin-left: 0.5rem;
}
</style>

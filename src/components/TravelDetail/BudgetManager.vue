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
                {{ item.currencyCode && item.currencyCode !== getDestinationCurrency.value.code
                  ? formatCurrency(item.amount, getCurrencyByCode(item.currencyCode) || getDestinationCurrency.value)
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
            :placeholder="t('travelDetail.expensePayerPlaceholder') || '选择付款人'"
            allow-clear
            @change="handlePayerChange"
          >
            <a-select-option :value="currentUser.id">
              {{ currentUser.name }}
            </a-select-option>
            <a-select-option
              v-for="member in members"
              :key="member.id"
              :value="member.id"
            >
              {{ member.name }}
            </a-select-option>
          </a-select>
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
import { ref, computed, watch, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { EditOutlined, PlusOutlined, DeleteOutlined, FileTextOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useTravelListStore } from '@/stores/travelList'
import { useTravelStore } from '@/stores/travel'
import { message, Modal } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { getCurrencyForDestination, formatCurrency, getAllCurrencies, getCurrencyByCode, type CurrencyInfo } from '@/utils/currency'
import { PRESET_COUNTRIES } from '@/constants/countries'
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

const total = ref(props.initialTotal || 0)
const expenses = ref<Expense[]>([])
const showEditBudgetModal = ref(false)
const showAddExpenseModal = ref(false)
const editingExpense = ref<Expense | null>(null)

const budgetForm = ref({
  total: props.initialTotal || 0
})

// 获取成员列表（用于付款人选择）
const members = computed(() => {
  if (!props.travelId) return []
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel?.data?.members) return []
  return travel.data.members
})

// 获取当前用户信息（作为默认付款人）
const currentUser = computed(() => {
  // 可以从用户配置或store中获取
  return { id: 'current_user', name: '您' }
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

// 从左侧行程数据中提取费用
const extractCostsFromItinerary = () => {
  if (!props.travelId) return 0
  
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) return 0
  
  let totalCost = 0
  
  // 从Planner模式的行程数据中提取
  if (travel.mode === 'planner') {
    const plannerItinerary = (travelStore as any).plannerItinerary
    if (plannerItinerary?.days) {
      plannerItinerary.days.forEach((day: any) => {
        // 优先使用day.stats.cost（这是每日汇总的费用）
        if (day.stats?.cost) {
          totalCost += day.stats.cost
        } else if (day.timeSlots) {
          // 如果没有每日汇总，则从timeSlots中提取
          day.timeSlots.forEach((slot: any) => {
            if (slot.estimatedCost) {
              totalCost += slot.estimatedCost
            }
          })
        }
      })
    }
    // 如果行程有总费用，使用总费用（避免重复计算）
    if (plannerItinerary?.totalCost) {
      totalCost = plannerItinerary.totalCost
    }
  }
  
  // 从Inspiration模式的行程数据中提取
  if (travel.mode === 'inspiration') {
    const itineraryData = travel.data?.itineraryData
    if (itineraryData?.days) {
      itineraryData.days.forEach((day: any) => {
        if (day.timeSlots) {
          day.timeSlots.forEach((slot: any) => {
            // 支持多种费用字段
            if (slot.cost) {
              totalCost += slot.cost
            } else if (slot.details?.pricing?.general) {
              totalCost += slot.details.pricing.general
            } else if (slot.estimatedCost) {
              totalCost += slot.estimatedCost
            }
          })
        }
      })
    }
    // 如果有总费用，也加上
    if (itineraryData?.totalCost) {
      totalCost += itineraryData.totalCost
    }
  }
  
  return totalCost
}

// 计算总支出（手动添加的支出 + 自动提取的费用）
const totalSpent = computed(() => {
  const manualExpenses = expenses.value.reduce((sum, exp) => sum + exp.amount, 0)
  const autoExtracted = extractCostsFromItinerary()
  return manualExpenses + autoExtracted
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
  if (payerId === currentUser.value.id || !payerId) {
    expenseForm.value.payerName = currentUser.value.name
  } else {
    const member = members.value.find(m => m.id === payerId)
    if (member) {
      expenseForm.value.payerName = member.name
    }
  }
}

// 打开添加费用模态框
const handleAddExpense = () => {
  // 重置表单并设置默认值
  expenseForm.value = {
    title: '',
    amount: 0,
    currencyCode: getDestinationCurrency.value.code, // 默认使用目的地货币
    category: '',
    location: '',
    payerId: currentUser.value.id,
    payerName: currentUser.value.name,
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
const loadData = () => {
  if (!props.travelId) return
  
  const travel = travelListStore.getTravel(props.travelId)
  if (travel) {
    total.value = travel.budget || 0
    budgetForm.value.total = travel.budget || 0
    
    // 加载支出明细
    if (travel.data?.expenses) {
      expenses.value = travel.data.expenses
    }
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
const handleSaveExpense = () => {
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
  
  if (editingExpense.value) {
    // 编辑支出
    const index = expenses.value.findIndex(e => e.id === editingExpense.value!.id)
    if (index !== -1) {
      expenses.value[index] = {
        ...expenses.value[index],
        title: expenseForm.value.title,
        amount: expenseForm.value.amount,
        currencyCode: expenseForm.value.currencyCode || getDestinationCurrency.value.code,
        category: expenseForm.value.category,
        location: expenseForm.value.location,
        payerId: expenseForm.value.payerId,
        payerName: expenseForm.value.payerName,
        splitType: expenseForm.value.splitType,
        splitDetails: expenseForm.value.splitType === 'custom' ? { ...expenseForm.value.splitDetails } : undefined,
        date: dateStr,
        notes: expenseForm.value.notes
      }
    }
    message.success(t('travelDetail.expenseUpdated') || '支出已更新')
  } else {
    // 添加新支出
    const newExpense: Expense = {
      id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: expenseForm.value.title,
      amount: expenseForm.value.amount,
      currencyCode: expenseForm.value.currencyCode || getDestinationCurrency.value.code,
      category: expenseForm.value.category,
      location: expenseForm.value.location,
      payerId: expenseForm.value.payerId || currentUser.value.id,
      payerName: expenseForm.value.payerName || currentUser.value.name,
      splitType: expenseForm.value.splitType || 'none',
      splitDetails: expenseForm.value.splitType === 'custom' ? { ...expenseForm.value.splitDetails } : undefined,
      date: dateStr,
      notes: expenseForm.value.notes,
      createdAt: Date.now()
    }
    expenses.value.push(newExpense)
    message.success(t('travelDetail.expenseAdded') || '支出已添加')
  }
  
  // 保存到store
  saveExpenses()
  
  // 更新总支出
  updateTotalSpent()
  
  // 重置表单
  handleCancelExpense()
}

// 取消编辑支出
const handleCancelExpense = () => {
  editingExpense.value = null
  expenseForm.value = {
    title: '',
    amount: 0,
    currencyCode: '',
    category: '',
    location: '',
    payerId: currentUser.value.id,
    payerName: currentUser.value.name,
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
  expenseForm.value = {
    title: expense.title,
    amount: expense.amount,
    currencyCode: expense.currencyCode || getDestinationCurrency.value.code,
    category: expense.category || '',
    location: expense.location || '',
    payerId: expense.payerId || currentUser.value.id,
    payerName: expense.payerName || currentUser.value.name,
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
    onOk: () => {
      expenses.value = expenses.value.filter(e => e.id !== expenseId)
      saveExpenses()
      updateTotalSpent()
      message.success(t('travelDetail.expenseDeleted') || '支出已删除')
    }
  })
}

// 保存支出明细到store
const saveExpenses = () => {
  if (!props.travelId) return
  
  const travel = travelListStore.getTravel(props.travelId)
  if (travel) {
    travelListStore.updateTravel(props.travelId, {
      data: {
        ...travel.data,
        expenses: expenses.value
      }
    })
  }
}

// 更新总支出到store
const updateTotalSpent = () => {
  if (!props.travelId) return
  
  travelListStore.updateTravel(props.travelId, {
    spent: totalSpent.value
  })
}

// 监听travelId变化
watch(() => props.travelId, () => {
  if (props.travelId) {
    loadData()
  }
}, { immediate: true })

// 监听props变化
watch(() => [props.initialSpent, props.initialTotal], () => {
  total.value = props.initialTotal || 0
  budgetForm.value.total = props.initialTotal || 0
})

// 监听行程数据变化，自动更新支出
watch(() => travelStore.plannerItinerary, () => {
  if (props.travelId) {
    updateTotalSpent()
  }
}, { deep: true })

onMounted(() => {
  if (props.travelId) {
    loadData()
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

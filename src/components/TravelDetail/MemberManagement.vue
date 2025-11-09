<template>
  <a-card :title="t('travelDetail.members')" class="sidebar-card" :bordered="false">
    <!-- 成员列表 -->
    <div class="members-section">
      <a-list :dataSource="members" item-layout="horizontal" size="small">
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small">
                  <more-outlined />
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="assignTask(item)">
                      <file-text-outlined />
                      {{ t('travelDetail.memberManagement.assignTask') }}
                    </a-menu-item>
                    <a-menu-item @click="viewCostSplit(item)">
                      <dollar-outlined />
                      {{ t('travelDetail.memberManagement.costSplit') }}
                    </a-menu-item>
                    <a-menu-item v-if="item.role !== 'owner'" @click="removeMember(item)" danger>
                      <user-delete-outlined />
                      {{ t('travelDetail.memberManagement.remove') }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
            <a-list-item-meta>
              <template #avatar>
                <a-avatar :style="{ backgroundColor: item.color }">
                  {{ item.name[0] }}
                </a-avatar>
              </template>
              <template #title>
                <div class="member-title">
                  <span>{{ item.name }}</span>
                  <a-tag v-if="item.role === 'owner'" color="gold" size="small">
                    {{ t('travelDetail.memberManagement.owner') }}
                  </a-tag>
                  <a-tag v-else-if="item.role === 'admin'" color="blue" size="small">
                    {{ t('travelDetail.memberManagement.admin') }}
                  </a-tag>
                </div>
              </template>
              <template #description>
                <div class="member-info">
                  <span v-if="item.tasksCount > 0" class="task-count">
                    <file-text-outlined /> {{ item.tasksCount }} {{ t('travelDetail.memberManagement.tasks') }}
                  </span>
                  <span v-if="item.totalCost > 0" class="cost-amount">
                    <dollar-outlined /> {{ formatAmount(item.totalCost) }}
                  </span>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
      
      <!-- 邀请成员按钮 -->
      <a-button type="dashed" block style="margin-top: 1rem" @click="showInviteModal = true">
        <template #icon>
          <user-add-outlined />
        </template>
        {{ t('travelDetail.inviteMember') }}
      </a-button>
    </div>

    <!-- 任务分配统计 -->
    <a-divider style="margin: 16px 0" />
    <div class="tasks-summary">
      <div class="summary-item">
        <span class="summary-label">{{ t('travelDetail.memberManagement.totalTasks') }}</span>
        <span class="summary-value">{{ totalTasks }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ t('travelDetail.memberManagement.assignedTasks') }}</span>
        <span class="summary-value">{{ assignedTasks }}</span>
      </div>
    </div>

    <!-- 成本分摊统计 -->
    <a-divider style="margin: 16px 0" />
    <div class="cost-summary">
      <div class="summary-header">
        <span>{{ t('travelDetail.memberManagement.costSummary') }}</span>
        <a-button type="link" size="small" @click="showCostSplitModal = true">
          {{ t('travelDetail.memberManagement.manageCostSplit') }}
        </a-button>
      </div>
      <div class="cost-list">
        <div v-for="member in members" :key="member.id" class="cost-item">
          <span class="cost-member">{{ member.name }}</span>
          <span class="cost-amount">{{ formatAmount(member.totalCost) }}</span>
        </div>
        <div class="cost-total">
          <span class="cost-label">{{ t('travelDetail.memberManagement.total') }}</span>
          <span class="cost-value">{{ formatAmount(totalCost) }}</span>
        </div>
      </div>
    </div>

    <!-- 邀请成员弹窗 -->
    <a-modal
      v-model:open="showInviteModal"
      :title="t('travelDetail.memberManagement.inviteMember')"
      @ok="handleInvite"
      @cancel="showInviteModal = false"
    >
      <a-form :model="inviteForm" layout="vertical">
        <a-form-item :label="t('travelDetail.memberManagement.email')">
          <a-input
            v-model:value="inviteForm.email"
            :placeholder="t('travelDetail.memberManagement.emailPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="t('travelDetail.memberManagement.role')">
          <a-select v-model:value="inviteForm.role">
            <a-select-option value="member">{{ t('travelDetail.memberManagement.member') }}</a-select-option>
            <a-select-option value="admin">{{ t('travelDetail.memberManagement.admin') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('travelDetail.memberManagement.message')">
          <a-textarea
            v-model:value="inviteForm.message"
            :placeholder="t('travelDetail.memberManagement.messagePlaceholder')"
            :rows="3"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showInviteModal = false">{{ t('common.cancel') }}</a-button>
        <a-button type="primary" @click="handleInvite">{{ t('common.send') }}</a-button>
      </template>
    </a-modal>

    <!-- 任务分配弹窗 -->
    <a-modal
      v-model:open="showTaskModal"
      :title="t('travelDetail.memberManagement.assignTask')"
      @ok="handleAssignTask"
      @cancel="showTaskModal = false"
    >
      <a-form :model="taskForm" layout="vertical">
        <a-form-item :label="t('travelDetail.memberManagement.member')">
          <a-select v-model:value="taskForm.memberId" :placeholder="t('travelDetail.memberManagement.selectMember')">
            <a-select-option
              v-for="member in members"
              :key="member.id"
              :value="member.id"
            >
              {{ member.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('travelDetail.memberManagement.task')">
          <a-select v-model:value="taskForm.taskId" :placeholder="t('travelDetail.memberManagement.selectTask')">
            <a-select-option
              v-for="task in availableTasks"
              :key="task.id"
              :value="task.id"
            >
              {{ task.title }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showTaskModal = false">{{ t('common.cancel') }}</a-button>
        <a-button type="primary" @click="handleAssignTask">{{ t('common.confirm') }}</a-button>
      </template>
    </a-modal>

    <!-- 成本分摊弹窗 -->
    <a-modal
      v-model:open="showCostSplitModal"
      :title="t('travelDetail.memberManagement.costSplit')"
      width="600px"
      @ok="handleCostSplit"
      @cancel="showCostSplitModal = false"
    >
      <a-form :model="costSplitForm" layout="vertical">
        <a-form-item :label="t('travelDetail.memberManagement.expense')">
          <a-input
            v-model:value="costSplitForm.expenseName"
            :placeholder="t('travelDetail.memberManagement.expensePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="t('travelDetail.memberManagement.amount')">
          <a-input-number
            v-model:value="costSplitForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
            :placeholder="t('travelDetail.memberManagement.amountPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="t('travelDetail.memberManagement.splitBy')">
          <a-radio-group v-model:value="costSplitForm.splitType">
            <a-radio value="equal">{{ t('travelDetail.memberManagement.equal') }}</a-radio>
            <a-radio value="custom">{{ t('travelDetail.memberManagement.custom') }}</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="costSplitForm.splitType === 'custom'" :label="t('travelDetail.memberManagement.splitDetails')">
          <div class="split-details">
            <div
              v-for="member in members"
              :key="member.id"
              class="split-item"
            >
              <span>{{ member.name }}</span>
              <a-input-number
                v-model:value="costSplitForm.splitDetails[member.id]"
                :min="0"
                :precision="2"
                style="width: 150px"
                :placeholder="t('travelDetail.memberManagement.amount')"
              />
            </div>
          </div>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showCostSplitModal = false">{{ t('common.cancel') }}</a-button>
        <a-button type="primary" @click="handleCostSplit">{{ t('common.confirm') }}</a-button>
      </template>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTravelListStore } from '@/stores/travelList'
import { message } from 'ant-design-vue'
import {
  UserAddOutlined,
  MoreOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserDeleteOutlined
} from '@ant-design/icons-vue'
import { getCurrencyForDestination, formatCurrency, type CurrencyInfo } from '@/utils/currency'
import { PRESET_COUNTRIES } from '@/constants/countries'

const { t } = useI18n()
const travelListStore = useTravelListStore()

interface Props {
  travelId?: string
}

const props = withDefaults(defineProps<Props>(), {
  travelId: ''
})

interface Member {
  id: string
  name: string
  email?: string
  role: 'owner' | 'admin' | 'member'
  tasksCount: number
  totalCost: number
  color: string
}

interface Task {
  id: string
  title: string
  assignedTo?: string
}

// 成员列表（从store加载）
const members = ref<Member[]>([])

// 可用任务列表（从TaskList组件获取或从store获取）
const availableTasks = ref<Task[]>([])

// 从store加载任务列表（从任务清单中获取所有任务）
const loadTasks = () => {
  if (!props.travelId) {
    availableTasks.value = []
    return
  }
  
  const travel = travelListStore.getTravel(props.travelId)
  const existingTasks = travel?.data?.tasks || []
  
  // 从任务清单中获取所有任务（不管是否已分配）
  availableTasks.value = existingTasks.map((task: any) => ({
    id: task.id,
    title: task.title,
    assignedTo: task.assignedTo
  }))
}

// 统计信息
const totalTasks = computed(() => availableTasks.value.length)
const assignedTasks = computed(() => 
  availableTasks.value.filter(t => t.assignedTo).length
)
const totalCost = computed(() => 
  members.value.reduce((sum, member) => sum + member.totalCost, 0)
)

// 弹窗状态
const showInviteModal = ref(false)
const showTaskModal = ref(false)
const showCostSplitModal = ref(false)

// 表单数据
const inviteForm = ref({
  email: '',
  role: 'member' as 'member' | 'admin',
  message: ''
})

const taskForm = ref({
  memberId: '',
  taskId: ''
})

const costSplitForm = ref({
  expenseName: '',
  amount: 0,
  splitType: 'equal' as 'equal' | 'custom',
  splitDetails: {} as Record<string, number>
})

// 加载成员数据
const loadMembers = () => {
  if (!props.travelId) {
    members.value = []
    return
  }
  
  const travel = travelListStore.getTravel(props.travelId)
  const storedMembers = travel?.data?.members || []
  
  if (storedMembers.length > 0) {
    // 从store加载成员信息，并计算任务数和成本
    const existingTasks = travel?.data?.tasks || []
    members.value = storedMembers.map((member: any) => {
      const memberTasks = existingTasks.filter((task: any) => task.assignedTo === member.id)
      return {
        ...member,
        tasksCount: memberTasks.length,
        totalCost: member.totalCost || 0
      }
    })
  } else {
    members.value = []
  }
}

// 提取目的地国家代码（与BudgetManager中的逻辑一致）
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
  
  // 3. 从 data 中的 destination 提取
  const destination = data?.destination || data?.selectedLocation
  if (destination) {
    for (const [code, country] of Object.entries(PRESET_COUNTRIES)) {
      if (destination.includes(country.name) || destination.includes(code)) {
        return code
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

// 加载数据
onMounted(() => {
  loadTasks()
  loadMembers()
  
  // 监听任务列表变化，实时更新可用任务
  if (props.travelId) {
    watch(() => {
      const travel = travelListStore.getTravel(props.travelId)
      return travel?.data?.tasks
    }, (newTasks) => {
      if (newTasks && Array.isArray(newTasks)) {
        // 更新可用任务列表
        availableTasks.value = newTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          assignedTo: task.assignedTo
        }))
      } else {
        availableTasks.value = []
      }
    }, { deep: true, immediate: true })
  }
})

// 邀请成员
const handleInvite = () => {
  if (!inviteForm.value.email) {
    message.warning(t('travelDetail.memberManagement.emailRequired'))
    return
  }
  
  // TODO: 调用API发送邀请
  message.success(t('travelDetail.memberManagement.inviteSent'))
  showInviteModal.value = false
  
  // 重置表单
  inviteForm.value = {
    email: '',
    role: 'member',
    message: ''
  }
}

// 分配任务
const assignTask = (member: Member) => {
  taskForm.value.memberId = member.id
  taskForm.value.taskId = ''
  showTaskModal.value = true
}

const handleAssignTask = () => {
  if (!taskForm.value.memberId || !taskForm.value.taskId) {
    message.warning(t('travelDetail.memberManagement.selectTaskAndMember'))
    return
  }
  
  if (!props.travelId) {
    message.error('旅行ID缺失')
    return
  }
  
  // 获取travel数据
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) {
    message.error('旅行数据不存在')
    return
  }
  
  // 获取或创建任务列表
  const existingTasks = travel.data?.tasks || []
  
  // 检查任务是否已存在于任务列表中
  let taskInList = existingTasks.find((t: any) => t.id === taskForm.value.taskId)
  
  if (!taskInList) {
    message.warning('任务不存在，请先在任务清单中添加任务')
    return
  }
  
  // 如果任务已存在，更新分配
  taskInList.assignedTo = taskForm.value.memberId
  
  // 更新可用任务列表中的分配信息
  const taskInAvailable = availableTasks.value.find(t => t.id === taskForm.value.taskId)
  if (taskInAvailable) {
    taskInAvailable.assignedTo = taskForm.value.memberId
  }
  
  // 更新成员任务计数
  const member = members.value.find(m => m.id === taskForm.value.memberId)
  if (member) {
    // 重新计算该成员的任务数
    member.tasksCount = existingTasks.filter((t: any) => t.assignedTo === member.id).length
  }
  
  // 保存成员信息到store（如果还没有）
  const membersData = travel.data?.members || members.value
  
  // 保存到store
  travelListStore.updateTravel(props.travelId, {
    data: {
      ...travel.data,
      tasks: existingTasks,
      members: membersData
    }
  })
  
  // 重新加载数据以保持同步
  loadTasks()
  loadMembers()
  
  message.success(t('travelDetail.memberManagement.taskAssigned'))
  
  showTaskModal.value = false
  taskForm.value = {
    memberId: '',
    taskId: ''
  }
}

// 查看成本分摊
const viewCostSplit = (member: Member) => {
  showCostSplitModal.value = true
}

// 成本分摊
const handleCostSplit = () => {
  if (!costSplitForm.value.expenseName || !costSplitForm.value.amount) {
    message.warning(t('travelDetail.memberManagement.fillExpenseInfo'))
    return
  }
  
  if (costSplitForm.value.splitType === 'custom') {
    const total = Object.values(costSplitForm.value.splitDetails).reduce((sum, val) => sum + (val || 0), 0)
    if (Math.abs(total - costSplitForm.value.amount) > 0.01) {
      message.warning(t('travelDetail.memberManagement.splitAmountMismatch'))
      return
    }
  }
  
  if (!props.travelId) {
    message.error('旅行ID缺失')
    return
  }
  
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) {
    message.error('旅行数据不存在')
    return
  }
  
  // 更新成本分摊
  if (costSplitForm.value.splitType === 'equal') {
    const perPerson = costSplitForm.value.amount / members.value.length
    members.value.forEach(member => {
      member.totalCost = (member.totalCost || 0) + perPerson
    })
  } else {
    Object.entries(costSplitForm.value.splitDetails).forEach(([memberId, amount]) => {
      const member = members.value.find(m => m.id === memberId)
      if (member && amount) {
        member.totalCost = (member.totalCost || 0) + amount
      }
    })
  }
  
  // 保存到store
  travelListStore.updateTravel(props.travelId, {
    data: {
      ...travel.data,
      members: members.value
    }
  })
  
  message.success(t('travelDetail.memberManagement.costSplitSaved'))
  showCostSplitModal.value = false
  
  // 重置表单
  costSplitForm.value = {
    expenseName: '',
    amount: 0,
    splitType: 'equal',
    splitDetails: {}
  }
}

// 移除成员
const removeMember = (member: Member) => {
  if (!props.travelId) {
    message.error('旅行ID缺失')
    return
  }
  
  const travel = travelListStore.getTravel(props.travelId)
  if (!travel) {
    message.error('旅行数据不存在')
    return
  }
  
  const index = members.value.findIndex(m => m.id === member.id)
  if (index > -1) {
    members.value.splice(index, 1)
    
    // 保存到store
    travelListStore.updateTravel(props.travelId, {
      data: {
        ...travel.data,
        members: members.value
      }
    })
    
    message.success(t('travelDetail.memberManagement.memberRemoved'))
  }
}
</script>

<style scoped>
.sidebar-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.members-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member-info {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.task-count,
.cost-amount {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.tasks-summary,
.cost-summary {
  font-size: 0.9rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.summary-label {
  color: #666;
}

.summary-value {
  font-weight: 500;
  color: #1890ff;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.cost-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.cost-member {
  color: #666;
}

.cost-amount {
  font-weight: 500;
  color: #333;
}

.cost-total {
  display: flex;
  justify-content: space-between;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  border-top: 2px solid #f0f0f0;
  font-weight: 600;
}

.cost-label {
  color: #333;
}

.cost-value {
  color: #1890ff;
  font-size: 1.1rem;
}

.split-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.split-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #fafafa;
  border-radius: 4px;
}
</style>

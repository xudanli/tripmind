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
                      <a-menu-item v-if="canEditMember(item)" @click="editMemberRole(item)">
                      <edit-outlined />
                      {{ t('travelDetail.memberManagement.editRole') }}
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

    <!-- 编辑成员角色弹窗 -->
    <a-modal
      v-model:open="showEditRoleModal"
      :title="t('travelDetail.memberManagement.editRole')"
      @ok="handleEditRole"
      @cancel="showEditRoleModal = false"
    >
      <a-form :model="editRoleForm" layout="vertical">
        <a-form-item :label="t('travelDetail.memberManagement.member')">
          <a-input v-model:value="editRoleForm.memberName" disabled />
        </a-form-item>
        <a-form-item :label="t('travelDetail.memberManagement.role')">
          <a-select v-model:value="editRoleForm.role">
            <a-select-option value="member">{{ t('travelDetail.memberManagement.member') }}</a-select-option>
            <a-select-option value="admin">{{ t('travelDetail.memberManagement.admin') }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showEditRoleModal = false">{{ t('common.cancel') }}</a-button>
        <a-button type="primary" @click="handleEditRole">{{ t('common.confirm') }}</a-button>
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
import { useUserStore } from '@/stores/user'
import { message, Modal } from 'ant-design-vue'
import {
  UserAddOutlined,
  MoreOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserDeleteOutlined,
  EditOutlined
} from '@ant-design/icons-vue'
import { getCurrencyForDestination, formatCurrency, type CurrencyInfo } from '@/utils/currency'
import { PRESET_COUNTRIES } from '@/constants/countries'
import { getMembers, inviteMember, addMember, updateMember, removeMember as removeMemberAPI, type Member as APIMember } from '@/services/itineraryAPI'

const { t } = useI18n()
const travelListStore = useTravelListStore()
const userStore = useUserStore()

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
  userId?: string | null
  createdAt?: string
  updatedAt?: string
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
const showEditRoleModal = ref(false)

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

const editRoleForm = ref({
  memberId: '',
  memberName: '',
  role: 'member' as 'member' | 'admin'
})

// 加载成员数据
const loadMembers = async () => {
  if (!props.travelId) {
    members.value = []
    return
  }
  
  const travel = travelListStore.getTravel(props.travelId)
  let backendItineraryId = travel?.data?.backendItineraryId
  const currentUser = userStore.user
  
  // 如果没有 backendItineraryId，尝试自动创建
  if (!backendItineraryId) {
    backendItineraryId = await ensureBackendItineraryId()
    if (!backendItineraryId) {
      console.warn('[MemberManagement] 未找到 backendItineraryId，使用本地显示创建者')
      // 即使没有 backendItineraryId，也显示创建者
      if (currentUser) {
        const ownerMember: Member = {
          id: `owner_local_${currentUser.id || 'default'}`,
          name: currentUser.name || currentUser.nickname || currentUser.email || '我',
          email: currentUser.email,
          role: 'owner',
          userId: currentUser.id,
          tasksCount: 0,
          totalCost: 0,
          color: '#1890ff',
          createdAt: travel?.createdAt || new Date().toISOString(),
          updatedAt: travel?.updatedAt || new Date().toISOString()
        }
        members.value = [ownerMember]
        console.log('[MemberManagement] 使用本地数据显示创建者')
      } else {
    members.value = []
      }
    return
    }
  }
  
  try {
    console.log('[MemberManagement] 从后端加载成员数据:', backendItineraryId)
    let apiMembers = await getMembers(backendItineraryId)
    
    // 检查是否已有 owner 角色成员
    const hasOwner = apiMembers.some(m => m.role === 'owner')
    
    // 如果后端返回空列表或没有 owner，确保创建者显示
    if ((apiMembers.length === 0 || !hasOwner) && currentUser) {
      console.log('[MemberManagement] 后端成员列表为空或缺少 owner，确保创建者显示')
      
      // 检查当前用户是否已经是成员（通过 userId 或 email 匹配）
      const existingMember = apiMembers.find(m => 
        m.userId === currentUser.id || 
        (m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
      )
      
      if (!existingMember) {
        // 如果用户还不是成员，尝试添加到后端
        try {
          console.log('[MemberManagement] 尝试将创建者添加到后端成员列表')
          const ownerMember = await addMember(backendItineraryId, {
            name: currentUser.name || currentUser.nickname || currentUser.email || '我',
            email: currentUser.email,
            role: 'member', // 注意：owner 角色应该由后端在创建行程时自动分配
            userId: currentUser.id
          })
          
          // 重新加载成员列表
          apiMembers = await getMembers(backendItineraryId)
          console.log('[MemberManagement] 创建者已添加到后端，重新加载成员列表')
        } catch (addError: any) {
          console.warn('[MemberManagement] 自动添加创建者到后端失败，使用前端显示:', addError.message)
          // 如果添加失败（可能是权限问题或后端限制），至少在前端显示创建者
        const ownerMember: APIMember = {
            id: `owner_${backendItineraryId}_${currentUser.id || 'default'}`,
          name: currentUser.name || currentUser.nickname || currentUser.email || '我',
          email: currentUser.email,
          role: 'owner' as const,
          userId: currentUser.id,
          createdAt: travel?.createdAt || new Date().toISOString(),
          updatedAt: travel?.updatedAt || new Date().toISOString()
        }
        
        if (apiMembers.length === 0) {
          apiMembers = [ownerMember]
        } else {
          apiMembers.unshift(ownerMember)
        }
      }
      } else {
        // 如果用户已经是成员，确保显示
        console.log('[MemberManagement] 创建者已是成员，角色:', existingMember.role)
      }
    }
    
    // 如果后端有成员但没有 owner，且当前用户是创建者，确保在前端显示为 owner
    if (apiMembers.length > 0 && !hasOwner && currentUser) {
      const currentUserMember = apiMembers.find(m => 
        m.userId === currentUser.id || 
        (m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
      )
      
      if (currentUserMember && currentUserMember.role !== 'owner') {
        // 在前端将创建者标记为 owner（即使后端不是）
        console.log('[MemberManagement] 在前端将创建者标记为 owner')
        currentUserMember.role = 'owner' as const
      } else if (!currentUserMember) {
        // 如果创建者不在列表中，添加到开头
        const ownerMember: APIMember = {
          id: `owner_${backendItineraryId}_${currentUser.id || 'default'}`,
          name: currentUser.name || currentUser.nickname || currentUser.email || '我',
          email: currentUser.email,
          role: 'owner' as const,
          userId: currentUser.id,
          createdAt: travel?.createdAt || new Date().toISOString(),
          updatedAt: travel?.updatedAt || new Date().toISOString()
        }
        apiMembers.unshift(ownerMember)
      }
    }
    
    // 确保 owner 始终显示在列表第一位
    apiMembers.sort((a, b) => {
      if (a.role === 'owner') return -1
      if (b.role === 'owner') return 1
      if (a.role === 'admin' && b.role === 'member') return -1
      if (a.role === 'member' && b.role === 'admin') return 1
      return 0
    })
    
    // 计算任务数和成本
    const existingTasks = travel?.data?.tasks || []
    
    // 生成颜色（基于成员ID）
    const generateColor = (id: string) => {
      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96']
      const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
      return colors[index]
    }
    
    members.value = apiMembers.map((member: APIMember) => {
      const memberTasks = existingTasks.filter((task: any) => task.assignedTo === member.id)
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        userId: member.userId,
        tasksCount: memberTasks.length,
        totalCost: 0, // 成本可以从支出接口计算
        color: generateColor(member.id),
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      }
    })
    
    console.log('[MemberManagement] 从后端加载成员数据成功:', members.value.length)
  } catch (error: any) {
    console.error('[MemberManagement] 从后端加载成员数据失败:', error)
    message.error(error.message || (t('travelDetail.memberLoadFailed') || '加载成员数据失败'))
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
  
  // 0. 优先使用后端返回的货币信息（最准确，后端已推断）
  const itineraryData = (travel.data as any)?.itineraryData
  if (itineraryData?.currencyInfo) {
    return itineraryData.currencyInfo
  }
  
  // 1. 使用后端返回的货币代码
  const backendCurrencyCode = 
    itineraryData?.currency ||
    travel.data?.currencyCode ||
    travel.currency ||
    (travel.data as any)?.currency

  if (backendCurrencyCode) {
    const currency = getCurrencyByCode(backendCurrencyCode)
    if (currency) {
      return currency
    }
  }
  
  // 2. 从国家代码获取（后备方案）
  const countryCode = extractDestinationCountry()
  if (countryCode && PRESET_COUNTRIES[countryCode]) {
    const country = PRESET_COUNTRIES[countryCode]
    return getCurrencyForDestination(country.name)
  }
  
  // 3. 从location字段获取（后备方案）
  if (travel.location) {
    const currency = getCurrencyForDestination(travel.location)
    if (currency.code !== 'CNY') {
      return currency
    }
  }
  
  // 4. 从destination字段获取（后备方案）
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
onMounted(async () => {
  loadTasks()
  await loadMembers()
  
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
    
    // 监听 travelId 变化，重新加载成员
    watch(() => props.travelId, async (newId) => {
      if (newId) {
        await loadMembers()
      }
    })
  }
})

// 尝试创建或获取 backendItineraryId
const ensureBackendItineraryId = async (): Promise<string | null> => {
  const travel = props.travelId ? travelListStore.getTravel(props.travelId) : null
  if (!travel) return null
  
  // 如果已有 backendItineraryId，直接返回
  if (travel.data?.backendItineraryId) {
    return travel.data.backendItineraryId
  }
  
  // 尝试自动创建行程
  try {
    const { createJourneyFromFrontendData } = await import('@/services/itineraryAPI')
    
    // 检查是否有足够的行程数据
    const itineraryData = travel.data?.itineraryData
    if (!itineraryData || !itineraryData.destination) {
      return null
    }
    
    // 准备创建请求（使用前端数据格式）
    const destination = itineraryData.destination || travel.location || '待定'
    const startDate = itineraryData.days?.[0]?.date || travel.startDate || new Date().toISOString().split('T')[0]
    
    // 确保 days 数组不为空
    const days = itineraryData.days && itineraryData.days.length > 0
      ? itineraryData.days
      : [{
          day: 1,
          date: startDate,
          timeSlots: []
        }]
    
    // 使用前端数据格式创建行程（接受 timeSlots 格式）
    const createRequest = {
      itineraryData: {
        destination,
        duration: days.length,
        days: days.map((day: any) => ({
          day: day.day || 1,
          date: day.date || startDate,
          timeSlots: day.timeSlots || []
        })),
        totalCost: itineraryData.totalCost || travel.budget || 0,
        summary: itineraryData.summary || travel.description || '',
        title: travel.title || `${destination}之旅`,
        preferences: itineraryData.preferences
      },
      startDate
    }
    
    // 创建行程（使用 from-frontend-data 接口）
    const backendItinerary = await createJourneyFromFrontendData(createRequest)
    const backendItineraryId = backendItinerary.id
    
    // 更新 travel 数据
    travelListStore.updateTravel(props.travelId, {
      data: {
        ...travel.data,
        backendItineraryId
      }
    })
    
    message.success('行程已自动保存到后端')
    return backendItineraryId
  } catch (error: any) {
    console.error('[MemberManagement] 自动创建行程失败:', error)
    return null
  }
}

// 邀请成员
const handleInvite = async () => {
  if (!inviteForm.value.email) {
    message.warning(t('travelDetail.memberManagement.emailRequired'))
    return
  }
  
  const travel = props.travelId ? travelListStore.getTravel(props.travelId) : null
  let backendItineraryId = travel?.data?.backendItineraryId
  
  // 如果没有 backendItineraryId，尝试自动创建
  if (!backendItineraryId) {
    message.loading('正在保存行程到后端...', 0)
    backendItineraryId = await ensureBackendItineraryId()
    message.destroy()
    
    if (!backendItineraryId) {
      message.error(t('travelDetail.noBackendItineraryId') || '无法邀请成员：请先保存行程到后端')
    return
    }
  }
  
  try {
    await inviteMember(backendItineraryId, {
      email: inviteForm.value.email,
      role: inviteForm.value.role || 'member',
      message: inviteForm.value.message
    })
    
    message.success(t('travelDetail.memberManagement.inviteSent') || '邀请已发送')
    showInviteModal.value = false
    
    // 重置表单
    inviteForm.value = {
      email: '',
      role: 'member',
      message: ''
    }
    
    // 刷新成员列表（虽然邀请是pending状态，但可以显示邀请信息）
    await loadMembers()
  } catch (error: any) {
    console.error('[MemberManagement] 邀请成员失败:', error)
    message.error(error.message || (t('travelDetail.memberInviteFailed') || '邀请成员失败'))
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
  Modal.confirm({
    title: t('travelDetail.confirmRemoveMember') || '确认移除',
    content: t('travelDetail.confirmRemoveMemberContent') || `确定要移除成员 "${member.name}" 吗？`,
    okText: t('common.confirm') || '确定',
    okType: 'danger',
    cancelText: t('common.cancel') || '取消',
    onOk: async () => {
      const travel = props.travelId ? travelListStore.getTravel(props.travelId) : null
      let backendItineraryId = travel?.data?.backendItineraryId
      
      // 如果没有 backendItineraryId，尝试自动创建
      if (!backendItineraryId) {
        backendItineraryId = await ensureBackendItineraryId()
        if (!backendItineraryId) {
          message.error(t('travelDetail.noBackendItineraryId') || '无法移除成员：请先保存行程到后端')
        return
        }
      }
      
      if (!member.id) {
        message.error(t('travelDetail.memberIdMissing') || '成员ID缺失')
        return
      }
      
      try {
        await removeMemberAPI(backendItineraryId, member.id)
        
        // 刷新成员列表
        await loadMembers()
        
        message.success(t('travelDetail.memberManagement.memberRemoved') || '成员已移除')
      } catch (error: any) {
        console.error('[MemberManagement] 移除成员失败:', error)
        message.error(error.message || (t('travelDetail.memberRemoveFailed') || '移除成员失败'))
      }
    }
  })
}

// 检查是否可以编辑成员（owner和admin可以编辑非owner成员）
const canEditMember = (member: Member) => {
  const currentUser = userStore.user
  if (!currentUser) return false
  
  const currentMember = members.value.find(m => m.userId === currentUser.id)
  if (!currentMember) return false
  
  // owner可以编辑所有非owner成员
  if (currentMember.role === 'owner' && member.role !== 'owner') {
    return true
  }
  
  // admin可以编辑member角色成员
  if (currentMember.role === 'admin' && member.role === 'member') {
    return true
  }
  
  return false
}

// 编辑成员角色
const editMemberRole = (member: Member) => {
  editRoleForm.value = {
    memberId: member.id,
    memberName: member.name,
    role: member.role === 'owner' ? 'member' : (member.role as 'member' | 'admin')
  }
  showEditRoleModal.value = true
}

// 处理编辑角色
const handleEditRole = async () => {
  if (!editRoleForm.value.memberId) {
    message.warning('成员ID缺失')
    return
  }
  
  const travel = props.travelId ? travelListStore.getTravel(props.travelId) : null
  let backendItineraryId = travel?.data?.backendItineraryId
  
  // 如果没有 backendItineraryId，尝试自动创建
  if (!backendItineraryId) {
    backendItineraryId = await ensureBackendItineraryId()
    if (!backendItineraryId) {
      message.error(t('travelDetail.noBackendItineraryId') || '无法更新成员：请先保存行程到后端')
      return
    }
  }
  
  try {
    await updateMember(backendItineraryId, editRoleForm.value.memberId, {
      role: editRoleForm.value.role
    })
    
    message.success(t('travelDetail.memberManagement.roleUpdated') || '角色更新成功')
    showEditRoleModal.value = false
    
    // 刷新成员列表
    await loadMembers()
  } catch (error: any) {
    console.error('[MemberManagement] 更新成员角色失败:', error)
    message.error(error.message || (t('travelDetail.memberUpdateFailed') || '更新成员角色失败'))
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

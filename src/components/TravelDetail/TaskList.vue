<template>
  <a-card :title="t('travelDetail.tasks') || '任务清单'" class="sidebar-card" :bordered="false">
    <div class="task-section">
      <a-spin :spinning="loading">
        <a-list :dataSource="tasks" item-layout="horizontal" size="small">
          <template #renderItem="{ item }">
            <a-list-item>
              <template #actions>
                <a-button 
                  type="text" 
                  size="small" 
                  danger 
                  @click="handleDeleteTask(item.id)"
                  :disabled="loading"
                >
                  <delete-outlined />
                </a-button>
              </template>
              <a-checkbox 
                v-model:checked="item.completed"
                @change="handleTaskToggle(item)"
                :disabled="loading"
              >
                <div class="task-content">
                  <span :class="{ 'task-completed': item.completed }">
                    {{ item.title }}
                  </span>
                  <div v-if="item.links?.length" class="task-links">
                    <a
                      v-for="(link, linkIndex) in item.links"
                      :key="linkIndex"
                      class="task-link"
                      :href="link.url"
                      target="_blank"
                      rel="noopener"
                    >
                      🔗 {{ link.label }}
                    </a>
                  </div>
                  <span v-if="getAssigneeName(item.assignedTo)" class="task-assignee">
                    <user-outlined />
                    {{ getAssigneeName(item.assignedTo) }}
                  </span>
                </div>
              </a-checkbox>
            </a-list-item>
          </template>
          <template #empty>
            <a-empty 
              :description="loading ? '加载中...' : '暂无任务'" 
              :image="false" 
              style="padding: 1rem 0"
            />
          </template>
        </a-list>
      </a-spin>
      
      <div class="task-actions">
        <a-input
          v-model:value="newTaskTitle"
          :placeholder="t('travelDetail.taskPlaceholder') || '添加新任务...'"
          @pressEnter="handleAddTask"
          :disabled="loading || addingTask || !journeyId"
          style="margin-bottom: 0.5rem"
        >
          <template #suffix>
            <plus-outlined 
              @click="handleAddTask"
              :style="{ 
                cursor: (newTaskTitle.trim() && !loading && !addingTask && journeyId) ? 'pointer' : 'not-allowed', 
                color: (newTaskTitle.trim() && !loading && !addingTask && journeyId) ? '#1890ff' : '#ccc' 
              }"
            />
          </template>
        </a-input>
        
        <div class="task-stats">
          <span class="stat-item">
            {{ t('travelDetail.taskCompleted') || '已完成' }}: 
            <strong>{{ completedCount }}</strong> / {{ tasks.length }}
          </span>
          <a-button 
            v-if="completedCount > 0"
            type="link" 
            size="small" 
            danger
            @click="handleClearCompleted"
            :disabled="loading"
          >
            {{ t('travelDetail.clearCompleted') || '清除已完成' }}
          </a-button>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useTravelListStore } from '@/stores/travelList'
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  type Task 
} from '@/services/itineraryAPI'

interface Props {
  travelId?: string
  initialTasks?: Task[]
}

const props = withDefaults(defineProps<Props>(), {
  travelId: '',
  initialTasks: () => []
})

const { t } = useI18n()
const travelListStore = useTravelListStore()

const tasks = ref<Task[]>(props.initialTasks || [])
const newTaskTitle = ref('')
const loading = ref(false)
const addingTask = ref(false)

// 获取 journeyId（后端行程ID）
const journeyId = computed(() => {
  if (!props.travelId) return null
  const travel = travelListStore.getTravel(props.travelId)
  return travel?.data?.backendItineraryId || null
})

// 加载任务列表
const loadTasks = async () => {
  const id = journeyId.value
  if (!id) {
    console.warn('[TaskList] 无法加载任务：缺少 journeyId')
    return
  }

  loading.value = true
  try {
    const taskList = await getTasks(id)
    tasks.value = taskList
    console.log('[TaskList] 任务列表加载成功:', {
      journeyId: id,
      taskCount: taskList.length
    })
  } catch (error: any) {
    console.error('[TaskList] 加载任务列表失败:', error)
    message.error(`加载任务失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 添加任务
const handleAddTask = async () => {
  if (!newTaskTitle.value.trim()) return
  
  const id = journeyId.value
  if (!id) {
    message.error('无法添加任务：缺少行程ID')
    return
  }

  addingTask.value = true
  try {
    const travel = travelListStore.getTravel(props.travelId)
    const newTask = await createTask(id, {
      title: newTaskTitle.value.trim(),
      category: 'preparation',
      destination: travel?.destination || undefined
    })
    
    tasks.value.push(newTask)
    newTaskTitle.value = ''
    message.success('任务已添加')
    console.log('[TaskList] 任务添加成功:', newTask)
  } catch (error: any) {
    console.error('[TaskList] 添加任务失败:', error)
    message.error(`添加任务失败: ${error.message || '未知错误'}`)
  } finally {
    addingTask.value = false
  }
}

// 切换任务状态
const handleTaskToggle = async (task: Task) => {
  const id = journeyId.value
  if (!id) {
    message.error('无法更新任务：缺少行程ID')
    return
  }

  try {
    const updatedTask = await updateTask(id, task.id, {
      completed: !task.completed
    })
    
    // 更新本地任务列表
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      tasks.value[index] = updatedTask
    }
    
    console.log('[TaskList] 任务状态更新成功:', {
      taskId: task.id,
      completed: updatedTask.completed
    })
  } catch (error: any) {
    console.error('[TaskList] 更新任务状态失败:', error)
    message.error(`更新任务失败: ${error.message || '未知错误'}`)
    // 恢复原状态
    task.completed = !task.completed
  }
}

// 删除任务
const handleDeleteTask = (taskId: string) => {
  const id = journeyId.value
  if (!id) {
    message.error('无法删除任务：缺少行程ID')
    return
  }

  Modal.confirm({
    title: '确认删除',
    content: '确定要删除此任务吗？',
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteTask(id, taskId)
        
        // 从本地任务列表中移除
        const index = tasks.value.findIndex(t => t.id === taskId)
        if (index !== -1) {
          tasks.value.splice(index, 1)
        }
        
        message.success('任务已删除')
        console.log('[TaskList] 任务删除成功:', taskId)
      } catch (error: any) {
        console.error('[TaskList] 删除任务失败:', error)
        message.error(`删除任务失败: ${error.message || '未知错误'}`)
      }
    }
  })
}

// 清除已完成任务
const handleClearCompleted = () => {
  const completedTasks = tasks.value.filter(t => t.completed)
  if (completedTasks.length === 0) {
    message.info('没有已完成的任务')
    return
  }

  Modal.confirm({
    title: '确认清除',
    content: `确定要删除 ${completedTasks.length} 个已完成的任务吗？`,
    okText: '清除',
    cancelText: '取消',
    onOk: async () => {
      const id = journeyId.value
      if (!id) {
        message.error('无法清除任务：缺少行程ID')
        return
      }

      try {
        // 逐个删除已完成的任务
        const deletePromises = completedTasks.map(task => deleteTask(id, task.id))
        await Promise.all(deletePromises)
        
        // 从本地任务列表中移除
        tasks.value = tasks.value.filter(t => !t.completed)
        
        message.success(`已清除 ${completedTasks.length} 个已完成的任务`)
        console.log('[TaskList] 清除已完成任务成功:', completedTasks.length)
      } catch (error: any) {
        console.error('[TaskList] 清除已完成任务失败:', error)
        message.error(`清除任务失败: ${error.message || '未知错误'}`)
      }
    }
  })
}

// 已完成任务数量
const completedCount = computed(() => {
  return tasks.value.filter(t => t.completed).length
})

// 获取成员信息（从store获取）
const getMemberInfo = computed(() => {
  if (!props.travelId) return {}
  
  const travel = travelListStore.getTravel(props.travelId)
  const members = travel?.data?.members || []
  
  // 创建成员ID到名称的映射
  const memberMap: Record<string, string> = {}
  members.forEach((member: any) => {
    memberMap[member.id] = member.name
  })
  
  return memberMap
})

// 获取执行人名称
const getAssigneeName = (assignedTo?: string): string => {
  if (!assignedTo) return ''
  
  // 如果 assignedTo 是成员ID，从成员信息中获取名称
  if (getMemberInfo.value[assignedTo]) {
    return getMemberInfo.value[assignedTo]
  }
  
  // 如果 assignedTo 直接是名称，直接返回
  return assignedTo
}

// 监听 journeyId 变化，重新加载任务
watch(journeyId, (newId) => {
  if (newId) {
    loadTasks()
  } else {
    tasks.value = []
  }
}, { immediate: true })

// 组件挂载时加载任务
onMounted(() => {
  if (journeyId.value) {
    loadTasks()
  }
})
</script>

<style scoped>
.sidebar-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.task-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-completed {
  text-decoration: line-through;
  color: #999;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}

.task-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.task-link {
  color: #2563eb;
  text-decoration: none;
}

.task-link:hover {
  text-decoration: underline;
}

.task-assignee {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.125rem;
}

.task-assignee :deep(.anticon) {
  font-size: 0.75rem;
}

.task-actions {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.task-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.stat-item strong {
  color: #1890ff;
  font-weight: 600;
}

:deep(.ant-list-item) {
  padding: 0.5rem 0;
}

:deep(.ant-checkbox-wrapper) {
  width: 100%;
}

:deep(.ant-list-item-action) {
  margin-left: 0.5rem;
}
</style>


<template>
  <a-card :title="t('travelDetail.tasks') || '任务清单'" class="sidebar-card" :bordered="false">
    <div class="task-section">
      <a-list :dataSource="tasks" item-layout="horizontal" size="small">
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-button type="text" size="small" danger @click="handleDeleteTask(item.id)">
                <delete-outlined />
              </a-button>
            </template>
            <a-checkbox 
              v-model:checked="item.completed"
              @change="handleTaskToggle(item)"
            >
              <span :class="{ 'task-completed': item.completed }">
                {{ item.title }}
              </span>
            </a-checkbox>
          </a-list-item>
        </template>
      </a-list>
      
      <div class="task-actions">
        <a-input
          v-model:value="newTaskTitle"
          :placeholder="t('travelDetail.taskPlaceholder') || '添加新任务...'"
          @pressEnter="handleAddTask"
          style="margin-bottom: 0.5rem"
        >
          <template #suffix>
            <plus-outlined 
              @click="handleAddTask"
              :style="{ cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed', color: newTaskTitle.trim() ? '#1890ff' : '#ccc' }"
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
          >
            {{ t('travelDetail.clearCompleted') || '清除已完成' }}
          </a-button>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { useTravelListStore } from '@/stores/travelList'

interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

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

// 加载任务列表
const loadTasks = () => {
  if (!props.travelId) return
  
  const travel = travelListStore.getTravel(props.travelId)
  if (travel?.data?.tasks) {
    tasks.value = travel.data.tasks
  }
}

// 保存任务列表
const saveTasks = () => {
  if (!props.travelId) return
  
  travelListStore.updateTravel(props.travelId, {
    data: {
      ...travelListStore.getTravel(props.travelId)?.data,
      tasks: tasks.value
    }
  })
}

// 添加任务
const handleAddTask = () => {
  if (!newTaskTitle.value.trim()) return
  
  const newTask: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: newTaskTitle.value.trim(),
    completed: false,
    createdAt: Date.now()
  }
  
  tasks.value.push(newTask)
  newTaskTitle.value = ''
  saveTasks()
}

// 切换任务状态
const handleTaskToggle = (task: Task) => {
  saveTasks()
}

// 删除任务
const handleDeleteTask = (taskId: string) => {
  const index = tasks.value.findIndex(t => t.id === taskId)
  if (index !== -1) {
    tasks.value.splice(index, 1)
    saveTasks()
  }
}

// 清除已完成任务
const handleClearCompleted = () => {
  tasks.value = tasks.value.filter(t => !t.completed)
  saveTasks()
}

// 已完成任务数量
const completedCount = computed(() => {
  return tasks.value.filter(t => t.completed).length
})

// 监听travelId变化
watch(() => props.travelId, () => {
  if (props.travelId) {
    loadTasks()
  }
}, { immediate: true })

// 监听props变化
watch(() => props.initialTasks, () => {
  if (props.initialTasks && props.initialTasks.length > 0) {
    tasks.value = props.initialTasks
  }
}, { deep: true })
</script>

<style scoped>
.sidebar-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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


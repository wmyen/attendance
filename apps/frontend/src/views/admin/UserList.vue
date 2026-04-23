<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface User {
  id: number
  email: string
  name: string
  role: string
  department: string | null
  is_active: boolean
  hire_date: string
}

const router = useRouter()
const users = ref<User[]>([])

async function fetchData() {
  try {
    const { data } = await api.get('/users')
    users.value = data.data || []
  } catch { /* ignore */ }
}

function handleAdd() {
  router.push('/admin/users/new')
}

function handleEdit(id: number) {
  router.push(`/admin/users/${id}/edit`)
}

async function handleDeactivate(row: User) {
  try {
    await ElMessageBox.confirm(`確定要停用 ${row.name} 的帳號？`, '確認停用', { type: 'warning' })
    await api.delete(`/users/${row.id}`)
    ElMessage.success('已停用')
    fetchData()
  } catch { /* cancelled */ }
}

onMounted(fetchData)
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span style="font-weight: bold">使用者管理</span>
        <el-button type="primary" @click="handleAdd">新增使用者</el-button>
      </div>
    </template>

    <el-table :data="users" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="email" label="Email" width="200" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
            {{ row.role === 'admin' ? '管理者' : '員工' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="department" label="部門" width="120">
        <template #default="{ row }">{{ row.department || '--' }}</template>
      </el-table-column>
      <el-table-column label="狀態" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
            {{ row.is_active ? '啟用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="hire_date" label="到職日" width="120" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" text @click="handleEdit(row.id)">編輯</el-button>
          <el-button v-if="row.is_active" type="danger" size="small" text @click="handleDeactivate(row)">停用</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

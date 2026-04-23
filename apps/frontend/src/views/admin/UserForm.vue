<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../api'
import { ElMessage } from 'element-plus'

interface UserOption { id: number; name: string }

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const managers = ref<UserOption[]>([])

const form = ref({
  email: '',
  name: '',
  role: 'employee' as 'admin' | 'employee',
  department: '',
  manager_id: null as number | null,
  agent_id: null as number | null,
  hire_date: '',
})

async function fetchManagers() {
  try {
    const { data } = await api.get('/users')
    managers.value = (data.data || []).map((u: any) => ({ id: u.id, name: u.name }))
  } catch { /* ignore */ }
}

async function fetchUser() {
  if (!isEdit.value) return
  try {
    const { data } = await api.get('/users')
    const user = (data.data || []).find((u: any) => u.id === Number(route.params.id))
    if (user) {
      form.value = {
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department || '',
        manager_id: user.manager_id,
        agent_id: user.agent_id,
        hire_date: user.hire_date,
      }
    }
  } catch { /* ignore */ }
}

async function handleSubmit() {
  if (!form.value.email || !form.value.name || !form.value.hire_date) {
    ElMessage.warning('請填寫所有必要欄位')
    return
  }
  loading.value = true
  try {
    const payload: any = {
      email: form.value.email,
      name: form.value.name,
      role: form.value.role,
      department: form.value.department || undefined,
      manager_id: form.value.manager_id || undefined,
      agent_id: form.value.agent_id || undefined,
      hire_date: form.value.hire_date,
    }

    if (isEdit.value) {
      await api.put(`/users/${route.params.id}`, payload)
      ElMessage.success('使用者已更新')
    } else {
      await api.post('/users', payload)
      ElMessage.success('使用者已建立，密碼已發送至 Email')
    }
    router.push('/admin/users')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失敗')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchManagers()
  fetchUser()
})
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span style="font-weight: bold">{{ isEdit ? '編輯使用者' : '新增使用者' }}</span>
    </template>

    <el-form :model="form" @submit.prevent="handleSubmit" label-width="100px" style="max-width: 600px">
      <el-form-item label="Email" required>
        <el-input v-model="form.email" placeholder="請輸入 Email" :disabled="isEdit" />
      </el-form-item>

      <el-form-item label="姓名" required>
        <el-input v-model="form.name" placeholder="請輸入姓名" />
      </el-form-item>

      <el-form-item label="角色" required>
        <el-select v-model="form.role" style="width: 100%">
          <el-option label="員工" value="employee" />
          <el-option label="管理者" value="admin" />
        </el-select>
      </el-form-item>

      <el-form-item label="部門">
        <el-input v-model="form.department" placeholder="請輸入部門（選填）" />
      </el-form-item>

      <el-form-item label="直屬主管">
        <el-select v-model="form.manager_id" placeholder="請選擇直屬主管（選填）" clearable style="width: 100%">
          <el-option v-for="m in managers" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="預設代理人">
        <el-select v-model="form.agent_id" placeholder="請選擇代理人（選填）" clearable style="width: 100%">
          <el-option v-for="m in managers" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="到職日" required>
        <el-date-picker v-model="form.hire_date" type="date" value-format="YYYY-MM-DD" placeholder="選擇到職日期" style="width: 100%" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit">{{ isEdit ? '更新' : '建立' }}</el-button>
        <el-button @click="router.push('/admin/users')">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

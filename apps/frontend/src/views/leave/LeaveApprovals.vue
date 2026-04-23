<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface LeaveRequest {
  id: number
  user_id: number
  employee_name?: string
  leave_type_id: number
  start_date: string
  end_date: string
  hours: number
  reason: string
  status: string
}

const pendingList = ref<LeaveRequest[]>([])

async function fetchData() {
  try {
    const { data } = await api.get('/leave/requests/pending')
    pendingList.value = data.data || []
  } catch { /* ignore */ }
}

function formatDt(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

async function handleApprove(row: LeaveRequest) {
  try {
    await api.put(`/leave/requests/${row.id}/approve`)
    ElMessage.success('已核准')
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失敗')
  }
}

async function handleReject(row: LeaveRequest) {
  try {
    const { value } = await ElMessageBox.prompt('請輸入駁回理由', '駁回假單', {
      confirmButtonText: '確認駁回',
      cancelButtonText: '取消',
      inputPlaceholder: '駁回理由',
    })
    await api.put(`/leave/requests/${row.id}/reject`, { rejection_reason: value })
    ElMessage.success('已駁回')
    fetchData()
  } catch { /* cancelled */ }
}

onMounted(fetchData)
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span style="font-weight: bold">待簽核假單</span>
        <el-button @click="fetchData" text>重新整理</el-button>
      </div>
    </template>

    <el-empty v-if="pendingList.length === 0" description="目前沒有待簽核的假單" />

    <el-table v-else :data="pendingList" stripe style="width: 100%">
      <el-table-column prop="employee_name" label="申請人" width="100" />
      <el-table-column label="假別" width="100">
        <template #default="{ row }">類型 {{ row.leave_type_id }}</template>
      </el-table-column>
      <el-table-column label="開始" width="140">
        <template #default="{ row }">{{ formatDt(row.start_date) }}</template>
      </el-table-column>
      <el-table-column label="結束" width="140">
        <template #default="{ row }">{{ formatDt(row.end_date) }}</template>
      </el-table-column>
      <el-table-column prop="hours" label="時數" width="80" />
      <el-table-column prop="reason" label="事由" show-overflow-tooltip />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="handleApprove(row)">核准</el-button>
          <el-button type="danger" size="small" @click="handleReject(row)">駁回</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

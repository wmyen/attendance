<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface LeaveRequest {
  id: number
  leave_type_id: number
  leave_type_name?: string
  start_date: string
  end_date: string
  hours: number
  reason: string
  status: string
  rejection_reason: string | null
  created_at: string
}

const records = ref<LeaveRequest[]>([])

async function fetchData() {
  try {
    const { data } = await api.get('/leave/requests')
    records.value = data.data || []
  } catch { /* ignore */ }
}

function statusTag(status: string) {
  const map: Record<string, { type: 'warning' | 'success' | 'danger' | 'info'; label: string }> = {
    pending: { type: 'warning', label: '待簽核' },
    approved: { type: 'success', label: '已核准' },
    rejected: { type: 'danger', label: '已駁回' },
    cancelled: { type: 'info', label: '已取消' },
  }
  return map[status] || { type: 'info' as const, label: status }
}

async function handleCancel(row: LeaveRequest) {
  try {
    await ElMessageBox.confirm('確定要取消此請假申請？', '確認', { type: 'warning' })
    await api.delete(`/leave/requests/${row.id}`)
    ElMessage.success('已取消')
    fetchData()
  } catch { /* cancelled */ }
}

function formatDt(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

onMounted(fetchData)
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span style="font-weight: bold">我的請假紀錄</span>
        <el-button @click="fetchData" text>重新整理</el-button>
      </div>
    </template>

    <el-table :data="records" stripe style="width: 100%">
      <el-table-column label="假別" width="100">
        <template #default="{ row }">{{ row.leave_type_name || `類型 ${row.leave_type_id}` }}</template>
      </el-table-column>
      <el-table-column label="開始" width="140">
        <template #default="{ row }">{{ formatDt(row.start_date) }}</template>
      </el-table-column>
      <el-table-column label="結束" width="140">
        <template #default="{ row }">{{ formatDt(row.end_date) }}</template>
      </el-table-column>
      <el-table-column prop="hours" label="時數" width="80" />
      <el-table-column prop="reason" label="事由" show-overflow-tooltip />
      <el-table-column label="狀態" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status).type" size="small">{{ statusTag(row.status).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" type="danger" size="small" text @click="handleCancel(row)">取消</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'
import { ElMessage } from 'element-plus'

const records = ref<any[]>([])

const typeLabels: Record<string, string> = {
  missed_clock_in: '補登上班',
  missed_clock_out: '補登下班',
  correct_clock_in: '更正上班',
  correct_clock_out: '更正下班',
}

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待審核', type: 'warning' },
  approved: { label: '已核准', type: 'success' },
  rejected: { label: '已駁回', type: 'danger' },
  cancelled: { label: '已取消', type: 'info' },
}

async function fetchRecords() {
  try {
    const { data } = await api.get('/attendance/corrections')
    records.value = data.data || []
  } catch {
    ElMessage.error('載入失敗')
  }
}

async function handleCancel(id: number) {
  try {
    await api.delete(`/attendance/corrections/${id}`)
    ElMessage.success('已取消')
    fetchRecords()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '取消失敗')
  }
}

onMounted(fetchRecords)
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span style="font-weight: bold">我的補登/更正紀錄</span>
    </template>

    <el-table :data="records" stripe>
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column label="類型" width="120">
        <template #default="{ row }">{{ typeLabels[row.correction_type] || row.correction_type }}</template>
      </el-table-column>
      <el-table-column prop="original_time" label="原始時間" width="180" />
      <el-table-column prop="requested_time" label="申請時間" width="180" />
      <el-table-column prop="reason" label="原因" min-width="150" />
      <el-table-column label="狀態" width="100">
        <template #default="{ row }">
          <el-tag :type="(statusMap[row.status]?.type as any)" size="small">{{ statusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rejection_reason" label="駁回理由" width="150" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" type="danger" size="small" text @click="handleCancel(row.id)">取消</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

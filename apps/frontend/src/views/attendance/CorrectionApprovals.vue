<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const records = ref<any[]>([])

const typeLabels: Record<string, string> = {
  missed_clock_in: '補登上班',
  missed_clock_out: '補登下班',
  correct_clock_in: '更正上班',
  correct_clock_out: '更正下班',
}

async function fetchPending() {
  try {
    const { data } = await api.get('/attendance/corrections/pending')
    records.value = data.data || []
  } catch {
    ElMessage.error('載入失敗')
  }
}

async function handleApprove(id: number) {
  try {
    await api.put(`/attendance/corrections/${id}/approve`)
    ElMessage.success('已核准')
    fetchPending()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失敗')
  }
}

async function handleReject(id: number) {
  try {
    const { value } = await ElMessageBox.prompt('請輸入駁回理由', '駁回', { confirmButtonText: '確認', cancelButtonText: '取消', inputPlaceholder: '駁回理由（選填）' })
    await api.put(`/attendance/corrections/${id}/reject`, { rejection_reason: value })
    ElMessage.success('已駁回')
    fetchPending()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message !== 'cancel') {
      // If prompt was cancelled, try reject without reason
      if (e === 'cancel' || e?.message === 'cancel') return
    }
  }
}

onMounted(fetchPending)
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span style="font-weight: bold">待簽核打卡補登/更正</span>
    </template>

    <el-empty v-if="records.length === 0" description="目前無待簽核項目" />

    <el-table v-else :data="records" stripe>
      <el-table-column prop="employee_name" label="申請人" width="100" />
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column label="類型" width="120">
        <template #default="{ row }">{{ typeLabels[row.correction_type] || row.correction_type }}</template>
      </el-table-column>
      <el-table-column prop="original_time" label="原始時間" width="180" />
      <el-table-column prop="requested_time" label="申請時間" width="180" />
      <el-table-column prop="reason" label="原因" min-width="150" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="handleApprove(row.id)">核准</el-button>
          <el-button type="danger" size="small" @click="handleReject(row.id)">駁回</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

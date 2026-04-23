<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

interface AttendanceRecord {
  id: number
  date: string
  clock_in: string | null
  clock_out: string | null
}

const records = ref<AttendanceRecord[]>([])
const searchMonth = ref(new Date().toISOString().slice(0, 7))

async function fetchData() {
  try {
    const { data } = await api.get('/attendance/monthly', { params: { month: searchMonth.value } })
    if (data.success) {
      records.value = data.data || []
    }
  } catch { /* ignore */ }
}

function formatDate(iso: string | null) {
  if (!iso) return '--'
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function formatWorkingHours(row: AttendanceRecord) {
  if (!row.clock_in || !row.clock_out) return '--'
  const diff = new Date(row.clock_out).getTime() - new Date(row.clock_in).getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}小時${mins}分鐘`
}

onMounted(fetchData)
</script>

<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">月度出勤紀錄</span>
          <div style="display: flex; gap: 8px; align-items: center">
            <el-date-picker
              v-model="searchMonth"
              type="month"
              placeholder="選擇月份"
              format="YYYY/MM"
              value-format="YYYY-MM"
              @change="fetchData"
            />
          </div>
        </div>
      </template>

      <el-table :data="records" stripe style="width: 100%">
        <el-table-column prop="date" label="日期" width="140" />
        <el-table-column label="上班時間" width="120">
          <template #default="{ row }">{{ formatDate(row.clock_in) }}</template>
        </el-table-column>
        <el-table-column label="下班時間" width="120">
          <template #default="{ row }">{{ formatDate(row.clock_out) }}</template>
        </el-table-column>
        <el-table-column label="工時" width="140">
          <template #default="{ row }">{{ formatWorkingHours(row) }}</template>
        </el-table-column>
        <el-table-column label="狀態">
          <template #default="{ row }">
            <el-tag v-if="row.clock_out" type="success" size="small">正常</el-tag>
            <el-tag v-else-if="row.clock_in" type="warning" size="small">工作中</el-tag>
            <el-tag v-else type="info" size="small">異常</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

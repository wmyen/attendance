<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'

interface LeaveBalance {
  id: number
  leave_type_id: number
  total_hours: number
  used_hours: number
  year: number
  leave_type?: { name: string }
}

const balances = ref<LeaveBalance[]>([])

async function fetchData() {
  try {
    const { data } = await api.get('/leave/balances')
    balances.value = data.data || []
  } catch { /* ignore */ }
}

function remaining(row: LeaveBalance) {
  return (row.total_hours - row.used_hours).toFixed(1)
}

function typeName(row: LeaveBalance) {
  return row.leave_type?.name || `類型 ${row.leave_type_id}`
}

onMounted(fetchData)
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span style="font-weight: bold">假別額度總覽</span>
        <el-button @click="fetchData" text>重新整理</el-button>
      </div>
    </template>

    <el-table :data="balances" stripe style="width: 100%">
      <el-table-column label="假別" width="140">
        <template #default="{ row }">{{ typeName(row) }}</template>
      </el-table-column>
      <el-table-column prop="year" label="年度" width="80" />
      <el-table-column prop="total_hours" label="總額度（小時）" width="140" />
      <el-table-column prop="used_hours" label="已用（小時）" width="140" />
      <el-table-column label="剩餘（小時）" width="140">
        <template #default="{ row }">
          <el-tag :type="Number(remaining(row)) > 0 ? 'success' : 'danger'">
            {{ remaining(row) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

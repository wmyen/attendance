<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'
import { ElMessage } from 'element-plus'

interface LeaveType { id: number; name: string }
interface UserOption { id: number; name: string }

const leaveTypes = ref<LeaveType[]>([])
const agents = ref<UserOption[]>([])
const loading = ref(false)

const form = ref({
  leave_type_id: null as number | null,
  agent_id: null as number | null,
  dateRange: [] as string[],
  hours: 8,
  reason: '',
})

async function fetchOptions() {
  const [typesRes, usersRes] = await Promise.all([
    api.get('/leave/types'),
    api.get('/users'),
  ])
  leaveTypes.value = typesRes.data.data || []
  agents.value = (usersRes.data.data || []).filter((u: any) => u.is_active)
}

async function handleSubmit() {
  if (!form.value.leave_type_id || form.value.dateRange.length < 2 || !form.value.reason) {
    ElMessage.warning('請填寫所有必要欄位')
    return
  }
  loading.value = true
  try {
    await api.post('/leave/requests', {
      leave_type_id: form.value.leave_type_id,
      agent_id: form.value.agent_id || undefined,
      start_date: form.value.dateRange[0],
      end_date: form.value.dateRange[1],
      hours: form.value.hours,
      reason: form.value.reason,
    })
    ElMessage.success('請假申請已提交')
    form.value = { leave_type_id: null, agent_id: null, dateRange: [], hours: 8, reason: '' }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '提交失敗')
  } finally {
    loading.value = false
  }
}

onMounted(fetchOptions)
</script>

<template>
  <el-card shadow="hover">
    <template #header><span style="font-weight: bold">請假申請</span></template>

    <el-form :model="form" @submit.prevent="handleSubmit" label-width="100px" style="max-width: 600px">
      <el-form-item label="假別" required>
        <el-select v-model="form.leave_type_id" placeholder="請選擇假別" style="width: 100%">
          <el-option v-for="t in leaveTypes" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="請假時間" required>
        <el-date-picker
          v-model="form.dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="開始時間"
          end-placeholder="結束時間"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="時數" required>
        <el-input-number v-model="form.hours" :min="0.5" :max="240" :step="0.5" />
      </el-form-item>

      <el-form-item label="代理人">
        <el-select v-model="form.agent_id" placeholder="請選擇代理人（選填）" clearable style="width: 100%">
          <el-option v-for="u in agents" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="事由" required>
        <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請輸入請假事由" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit">送出申請</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

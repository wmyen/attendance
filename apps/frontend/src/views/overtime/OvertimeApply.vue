<script setup lang="ts">
import { ref } from 'vue'
import api from '../../api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const form = ref({
  dateRange: [] as string[],
  hours: 2,
  reason: '',
})

async function handleSubmit() {
  if (form.value.dateRange.length < 2 || !form.value.reason) {
    ElMessage.warning('請填寫所有必要欄位')
    return
  }
  loading.value = true
  try {
    await api.post('/overtime/requests', {
      start_time: form.value.dateRange[0],
      end_time: form.value.dateRange[1],
      hours: form.value.hours,
      reason: form.value.reason,
    })
    ElMessage.success('加班申請已提交')
    form.value = { dateRange: [], hours: 2, reason: '' }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '提交失敗')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card shadow="hover">
    <template #header><span style="font-weight: bold">加班申請</span></template>

    <el-form :model="form" @submit.prevent="handleSubmit" label-width="100px" style="max-width: 600px">
      <el-form-item label="加班時間" required>
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
        <el-input-number v-model="form.hours" :min="0.5" :max="24" :step="0.5" />
      </el-form-item>

      <el-form-item label="事由" required>
        <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請輸入加班事由" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit">送出申請</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

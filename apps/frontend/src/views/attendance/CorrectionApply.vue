<script setup lang="ts">
import { ref } from 'vue'
import api from '../../api'
import { ElMessage } from 'element-plus'

const loading = ref(false)

const form = ref({
  date: '',
  correction_type: 'missed_clock_in' as string,
  original_time: '',
  requested_time: '',
  reason: '',
})

const typeOptions = [
  { label: '補登上班打卡', value: 'missed_clock_in' },
  { label: '補登下班打卡', value: 'missed_clock_out' },
  { label: '更正上班時間', value: 'correct_clock_in' },
  { label: '更正下班時間', value: 'correct_clock_out' },
]

const isCorrection = (type: string) => type.startsWith('correct_')

async function handleSubmit() {
  if (!form.value.date || !form.value.correction_type || !form.value.requested_time || !form.value.reason) {
    ElMessage.warning('請填寫所有必要欄位')
    return
  }
  loading.value = true
  try {
    const payload: any = {
      date: form.value.date,
      correction_type: form.value.correction_type,
      requested_time: form.value.requested_time,
      reason: form.value.reason,
    }
    if (isCorrection(form.value.correction_type) && form.value.original_time) {
      payload.original_time = form.value.original_time
    }
    await api.post('/attendance/corrections', payload)
    ElMessage.success('申請已提交')
    form.value = { date: '', correction_type: 'missed_clock_in', original_time: '', requested_time: '', reason: '' }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '提交失敗')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span style="font-weight: bold">申請打卡補登/更正</span>
    </template>

    <el-form :model="form" @submit.prevent="handleSubmit" label-width="120px" style="max-width: 600px">
      <el-form-item label="打卡日期" required>
        <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" placeholder="選擇日期" style="width: 100%" />
      </el-form-item>

      <el-form-item label="申請類型" required>
        <el-select v-model="form.correction_type" style="width: 100%">
          <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="isCorrection(form.correction_type)" label="原始時間">
        <el-date-picker v-model="form.original_time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="選擇原始打卡時間" style="width: 100%" />
      </el-form-item>

      <el-form-item label="申請時間" required>
        <el-date-picker v-model="form.requested_time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="選擇正確的打卡時間" style="width: 100%" />
      </el-form-item>

      <el-form-item label="原因" required>
        <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="請說明原因" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit">提交申請</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

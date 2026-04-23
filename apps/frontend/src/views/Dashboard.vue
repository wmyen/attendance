<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { ElMessage } from 'element-plus'

interface TodayRecord {
  clock_in: string | null
  clock_out: string | null
}

const todayRecord = ref<TodayRecord>({ clock_in: null, clock_out: null })
const currentTime = ref('')
const loading = ref(false)
let timer: ReturnType<typeof setInterval>

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

async function fetchToday() {
  try {
    const { data } = await api.get('/attendance/today')
    if (data.success) {
      todayRecord.value = data.data || { clock_in: null, clock_out: null }
    }
  } catch { /* no record yet */ }
}

async function handleClockIn() {
  loading.value = true
  try {
    const { data } = await api.post('/attendance/clock-in')
    if (data.success) {
      ElMessage.success('上班打卡成功')
      await fetchToday()
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '打卡失敗')
  } finally {
    loading.value = false
  }
}

async function handleClockOut() {
  loading.value = true
  try {
    const { data } = await api.post('/attendance/clock-out')
    if (data.success) {
      ElMessage.success('下班打卡成功')
      await fetchToday()
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '打卡失敗')
  } finally {
    loading.value = false
  }
}

function formatTime(iso: string | null) {
  if (!iso) return '--'
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  fetchToday()
})
</script>

<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <div style="text-align: center; padding: 20px 0">
            <div style="font-size: 32px; font-weight: bold; color: #303133; margin-bottom: 8px">{{ currentTime }}</div>
            <div style="color: #909399; font-size: 14px; margin-bottom: 32px">現在時間</div>

            <el-row :gutter="16" justify="center">
              <el-col :span="10">
                <el-button
                  type="primary"
                  size="large"
                  :disabled="!!todayRecord.clock_in"
                  :loading="loading"
                  @click="handleClockIn"
                  style="width: 100%; height: 60px; font-size: 18px"
                >
                  上班打卡
                </el-button>
                <div style="margin-top: 8px; color: #909399; font-size: 13px">
                  {{ todayRecord.clock_in ? formatTime(todayRecord.clock_in) : '尚未打卡' }}
                </div>
              </el-col>
              <el-col :span="10">
                <el-button
                  type="success"
                  size="large"
                  :disabled="!todayRecord.clock_in || !!todayRecord.clock_out"
                  :loading="loading"
                  @click="handleClockOut"
                  style="width: 100%; height: 60px; font-size: 18px"
                >
                  下班打卡
                </el-button>
                <div style="margin-top: 8px; color: #909399; font-size: 13px">
                  {{ todayRecord.clock_out ? formatTime(todayRecord.clock_out) : '尚未打卡' }}
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span style="font-weight: bold">今日狀態</span></template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="上班時間">{{ formatTime(todayRecord.clock_in) }}</el-descriptions-item>
            <el-descriptions-item label="下班時間">{{ formatTime(todayRecord.clock_out) }}</el-descriptions-item>
            <el-descriptions-item label="狀態">
              <el-tag v-if="todayRecord.clock_out" type="success">已下班</el-tag>
              <el-tag v-else-if="todayRecord.clock_in" type="warning">工作中</el-tag>
              <el-tag v-else type="info">尚未打卡</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

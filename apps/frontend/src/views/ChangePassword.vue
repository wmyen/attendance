<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)

async function handleSubmit() {
  if (!form.value.oldPassword || !form.value.newPassword || !form.value.confirmPassword) {
    ElMessage.warning('請填寫所有欄位')
    return
  }
  if (form.value.newPassword.length < 8) {
    ElMessage.warning('新密碼至少需 8 位字元')
    return
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    ElMessage.warning('兩次輸入的新密碼不一致')
    return
  }

  loading.value = true
  try {
    await auth.changePassword(form.value.oldPassword, form.value.newPassword)
    ElMessage.success('密碼修改成功')
    router.push('/dashboard')
  } catch {
    ElMessage.error('舊密碼不正確')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5">
    <el-card style="width: 440px" shadow="always">
      <template #header>
        <div style="text-align: center">
          <h2 style="margin: 0; color: #303133">修改密碼</h2>
          <p style="margin: 8px 0 0; color: #909399; font-size: 14px">
            {{ auth.mustChangePassword ? '首次登入請設定新密碼' : '請輸入新密碼' }}
          </p>
        </div>
      </template>

      <el-form :model="form" @submit.prevent="handleSubmit" label-position="top">
        <el-form-item label="舊密碼">
          <el-input v-model="form.oldPassword" type="password" placeholder="請輸入舊密碼" prefix-icon="Lock" size="large" show-password />
        </el-form-item>

        <el-form-item label="新密碼">
          <el-input v-model="form.newPassword" type="password" placeholder="至少 8 位字元" prefix-icon="Key" size="large" show-password />
        </el-form-item>

        <el-form-item label="確認新密碼">
          <el-input v-model="form.confirmPassword" type="password" placeholder="再次輸入新密碼" prefix-icon="Key" size="large" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" native-type="submit" size="large" style="width: 100%">
            確認修改
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

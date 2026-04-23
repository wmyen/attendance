<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = ref({ email: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.value.email || !form.value.password) {
    ElMessage.warning('請輸入帳號和密碼')
    return
  }
  loading.value = true
  try {
    const result = await auth.login(form.value.email, form.value.password)
    if (result.mustChangePassword) {
      router.push('/change-password')
    } else {
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    }
  } catch {
    ElMessage.error('帳號或密碼錯誤')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5">
    <el-card style="width: 400px" shadow="always">
      <template #header>
        <div style="text-align: center">
          <h2 style="margin: 0; color: #303133">考勤管理系統</h2>
          <p style="margin: 8px 0 0; color: #909399; font-size: 14px">請登入您的帳號</p>
        </div>
      </template>

      <el-form :model="form" @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="帳號（Email）">
          <el-input v-model="form.email" placeholder="請輸入 Email" prefix-icon="Message" size="large" />
        </el-form-item>

        <el-form-item label="密碼">
          <el-input v-model="form.password" type="password" placeholder="請輸入密碼" prefix-icon="Lock" size="large" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" native-type="submit" size="large" style="width: 100%">
            登入
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

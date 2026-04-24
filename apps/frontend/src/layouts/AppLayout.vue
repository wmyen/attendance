<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  Menu as IconMenu,
  Timer,
  Calendar,
  Document,
  Checked,
  PieChart,
  Odometer,
  List,
  Stamp,
  User,
  SwitchButton,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isCollapsed = ref(false)

const activeMenu = computed(() => route.path)

function handleSelect(path: string) {
  router.push(path)
}

async function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <el-container style="height: 100vh">
    <el-aside :width="isCollapsed ? '64px' : '220px'" style="transition: width 0.3s; border-right: 1px solid #e4e7ed">
      <div style="padding: 16px; text-align: center; font-weight: bold; font-size: 16px; white-space: nowrap; overflow: hidden">
        {{ isCollapsed ? '考勤' : '考勤管理系統' }}
      </div>
      <el-menu :default-active="activeMenu" :collapse="isCollapsed" @select="handleSelect" style="border-right: none">
        <el-menu-item index="/dashboard">
          <el-icon><Timer /></el-icon>
          <template #title>首頁打卡</template>
        </el-menu-item>
        <el-menu-item index="/attendance/monthly">
          <el-icon><Calendar /></el-icon>
          <template #title>月度出勤</template>
        </el-menu-item>

        <el-sub-menu index="correction">
          <template #title>
            <el-icon><Stamp /></el-icon>
            <span>打卡補登</span>
          </template>
          <el-menu-item index="/attendance/correction/apply">申請補登/更正</el-menu-item>
          <el-menu-item index="/attendance/correction/records">補登紀錄</el-menu-item>
          <el-menu-item index="/attendance/correction/approvals">補登簽核</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="leave">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>請假管理</span>
          </template>
          <el-menu-item index="/leave/apply">請假申請</el-menu-item>
          <el-menu-item index="/leave/records">請假紀錄</el-menu-item>
          <el-menu-item index="/leave/approvals">假單簽核</el-menu-item>
          <el-menu-item index="/leave/balance">假別額度</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="overtime">
          <template #title>
            <el-icon><Odometer /></el-icon>
            <span>加班管理</span>
          </template>
          <el-menu-item index="/overtime/apply">加班申請</el-menu-item>
          <el-menu-item index="/overtime/records">加班紀錄</el-menu-item>
          <el-menu-item index="/overtime/approvals">加班簽核</el-menu-item>
        </el-sub-menu>

        <el-menu-item v-if="auth.isAdmin" index="/admin/users">
          <el-icon><User /></el-icon>
          <template #title>使用者管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e4e7ed; padding: 0 20px">
        <div style="display: flex; align-items: center; gap: 12px">
          <el-button :icon="IconMenu" text @click="isCollapsed = !isCollapsed" />
          <span style="font-size: 14px; color: #606266">{{ route.meta.title || '' }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px">
          <span style="font-size: 14px">{{ auth.user?.name }}</span>
          <el-tag :type="auth.isAdmin ? 'danger' : 'info'" size="small">{{ auth.isAdmin ? '管理者' : '員工' }}</el-tag>
          <el-button :icon="SwitchButton" text @click="handleLogout" title="登出" />
        </div>
      </el-header>

      <el-main style="background: #f5f7fa; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

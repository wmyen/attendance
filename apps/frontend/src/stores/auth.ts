import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

interface UserInfo {
  id: number
  email: string
  name: string
  role: 'admin' | 'employee'
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const user = ref<UserInfo | null>(null)
  const mustChangePassword = ref(false)

  const isLoggedIn = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    const result = data.data
    accessToken.value = result.accessToken
    refreshToken.value = result.refreshToken
    user.value = result.user
    mustChangePassword.value = result.mustChangePassword
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    return result
  }

  async function refresh() {
    const { data } = await api.post('/auth/refresh', { refreshToken: refreshToken.value })
    const result = data.data
    accessToken.value = result.accessToken
    refreshToken.value = result.refreshToken
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    return result
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    await api.post('/auth/change-password', { oldPassword, newPassword })
    mustChangePassword.value = false
  }

  async function fetchProfile() {
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.data
      mustChangePassword.value = data.data.mustChangePassword ?? false
    } catch {
      logout()
    }
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    mustChangePassword.value = false
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return {
    accessToken,
    refreshToken,
    user,
    mustChangePassword,
    isLoggedIn,
    isAdmin,
    login,
    refresh,
    changePassword,
    fetchProfile,
    logout,
  }
})

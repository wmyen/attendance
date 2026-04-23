import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      const auth = useAuthStore()
      if (!auth.refreshToken) {
        auth.logout()
        router.push('/login')
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newTokens = await auth.refresh()
        pendingRequests.forEach((cb) => cb(newTokens.accessToken))
        pendingRequests = []
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
        return api(originalRequest)
      } catch {
        auth.logout()
        router.push('/login')
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default api

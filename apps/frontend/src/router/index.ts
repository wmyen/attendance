import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const AppLayout = () => import('../layouts/AppLayout.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('../views/ChangePassword.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: 'attendance/monthly',
        name: 'MonthlyAttendance',
        component: () => import('../views/MonthlyAttendance.vue'),
      },
      {
        path: 'leave/apply',
        name: 'LeaveApply',
        component: () => import('../views/leave/LeaveApply.vue'),
      },
      {
        path: 'leave/records',
        name: 'LeaveRecords',
        component: () => import('../views/leave/LeaveRecords.vue'),
      },
      {
        path: 'leave/approvals',
        name: 'LeaveApprovals',
        component: () => import('../views/leave/LeaveApprovals.vue'),
      },
      {
        path: 'leave/balance',
        name: 'LeaveBalance',
        component: () => import('../views/leave/LeaveBalance.vue'),
      },
      {
        path: 'overtime/apply',
        name: 'OvertimeApply',
        component: () => import('../views/overtime/OvertimeApply.vue'),
      },
      {
        path: 'overtime/records',
        name: 'OvertimeRecords',
        component: () => import('../views/overtime/OvertimeRecords.vue'),
      },
      {
        path: 'overtime/approvals',
        name: 'OvertimeApprovals',
        component: () => import('../views/overtime/OvertimeApprovals.vue'),
      },
      {
        path: 'admin/users',
        name: 'UserList',
        component: () => import('../views/admin/UserList.vue'),
        meta: { adminOnly: true },
      },
      {
        path: 'admin/users/new',
        name: 'UserNew',
        component: () => import('../views/admin/UserForm.vue'),
        meta: { adminOnly: true },
      },
      {
        path: 'admin/users/:id/edit',
        name: 'UserEdit',
        component: () => import('../views/admin/UserForm.vue'),
        meta: { adminOnly: true },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

let profileFetched = false

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  if (auth.isLoggedIn && !auth.user && !profileFetched) {
    profileFetched = true
    try {
      await auth.fetchProfile()
    } catch {
      auth.logout()
      return next({ name: 'Login' })
    }
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (to.meta.guest && auth.isLoggedIn) {
    return next({ name: 'Dashboard' })
  }

  if (to.meta.adminOnly && !auth.isAdmin) {
    return next({ name: 'Dashboard' })
  }

  if (auth.isLoggedIn && auth.mustChangePassword && to.name !== 'ChangePassword') {
    return next({ name: 'ChangePassword' })
  }

  next()
})

export default router

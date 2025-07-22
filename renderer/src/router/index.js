import { createRouter, createWebHashHistory } from 'vue-router'
import PointCloudViewer from '../components/PointCloudViewer.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: PointCloudViewer,
    meta: {
      title: '点云可视化'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: {
      title: '设置'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: {
      title: '关于'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(), // Electron 中推荐使用 Hash 模式
  routes
})

// 路由守卫 - 更新页面标题
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.title) {
    document.title = `点云三维可视化系统 - ${to.meta.title}`
  }
  next()
})

export default router

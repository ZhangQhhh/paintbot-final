<template>
  <aside class="sidebar">
    <div class="logo">🌐 点云可视化</div>
    <nav>
      <ul class="nav-list">
        <li>
          <router-link 
            to="/" 
            class="nav-link"
            :class="{ active: $route.name === 'Home' }"
          >
            🏠 点云三维显示
          </router-link>
        </li>
        <li>
          <router-link 
            to="/settings" 
            class="nav-link"
            :class="{ active: $route.name === 'Settings' }"
          >
            ⚙️ 系统设置
          </router-link>
        </li>
        <li>
          <router-link 
            to="/about" 
            class="nav-link"
            :class="{ active: $route.name === 'About' }"
          >
            ℹ️ 关于软件
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

const $route = useRoute()
</script>

<style scoped>
.sidebar {
  width: 200px;
  min-width: 200px;
  background: linear-gradient(180deg, #b7d8f6 0%, #eaf2fb 100%);
  color: #234;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0 0 0;
  box-shadow: 2px 0 8px #b7d8f633;
}

.logo {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 40px;
  letter-spacing: 2px;
  color: #42b883;
  user-select: none;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.nav-list li {
  width: 100%;
}

.nav-link {
  display: block;
  padding: 16px 24px;
  color: #555;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  font-size: 16px;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(66, 184, 131, 0.1);
  color: #42b883;
  border-left-color: #42b883;
}

.nav-link.active,
.nav-link.router-link-active {
  background: rgba(66, 184, 131, 0.15);
  color: #42b883;
  border-left-color: #42b883;
  font-weight: 600;
}
</style>

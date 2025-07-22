<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
</script>

<template>
  <div class="app-container">
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
:global(html, body, #app) {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  background: #eaf2fb;
}
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #eaf2fb;
  min-height: 100vh;
  min-width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  background: #eaf2fb;
  height: 100vh;
  width: calc(100vw - 200px);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
}
</style>

<template>
  <div class="about-container">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="text-center mb-5">
            <h1 class="display-4 mb-3">点云三维可视化系统</h1>
            <p class="lead text-muted">基于 Electron + Vue 3 + Three.js 构建的专业点云处理工具</p>
          </div>

          <div class="card">
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h5>技术栈</h5>
                  <ul class="list-unstyled">
                    <li><i class="bi bi-check-circle text-success me-2"></i>Electron</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Vue 3</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Three.js</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Bootstrap 5</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Vite</li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <h5>支持格式</h5>
                  <ul class="list-unstyled">
                    <li><i class="bi bi-file-earmark text-info me-2"></i>CSV 格式</li>
                    <li><i class="bi bi-file-earmark text-info me-2"></i>PCD 格式</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-4">
            <div class="card-body">
              <h5>版本信息</h5>
              <table class="table table-borderless">
                <tbody>
                  <tr>
                    <td><strong>应用版本：</strong></td>
                    <td>{{ appVersion }}</td>
                  </tr>
                  <tr>
                    <td><strong>作者：</strong></td>
                    <td>张琦</td>
                  </tr>
                  <tr>
                    <td><strong>构建时间：</strong></td>
                    <td>{{ buildTime }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="text-center mt-4">
            <p class="text-muted">
              © 2025 点云三维可视化系统. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const appVersion = ref('1.0.0')
const buildTime = ref(new Date().toLocaleDateString('zh-CN'))
</script>

<style scoped>
.about-container {
  padding: 40px 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.card {
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.display-4 {
  font-weight: 300;
  color: #2c3e50;
}

.bi {
  width: 16px;
  height: 16px;
}
</style>

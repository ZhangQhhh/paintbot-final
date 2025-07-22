<template>
  <div class="settings-container">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h2 class="mb-4">系统设置</h2>
          
          <!-- 显示设置 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">显示设置</h5>
            </div>
            <div class="card-body">
              <div class="form-check form-switch mb-3">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="autoRotate" 
                  :checked="autoRotate"
                  @change="updateAutoRotate"
                >
                <label class="form-check-label" for="autoRotate">
                  自动旋转点云
                </label>
              </div>
              <div class="form-check form-switch mb-3">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="showAxis" 
                  :checked="showAxis"
                  @change="updateShowAxis"
                >
                <label class="form-check-label" for="showAxis">
                  显示坐标轴
                </label>
              </div>
            </div>
          </div>

          <!-- 性能设置 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">性能设置</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label for="pointSize" class="form-label">点云大小: {{ pointSize }}</label>
                <input 
                  type="range" 
                  class="form-range" 
                  id="pointSize" 
                  :value="pointSize"
                  @input="updatePointSize"
                  min="1" 
                  max="30" 
                  step="1"
                >
              </div>
              <div class="mb-3">
                <label for="renderQuality" class="form-label">渲染质量</label>
                <select 
                  class="form-select" 
                  id="renderQuality" 
                  :value="renderQuality"
                  @change="updateRenderQuality"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-primary" @click="saveSettings">
              保存设置
            </button>
            <button type="button" class="btn btn-secondary" @click="resetSettings">
              重置为默认
            </button>
          </div>
          
          <!-- 设置保存提示 -->
          <div v-if="showSavedMessage" class="alert alert-success mt-3" role="alert">
            设置已保存并应用！
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const showSavedMessage = ref(false)

// 计算属性获取设置值
const autoRotate = computed(() => store.getters.autoRotate)
const showAxis = computed(() => store.getters.showAxis)
const pointSize = computed(() => store.getters.pointSize)
const renderQuality = computed(() => store.getters.renderQuality)

// 更新设置的方法
const updateAutoRotate = (event) => {
  store.dispatch('updateSetting', {
    key: 'autoRotate',
    value: event.target.checked
  })
}

const updateShowAxis = (event) => {
  store.dispatch('updateSetting', {
    key: 'showAxis',
    value: event.target.checked
  })
}

const updatePointSize = (event) => {
  store.dispatch('updateSetting', {
    key: 'pointSize',
    value: parseFloat(event.target.value)
  })
}

const updateRenderQuality = (event) => {
  store.dispatch('updateSetting', {
    key: 'renderQuality',
    value: event.target.value
  })
}

const saveSettings = () => {
  // 设置已经实时保存，这里只是显示提示
  showSavedMessage.value = true
  setTimeout(() => {
    showSavedMessage.value = false
  }, 3000)
}

const resetSettings = () => {
  store.dispatch('resetSettings')
  showSavedMessage.value = true
  setTimeout(() => {
    showSavedMessage.value = false
  }, 3000)
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

/* 隐藏滚动条但保持功能 */
.settings-container::-webkit-scrollbar {
  width: 6px;
}

.settings-container::-webkit-scrollbar-track {
  background: transparent;
}

.settings-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.settings-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}
</style>

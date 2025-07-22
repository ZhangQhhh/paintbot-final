<template>
  <div class="path-planning-toolbar">
    <!-- 主要工具 -->
    <div class="toolbar-section main-tools">
      <button 
        :class="['tool-btn', 'draw-btn', { active: drawingMode }]"
        @click="toggleDrawingMode"
        :title="drawingMode ? '停止绘制' : '开始绘制路径'"
      >
        <span class="icon">✏️</span>
        {{ drawingMode ? '停止绘制' : '绘制路径' }}
      </button>

      <button 
        class="tool-btn clear-btn"
        @click="clearAllPaths"
        :disabled="paths.length === 0"
        title="清空所有路径"
      >
        <span class="icon">🗑️</span>
        清空路径
      </button>

      <button 
        class="tool-btn undo-btn"
        @click="undoLastPoint"
        :disabled="!canUndo"
        title="撤销最后一个点"
      >
        <span class="icon">↶</span>
        撤销
      </button>
    </div>

    <!-- 绘制设置 -->
    <div class="toolbar-section draw-settings">
      <div class="setting-group">
        <label>绘制模式:</label>
        <select v-model="drawMode" @change="updateDrawMode" class="select-input">
          <option value="free">自由绘制</option>
          <option value="snap">点云吸附</option>
          <option value="grid">网格对齐</option>
          <option value="plane">平面绘制</option>
        </select>
      </div>

      <div class="setting-group">
        <label>绘制平面:</label>
        <select v-model="drawPlane" @change="updateDrawPlane" class="select-input">
          <option value="xy">XY平面</option>
          <option value="xz">XZ平面</option>
          <option value="yz">YZ平面</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div v-if="drawPlane === 'custom'" class="setting-group plane-settings">
        <div class="plane-controls">
          <div class="axis-input">
            <label>法向量X:</label>
            <input type="number" v-model.number="customPlane.x" step="0.1" />
          </div>
          <div class="axis-input">
            <label>法向量Y:</label>
            <input type="number" v-model.number="customPlane.y" step="0.1" />
          </div>
          <div class="axis-input">
            <label>法向量Z:</label>
            <input type="number" v-model.number="customPlane.z" step="0.1" />
          </div>
        </div>
      </div>
    </div>

    <!-- 路径操作 -->
    <div class="toolbar-section path-operations">
      <button 
        class="tool-btn connect-btn"
        @click="connectPaths"
        :disabled="paths.length < 2"
        title="连接选中的路径"
      >
        <span class="icon">🔗</span>
        连接路径
      </button>

      <button 
        class="tool-btn optimize-btn"
        @click="optimizePaths"
        :disabled="paths.length === 0"
        title="优化路径（移除冗余点）"
      >
        <span class="icon">⚡</span>
        优化路径
      </button>

      <button 
        class="tool-btn smooth-btn"
        @click="smoothPaths"
        :disabled="paths.length === 0"
        title="平滑所有路径"
      >
        <span class="icon">〰️</span>
        平滑路径
      </button>
    </div>

    <!-- 导入导出 -->
    <div class="toolbar-section import-export">
      <div class="file-operations">
        <input 
          ref="fileInput"
          type="file" 
          accept=".json,.csv,.obj"
          @change="handleFileLoad"
          style="display: none"
        />
        
        <button 
          class="tool-btn load-btn"
          @click="loadPaths"
          title="加载路径文件"
        >
          <span class="icon">📁</span>
          加载
        </button>

        <div class="save-dropdown" ref="saveDropdown">
          <button 
            class="tool-btn save-btn"
            @click="toggleSaveMenu"
            :disabled="paths.length === 0"
            title="保存路径"
          >
            <span class="icon">💾</span>
            保存
            <span class="dropdown-arrow">▼</span>
          </button>
          
          <div v-if="showSaveMenu" class="save-menu">
            <button @click="savePaths('json')">JSON格式</button>
            <button @click="savePaths('csv')">CSV格式</button>
            <button @click="savePaths('obj')">OBJ格式</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态信息 -->
    <div class="toolbar-section status-info">
      <div class="status-item">
        <span class="label">路径:</span>
        <span class="value">{{ paths.length }}</span>
      </div>
      <div class="status-item">
        <span class="label">总距离:</span>
        <span class="value">{{ totalDistance.toFixed(2) }}</span>
      </div>
      <div class="status-item">
        <span class="label">当前点:</span>
        <span class="value">{{ currentPathPoints }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  drawingMode: {
    type: Boolean,
    default: false
  },
  paths: {
    type: Array,
    default: () => []
  },
  currentPath: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'toggle-drawing-mode',
  'clear-paths',
  'undo-point',
  'load-paths',
  'save-paths',
  'update-draw-mode',
  'update-draw-plane',
  'connect-paths',
  'optimize-paths',
  'smooth-paths'
])

// 响应式数据
const fileInput = ref(null)
const saveDropdown = ref(null)
const showSaveMenu = ref(false)
const drawMode = ref('free')
const drawPlane = ref('xy')

const customPlane = ref({
  x: 0,
  y: 1,
  z: 0
})

// 计算属性
const totalDistance = computed(() => {
  return props.paths.reduce((total, path) => total + (path.distance || 0), 0)
})

const currentPathPoints = computed(() => {
  return props.currentPath?.points?.length || 0
})

const canUndo = computed(() => {
  return props.currentPath && props.currentPath.points.length > 0
})

// 方法
function toggleDrawingMode() {
  emit('toggle-drawing-mode')
}

function clearAllPaths() {
  if (confirm('确定要清空所有路径吗？')) {
    emit('clear-paths')
  }
}

function undoLastPoint() {
  emit('undo-point')
}

function updateDrawMode() {
  emit('update-draw-mode', drawMode.value)
}

function updateDrawPlane() {
  let planeNormal
  switch (drawPlane.value) {
    case 'xy':
      planeNormal = { x: 0, y: 0, z: 1 }
      break
    case 'xz':
      planeNormal = { x: 0, y: 1, z: 0 }
      break
    case 'yz':
      planeNormal = { x: 1, y: 0, z: 0 }
      break
    case 'custom':
      planeNormal = customPlane.value
      break
  }
  emit('update-draw-plane', planeNormal)
}

function connectPaths() {
  emit('connect-paths')
}

function optimizePaths() {
  emit('optimize-paths')
}

function smoothPaths() {
  emit('smooth-paths')
}

function loadPaths() {
  fileInput.value.click()
}

function handleFileLoad(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      let pathData
      const fileName = file.name.toLowerCase()
      
      if (fileName.endsWith('.json')) {
        pathData = JSON.parse(e.target.result)
      } else if (fileName.endsWith('.csv')) {
        pathData = parseCSV(e.target.result)
      } else {
        alert('不支持的文件格式')
        return
      }
      
      emit('load-paths', pathData)
    } catch (error) {
      alert('文件加载失败: ' + error.message)
    }
  }
  reader.readAsText(file)
  
  // 清空input值以便重复选择同一文件
  event.target.value = ''
}

function parseCSV(csvText) {
  // 简单的CSV解析器，实际项目中可能需要更强大的库
  const lines = csvText.split('\n')
  const header = lines[0].split(',')
  const paths = {}
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(',')
    if (values.length < 5) continue
    
    const pathId = values[0]
    const x = parseFloat(values[2])
    const y = parseFloat(values[3])
    const z = parseFloat(values[4])
    
    if (!paths[pathId]) {
      paths[pathId] = {
        id: pathId,
        name: `导入路径 ${pathId}`,
        points: [],
        distance: 0,
        style: {
          color: 0xff4444,
          lineWidth: 3,
          opacity: 1.0,
          type: 'solid',
          showPoints: true
        }
      }
    }
    
    paths[pathId].points.push({ x, y, z })
  }
  
  return {
    version: '2.0',
    paths: Object.values(paths)
  }
}

function toggleSaveMenu() {
  showSaveMenu.value = !showSaveMenu.value
}

function savePaths(format) {
  emit('save-paths', format)
  showSaveMenu.value = false
}

// 点击外部关闭保存菜单
function handleClickOutside(event) {
  if (saveDropdown.value && !saveDropdown.value.contains(event.target)) {
    showSaveMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.path-planning-toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  max-width: calc(100vw - 320px);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.main-tools {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.draw-settings {
  flex-direction: column;
  align-items: stretch;
  min-width: 200px;
}

.path-operations {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.import-export {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.status-info {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  flex-direction: column;
  align-items: stretch;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tool-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-btn.active {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.icon {
  font-size: 14px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group label {
  font-size: 11px;
  font-weight: 600;
  color: #495057;
}

.select-input {
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 11px;
  background: white;
}

.plane-settings {
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.plane-controls {
  display: flex;
  gap: 8px;
}

.axis-input {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.axis-input label {
  font-size: 10px;
  color: #6c757d;
}

.axis-input input {
  padding: 2px 4px;
  border: 1px solid #ced4da;
  border-radius: 2px;
  font-size: 10px;
  width: 100%;
}

.file-operations {
  display: flex;
  gap: 8px;
}

.save-dropdown {
  position: relative;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: 4px;
}

.save-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 120px;
  margin-top: 4px;
}

.save-menu button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  font-size: 12px;
  cursor: pointer;
  color: #495057;
}

.save-menu button:hover {
  background: #f8f9fa;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.status-item .label {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.9;
}

.status-item .value {
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .path-planning-toolbar {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    max-width: none;
    margin-bottom: 16px;
  }
  
  .toolbar-section {
    flex: 1;
    min-width: 120px;
  }
  
  .draw-settings {
    min-width: 160px;
  }
}
</style>

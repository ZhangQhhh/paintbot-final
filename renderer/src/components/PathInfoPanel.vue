<template>
  <div class="path-info-panel" :class="{ collapsed: isCollapsed }">
    <!-- 折叠控制头部 -->
    <div class="panel-header" @click="toggleCollapse">
      <div class="header-left">
        <div class="panel-icon">📍</div>
        <h4 class="panel-title">路径信息</h4>
        <span class="path-count">{{ paths.length }}</span>
      </div>
      <button class="collapse-btn" :class="{ active: !isCollapsed }">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </div>

    <!-- 可折叠内容 -->
    <div class="panel-content" v-show="!isCollapsed">
      <!-- 路径统计 -->
      <div v-if="paths.length > 0" class="path-summary">
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">总路径</span>
            <span class="summary-value">{{ paths.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">总距离</span>
            <span class="summary-value">{{ totalDistance.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">总点数</span>
            <span class="summary-value">{{ totalPoints }}</span>
          </div>
        </div>
      </div>

      <!-- 路径列表 -->
      <div v-if="paths.length > 0" class="path-list">
        <div class="list-controls">
          <button @click="selectAll" class="control-btn primary">全选</button>
          <button @click="selectNone" class="control-btn">清除</button>
          <button @click="exportSelected" class="control-btn success">导出</button>
        </div>
        
        <!-- 路径显示设置 -->
        <div class="path-settings">
          <div class="setting-item">
            <label class="setting-label">路径点大小</label>
            <div class="setting-control">
              <input 
                type="range" 
                min="0.02" 
                max="0.15" 
                step="0.01" 
                :value="sphereSize"
                @input="updateSphereSize"
                class="size-slider"
              />
              <span class="size-value">{{ (sphereSize * 100).toFixed(0) }}%</span>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                :checked="snapEnabled"
                @change="toggleSnapEnabled"
                class="snap-checkbox"
              />
              自动吸附点云
            </label>
          </div>
        </div>
        
        <div class="paths-container">
          <div 
            v-for="(path, index) in paths" 
            :key="path.id || index" 
            class="path-item"
            :class="{ 
              highlighted: highlightedIndex === index,
              selected: selectedPaths.includes(index)
            }"
            @click="selectPath(index)"
          >
            <div class="path-main">
              <input 
                type="checkbox" 
                :checked="selectedPaths.includes(index)"
                @change="togglePathSelection(index)"
                @click.stop
                class="path-checkbox"
              />
              <div class="path-color" :style="{ backgroundColor: getPathColor(path) }"></div>
              <div class="path-details">
                <span class="path-name">路径 {{ index + 1 }}</span>
                <span class="path-stats">{{ path.points.length }} 点 · {{ path.distance.toFixed(1) }} 单位</span>
              </div>
              <div class="path-actions">
                <button @click.stop="editPath(index)" class="action-btn edit" title="编辑">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                  </svg>
                </button>
                <button @click.stop="deletePath(index)" class="action-btn delete" title="删除">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">🎯</div>
        <p class="empty-text">按 W 开始绘制路径</p>
        <p class="empty-hint">双击点云添加路径点</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  paths: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'highlight-path',
  'delete-path',
  'edit-path',
  'duplicate-path',
  'reverse-path',
  'export-path',
  'export-selected',
  'update-path-config'
])

const highlightedIndex = ref(-1)
const selectedPaths = ref([])
const openMenuIndex = ref(-1)
const pathCanvases = ref([])
const isCollapsed = ref(false) // 添加折叠状态

// 路径显示配置
const sphereSize = ref(0.08)
const snapEnabled = ref(true)

// 计算属性
const totalDistance = computed(() => {
  return props.paths.reduce((total, path) => total + (path.distance || 0), 0)
})

const totalPoints = computed(() => {
  return props.paths.reduce((total, path) => total + (path.points?.length || 0), 0)
})

const averageDistance = computed(() => {
  return props.paths.length > 0 ? totalDistance.value / props.paths.length : 0
})

// 方法
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
function selectPath(index) {
  highlightedIndex.value = index
  emit('highlight-path', index)
  closeAllMenus()
}

function togglePathSelection(index) {
  const selectedIndex = selectedPaths.value.indexOf(index)
  if (selectedIndex > -1) {
    selectedPaths.value.splice(selectedIndex, 1)
  } else {
    selectedPaths.value.push(index)
  }
}

function selectAll() {
  selectedPaths.value = props.paths.map((_, index) => index)
}

function selectNone() {
  selectedPaths.value = []
}

function togglePathMenu(index) {
  openMenuIndex.value = openMenuIndex.value === index ? -1 : index
}

function closeAllMenus() {
  openMenuIndex.value = -1
}

function editPath(index) {
  emit('edit-path', index)
  closeAllMenus()
}

function duplicatePath(index) {
  emit('duplicate-path', index)
  closeAllMenus()
}

function reversePath(index) {
  emit('reverse-path', index)
  closeAllMenus()
}

function deletePath(index) {
  if (confirm('确定要删除这条路径吗？')) {
    emit('delete-path', index)
    // 更新选中状态
    const selectedIndex = selectedPaths.value.indexOf(index)
    if (selectedIndex > -1) {
      selectedPaths.value.splice(selectedIndex, 1)
    }
    // 调整其他选中索引
    selectedPaths.value = selectedPaths.value.map(i => i > index ? i - 1 : i)
  }
  closeAllMenus()
}

function exportPath(index) {
  emit('export-path', index)
  closeAllMenus()
}

function exportSelected() {
  if (selectedPaths.value.length === 0) {
    alert('请先选择要导出的路径')
    return
  }
  emit('export-selected', selectedPaths.value)
}

// 路径显示配置方法
function updateSphereSize(event) {
  sphereSize.value = parseFloat(event.target.value)
  emit('update-path-config', {
    sphereSize: sphereSize.value
  })
}

function toggleSnapEnabled(event) {
  snapEnabled.value = event.target.checked
  emit('update-path-config', {
    snapEnabled: snapEnabled.value
  })
}

function getPathColor(path) {
  if (path.style && path.style.color) {
    const color = path.style.color
    if (typeof color === 'number') {
      return `#${color.toString(16).padStart(6, '0')}`
    }
    return color
  }
  return '#ff4444'
}

function getPathTypeText(type) {
  switch (type) {
    case 'solid': return '实线'
    case 'dashed': return '虚线'
    case 'dotted': return '点线'
    default: return '实线'
  }
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5)
}

function drawPathPreview(path, canvas) {
  if (!canvas || !path.points || path.points.length < 2) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 计算路径边界
  let minX = path.points[0].x, maxX = path.points[0].x
  let minZ = path.points[0].z, maxZ = path.points[0].z
  
  path.points.forEach(point => {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minZ = Math.min(minZ, point.z)
    maxZ = Math.max(maxZ, point.z)
  })
  
  const rangeX = maxX - minX || 1
  const rangeZ = maxZ - minZ || 1
  const scale = Math.min(width / rangeX, height / rangeZ) * 0.8
  const offsetX = (width - rangeX * scale) / 2
  const offsetY = (height - rangeZ * scale) / 2
  
  // 设置样式
  ctx.strokeStyle = getPathColor(path)
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  // 绘制路径
  ctx.beginPath()
  path.points.forEach((point, index) => {
    const x = (point.x - minX) * scale + offsetX
    const y = height - ((point.z - minZ) * scale + offsetY)
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()
  
  // 绘制起点和终点
  if (path.points.length > 0) {
    const startPoint = path.points[0]
    const endPoint = path.points[path.points.length - 1]
    
    const startX = (startPoint.x - minX) * scale + offsetX
    const startY = height - ((startPoint.z - minZ) * scale + offsetY)
    const endX = (endPoint.x - minX) * scale + offsetX
    const endY = height - ((endPoint.z - minZ) * scale + offsetY)
    
    // 起点（绿色）
    ctx.fillStyle = '#00ff00'
    ctx.beginPath()
    ctx.arc(startX, startY, 3, 0, Math.PI * 2)
    ctx.fill()
    
    // 终点（红色）
    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.arc(endX, endY, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 监听路径变化，更新预览
watch(() => props.paths, () => {
  nextTick(() => {
    props.paths.forEach((path, index) => {
      const canvas = pathCanvases.value[index]
      if (canvas) {
        drawPathPreview(path, canvas)
      }
    })
  })
}, { deep: true, immediate: true })

// 点击外部关闭菜单
onMounted(() => {
  document.addEventListener('click', closeAllMenus)
})


</script>




<style scoped>
.path-info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(183, 216, 246, 0.3);
  border: 1px solid rgba(66, 184, 131, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  z-index: 100;
}

.path-info-panel.collapsed {
  height: 60px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fbff 0%, #eef7ff 100%);
  border-bottom: 1px solid rgba(66, 184, 131, 0.1);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.panel-header:hover {
  background: linear-gradient(135deg, #eef7ff 0%, #e3f2ff 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-icon {
  font-size: 20px;
  color: #42b883;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.path-count {
  background: linear-gradient(90deg, #42b883 0%, #7ed6df 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

.collapse-btn {
  background: none;
  border: none;
  color: #6c7a89;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: rgba(66, 184, 131, 0.1);
  color: #42b883;
}

.collapse-btn.active {
  transform: rotate(180deg);
}

.panel-content {
  padding: 0;
  transition: all 0.3s ease;
}

.path-summary {
  padding: 16px 20px;
  background: rgba(248, 251, 255, 0.5);
  border-bottom: 1px solid rgba(66, 184, 131, 0.08);
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: #6c7a89;
  font-weight: 500;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.path-list {
  padding: 16px 20px 20px;
}

.list-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.control-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #6c7a89;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #f8f9fa;
  border-color: #42b883;
  color: #42b883;
}

.control-btn.primary {
  background: linear-gradient(90deg, #42b883 0%, #7ed6df 100%);
  color: white;
  border-color: #42b883;
}

.control-btn.primary:hover {
  background: #7ed6df;
}

.control-btn.success {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.control-btn.success:hover {
  background: #369870;
}

.path-settings {
  background: rgba(248, 251, 255, 0.5);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(66, 184, 131, 0.1);
}

.setting-item {
  margin-bottom: 8px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 6px;
  cursor: pointer;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #dee2e6;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.size-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(90deg, #42b883 0%, #7ed6df 100%);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.size-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(90deg, #42b883 0%, #7ed6df 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.size-value {
  font-size: 11px;
  font-weight: 600;
  color: #42b883;
  min-width: 32px;
  text-align: right;
}

.snap-checkbox {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  accent-color: #42b883;
  cursor: pointer;
}

.paths-container {
  max-height: 300px;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}

.paths-container::-webkit-scrollbar {
  width: 4px;
}

.paths-container::-webkit-scrollbar-track {
  background: transparent;
}

.paths-container::-webkit-scrollbar-thumb {
  background: rgba(66, 184, 131, 0.3);
  border-radius: 2px;
}

.paths-container::-webkit-scrollbar-thumb:hover {
  background: rgba(66, 184, 131, 0.5);
}

.path-item {
  border: 1px solid rgba(222, 226, 230, 0.6);
  border-radius: 12px;
  background: white;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.path-item:hover {
  background: rgba(248, 251, 255, 0.8);
  border-color: #42b883;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.15);
}

.path-item.highlighted {
  background: rgba(66, 184, 131, 0.08);
  border-color: #42b883;
}

.path-item.selected {
  background: rgba(126, 214, 223, 0.1);
  border-color: #7ed6df;
}

.path-main {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.path-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #42b883;
  cursor: pointer;
}

.path-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.path-details {
  flex: 1;
  min-width: 0;
}

.path-name {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 2px;
}

.path-stats {
  display: block;
  font-size: 12px;
  color: #6c7a89;
}

.path-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6c7a89;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(66, 184, 131, 0.1);
  color: #42b883;
}

.action-btn.edit:hover {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.action-btn.delete:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #6c7a89;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 14px;
  color: #6c7a89;
  margin: 0;
}
</style>

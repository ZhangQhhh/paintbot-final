<template>
  <div class="path-info-panel">
    <!-- 路径统计 -->
    <div v-if="paths.length > 0" class="path-summary">
      <h4>路径统计</h4>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">路径数量:</span>
          <span class="value">{{ paths.length }} 条</span>
        </div>
        <div class="summary-item">
          <span class="label">总距离:</span>
          <span class="value">{{ totalDistance.toFixed(3) }} 单位</span>
        </div>
        <div class="summary-item">
          <span class="label">总点数:</span>
          <span class="value">{{ totalPoints }} 个</span>
        </div>
        <div class="summary-item">
          <span class="label">平均长度:</span>
          <span class="value">{{ averageDistance.toFixed(3) }} 单位</span>
        </div>
      </div>
    </div>

    <!-- 路径列表 -->
    <div v-if="paths.length > 0" class="path-list">
      <h4>路径列表</h4>
      <div class="list-controls">
        <button @click="selectAll" class="control-btn">全选</button>
        <button @click="selectNone" class="control-btn">取消</button>
        <button @click="exportSelected" class="control-btn export">导出选中</button>
      </div>
      
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
        <div class="path-header">
          <div class="path-checkbox">
            <input 
              type="checkbox" 
              :checked="selectedPaths.includes(index)"
              @change="togglePathSelection(index)"
              @click.stop
            />
          </div>
          <div class="path-color" :style="{ backgroundColor: getPathColor(path) }"></div>
          <div class="path-title">
            <span class="path-name">{{ path.name || `路径 ${index + 1}` }}</span>
            <span class="path-date">{{ formatDate(path.created) }}</span>
          </div>
          <div class="path-menu">
            <button @click.stop="togglePathMenu(index)" class="menu-btn">⋮</button>
            <div v-if="openMenuIndex === index" class="menu-dropdown">
              <button @click.stop="editPath(index)">编辑样式</button>
              <button @click.stop="duplicatePath(index)">复制路径</button>
              <button @click.stop="reversePath(index)">反向路径</button>
              <button @click.stop="exportPath(index)">单独导出</button>
              <button @click.stop="deletePath(index)" class="delete">删除</button>
            </div>
          </div>
        </div>
        
        <div class="path-details">
          <div class="detail-row">
            <span class="detail-label">点数:</span>
            <span class="detail-value">{{ path.points.length }}</span>
            <span class="detail-label">距离:</span>
            <span class="detail-value">{{ path.distance.toFixed(3) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">类型:</span>
            <span class="detail-value">{{ getPathTypeText(path.style?.type) }}</span>
            <span class="detail-label">宽度:</span>
            <span class="detail-value">{{ path.style?.lineWidth || 3 }}px</span>
          </div>
        </div>

        <div class="path-preview">
          <canvas 
            :ref="el => pathCanvases[index] = el"
            width="200" 
            height="60"
            class="preview-canvas"
          ></canvas>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📍</div>
      <h4>还没有路径</h4>
      <p>开始绘制路径来规划您的轨迹</p>
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
  'export-selected'
])

const highlightedIndex = ref(-1)
const selectedPaths = ref([])
const openMenuIndex = ref(-1)
const pathCanvases = ref([])

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
  top: 80px;
  right: 20px;
  width: 280px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
}

.path-summary {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.path-summary h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-weight: 600;
  font-size: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.summary-item .label {
  font-size: 11px;
  color: #6c757d;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
}

.path-list {
  padding: 16px;
}

.path-list h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-weight: 600;
  font-size: 14px;
}

.list-controls {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.control-btn {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #f8f9fa;
}

.control-btn.export {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.control-btn.export:hover {
  background: #218838;
}

.path-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.path-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.path-item.highlighted {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.path-item.selected {
  background: #f8f9ff;
  border-color: #007bff;
}

.path-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f3f4;
}

.path-checkbox {
  margin-right: 8px;
}

.path-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.path-title {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.path-name {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
}

.path-date {
  font-size: 10px;
  color: #6c757d;
}

.path-menu {
  position: relative;
}

.menu-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: #6c757d;
}

.menu-btn:hover {
  background: #f8f9fa;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 120px;
}

.menu-dropdown button {
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

.menu-dropdown button:hover {
  background: #f8f9fa;
}

.menu-dropdown button.delete {
  color: #dc3545;
}

.menu-dropdown button.delete:hover {
  background: #f8d7da;
}

.path-details {
  padding: 8px 12px;
  background: #f8f9fa;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 11px;
  color: #6c757d;
  margin-right: 8px;
}

.detail-value {
  font-size: 11px;
  font-weight: 500;
  color: #495057;
}

.path-preview {
  padding: 8px 12px;
  background: #fff;
}

.preview-canvas {
  width: 100%;
  height: 60px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: #f8f9fa;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}
</style>

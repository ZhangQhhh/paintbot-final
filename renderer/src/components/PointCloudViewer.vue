<template>
  <div class="pointcloud-root">
    <div class="upload-bar">
      <input type="file" accept=".csv,.pcd" @change="onFileChange" id="file-upload" style="display:none" />
      <label for="file-upload" class="upload-btn">选择文件</label>
      <span class="file-tip">支持CSV和PCD格式</span>
      <button class="rotate-btn" @click="toggleAutoRotate">
        {{ autoRotate ? '关闭自动旋转' : '开启自动旋转' }}
      </button>
      
      <!-- 路径规划工具栏 -->
      <PathPlanningToolbar 
        :drawing-mode="drawingMode"
        :paths="paths"
        @clear-paths="clearPaths"
        @save-paths="savePaths"
        @load-paths="loadPaths"
      />
    </div>
    
    <!-- 路径信息面板 -->
    <PathInfoPanel 
      :paths="paths"
      @highlight-path="highlightPath"
      @delete-path="deletePath"
      @edit-path="editPath"
      @update-path-config="updatePathConfig"
    />
    
    <div ref="container" class="pointcloud-viewer"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount, computed, watch } from 'vue'
import { useStore } from 'vuex'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import PathPlanningToolbar from './PathPlanningToolbar.vue'
import PathInfoPanel from './PathInfoPanel.vue'
import { PathManager } from '../utils/PathManager.js'

const store = useStore()
const container = ref(null)
let renderer, scene, camera, animationId, points, controls, resizeObserver, axesHelper

// 路径规划相关
const drawingMode = ref(false)
const paths = ref([])
const currentPath = ref(null)
const selectedPathForEdit = ref(null)
const selectedPathIndex = ref(-1)
const showStyleEditor = ref(false)
let pathManager = null

// 从 Vuex store 获取设置
const autoRotate = computed(() => store.getters.autoRotate)
const showAxis = computed(() => store.getters.showAxis)
const pointSize = computed(() => store.getters.pointSize)
const renderQuality = computed(() => store.getters.renderQuality)

// 监听设置变化
watch(autoRotate, (newValue) => {
  if (controls) {
    controls.autoRotate = newValue
  }
})

watch(showAxis, (newValue) => {
  if (scene && axesHelper) {
    axesHelper.visible = newValue
  }
})

watch(pointSize, (newValue) => {
  if (points && points.material) {
    points.material.size = newValue * 0.03 // 保持与渲染时相同的比例
  }
})

watch(renderQuality, (newValue) => {
  if (renderer) {
    updateRenderQuality(newValue)
  }
})

function toggleAutoRotate() {
  store.dispatch('toggleAutoRotate')
}

// 路径规划功能
function toggleDrawingMode() {
  if (pathManager) {
    drawingMode.value = pathManager.toggleDrawingMode()
    if (drawingMode.value) {
      // 在绘制模式下保持所有相机控制功能
      controls.enabled = true
      container.value.style.cursor = 'crosshair'
      
      // 保持正常的鼠标控制，通过双击来添加点
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,   // 左键仍然用于旋转
        MIDDLE: THREE.MOUSE.DOLLY,  // 滚轮缩放
        RIGHT: THREE.MOUSE.PAN      // 右键平移
      }
      
      console.log('划线模式已开启 - 双击添加点，拖拽控制视角，滚轮缩放')
    } else {
      controls.enabled = true
      container.value.style.cursor = 'default'
      
      // 恢复正常的鼠标控制（实际上已经是正常的了）
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,   // 左键旋转
        MIDDLE: THREE.MOUSE.DOLLY,  // 滚轮缩放
        RIGHT: THREE.MOUSE.PAN      // 右键平移
      }
      
      console.log('划线模式已关闭')
    }
    updatePaths()
  }
}

// 键盘事件处理
function onKeyDown(event) {
  // 防止在输入框中触发
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }
  
  if (event.key === 'w' || event.key === 'W') {
    event.preventDefault()
    toggleDrawingMode()
  }
}

function onMouseDoubleClick(event) {
  // 只在绘制模式下双击添加点
  if (!drawingMode.value || !pathManager) return
  
  const point = pathManager.getIntersectionPoint(event, camera, points, container.value)
  if (point) {
    pathManager.addPointToPath(point)
    updatePaths()
    
    // 给予视觉反馈
    console.log(`添加点: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`)
  }
}

function clearPaths() {
  if (pathManager) {
    pathManager.clearPaths()
    updatePaths()
  }
}

function deletePath(index) {
  if (pathManager) {
    pathManager.deletePath(index)
    updatePaths()
  }
}

function highlightPath(index) {
  if (pathManager) {
    pathManager.highlightPath(index)
  }
}

function editPath(index) {
  // 简化编辑功能，只是高亮显示
  highlightPath(index)
  console.log('编辑路径:', index)
}

function savePaths(format = 'json') {
  if (pathManager) {
    try {
      const exportData = pathManager.exportPaths(format)
      downloadFile(exportData.content, exportData.filename, exportData.mimeType)
      
      alert(`路径已保存！共 ${paths.value.length} 条路径，总距离 ${pathManager.getTotalDistance().toFixed(3)} 单位`)
    } catch (error) {
      alert(error.message)
    }
  }
}

function loadPaths(pathData) {
  if (pathManager) {
    pathManager.loadPathsData(pathData)
    updatePaths()
    alert('路径加载成功！')
  }
}

function updatePaths() {
  if (pathManager) {
    paths.value = [...pathManager.paths]
    currentPath.value = pathManager.currentPath
  }
}

function updatePathConfig(config) {
  if (pathManager) {
    pathManager.updateConfig(config)
    console.log('路径配置已更新:', config)
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// 坐标系控制函数
function updateAxisVisibility(visible) {
  if (axesHelper) {
    axesHelper.visible = visible
  }
}

function updateAxisSize(size) {
  if (axesHelper) {
    axesHelper.scale.setScalar(size)
  }
}

function updateAxisPosition(position) {
  if (axesHelper) {
    axesHelper.position.set(position.x, position.y, position.z)
  }
}

function updateAxisRotation(rotation) {
  if (axesHelper) {
    axesHelper.rotation.set(rotation.x, rotation.y, rotation.z)
  }
}

function updateAxisScale(scale) {
  if (axesHelper) {
    axesHelper.scale.setScalar(scale)
  }
}

function updateAxisColors(colors) {
  if (axesHelper) {
    // 更新坐标轴颜色
    const xAxis = axesHelper.children[0]
    const yAxis = axesHelper.children[1] 
    const zAxis = axesHelper.children[2]
    
    if (xAxis) xAxis.material.color.setHex(parseInt(colors.x.replace('#', ''), 16))
    if (yAxis) yAxis.material.color.setHex(parseInt(colors.y.replace('#', ''), 16))
    if (zAxis) zAxis.material.color.setHex(parseInt(colors.z.replace('#', ''), 16))
  }
}

function resetCoordinateSystem() {
  if (axesHelper) {
    axesHelper.position.set(0, 0, 0)
    axesHelper.rotation.set(0, 0, 0)
    axesHelper.scale.setScalar(5)
    axesHelper.visible = true
    
    // 重置颜色
    const xAxis = axesHelper.children[0]
    const yAxis = axesHelper.children[1] 
    const zAxis = axesHelper.children[2]
    
    if (xAxis) xAxis.material.color.setHex(0xff0000)
    if (yAxis) yAxis.material.color.setHex(0x00ff00)
    if (zAxis) zAxis.material.color.setHex(0x0000ff)
  }
}

function updateRenderQuality(quality) {
  if (!renderer) return
  
  switch(quality) {
    case 'low':
      renderer.setPixelRatio(1)
      renderer.shadowMap.enabled = false
      break
    case 'medium':
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = false
      break
    case 'high':
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      break
  }
}

function clearScene() {
  if (points && scene) {
    scene.remove(points)
    points.geometry.dispose()
    points.material.dispose()
    points = null
  }
}

function getColorByDepth(z, zMin, zMax) {
  // 使用柔和不刺眼的色彩方案
  const t = (z - zMin) / (zMax - zMin)
  
  if (t < 0.2) {
    // 深蓝色 - 柔和的深蓝
    return new THREE.Color().setHSL(0.65, 0.7, 0.4)
  } else if (t < 0.4) {
    // 蓝色到青色 - 降低饱和度
    const localT = (t - 0.2) / 0.2
    return new THREE.Color().setHSL(0.58 + localT * 0.05, 0.6, 0.5)
  } else if (t < 0.6) {
    // 青色到绿色 - 柔和的绿色系
    const localT = (t - 0.4) / 0.2
    return new THREE.Color().setHSL(0.48 + localT * 0.05, 0.6, 0.55)
  } else if (t < 0.8) {
    // 绿色到黄绿色 - 温和的黄绿
    const localT = (t - 0.6) / 0.2
    return new THREE.Color().setHSL(0.35 + localT * 0.03, 0.65, 0.6)
  } else {
    // 黄色到浅橙 - 避免刺眼的红色
    const localT = (t - 0.8) / 0.2
    return new THREE.Color().setHSL(0.18 - localT * 0.03, 0.7, 0.65)
  }
}

function renderPoints(vertices) {
  clearScene()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  // 计算 z 值范围
  let zMin = Infinity, zMax = -Infinity
  for (let i = 2; i < vertices.length; i += 3) {
    if (vertices[i] < zMin) zMin = vertices[i]
    if (vertices[i] > zMax) zMax = vertices[i]
  }
  // 生成颜色数组
  const colors = []
  for (let i = 2; i < vertices.length; i += 3) {
    const color = getColorByDepth(vertices[i], zMin, zMax)
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

  // 创建圆形纹理，让点显示为真正的圆形 - 精细版
  const canvas = document.createElement('canvas')
  canvas.width = 32  // 减小纹理尺寸，更精细
  canvas.height = 32
  const context = canvas.getContext('2d')
  
  // 绘制更精细的圆形
  const centerX = 16
  const centerY = 16
  const radius = 14
  
  // 清除画布
  context.clearRect(0, 0, 32, 32)
  
  // 绘制更精细的圆形渐变
  const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)')   // 中心亮
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.8)') // 中等
  gradient.addColorStop(0.9, 'rgba(255, 255, 255, 0.2)') // 边缘很淡
  gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)')   // 完全透明
  
  context.fillStyle = gradient
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.fill()
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  // 使用圆形纹理的点材质 - 精细化显示
  const material = new THREE.PointsMaterial({ 
    size: pointSize.value * 0.03, // 调整比例，让小数值也有效果
    vertexColors: true,
    map: texture,
    transparent: true,
    alphaTest: 0.1,
    sizeAttenuation: true,
    blending: THREE.NormalBlending // 改为正常混合，避免过亮
  })
  points = new THREE.Points(geometry, material)
  scene.add(points)
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const vertices = []
  for (const line of lines) {
    const parts = line.split(',').map(Number)
    if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
      vertices.push(parts[0], parts[1], parts[2])
    }
  }
  return vertices
}

function parsePCD(text) {
  // 只支持ASCII格式的简单PCD
  const lines = text.split(/\r?\n/)
  let dataStart = false
  const vertices = []
  for (const line of lines) {
    if (dataStart) {
      const parts = line.trim().split(/\s+/).map(Number)
      if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
        vertices.push(parts[0], parts[1], parts[2])
      }
    }
    if (line.startsWith('DATA')) {
      dataStart = true
    }
  }
  return vertices
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    const text = evt.target.result
    let vertices = []
    if (file.name.endsWith('.csv')) {
      vertices = parseCSV(text)
    } else if (file.name.endsWith('.pcd')) {
      vertices = parsePCD(text)
    }
    if (vertices.length > 0) {
      renderPoints(vertices)
    } else {
      alert('未能解析点云数据，请检查文件格式')
    }
  }
  reader.readAsText(file)
}

function resizeRenderer() {
  if (!renderer || !container.value) return
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  renderer.setSize(width, height, false)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

onMounted(() => {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  
  // 设置更好的相机位置，避免镜像问题
  camera.position.set(5, 3, 5)
  camera.lookAt(0, 0, 0)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setClearColor('#000000') // 纯黑背景，更接近图片效果
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  container.value.appendChild(renderer.domElement)
  
  // 应用渲染质量设置
  updateRenderQuality(renderQuality.value)
  
  // 添加坐标轴辅助器
  axesHelper = new THREE.AxesHelper(5) // 增大坐标轴大小
  axesHelper.visible = showAxis.value
  scene.add(axesHelper)
  
  resizeRenderer()

  // OrbitControls 交互 - 修复镜像问题
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  
  // 修复镜像问题的关键设置
  controls.screenSpacePanning = false
  controls.target.set(0, 0, 0) // 确保围绕中心旋转
  
  // 鼠标按钮映射
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY, 
    RIGHT: THREE.MOUSE.PAN
  }
  
  // 旋转约束，避免翻转
  controls.enableRotate = true
  controls.enableZoom = true
  controls.enablePan = true
  controls.maxPolarAngle = Math.PI // 允许完全旋转
  controls.minDistance = 1
  controls.maxDistance = 100
  controls.autoRotate = autoRotate.value
  controls.autoRotateSpeed = 2.0

  // 初始化路径管理器 - 添加配置选项
  pathManager = new PathManager(scene, {
    sphereSize: 0.08,        // 稍大一些的球体便于看清
    snapDistance: 0.15,      // 合理的吸附距离
    snapEnabled: true,       // 启用点云吸附
    lineWidth: 3,           // 线条宽度
    pointColor: 0xff4444    // 红色点
  })
  
  // 添加事件监听
  container.value.addEventListener('dblclick', onMouseDoubleClick)
  window.addEventListener('keydown', onKeyDown)
  
  // 加载保存的路径
  pathManager.loadSavedPaths()
  updatePaths()

  // 默认显示示例点云
  const vertices = []
  for (let i = 0; i < 1000; i++) {
    vertices.push(
      THREE.MathUtils.randFloatSpread(4),
      THREE.MathUtils.randFloatSpread(4),
      THREE.MathUtils.randFloatSpread(4)
    )
  }
  renderPoints(vertices)

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls && controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // 使用 ResizeObserver 监听容器尺寸变化
  resizeObserver = new ResizeObserver(() => {
    resizeRenderer()
  })
  resizeObserver.observe(container.value)

  window.addEventListener('resize', resizeRenderer)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  renderer && renderer.dispose()
  clearScene()
  container.value?.removeEventListener('dblclick', onMouseDoubleClick)
  window.removeEventListener('keydown', onKeyDown)
  if (pathManager) {
    pathManager.dispose()
    pathManager = null
  }
  resizeObserver && resizeObserver.disconnect()
  window.removeEventListener('resize', resizeRenderer)
})
</script>

<style scoped>
.pointcloud-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}
.upload-bar {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 0 0 24px 0;
  justify-content: center;
  width: 100%;
  flex-wrap: wrap;
}
.upload-btn {
  background: linear-gradient(90deg, #42b883 60%, #7ed6df 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 22px;
  font-size: 15px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px #42b88333;
}
.upload-btn:hover {
  background: #7ed6df;
}
.rotate-btn {
  background: #eaf2fb;
  color: #42b883;
  border: 1px solid #42b883;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 15px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}
.rotate-btn:hover {
  background: #42b883;
  color: #fff;
}
.file-tip {
  color: #6c7a89;
  font-size: 14px;
  margin-left: 4px;
}
.pointcloud-viewer {
  flex: 1;
  width: 100%;
  min-height: 0;
  background: #fafdff;
  border-radius: 16px;
  margin: 0;
  overflow: hidden;
  box-shadow: 0 4px 24px #b7d8f633;
  position: relative;
}

.pointcloud-viewer canvas {
  width: 100% !important;
  height: 100% !important;
  border-radius: 16px;
}

.style-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.style-editor-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #495057;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.coordinate-controls-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}
</style> 
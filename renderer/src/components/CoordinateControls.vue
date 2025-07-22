<template>
  <div class="coordinate-controls">
    <h4>坐标系控制</h4>
    
    <!-- 显示/隐藏控制 -->
    <div class="control-group">
      <label>
        <input 
          type="checkbox" 
          v-model="visible" 
          @change="updateVisibility"
        />
        显示坐标系
      </label>
    </div>

    <!-- 大小控制 -->
    <div class="control-group">
      <label>大小:</label>
      <input 
        type="range" 
        min="0.1" 
        max="10" 
        step="0.1" 
        v-model="size" 
        @input="updateSize"
      />
      <span class="value">{{ size }}</span>
    </div>

    <!-- 位置控制 -->
    <div class="control-group">
      <label>位置:</label>
      <div class="position-controls">
        <div class="axis-control">
          <label>X:</label>
          <input 
            type="number" 
            v-model.number="position.x" 
            @input="updatePosition"
            step="0.1"
          />
        </div>
        <div class="axis-control">
          <label>Y:</label>
          <input 
            type="number" 
            v-model.number="position.y" 
            @input="updatePosition"
            step="0.1"
          />
        </div>
        <div class="axis-control">
          <label>Z:</label>
          <input 
            type="number" 
            v-model.number="position.z" 
            @input="updatePosition"
            step="0.1"
          />
        </div>
      </div>
    </div>

    <!-- 旋转控制 -->
    <div class="control-group">
      <label>旋转:</label>
      <div class="rotation-controls">
        <div class="axis-control">
          <label>X:</label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            v-model.number="rotation.x" 
            @input="updateRotation"
          />
          <span class="value">{{ rotation.x }}°</span>
        </div>
        <div class="axis-control">
          <label>Y:</label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            v-model.number="rotation.y" 
            @input="updateRotation"
          />
          <span class="value">{{ rotation.y }}°</span>
        </div>
        <div class="axis-control">
          <label>Z:</label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            v-model.number="rotation.z" 
            @input="updateRotation"
          />
          <span class="value">{{ rotation.z }}°</span>
        </div>
      </div>
    </div>

    <!-- 缩放控制 -->
    <div class="control-group">
      <label>缩放:</label>
      <input 
        type="range" 
        min="0.1" 
        max="5" 
        step="0.1" 
        v-model="scale" 
        @input="updateScale"
      />
      <span class="value">{{ scale }}x</span>
    </div>

    <!-- 颜色控制 -->
    <div class="control-group">
      <label>轴颜色:</label>
      <div class="color-controls">
        <div class="color-input">
          <label>X轴:</label>
          <input 
            type="color" 
            v-model="colors.x" 
            @input="updateColors"
          />
        </div>
        <div class="color-input">
          <label>Y轴:</label>
          <input 
            type="color" 
            v-model="colors.y" 
            @input="updateColors"
          />
        </div>
        <div class="color-input">
          <label>Z轴:</label>
          <input 
            type="color" 
            v-model="colors.z" 
            @input="updateColors"
          />
        </div>
      </div>
    </div>

    <!-- 重置按钮 -->
    <div class="control-group">
      <button @click="resetToDefault" class="reset-btn">
        重置坐标系
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  coordinateSystem: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'update-visibility',
  'update-size', 
  'update-position',
  'update-rotation',
  'update-scale',
  'update-colors',
  'reset'
])

// 响应式数据
const visible = ref(true)
const size = ref(5)
const scale = ref(1)

const position = reactive({
  x: 0,
  y: 0,
  z: 0
})

const rotation = reactive({
  x: 0,
  y: 0,
  z: 0
})

const colors = reactive({
  x: '#ff0000',
  y: '#00ff00', 
  z: '#0000ff'
})

// 更新函数
function updateVisibility() {
  emit('update-visibility', visible.value)
}

function updateSize() {
  emit('update-size', parseFloat(size.value))
}

function updatePosition() {
  emit('update-position', { ...position })
}

function updateRotation() {
  emit('update-rotation', {
    x: rotation.x * Math.PI / 180,
    y: rotation.y * Math.PI / 180,
    z: rotation.z * Math.PI / 180
  })
}

function updateScale() {
  emit('update-scale', parseFloat(scale.value))
}

function updateColors() {
  emit('update-colors', { ...colors })
}

function resetToDefault() {
  visible.value = true
  size.value = 5
  scale.value = 1
  position.x = 0
  position.y = 0
  position.z = 0
  rotation.x = 0
  rotation.y = 0
  rotation.z = 0
  colors.x = '#ff0000'
  colors.y = '#00ff00'
  colors.z = '#0000ff'
  
  emit('reset')
}

// 监听坐标系对象变化
watch(() => props.coordinateSystem, (newCoordinateSystem) => {
  if (newCoordinateSystem) {
    visible.value = newCoordinateSystem.visible
    size.value = newCoordinateSystem.scale?.x || 1
    scale.value = newCoordinateSystem.scale?.x || 1
    
    if (newCoordinateSystem.position) {
      position.x = newCoordinateSystem.position.x
      position.y = newCoordinateSystem.position.y
      position.z = newCoordinateSystem.position.z
    }
    
    if (newCoordinateSystem.rotation) {
      rotation.x = newCoordinateSystem.rotation.x * 180 / Math.PI
      rotation.y = newCoordinateSystem.rotation.y * 180 / Math.PI
      rotation.z = newCoordinateSystem.rotation.z * 180 / Math.PI
    }
  }
}, { deep: true, immediate: true })
</script>

<style scoped>
.coordinate-controls {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
}

.coordinate-controls h4 {
  margin: 0 0 16px 0;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.control-group {
  margin-bottom: 16px;
}

.control-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #495057;
}

.control-group input[type="range"] {
  width: 100%;
  margin: 4px 0;
}

.control-group input[type="number"] {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
}

.control-group input[type="color"] {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.control-group input[type="checkbox"] {
  margin-right: 8px;
}

.value {
  margin-left: 8px;
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.position-controls,
.rotation-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.axis-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.axis-control label {
  margin: 0;
  min-width: 15px;
  font-size: 12px;
  font-weight: 600;
}

.color-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.color-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-input label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
}

.reset-btn {
  width: 100%;
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.reset-btn:hover {
  background: #c82333;
}

.reset-btn:active {
  transform: translateY(1px);
}
</style>

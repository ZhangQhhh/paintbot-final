<template>
  <div class="path-style-editor">
    <h4>路径样式编辑</h4>
    
    <div v-if="selectedPath" class="style-controls">
      <!-- 路径名称 -->
      <div class="control-group">
        <label>路径名称:</label>
        <input 
          type="text" 
          v-model="pathName" 
          @input="updatePathName"
          class="text-input"
        />
      </div>

      <!-- 线条颜色 -->
      <div class="control-group">
        <label>线条颜色:</label>
        <div class="color-picker">
          <input 
            type="color" 
            v-model="lineColor" 
            @input="updateStyle"
          />
          <span class="color-value">{{ lineColor }}</span>
        </div>
      </div>

      <!-- 线条宽度 -->
      <div class="control-group">
        <label>线条宽度:</label>
        <input 
          type="range" 
          min="1" 
          max="20" 
          v-model="lineWidth" 
          @input="updateStyle"
        />
        <span class="value">{{ lineWidth }}px</span>
      </div>

      <!-- 透明度 -->
      <div class="control-group">
        <label>透明度:</label>
        <input 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.1" 
          v-model="opacity" 
          @input="updateStyle"
        />
        <span class="value">{{ Math.round(opacity * 100) }}%</span>
      </div>

      <!-- 线条类型 -->
      <div class="control-group">
        <label>线条类型:</label>
        <select v-model="lineType" @change="updateStyle" class="select-input">
          <option value="solid">实线</option>
          <option value="dashed">虚线</option>
          <option value="dotted">点线</option>
        </select>
      </div>

      <!-- 点大小 -->
      <div class="control-group">
        <label>关键点大小:</label>
        <input 
          type="range" 
          min="0.01" 
          max="0.2" 
          step="0.01" 
          v-model="pointSize" 
          @input="updateStyle"
        />
        <span class="value">{{ pointSize }}</span>
      </div>

      <!-- 显示关键点 -->
      <div class="control-group">
        <label>
          <input 
            type="checkbox" 
            v-model="showPoints" 
            @change="updateStyle"
          />
          显示关键点
        </label>
      </div>

      <!-- 预设样式 -->
      <div class="control-group">
        <label>预设样式:</label>
        <div class="preset-buttons">
          <button 
            v-for="preset in presets" 
            :key="preset.name"
            @click="applyPreset(preset)"
            class="preset-btn"
            :style="{ backgroundColor: preset.style.color }"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <!-- 动画效果 -->
      <div class="control-group">
        <label>动画效果:</label>
        <select v-model="animationType" @change="updateAnimation" class="select-input">
          <option value="none">无动画</option>
          <option value="flow">流动效果</option>
          <option value="pulse">脉冲效果</option>
          <option value="glow">发光效果</option>
        </select>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="duplicatePath" class="action-btn duplicate">
          复制路径
        </button>
        <button @click="reversePath" class="action-btn reverse">
          反向路径
        </button>
        <button @click="smoothPath" class="action-btn smooth">
          平滑路径
        </button>
        <button @click="deletePath" class="action-btn delete">
          删除路径
        </button>
      </div>
    </div>

    <div v-else class="no-selection">
      <p>请选择一条路径进行编辑</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  selectedPath: {
    type: Object,
    default: null
  },
  pathIndex: {
    type: Number,
    default: -1
  }
})

const emit = defineEmits([
  'update-style',
  'update-name',
  'update-animation',
  'duplicate-path',
  'reverse-path', 
  'smooth-path',
  'delete-path'
])

// 样式属性
const pathName = ref('')
const lineColor = ref('#ff4444')
const lineWidth = ref(3)
const opacity = ref(1.0)
const lineType = ref('solid')
const pointSize = ref(0.05)
const showPoints = ref(true)
const animationType = ref('none')

// 预设样式
const presets = ref([
  {
    name: '红色',
    style: {
      color: '#ff4444',
      lineWidth: 3,
      opacity: 1.0,
      type: 'solid'
    }
  },
  {
    name: '蓝色',
    style: {
      color: '#4444ff',
      lineWidth: 3,
      opacity: 1.0,
      type: 'solid'
    }
  },
  {
    name: '绿色',
    style: {
      color: '#44ff44',
      lineWidth: 3,
      opacity: 1.0,
      type: 'solid'
    }
  },
  {
    name: '黄色',
    style: {
      color: '#ffff44',
      lineWidth: 5,
      opacity: 0.8,
      type: 'solid'
    }
  },
  {
    name: '紫色虚线',
    style: {
      color: '#ff44ff',
      lineWidth: 2,
      opacity: 0.9,
      type: 'dashed'
    }
  },
  {
    name: '橙色粗线',
    style: {
      color: '#ff8844',
      lineWidth: 8,
      opacity: 1.0,
      type: 'solid'
    }
  }
])

// 当选中路径变化时更新UI
watch(() => props.selectedPath, (newPath) => {
  if (newPath && newPath.style) {
    pathName.value = newPath.name || ''
    lineColor.value = `#${newPath.style.color.toString(16).padStart(6, '0')}`
    lineWidth.value = newPath.style.lineWidth || 3
    opacity.value = newPath.style.opacity || 1.0
    lineType.value = newPath.style.type || 'solid'
    pointSize.value = newPath.style.pointSize || 0.05
    showPoints.value = newPath.style.showPoints !== false
  }
}, { immediate: true })

// 颜色转换辅助函数
function hexToNumber(hex) {
  return parseInt(hex.replace('#', ''), 16)
}

// 更新样式
function updateStyle() {
  if (props.pathIndex === -1) return
  
  const newStyle = {
    color: hexToNumber(lineColor.value),
    lineWidth: parseInt(lineWidth.value),
    opacity: parseFloat(opacity.value),
    type: lineType.value,
    pointSize: parseFloat(pointSize.value),
    showPoints: showPoints.value
  }
  
  emit('update-style', props.pathIndex, newStyle)
}

// 更新路径名称
function updatePathName() {
  if (props.pathIndex === -1) return
  emit('update-name', props.pathIndex, pathName.value)
}

// 应用预设样式
function applyPreset(preset) {
  lineColor.value = preset.style.color
  lineWidth.value = preset.style.lineWidth
  opacity.value = preset.style.opacity
  lineType.value = preset.style.type
  updateStyle()
}

// 更新动画
function updateAnimation() {
  if (props.pathIndex === -1) return
  emit('update-animation', props.pathIndex, animationType.value)
}

// 操作函数
function duplicatePath() {
  if (props.pathIndex === -1) return
  emit('duplicate-path', props.pathIndex)
}

function reversePath() {
  if (props.pathIndex === -1) return
  emit('reverse-path', props.pathIndex)
}

function smoothPath() {
  if (props.pathIndex === -1) return
  emit('smooth-path', props.pathIndex)
}

function deletePath() {
  if (props.pathIndex === -1) return
  if (confirm('确定要删除这条路径吗？')) {
    emit('delete-path', props.pathIndex)
  }
}
</script>

<style scoped>
.path-style-editor {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
}

.path-style-editor h4 {
  margin: 0 0 16px 0;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #28a745;
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
  font-size: 13px;
}

.text-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker input[type="color"] {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  font-size: 12px;
  color: #6c757d;
}

.select-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  background: white;
}

input[type="range"] {
  width: 100%;
  margin: 4px 0;
}

input[type="checkbox"] {
  margin-right: 8px;
}

.value {
  margin-left: 8px;
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.preset-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-top: 8px;
}

.preset-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.preset-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 20px;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.duplicate {
  background: #007bff;
  color: white;
}

.action-btn.reverse {
  background: #ffc107;
  color: #212529;
}

.action-btn.smooth {
  background: #28a745;
  color: white;
}

.action-btn.delete {
  background: #dc3545;
  color: white;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.no-selection {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 32px 16px;
}

.no-selection p {
  margin: 0;
}
</style>

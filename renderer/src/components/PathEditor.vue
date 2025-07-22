<template>
  <div v-if="showEditor" class="path-editor-overlay">
    <div class="editor-panel">
      <div class="editor-header">
        <h3>编辑路径 {{ pathIndex + 1 }}</h3>
        <button class="close-btn" @click="closeEditor">×</button>
      </div>
      
      <div class="editor-content">
        <div class="path-properties">
          <div class="property-group">
            <label>路径名称:</label>
            <input 
              v-model="pathName" 
              type="text" 
              placeholder="输入路径名称"
            />
          </div>
          
          <div class="property-group">
            <label>路径颜色:</label>
            <input 
              v-model="pathColor" 
              type="color"
              @change="updatePathColor"
            />
          </div>
          
          <div class="property-group">
            <label>线宽:</label>
            <input 
              v-model.number="lineWidth" 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              @input="updateLineWidth"
            />
            <span>{{ lineWidth }}px</span>
          </div>
        </div>
        
        <div class="points-list">
          <h4>路径点列表</h4>
          <div class="points-container">
            <div 
              v-for="(point, index) in pathPoints" 
              :key="index"
              class="point-item"
            >
              <span class="point-index">{{ index + 1 }}.</span>
              <div class="point-coords">
                <input 
                  v-model.number="point.x" 
                  type="number" 
                  step="0.001"
                  @change="updatePointPosition(index)"
                />
                <input 
                  v-model.number="point.y" 
                  type="number" 
                  step="0.001"
                  @change="updatePointPosition(index)"
                />
                <input 
                  v-model.number="point.z" 
                  type="number" 
                  step="0.001"
                  @change="updatePointPosition(index)"
                />
              </div>
              <button 
                class="delete-point-btn"
                @click="deletePoint(index)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
        
        <div class="path-stats">
          <div class="stat-item">
            <span>点数量: {{ pathPoints.length }}</span>
          </div>
          <div class="stat-item">
            <span>总距离: {{ calculatedDistance.toFixed(3) }}</span>
          </div>
        </div>
      </div>
      
      <div class="editor-actions">
        <button class="save-btn" @click="savePath">保存更改</button>
        <button class="cancel-btn" @click="cancelEdit">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  showEditor: {
    type: Boolean,
    default: false
  },
  pathIndex: {
    type: Number,
    default: -1
  },
  pathData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'close-editor',
  'save-path',
  'update-path-visual'
])

const pathName = ref('')
const pathColor = ref('#ff4444')
const lineWidth = ref(3)
const pathPoints = ref([])

const calculatedDistance = computed(() => {
  if (pathPoints.value.length < 2) return 0
  
  let distance = 0
  for (let i = 1; i < pathPoints.value.length; i++) {
    const p1 = pathPoints.value[i - 1]
    const p2 = pathPoints.value[i]
    distance += Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + 
      Math.pow(p2.y - p1.y, 2) + 
      Math.pow(p2.z - p1.z, 2)
    )
  }
  return distance
})

watch(() => props.pathData, (newData) => {
  if (newData) {
    pathName.value = newData.name || `路径 ${props.pathIndex + 1}`
    pathColor.value = newData.color || '#ff4444'
    lineWidth.value = newData.lineWidth || 3
    pathPoints.value = newData.points.map(p => ({ x: p.x, y: p.y, z: p.z }))
  }
}, { immediate: true })

function closeEditor() {
  emit('close-editor')
}

function updatePathColor() {
  emit('update-path-visual', {
    type: 'color',
    value: pathColor.value
  })
}

function updateLineWidth() {
  emit('update-path-visual', {
    type: 'lineWidth',
    value: lineWidth.value
  })
}

function updatePointPosition(index) {
  emit('update-path-visual', {
    type: 'pointPosition',
    index: index,
    value: pathPoints.value[index]
  })
}

function deletePoint(index) {
  if (pathPoints.value.length <= 2) {
    alert('路径至少需要保留2个点')
    return
  }
  
  pathPoints.value.splice(index, 1)
  emit('update-path-visual', {
    type: 'deletePoint',
    index: index
  })
}

function savePath() {
  const updatedPath = {
    name: pathName.value,
    color: pathColor.value,
    lineWidth: lineWidth.value,
    points: pathPoints.value,
    distance: calculatedDistance.value
  }
  
  emit('save-path', {
    index: props.pathIndex,
    pathData: updatedPath
  })
}

function cancelEdit() {
  emit('close-editor')
}
</script>

<style scoped>
.path-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.editor-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.editor-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.property-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.property-group label {
  width: 80px;
  font-weight: bold;
  color: #555;
}

.property-group input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.points-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
}

.point-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.point-index {
  font-weight: bold;
  color: #666;
  width: 30px;
}

.point-coords {
  display: flex;
  gap: 5px;
  flex: 1;
}

.point-coords input {
  width: 80px;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 12px;
}

.delete-point-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}

.path-stats {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  padding: 10px;
  background: #e9ecef;
  border-radius: 4px;
}

.stat-item {
  font-weight: bold;
  color: #495057;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.save-btn {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: bold;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
}
</style>

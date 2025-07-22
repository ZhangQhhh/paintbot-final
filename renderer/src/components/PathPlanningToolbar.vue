<template>
  <div class="path-tools">
    <div class="drawing-status" :class="{ active: drawingMode }">
      {{ drawingMode ? '📝 划线模式 (双击添加点，W退出)' : '🎯 按W开始划线' }}
    </div>
    <button class="tool-btn" @click="clearPaths">清除路径</button>
    <button class="tool-btn" @click="savePaths">保存路径</button>
    <button class="tool-btn" @click="loadPaths">加载路径</button>
  </div>
</template>

<script setup>
const props = defineProps({
  drawingMode: {
    type: Boolean,
    default: false
  },
  paths: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'clear-paths', 
  'save-paths',
  'load-paths'
])

function clearPaths() {
  if (props.paths.length === 0) {
    alert('没有路径可清除')
    return
  }
  if (confirm('确定要清除所有路径吗？')) {
    emit('clear-paths')
  }
}

function savePaths() {
  if (props.paths.length === 0) {
    alert('没有路径可保存')
    return
  }
  emit('save-paths')
}

function loadPaths() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const pathData = JSON.parse(evt.target.result)
          emit('load-paths', pathData)
        } catch (error) {
          alert('文件格式错误，请选择有效的路径文件')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}
</script>

<style scoped>
.path-tools {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.drawing-status {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.drawing-status.active {
  background: #28a745;
  color: white;
  border-color: #28a745;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.tool-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.tool-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}
</style>

import { createStore } from 'vuex'

// 从 localStorage 读取设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('appSettings')
    return saved ? JSON.parse(saved) : null
  } catch (e) {
    console.error('读取设置失败:', e)
    return null
  }
}

// 保存设置到 localStorage
const saveSettings = (settings) => {
  try {
    localStorage.setItem('appSettings', JSON.stringify(settings))
  } catch (e) {
    console.error('保存设置失败:', e)
  }
}

// 默认设置
const defaultSettings = {
  autoRotate: true,
  showAxis: false,
  pointSize: 8, // 设置更小的默认值
  renderQuality: 'medium'
}

// 初始状态
const initialSettings = loadSettings() || defaultSettings

export default createStore({
  state: {
    settings: { ...initialSettings },
    pointCloudData: null,
    isLoading: false,
    // 路径规划状态
    pathPlanning: {
      drawingMode: false,
      currentEditingPath: -1,
      pathsHistory: [] // 用于撤销/重做功能
    }
  },
  
  getters: {
    // 获取设置
    getSettings: (state) => state.settings,
    
    // 获取特定设置
    autoRotate: (state) => state.settings.autoRotate,
    showAxis: (state) => state.settings.showAxis,
    pointSize: (state) => state.settings.pointSize,
    renderQuality: (state) => state.settings.renderQuality,
    
    // 获取点云数据
    pointCloudData: (state) => state.pointCloudData,
    isLoading: (state) => state.isLoading,
    
    // 路径规划相关getters
    drawingMode: (state) => state.pathPlanning.drawingMode,
    currentEditingPath: (state) => state.pathPlanning.currentEditingPath,
    pathsHistory: (state) => state.pathPlanning.pathsHistory
  },
  
  mutations: {
    // 更新设置
    UPDATE_SETTINGS(state, newSettings) {
      state.settings = { ...state.settings, ...newSettings }
      saveSettings(state.settings)
    },
    
    // 更新单个设置项
    UPDATE_SETTING(state, { key, value }) {
      state.settings[key] = value
      saveSettings(state.settings)
    },
    
    // 重置设置
    RESET_SETTINGS(state) {
      state.settings = { ...defaultSettings }
      saveSettings(state.settings)
    },
    
    // 设置点云数据
    SET_POINTCLOUD_DATA(state, data) {
      state.pointCloudData = data
    },
    
    // 设置加载状态
    SET_LOADING(state, loading) {
      state.isLoading = loading
    }
  },
  
  actions: {
    // 更新设置
    updateSettings({ commit }, settings) {
      commit('UPDATE_SETTINGS', settings)
    },
    
    // 更新单个设置
    updateSetting({ commit }, payload) {
      commit('UPDATE_SETTING', payload)
    },
    
    // 重置设置
    resetSettings({ commit }) {
      commit('RESET_SETTINGS')
    },
    
    // 切换自动旋转
    toggleAutoRotate({ commit, state }) {
      commit('UPDATE_SETTING', {
        key: 'autoRotate',
        value: !state.settings.autoRotate
      })
    },
    
    // 设置点云数据
    setPointCloudData({ commit }, data) {
      commit('SET_POINTCLOUD_DATA', data)
    },
    
    // 设置加载状态
    setLoading({ commit }, loading) {
      commit('SET_LOADING', loading)
    }
  }
})

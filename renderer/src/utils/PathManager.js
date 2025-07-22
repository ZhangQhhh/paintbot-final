import * as THREE from 'three'

export class PathManager {
  constructor(scene, options = {}) {
    this.scene = scene
    this.paths = []
    this.currentPath = null
    this.drawingMode = false
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    // 配置选项
    this.config = {
      sphereSize: options.sphereSize || 0.05,          // 路径点球体大小
      snapDistance: options.snapDistance || 0.2,       // 吸附距离
      snapEnabled: options.snapEnabled !== false,      // 是否启用吸附
      lineWidth: options.lineWidth || 3,               // 线条宽度
      pointColor: options.pointColor || 0xff4444       // 点颜色
    }
  }

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // 更新现有路径的球体大小
    this.paths.forEach(path => {
      if (path.spheres) {
        path.spheres.forEach(sphere => {
          sphere.scale.setScalar(this.config.sphereSize / 0.05) // 基于默认大小缩放
        })
      }
    })
    
    // 更新当前路径的球体大小
    if (this.currentPath && this.currentPath.spheres) {
      this.currentPath.spheres.forEach(sphere => {
        sphere.scale.setScalar(this.config.sphereSize / 0.05)
      })
    }
  }

  // 切换绘制模式
  toggleDrawingMode() {
    this.drawingMode = !this.drawingMode
    if (!this.drawingMode) {
      this.finishCurrentPath()
    }
    return this.drawingMode
  }

  // 添加点到当前路径
  addPointToPath(point) {
    if (!this.currentPath) {
      this.currentPath = {
        points: [],
        distance: 0,
        line: null,
        spheres: []
      }
    }
    
    this.currentPath.points.push(point.clone())
    
    // 添加可视化的点 - 使用配置的大小和颜色
    const sphereGeometry = new THREE.SphereGeometry(this.config.sphereSize, 8, 8)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: this.config.pointColor })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.copy(point)
    this.scene.add(sphere)
    this.currentPath.spheres.push(sphere)
    
    // 如果有两个或更多点，绘制线段
    if (this.currentPath.points.length >= 2) {
      this.updatePathLine()
      this.updatePathDistance()
    }
    
    return this.currentPath
  }

  // 更新路径线段
  updatePathLine() {
    if (!this.currentPath || this.currentPath.points.length < 2) return
    
    // 移除旧的线段
    if (this.currentPath.line) {
      this.scene.remove(this.currentPath.line)
      this.currentPath.line.geometry.dispose()
      this.currentPath.line.material.dispose()
    }
    
    // 创建新的线段
    const geometry = new THREE.BufferGeometry().setFromPoints(this.currentPath.points)
    const material = new THREE.LineBasicMaterial({ 
      color: 0xff4444, 
      linewidth: 3 
    })
    const line = new THREE.Line(geometry, material)
    this.scene.add(line)
    this.currentPath.line = line
  }

  // 更新路径距离
  updatePathDistance() {
    if (!this.currentPath || this.currentPath.points.length < 2) return
    
    let distance = 0
    for (let i = 1; i < this.currentPath.points.length; i++) {
      distance += this.currentPath.points[i].distanceTo(this.currentPath.points[i - 1])
    }
    this.currentPath.distance = distance
  }

  // 完成当前路径
  finishCurrentPath() {
    if (this.currentPath && this.currentPath.points.length >= 2) {
      this.paths.push({
        points: [...this.currentPath.points],
        distance: this.currentPath.distance,
        line: this.currentPath.line,
        spheres: [...this.currentPath.spheres]
      })
    } else if (this.currentPath) {
      // 清理未完成的路径
      if (this.currentPath.line) {
        this.scene.remove(this.currentPath.line)
        this.currentPath.line.geometry.dispose()
        this.currentPath.line.material.dispose()
      }
      this.currentPath.spheres.forEach(sphere => {
        this.scene.remove(sphere)
        sphere.geometry.dispose()
        sphere.material.dispose()
      })
    }
    this.currentPath = null
  }

  // 清除所有路径
  clearPaths() {
    // 清除所有路径的可视化元素
    this.paths.forEach(path => {
      if (path.line) {
        this.scene.remove(path.line)
        path.line.geometry.dispose()
        path.line.material.dispose()
      }
      path.spheres.forEach(sphere => {
        this.scene.remove(sphere)
        sphere.geometry.dispose()
        sphere.material.dispose()
      })
    })
    
    // 清除当前正在绘制的路径
    if (this.currentPath) {
      if (this.currentPath.line) {
        this.scene.remove(this.currentPath.line)
        this.currentPath.line.geometry.dispose()
        this.currentPath.line.material.dispose()
      }
      this.currentPath.spheres.forEach(sphere => {
        this.scene.remove(sphere)
        sphere.geometry.dispose()
        sphere.material.dispose()
      })
      this.currentPath = null
    }
    
    this.paths = []
  }

  // 删除指定路径
  deletePath(index) {
    if (index < 0 || index >= this.paths.length) return
    
    const path = this.paths[index]
    if (path.line) {
      this.scene.remove(path.line)
      path.line.geometry.dispose()
      path.line.material.dispose()
    }
    path.spheres.forEach(sphere => {
      this.scene.remove(sphere)
      sphere.geometry.dispose()
      sphere.material.dispose()
    })
    this.paths.splice(index, 1)
  }

  // 高亮路径
  highlightPath(index) {
    // 重置所有路径为默认颜色
    this.paths.forEach(path => {
      if (path.line) {
        path.line.material.color.setHex(0xff4444)
        path.line.material.opacity = 0.8
        path.line.material.transparent = true
      }
      path.spheres.forEach(sphere => {
        sphere.material.color.setHex(0xff4444)
      })
    })
    
    // 高亮选中的路径
    if (index >= 0 && index < this.paths.length) {
      const selectedPath = this.paths[index]
      if (selectedPath.line) {
        selectedPath.line.material.color.setHex(0x00ff00)
        selectedPath.line.material.opacity = 1.0
      }
      selectedPath.spheres.forEach(sphere => {
        sphere.material.color.setHex(0x00ff00)
      })
    }
  }

  // 计算射线与点云的交点
  getIntersectionPoint(event, camera, pointCloud, container) {
    const rect = container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.raycaster.setFromCamera(this.mouse, camera)
    
    // 使用高精度深度检测
    const targetPoint = this.getHighPrecisionIntersection(this.mouse, camera, pointCloud)
    
    if (targetPoint) {
      // 如果启用了吸附功能，尝试找到最近的实际点云点
      if (this.config.snapEnabled && pointCloud && pointCloud.geometry) {
        const snappedPoint = this.findNearestCloudPoint(targetPoint, pointCloud)
        if (snappedPoint) {
          return snappedPoint
        }
      }
      return targetPoint
    }
    
    // 如果没有找到合适的点，使用回退策略
    return this.getFallbackIntersection(this.mouse, camera)
  }

  // 高精度深度检测
  getHighPrecisionIntersection(mouse, camera, pointCloud) {
    if (!pointCloud || !pointCloud.geometry || !pointCloud.geometry.attributes.position) {
      return null
    }
    
    // 设置射线投射器
    this.raycaster.setFromCamera(mouse, camera)
    
    const positions = pointCloud.geometry.attributes.position.array
    const pointsCount = positions.length / 3
    
    // 使用多层深度采样
    const depthSamples = []
    const sampleCount = 20 // 增加采样点数量
    
    // 在射线方向上创建多个采样点
    const rayOrigin = this.raycaster.ray.origin
    const rayDirection = this.raycaster.ray.direction
    const maxDistance = camera.far || 1000
    const minDistance = camera.near || 0.1
    
    for (let i = 0; i < sampleCount; i++) {
      const t = minDistance + (maxDistance - minDistance) * (i / (sampleCount - 1))
      const samplePoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(t))
      
      // 找到这个采样点附近的点云密度
      let nearbyPointsCount = 0
      const searchRadius = 0.1 // 搜索半径
      
      for (let j = 0; j < pointsCount; j++) {
        const cloudPoint = new THREE.Vector3(
          positions[j * 3],
          positions[j * 3 + 1],
          positions[j * 3 + 2]
        )
        
        const distance = samplePoint.distanceTo(cloudPoint)
        if (distance < searchRadius) {
          nearbyPointsCount++
        }
      }
      
      if (nearbyPointsCount > 0) {
        depthSamples.push({
          point: samplePoint,
          density: nearbyPointsCount,
          distance: t
        })
      }
    }
    
    // 如果没有找到任何密度点，使用传统方法
    if (depthSamples.length === 0) {
      return this.getFallbackIntersection(mouse, camera)
    }
    
    // 选择密度最高的区域作为目标深度
    let bestSample = depthSamples[0]
    for (let i = 1; i < depthSamples.length; i++) {
      if (depthSamples[i].density > bestSample.density) {
        bestSample = depthSamples[i]
      }
    }
    
    return bestSample.point
  }

  // 备用交点计算方法
  getFallbackIntersection(mouse, camera) {
    this.raycaster.setFromCamera(mouse, camera)
    const cameraDistance = camera.position.length()
    const targetDepth = cameraDistance * 0.4 // 稍微调整深度比例
    const direction = this.raycaster.ray.direction.clone()
    return this.raycaster.ray.origin.clone().add(direction.multiplyScalar(targetDepth))
  }

  // 优化的最近点查找算法
  findNearestCloudPoint(targetPoint, pointCloud) {
    if (!pointCloud.geometry || !pointCloud.geometry.attributes.position) {
      return null
    }
    
    const positions = pointCloud.geometry.attributes.position.array
    const pointsCount = positions.length / 3
    let nearestPoint = null
    let minDistance = this.config.snapDistance
    
    // 使用更智能的搜索策略
    const candidates = []
    
    // 第一步：收集候选点
    for (let i = 0; i < pointsCount; i++) {
      const cloudPoint = new THREE.Vector3(
        positions[i * 3],
        positions[i * 3 + 1], 
        positions[i * 3 + 2]
      )
      
      const distance = targetPoint.distanceTo(cloudPoint)
      
      if (distance < this.config.snapDistance * 3) { // 扩大初步筛选范围
        candidates.push({
          point: cloudPoint,
          distance: distance
        })
      }
    }
    
    // 第二步：从候选点中选择最优的
    if (candidates.length > 0) {
      // 按距离排序
      candidates.sort((a, b) => a.distance - b.distance)
      
      // 选择最近的点，但要考虑周围点的密度
      let bestCandidate = candidates[0]
      
      // 如果有多个相近的候选点，选择周围密度最高的
      if (candidates.length > 1) {
        for (let i = 0; i < Math.min(5, candidates.length); i++) {
          const candidate = candidates[i]
          let nearbyCount = 0
          
          // 计算周围点的密度
          for (let j = 0; j < candidates.length; j++) {
            if (i !== j) {
              const dist = candidate.point.distanceTo(candidates[j].point)
              if (dist < 0.05) { // 很小的邻域
                nearbyCount++
              }
            }
          }
          
          // 如果这个点周围有更多的邻近点，且距离差不大，优先选择它
          if (nearbyCount > 2 && candidate.distance < bestCandidate.distance * 1.5) {
            bestCandidate = candidate
          }
        }
      }
      
      return bestCandidate.point
    }
    
    return null
  }

  // 添加视觉反馈方法
  addVisualFeedback(point, color = 0x00ff00, duration = 1000) {
    // 创建临时的视觉反馈球体
    const geometry = new THREE.SphereGeometry(this.config.sphereSize * 1.5, 8, 8)
    const material = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.7
    })
    const feedbackSphere = new THREE.Mesh(geometry, material)
    feedbackSphere.position.copy(point)
    this.scene.add(feedbackSphere)
    
    // 添加脉冲动画
    let scale = 1
    const animate = () => {
      scale += 0.1
      feedbackSphere.scale.setScalar(scale)
      feedbackSphere.material.opacity = Math.max(0, 0.7 - (scale - 1) * 0.7)
      
      if (scale < 2) {
        requestAnimationFrame(animate)
      } else {
        this.scene.remove(feedbackSphere)
        geometry.dispose()
        material.dispose()
      }
    }
    
    setTimeout(() => {
      animate()
    }, 100)
  }

  // 保存路径数据
  savePathsData() {
    if (this.paths.length === 0) {
      throw new Error('没有路径可保存')
    }
    
    const pathData = {
      timestamp: new Date().toISOString(),
      totalPaths: this.paths.length,
      totalDistance: this.getTotalDistance(),
      paths: this.paths.map((path, index) => ({
        id: index + 1,
        points: path.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
        distance: path.distance,
        segments: path.points.length - 1
      }))
    }
    
    // 保存到本地存储
    localStorage.setItem('pointcloud_paths', JSON.stringify(pathData))
    
    return pathData
  }

  // 加载路径数据
  loadPathsData(pathData) {
    this.clearPaths()
    
    if (pathData && pathData.paths) {
      pathData.paths.forEach(pathInfo => {
        const points = pathInfo.points.map(p => new THREE.Vector3(p.x, p.y, p.z))
        const pathObj = {
          points: points,
          distance: pathInfo.distance,
          spheres: [],
          line: null
        }
        
        // 重建可视化元素
        points.forEach(point => {
          const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 8)
          const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })
          const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
          sphere.position.copy(point)
          this.scene.add(sphere)
          pathObj.spheres.push(sphere)
        })
        
        // 重建线段
        if (points.length >= 2) {
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const material = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 3 })
          const line = new THREE.Line(geometry, material)
          this.scene.add(line)
          pathObj.line = line
        }
        
        this.paths.push(pathObj)
      })
    }
  }

  // 从本地存储加载路径
  loadSavedPaths() {
    const savedData = localStorage.getItem('pointcloud_paths')
    if (savedData) {
      try {
        const pathData = JSON.parse(savedData)
        this.loadPathsData(pathData)
      } catch (error) {
        console.error('加载路径数据失败:', error)
      }
    }
  }

  // 获取总距离
  getTotalDistance() {
    return this.paths.reduce((total, path) => total + path.distance, 0)
  }

  // 导出路径数据
  exportPaths(format = 'json') {
    if (this.paths.length === 0) {
      throw new Error('没有路径可导出')
    }

    const pathData = {
      timestamp: new Date().toISOString(),
      totalPaths: this.paths.length,
      totalDistance: this.getTotalDistance(),
      paths: this.paths.map((path, index) => ({
        id: index + 1,
        points: path.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
        distance: path.distance,
        segments: path.points.length - 1
      }))
    }

    const filename = `路径规划_${new Date().toISOString().slice(0, 10)}.json`
    
    return {
      content: JSON.stringify(pathData, null, 2),
      filename: filename,
      mimeType: 'application/json'
    }
  }

  // 更新路径样式
  updatePathStyle(pathIndex, newStyle) {
    if (pathIndex >= 0 && pathIndex < this.paths.length) {
      const path = this.paths[pathIndex]
      // 更新样式逻辑
      if (path.line) {
        if (newStyle.color) {
          path.line.material.color.setHex(parseInt(newStyle.color.replace('#', ''), 16))
        }
        if (newStyle.lineWidth) {
          // Three.js 线宽在某些平台上有限制，这里记录但可能不会生效
          path.line.material.linewidth = newStyle.lineWidth
        }
      }
    }
  }

  // 重新创建路径可视化
  recreatePathVisuals(path) {
    // 清除旧的可视化
    if (path.line) {
      this.scene.remove(path.line)
      path.line.geometry.dispose()
      path.line.material.dispose()
    }
    path.spheres.forEach(sphere => {
      this.scene.remove(sphere)
      sphere.geometry.dispose()
      sphere.material.dispose()
    })
    path.spheres = []

    // 重建可视化
    path.points.forEach(point => {
      const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 8)
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.copy(point)
      this.scene.add(sphere)
      path.spheres.push(sphere)
    })

    if (path.points.length >= 2) {
      const geometry = new THREE.BufferGeometry().setFromPoints(path.points)
      const material = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 3 })
      const line = new THREE.Line(geometry, material)
      this.scene.add(line)
      path.line = line
    }

    // 重新计算距离
    let distance = 0
    for (let i = 1; i < path.points.length; i++) {
      distance += path.points[i].distanceTo(path.points[i - 1])
    }
    path.distance = distance
  }

  // 销毁管理器
  dispose() {
    this.clearPaths()
    this.paths = []
    this.currentPath = null
  }
}

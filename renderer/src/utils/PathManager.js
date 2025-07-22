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
    
    let targetPoint = null
    
    // 检测与点云的交集
    if (pointCloud) {
      const intersects = this.raycaster.intersectObject(pointCloud)
      if (intersects.length > 0) {
        // 选择合适的交点
        if (intersects.length > 1) {
          // 计算所有交点的深度分布，选择中等深度的点
          const distances = intersects.map(intersect => intersect.distance)
          const minDist = Math.min(...distances)
          const maxDist = Math.max(...distances)
          const targetDistance = minDist + (maxDist - minDist) * 0.4
          
          let bestIntersect = intersects[0]
          let minDiff = Math.abs(intersects[0].distance - targetDistance)
          
          for (let i = 1; i < intersects.length; i++) {
            const diff = Math.abs(intersects[i].distance - targetDistance)
            if (diff < minDiff) {
              minDiff = diff
              bestIntersect = intersects[i]
            }
          }
          
          targetPoint = bestIntersect.point
        } else {
          targetPoint = intersects[0].point
        }
        
        // 如果启用了吸附功能，尝试找到最近的实际点云点
        if (this.config.snapEnabled && pointCloud.geometry) {
          const snappedPoint = this.findNearestCloudPoint(targetPoint, pointCloud)
          if (snappedPoint) {
            targetPoint = snappedPoint
          }
        }
        
        return targetPoint
      }
    }
    
    // 如果没有点云交点，计算基于相机视角的合理深度位置
    const cameraDistance = camera.position.length()
    const targetDepth = cameraDistance * 0.3
    
    const direction = this.raycaster.ray.direction.clone()
    const intersectionPoint = this.raycaster.ray.origin.clone().add(direction.multiplyScalar(targetDepth))
    
    return intersectionPoint
  }

  // 查找最近的点云点
  findNearestCloudPoint(targetPoint, pointCloud) {
    if (!pointCloud.geometry || !pointCloud.geometry.attributes.position) {
      return null
    }
    
    const positions = pointCloud.geometry.attributes.position.array
    let nearestPoint = null
    let minDistance = this.config.snapDistance
    
    // 遍历所有点云点，找到最近的点
    for (let i = 0; i < positions.length; i += 3) {
      const cloudPoint = new THREE.Vector3(
        positions[i],
        positions[i + 1], 
        positions[i + 2]
      )
      
      const distance = targetPoint.distanceTo(cloudPoint)
      if (distance < minDistance) {
        minDistance = distance
        nearestPoint = cloudPoint
      }
    }
    
    return nearestPoint
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

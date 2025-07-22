import * as THREE from 'three'

export class PathManager {
  constructor(scene) {
    this.scene = scene
    this.paths = []
    this.currentPath = null
    this.drawingMode = false
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
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
    
    // 添加可视化的点
    const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 8)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })
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
    
    // 检测与点云的交集
    if (pointCloud) {
      const intersects = this.raycaster.intersectObject(pointCloud)
      if (intersects.length > 0) {
        return intersects[0].point
      }
    }
    
    // 如果没有点云，在射线与XZ平面的交点添加点
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersectionPoint = new THREE.Vector3()
    this.raycaster.ray.intersectPlane(plane, intersectionPoint)
    return intersectionPoint
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

  // 销毁管理器
  dispose() {
    this.clearPaths()
    this.paths = []
    this.currentPath = null
  }
}

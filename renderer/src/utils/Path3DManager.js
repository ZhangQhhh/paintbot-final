import * as THREE from 'three'
import { PathAlgorithms } from './PathAlgorithms.js'

export class Path3DManager {
  constructor(scene) {
    this.scene = scene
    this.paths = []
    this.currentPath = null
    this.drawingMode = false
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.drawingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    this.pathId = 0
    
    // 默认样式
    this.defaultStyle = {
      color: 0xff4444,
      lineWidth: 3,
      opacity: 1.0,
      type: 'solid', // solid, dashed, dotted
      pointSize: 0.05,
      showPoints: true
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

  // 设置绘制平面
  setDrawingPlane(normal, point) {
    this.drawingPlane.setFromNormalAndCoplanarPoint(normal, point)
  }

  // 获取3D交点
  getIntersectionPoint(event, camera, targetObject, container) {
    const rect = container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.raycaster.setFromCamera(this.mouse, camera)
    
    // 先尝试与点云相交
    if (targetObject) {
      const intersects = this.raycaster.intersectObject(targetObject)
      if (intersects.length > 0) {
        return intersects[0].point
      }
    }
    
    // 如果没有与点云相交，则与绘制平面相交
    const intersectPoint = new THREE.Vector3()
    if (this.raycaster.ray.intersectPlane(this.drawingPlane, intersectPoint)) {
      return intersectPoint
    }
    
    return null
  }

  // 添加点到当前路径
  addPointToPath(point, style = this.defaultStyle) {
    if (!this.currentPath) {
      this.currentPath = {
        id: this.pathId++,
        points: [],
        distance: 0,
        style: { ...style },
        line: null,
        spheres: [],
        tube: null,
        created: new Date(),
        name: `路径 ${this.pathId}`
      }
    }
    
    this.currentPath.points.push(point.clone())
    
    // 添加可视化的点
    if (this.currentPath.style.showPoints) {
      this.addPointSphere(point, this.currentPath.style)
    }
    
    // 如果有两个或更多点，绘制线段
    if (this.currentPath.points.length >= 2) {
      this.updatePathLine()
      this.updatePathDistance()
    }
    
    return this.currentPath
  }

  // 添加点球体
  addPointSphere(point, style) {
    const sphereGeometry = new THREE.SphereGeometry(style.pointSize, 16, 16)
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: style.color,
      transparent: true,
      opacity: style.opacity
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.copy(point)
    this.scene.add(sphere)
    this.currentPath.spheres.push(sphere)
  }

  // 更新路径线段
  updatePathLine() {
    if (!this.currentPath || this.currentPath.points.length < 2) return
    
    // 移除旧的线段和管道
    if (this.currentPath.line) {
      this.scene.remove(this.currentPath.line)
      this.currentPath.line.geometry.dispose()
      this.currentPath.line.material.dispose()
    }
    
    if (this.currentPath.tube) {
      this.scene.remove(this.currentPath.tube)
      this.currentPath.tube.geometry.dispose()
      this.currentPath.tube.material.dispose()
    }
    
    // 创建3D管道路径
    this.create3DPath()
  }

  // 创建3D路径（使用管道几何体）
  create3DPath() {
    if (this.currentPath.points.length < 2) return
    
    const style = this.currentPath.style
    
    // 创建曲线
    const curve = new THREE.CatmullRomCurve3(this.currentPath.points)
    
    // 创建管道几何体
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      Math.max(50, this.currentPath.points.length * 10), // 段数
      style.lineWidth * 0.01, // 半径
      8, // 径向段数
      false // 是否闭合
    )
    
    // 创建材质
    let material
    if (style.type === 'dashed') {
      material = new THREE.LineDashedMaterial({
        color: style.color,
        linewidth: style.lineWidth,
        scale: 1,
        dashSize: 0.1,
        gapSize: 0.05,
        transparent: true,
        opacity: style.opacity
      })
    } else {
      material = new THREE.MeshBasicMaterial({
        color: style.color,
        transparent: true,
        opacity: style.opacity,
        side: THREE.DoubleSide
      })
    }
    
    const tube = new THREE.Mesh(tubeGeometry, material)
    this.scene.add(tube)
    this.currentPath.tube = tube
    
    // 同时创建线框用于选择
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(this.currentPath.points)
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: style.color,
      transparent: true,
      opacity: 0.1
    })
    const line = new THREE.Line(lineGeometry, lineMaterial)
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
        ...this.currentPath,
        points: [...this.currentPath.points],
        spheres: [...this.currentPath.spheres]
      })
    } else if (this.currentPath) {
      // 清理未完成的路径
      this.clearCurrentPath()
    }
    this.currentPath = null
  }

  // 清理当前路径
  clearCurrentPath() {
    if (this.currentPath) {
      if (this.currentPath.line) {
        this.scene.remove(this.currentPath.line)
        this.currentPath.line.geometry.dispose()
        this.currentPath.line.material.dispose()
      }
      if (this.currentPath.tube) {
        this.scene.remove(this.currentPath.tube)
        this.currentPath.tube.geometry.dispose()
        this.currentPath.tube.material.dispose()
      }
      this.currentPath.spheres.forEach(sphere => {
        this.scene.remove(sphere)
        sphere.geometry.dispose()
        sphere.material.dispose()
      })
    }
  }

  // 更新路径样式
  updatePathStyle(pathIndex, newStyle) {
    if (pathIndex < 0 || pathIndex >= this.paths.length) return
    
    const path = this.paths[pathIndex]
    path.style = { ...path.style, ...newStyle }
    
    // 重新创建可视化
    this.recreatePathVisuals(path)
  }

  // 重新创建路径可视化
  recreatePathVisuals(path) {
    // 清理旧的可视化
    if (path.line) {
      this.scene.remove(path.line)
      path.line.geometry.dispose()
      path.line.material.dispose()
    }
    if (path.tube) {
      this.scene.remove(path.tube)
      path.tube.geometry.dispose()
      path.tube.material.dispose()
    }
    path.spheres.forEach(sphere => {
      this.scene.remove(sphere)
      sphere.geometry.dispose()
      sphere.material.dispose()
    })
    path.spheres = []
    
    // 重新创建
    if (path.style.showPoints) {
      path.points.forEach(point => {
        this.addPointSphere(point, path.style)
      })
    }
    
    this.currentPath = path
    this.create3DPath()
    
    // 更新路径引用
    const index = this.paths.findIndex(p => p.id === path.id)
    if (index !== -1) {
      this.paths[index] = { ...path }
    }
    
    this.currentPath = null
  }

  // 删除路径
  deletePath(index) {
    if (index < 0 || index >= this.paths.length) return
    
    const path = this.paths[index]
    
    // 清理场景中的对象
    if (path.line) {
      this.scene.remove(path.line)
      path.line.geometry.dispose()
      path.line.material.dispose()
    }
    if (path.tube) {
      this.scene.remove(path.tube)
      path.tube.geometry.dispose()
      path.tube.material.dispose()
    }
    path.spheres.forEach(sphere => {
      this.scene.remove(sphere)
      sphere.geometry.dispose()
      sphere.material.dispose()
    })
    
    this.paths.splice(index, 1)
  }

  // 清空所有路径
  clearPaths() {
    this.paths.forEach((_, index) => {
      this.deletePath(0) // 总是删除第一个，因为数组会缩短
    })
    this.paths = []
    this.clearCurrentPath()
    this.currentPath = null
  }

  // 高亮路径
  highlightPath(index) {
    // 重置所有路径的高亮状态
    this.paths.forEach(path => {
      if (path.tube) {
        path.tube.material.opacity = path.style.opacity
      }
      if (path.line) {
        path.line.material.opacity = path.style.opacity * 0.1
      }
    })
    
    // 高亮指定路径
    if (index >= 0 && index < this.paths.length) {
      const path = this.paths[index]
      if (path.tube) {
        path.tube.material.opacity = Math.min(1.0, path.style.opacity * 1.5)
      }
      if (path.line) {
        path.line.material.opacity = Math.min(1.0, path.style.opacity * 0.3)
      }
    }
  }

  // 获取总距离
  getTotalDistance() {
    return this.paths.reduce((total, path) => total + (path.distance || 0), 0)
  }

  // 保存路径数据
  savePathsData() {
    if (this.paths.length === 0) {
      throw new Error('没有路径可以保存')
    }
    
    return {
      version: '2.0',
      created: new Date().toISOString(),
      totalDistance: this.getTotalDistance(),
      pathCount: this.paths.length,
      paths: this.paths.map(path => ({
        id: path.id,
        name: path.name,
        points: path.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
        distance: path.distance,
        style: path.style,
        created: path.created
      }))
    }
  }

  // 加载路径数据
  loadPathsData(data) {
    this.clearPaths()
    
    if (data.paths && Array.isArray(data.paths)) {
      data.paths.forEach(pathData => {
        const path = {
          id: pathData.id || this.pathId++,
          name: pathData.name || `路径 ${this.pathId}`,
          points: pathData.points.map(p => new THREE.Vector3(p.x, p.y, p.z)),
          distance: pathData.distance || 0,
          style: { ...this.defaultStyle, ...pathData.style },
          spheres: [],
          line: null,
          tube: null,
          created: pathData.created || new Date()
        }
        
        // 重建可视化
        this.currentPath = path
        if (path.style.showPoints) {
          path.points.forEach(point => {
            this.addPointSphere(point, path.style)
          })
        }
        if (path.points.length >= 2) {
          this.create3DPath()
        }
        
        this.paths.push({ ...path })
        this.currentPath = null
      })
    }
  }

  // 导出路径为不同格式
  exportPaths(format = 'json') {
    const data = this.savePathsData()
    
    switch (format) {
      case 'json':
        return {
          content: JSON.stringify(data, null, 2),
          filename: `路径规划_${new Date().toISOString().slice(0, 10)}.json`,
          mimeType: 'application/json'
        }
      
      case 'csv':
        let csvContent = 'Path_ID,Point_Index,X,Y,Z,Distance\n'
        data.paths.forEach((path, pathIndex) => {
          path.points.forEach((point, pointIndex) => {
            csvContent += `${path.id},${pointIndex},${point.x},${point.y},${point.z},${path.distance}\n`
          })
        })
        return {
          content: csvContent,
          filename: `路径规划_${new Date().toISOString().slice(0, 10)}.csv`,
          mimeType: 'text/csv'
        }
      
      case 'obj':
        let objContent = '# 3D Path Export\n'
        let vertexIndex = 1
        
        data.paths.forEach((path, pathIndex) => {
          objContent += `# Path ${path.id}: ${path.name}\n`
          path.points.forEach(point => {
            objContent += `v ${point.x} ${point.y} ${point.z}\n`
          })
          
          // 创建线段
          for (let i = 0; i < path.points.length - 1; i++) {
            objContent += `l ${vertexIndex + i} ${vertexIndex + i + 1}\n`
          }
          
          vertexIndex += path.points.length
        })
        
        return {
          content: objContent,
          filename: `路径规划_${new Date().toISOString().slice(0, 10)}.obj`,
          mimeType: 'text/plain'
        }
      
      default:
        throw new Error(`不支持的导出格式: ${format}`)
    }
  }

  // 平滑路径
  smoothPath(pathIndex, segments = 50) {
    if (pathIndex < 0 || pathIndex >= this.paths.length) return false
    
    const path = this.paths[pathIndex]
    if (path.points.length < 3) return false
    
    const smoothedPoints = PathAlgorithms.smoothPath(path.points, segments)
    path.points = smoothedPoints
    this.updatePathDistance(path)
    this.recreatePathVisuals(path)
    
    return true
  }

  // 优化路径（移除冗余点）
  optimizePath(pathIndex, tolerance = 0.1) {
    if (pathIndex < 0 || pathIndex >= this.paths.length) return false
    
    const path = this.paths[pathIndex]
    if (path.points.length <= 2) return false
    
    const optimizedPoints = PathAlgorithms.optimizePath(path.points, tolerance)
    path.points = optimizedPoints
    this.updatePathDistance(path)
    this.recreatePathVisuals(path)
    
    return true
  }

  // 连接多条路径
  connectPaths(pathIndices, connectionMethod = 'shortest') {
    if (pathIndices.length < 2) return false
    
    const pathsToConnect = pathIndices.map(index => this.paths[index]).filter(Boolean)
    if (pathsToConnect.length < 2) return false
    
    const connectedPaths = PathAlgorithms.connectPaths(pathsToConnect, connectionMethod)
    
    if (connectedPaths.length === 1) {
      const newPath = connectedPaths[0]
      
      // 删除原路径
      pathIndices.sort((a, b) => b - a) // 从大到小删除
      pathIndices.forEach(index => this.deletePath(index))
      
      // 添加新连接的路径
      newPath.id = this.pathId++
      newPath.name = `连接路径 ${this.pathId}`
      newPath.spheres = []
      newPath.line = null
      newPath.tube = null
      newPath.created = new Date()
      
      this.updatePathDistance(newPath)
      
      // 重建可视化
      this.currentPath = newPath
      if (newPath.style.showPoints) {
        newPath.points.forEach(point => {
          this.addPointSphere(point, newPath.style)
        })
      }
      this.create3DPath()
      
      this.paths.push({ ...newPath })
      this.currentPath = null
      
      return true
    }
    
    return false
  }

  // 反向路径
  reversePath(pathIndex) {
    if (pathIndex < 0 || pathIndex >= this.paths.length) return false
    
    const path = this.paths[pathIndex]
    path.points.reverse()
    this.recreatePathVisuals(path)
    
    return true
  }

  // 缩放路径
  scalePath(pathIndex, scale, center = null) {
    if (pathIndex < 0 || pathIndex >= this.paths.length) return false
    
    const path = this.paths[pathIndex]
    path.points = PathAlgorithms.scalePath(path.points, scale, center)
    this.updatePathDistance(path)
    this.recreatePathVisuals(path)
    
    return true
  }

  // 旋转路径
  rotatePath(pathIndex, rotation, center = null) {
    if (pathIndex < 0 || pathIndex >= this.paths.length) return false
    
    const path = this.paths[pathIndex]
    path.points = PathAlgorithms.rotatePath(path.points, rotation, center)
    this.updatePathDistance(path)
    this.recreatePathVisuals(path)
    
    return true
  }

  // 平移路径
  translatePath(pathIndex, offset) {
    if (pathIndex < 0 || pathIndex >= this.paths.length) return false
    
    const path = this.paths[pathIndex]
    path.points = PathAlgorithms.translatePath(path.points, offset)
    this.recreatePathVisuals(path)
    
    return true
  }

  // 复制路径
  duplicatePath(pathIndex) {
    if (pathIndex < 0 || pathIndex >= this.paths.length) return false
    
    const originalPath = this.paths[pathIndex]
    const newPath = {
      ...originalPath,
      id: this.pathId++,
      name: `${originalPath.name} (副本)`,
      points: originalPath.points.map(p => p.clone()),
      spheres: [],
      line: null,
      tube: null,
      created: new Date()
    }
    
    // 重建可视化
    this.currentPath = newPath
    if (newPath.style.showPoints) {
      newPath.points.forEach(point => {
        this.addPointSphere(point, newPath.style)
      })
    }
    if (newPath.points.length >= 2) {
      this.create3DPath()
    }
    
    this.paths.push({ ...newPath })
    this.currentPath = null
    
    return this.paths.length - 1 // 返回新路径的索引
  }

  // 获取路径统计信息
  getPathStatistics() {
    const totalPaths = this.paths.length
    const totalDistance = this.getTotalDistance()
    const totalPoints = this.paths.reduce((total, path) => total + path.points.length, 0)
    
    const distances = this.paths.map(path => path.distance || 0)
    const avgDistance = totalPaths > 0 ? totalDistance / totalPaths : 0
    const minDistance = totalPaths > 0 ? Math.min(...distances) : 0
    const maxDistance = totalPaths > 0 ? Math.max(...distances) : 0
    
    return {
      totalPaths,
      totalDistance,
      totalPoints,
      avgDistance,
      minDistance,
      maxDistance,
      avgPointsPerPath: totalPaths > 0 ? totalPoints / totalPaths : 0
    }
  }

  // 更新单个路径的距离
  updatePathDistance(path) {
    if (!path || path.points.length < 2) {
      if (path) path.distance = 0
      return
    }
    
    let distance = 0
    for (let i = 1; i < path.points.length; i++) {
      distance += path.points[i].distanceTo(path.points[i - 1])
    }
    path.distance = distance
  }
}

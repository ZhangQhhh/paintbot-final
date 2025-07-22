// 路径算法扩展
import * as THREE from 'three'

export class PathAlgorithms {
  // 路径平滑算法（贝塞尔曲线）
  static smoothPath(points, segments = 50) {
    if (points.length < 3) return points
    
    const smoothedPoints = []
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      
      for (let t = 0; t < 1; t += 1 / segments) {
        const smoothPoint = this.catmullRomInterpolation(p0, p1, p2, p3, t)
        smoothedPoints.push(smoothPoint)
      }
    }
    
    smoothedPoints.push(points[points.length - 1])
    return smoothedPoints
  }
  
  // Catmull-Rom 插值
  static catmullRomInterpolation(p0, p1, p2, p3, t) {
    const t2 = t * t
    const t3 = t2 * t
    
    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    )
    
    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    )
    
    const z = 0.5 * (
      (2 * p1.z) +
      (-p0.z + p2.z) * t +
      (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
      (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3
    )
    
    return new THREE.Vector3(x, y, z)
  }
  
  // 路径优化 - 移除冗余点
  static optimizePath(points, tolerance = 0.1) {
    if (points.length <= 2) return points
    
    const optimized = [points[0]]
    
    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i - 1]
      const p2 = points[i]
      const p3 = points[i + 1]
      
      // 计算点到线段的距离
      const lineStart = p1
      const lineEnd = p3
      const distance = this.pointToLineDistance(p2, lineStart, lineEnd)
      
      // 如果距离大于容差，保留该点
      if (distance > tolerance) {
        optimized.push(p2)
      }
    }
    
    optimized.push(points[points.length - 1])
    return optimized
  }
  
  // 计算点到线段的距离
  static pointToLineDistance(point, lineStart, lineEnd) {
    const line = new THREE.Vector3().subVectors(lineEnd, lineStart)
    const pointToStart = new THREE.Vector3().subVectors(point, lineStart)
    
    const lineLength = line.length()
    if (lineLength === 0) return pointToStart.length()
    
    const t = Math.max(0, Math.min(1, pointToStart.dot(line) / (lineLength * lineLength)))
    const projection = new THREE.Vector3().addVectors(lineStart, line.multiplyScalar(t))
    
    return point.distanceTo(projection)
  }
  
  // 连接多条路径
  static connectPaths(paths, connectionMethod = 'shortest') {
    if (paths.length < 2) return paths
    
    const connected = []
    let currentPath = paths[0]
    const remainingPaths = [...paths.slice(1)]
    
    connected.push(currentPath)
    
    while (remainingPaths.length > 0) {
      let bestPath = null
      let bestIndex = -1
      let bestDistance = Infinity
      let shouldReverse = false
      
      const currentEnd = currentPath.points[currentPath.points.length - 1]
      
      // 找到距离最近的路径
      remainingPaths.forEach((path, index) => {
        const pathStart = path.points[0]
        const pathEnd = path.points[path.points.length - 1]
        
        const distanceToStart = currentEnd.distanceTo(pathStart)
        const distanceToEnd = currentEnd.distanceTo(pathEnd)
        
        if (distanceToStart < bestDistance) {
          bestDistance = distanceToStart
          bestPath = path
          bestIndex = index
          shouldReverse = false
        }
        
        if (distanceToEnd < bestDistance) {
          bestDistance = distanceToEnd
          bestPath = path
          bestIndex = index
          shouldReverse = true
        }
      })
      
      if (bestPath) {
        if (shouldReverse) {
          bestPath.points.reverse()
        }
        
        // 添加连接线段
        if (connectionMethod === 'linear') {
          currentPath.points.push(...bestPath.points)
        } else {
          // 添加中间连接点
          const connectionPoint = new THREE.Vector3()
            .addVectors(currentEnd, bestPath.points[0])
            .multiplyScalar(0.5)
          currentPath.points.push(connectionPoint, ...bestPath.points)
        }
        
        remainingPaths.splice(bestIndex, 1)
      }
    }
    
    return [currentPath]
  }
  
  // 路径反向
  static reversePath(path) {
    return {
      ...path,
      points: [...path.points].reverse()
    }
  }
  
  // 计算路径的边界框
  static getPathBounds(points) {
    if (points.length === 0) return null
    
    const min = new THREE.Vector3(Infinity, Infinity, Infinity)
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    
    points.forEach(point => {
      min.min(point)
      max.max(point)
    })
    
    return { min, max, center: new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5) }
  }
  
  // 路径缩放
  static scalePath(points, scale, center = null) {
    if (!center) {
      const bounds = this.getPathBounds(points)
      center = bounds ? bounds.center : new THREE.Vector3()
    }
    
    return points.map(point => {
      return new THREE.Vector3()
        .subVectors(point, center)
        .multiplyScalar(scale)
        .add(center)
    })
  }
  
  // 路径旋转
  static rotatePath(points, rotation, center = null) {
    if (!center) {
      const bounds = this.getPathBounds(points)
      center = bounds ? bounds.center : new THREE.Vector3()
    }
    
    const matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z))
    
    return points.map(point => {
      return new THREE.Vector3()
        .subVectors(point, center)
        .applyMatrix4(matrix)
        .add(center)
    })
  }
  
  // 路径平移
  static translatePath(points, offset) {
    return points.map(point => new THREE.Vector3().addVectors(point, offset))
  }
}

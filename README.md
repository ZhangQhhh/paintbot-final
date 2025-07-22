# 点云可视化系统 (Point Cloud Visualization System)

一个基于 Electron + Vue 3 + Three.js 的桌面点云可视化应用，支持路径规划和三维交互。

## ✨ 功能特性

### 🎯 点云可视化
- 支持 CSV 和 PCD 格式文件导入
- 三维点云渲染和交互
- 自定义点云大小和颜色方案
- 实时渲染质量调节

### 🛤️ 路径规划
- 交互式路径绘制
- 实时距离计算
- 多路径管理
- 路径编辑和优化
- 路径数据导出/导入

### 🎨 用户界面
- 现代化 Vue 3 界面
- Bootstrap 5 响应式设计
- 侧边栏导航
- 设置面板
- 实时参数调节

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn

### 安装依赖
```bash
# 安装主进程依赖
npm install

# 安装渲染进程依赖
cd renderer
npm install
cd ..
```

### 开发模式
```bash
# 启动开发服务器
npm run dev
```

### 构建应用
```bash
# 构建生产版本
npm run build

# 打包桌面应用
npm run electron:build
```

## 📁 项目结构

```
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本
├── package.json         # 主进程依赖
└── renderer/            # Vue 3 渲染进程
    ├── src/
    │   ├── components/  # Vue 组件
    │   │   ├── PointCloudViewer.vue     # 点云可视化核心组件
    │   │   ├── PathPlanningToolbar.vue  # 路径规划工具栏
    │   │   ├── PathInfoPanel.vue        # 路径信息面板
    │   │   ├── PathEditor.vue           # 路径编辑器
    │   │   └── Sidebar.vue              # 侧边栏导航
    │   ├── utils/
    │   │   └── PathManager.js           # 路径管理器
    │   ├── store/
    │   │   └── index.js                 # Vuex 状态管理
    │   ├── router/
    │   │   └── index.js                 # Vue Router 路由
    │   └── views/                       # 页面视图
    ├── package.json     # 渲染进程依赖
    └── vite.config.js   # Vite 配置
```

## 🛠️ 技术栈

- **桌面框架**: Electron
- **前端框架**: Vue 3 (Composition API)
- **3D 渲染**: Three.js
- **构建工具**: Vite
- **UI 框架**: Bootstrap 5
- **状态管理**: Vuex 4
- **路由**: Vue Router 4
- **开发语言**: JavaScript

## 🎮 使用说明

### 1. 加载点云数据
1. 点击"选择文件"按钮
2. 选择 CSV 或 PCD 格式的点云文件
3. 系统自动渲染点云数据

### 2. 路径规划
1. 点击"开始划线"进入绘制模式
2. 在点云中点击创建路径点
3. 系统自动连线并计算距离
4. 点击"退出划线"完成路径创建

### 3. 路径管理
- 在路径信息面板查看所有路径
- 点击路径项高亮显示
- 使用编辑功能修改路径属性
- 导出路径数据为 JSON 格式

### 4. 系统设置
- 调节点云大小和渲染质量
- 切换坐标轴显示
- 控制自动旋转

## 📊 数据格式

### CSV 格式
```csv
x,y,z
1.0,2.0,3.0
4.0,5.0,6.0
```

### PCD 格式
支持 ASCII 格式的 PCD 文件

### 路径数据格式
```json
{
  "timestamp": "2024-01-01T10:00:00.000Z",
  "totalPaths": 2,
  "totalDistance": 15.678,
  "paths": [
    {
      "id": 1,
      "points": [
        {"x": 1.2, "y": 2.3, "z": 0.5}
      ],
      "distance": 1.234,
      "segments": 1
    }
  ]
}
```

## 🔧 开发

### 添加新功能
1. 在 `renderer/src/components/` 添加新组件
2. 在 `renderer/src/utils/` 添加工具类
3. 更新 Vuex store 管理状态
4. 添加路由配置

### 构建配置
- 主进程构建: `package.json` scripts
- 渲染进程构建: `renderer/vite.config.js`

## 📝 更新日志

### v1.0.0
- ✅ 基础点云可视化功能
- ✅ 路径规划工具
- ✅ 组件化架构
- ✅ 数据导入导出
- ✅ 设置面板

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📧 联系方式

如有问题请提交 Issue 或联系开发者。

---

⭐ 如果这个项目对您有帮助，请给个 Star！

const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    center: true, // 窗口居中显示
    show: false, // 初始不显示，等加载完成后再显示
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // 隐藏菜单栏
  win.setMenuBarVisibility(false)
  
  // 加载前端页面
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'renderer', 'dist', 'index.html'))
  } else {
    win.loadURL('http://localhost:5173')
  }
  
  // 页面加载完成后显示窗口并聚焦
  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })
  
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
}) 
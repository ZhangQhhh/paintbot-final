import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import store from './store'

// 引入 Bootstrap CSS 和 JS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const app = createApp(App)
app.use(router)
app.use(store)
app.mount('#app')

import { createApp } from 'vue'
import naive from 'naive-ui'
import App from './App.vue'
import { multiRouter } from './router'
import './style.css'

const app = createApp(App)

app.use(naive)
app.use(multiRouter)

app.mount('#app')

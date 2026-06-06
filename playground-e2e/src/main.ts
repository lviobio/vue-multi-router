import { createApp } from 'vue'
import App from './App.vue'
import { multiRouter } from './router'

const app = createApp(App)
app.use(multiRouter)
app.mount('#app')

import { createApp } from 'vue'
import DisplayView from './views/DisplayView.vue'
import SettingsView from './views/SettingsView.vue'
import './styles.css'

const win = new URLSearchParams(location.search).get('win')
const App = win === 'settings' ? SettingsView : DisplayView
createApp(App).mount('#app')

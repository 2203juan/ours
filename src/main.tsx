import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initTheme } from './stores/themeStore'
import './index.css'

// Before the first render, so dark-mode users don't get a light flash
initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

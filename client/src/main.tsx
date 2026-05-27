import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<h1 style="color:red">ERROR: #root not found</h1>'
} else {
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (e) {
    root.innerHTML = `<div style="color:red;padding:20px;font-family:monospace"><h2>App crashed on mount:</h2><pre>${e}</pre></div>`
  }
}

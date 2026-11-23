import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PS5Launcher from './PS5Launcher.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PS5Launcher />
  </React.StrictMode>,
)

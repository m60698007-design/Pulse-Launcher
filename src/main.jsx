import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PulseLauncher from './PulseLauncher.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PulseLauncher />
  </React.StrictMode>,
)

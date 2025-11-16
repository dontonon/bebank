import React from 'react'
import ReactDOM from 'react-dom/client'
// import App from './App.jsx'
import TestApp from './TestApp.jsx'
import './index.css'

console.log('🔥 main.jsx is running!')
console.log('🔥 Root element:', document.getElementById('root'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)

console.log('🔥 React.render() called!')

import React from 'react'
import ReactDOM from 'react-dom/client'
import Website from './Website.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Website />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

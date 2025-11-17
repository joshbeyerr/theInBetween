import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import About from './routes/About.jsx'
import Login from './routes/Login.jsx'
import AdminLogin from './routes/AdminLogin.jsx'
import Admin from './routes/Admin.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

const router = createBrowserRouter([
  { 
    path: '/', 
    element: <App />,
    errorElement: <ErrorBoundary><div>Page not found</div></ErrorBoundary>
  },
  { 
    path: '/about', 
    element: <About />,
    errorElement: <ErrorBoundary><div>Error loading about page</div></ErrorBoundary>
  },
  { 
    path: '/login', 
    element: <Login />,
    errorElement: <ErrorBoundary><div>Error loading login page</div></ErrorBoundary>
  },
  { 
    path: '/admin-login', 
    element: <AdminLogin />,
    errorElement: <ErrorBoundary><div>Error loading admin login</div></ErrorBoundary>
  },
  { 
    path: '/admin', 
    element: <Admin />,
    errorElement: <ErrorBoundary><div>Error loading admin page</div></ErrorBoundary>
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Analytics />
    </ErrorBoundary>
  </React.StrictMode>,
)
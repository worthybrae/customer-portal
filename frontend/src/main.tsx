// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from '@/App'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import CompanyPortal from '@/pages/CompanyPortal'
import CreateCompany from '@/pages/CreateCompany'
import SurveyEditor from '@/pages/SurveyEditor'
import SurveyView from '@/pages/SurveyView'
import ThankYou from '@/pages/ThankYou'
import AuthCallback from '@/pages/AuthCallback'
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/login',
        element: <PublicRoute><Login /></PublicRoute>,
      },
      {
        path: '/register',
        element: <PublicRoute><Register /></PublicRoute>,
      },
      {
        path: '/company',
        element: <ProtectedRoute><CompanyPortal /></ProtectedRoute>,
      },
      {
        path: '/company/create',
        element: <ProtectedRoute><CreateCompany /></ProtectedRoute>,
      },
      {
        path: '/survey/editor/:surveyId?',
        element: <ProtectedRoute><SurveyEditor /></ProtectedRoute>,
      },
      {
        path: '/survey/results/:surveyId',
        element: <ProtectedRoute><CompanyPortal /></ProtectedRoute>,
      },
      {
        path: '/survey/:surveyId',
        element: <SurveyView />,
      },
      {
        path: '/thank-you',
        element: <ThankYou />,
      },
      {
        path: '/auth/callback',
        element: <AuthCallback />,
      }
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
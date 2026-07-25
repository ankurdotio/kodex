import { Navigate, createBrowserRouter } from 'react-router-dom'
import App from './App'
import { useAuth } from '../features/auth/hooks/useAuth'
import { ChatPage } from '../features/chat/ui/pages/ChatPage'
import { ForgotPasswordPage } from '../features/auth/ui/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/ui/pages/LoginPage'
import { RegisterPage } from '../features/auth/ui/pages/RegisterPage'
import { VerifyEmailPage } from '../features/auth/ui/pages/VerifyEmailPage'
import { ResetPasswordPage } from '../features/auth/ui/pages/ResetPasswordPage'

// Rule: if user is logged in and verified -> go to chat, otherwise redirect
function ChatRoute({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user && !user.verified) {
    return <Navigate to="/verify-email" replace />
  }

  return children
}

// Rule: if user is logged in but not verified -> go to verify-email, otherwise redirect
function VerifyEmailRoute({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user && user.verified) {
    return <Navigate to="/chat" replace />
  }

  return children
}

// Rule: if user is not logged in OR if user is logged in but not verified
// Applies to: login, signup/register, forgot-password, reset-password
function UnverifiedOrGuestRoute({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated && user && user.verified) {
    return <Navigate to="/chat" replace />
  }

  return children
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      {
        path: 'login',
        element: (
          <UnverifiedOrGuestRoute>
            <LoginPage />
          </UnverifiedOrGuestRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <UnverifiedOrGuestRoute>
            <RegisterPage />
          </UnverifiedOrGuestRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <UnverifiedOrGuestRoute>
            <ForgotPasswordPage />
          </UnverifiedOrGuestRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <UnverifiedOrGuestRoute>
            <ResetPasswordPage />
          </UnverifiedOrGuestRoute>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <VerifyEmailRoute>
            <VerifyEmailPage />
          </VerifyEmailRoute>
        ),
      },
      {
        path: 'chat/:id?',
        element: (
          <ChatRoute>
            <ChatPage />
          </ChatRoute>
        ),
      },
      { path: '*', element: <Navigate to="/chat" replace /> },
    ],
  },
])

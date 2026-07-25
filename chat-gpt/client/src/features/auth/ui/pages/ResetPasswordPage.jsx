import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from '../components/AuthLayout'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword, loading, error, clearError } = useAuth()
  
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    }
  }, [searchParams])

  async function onSubmit(event) {
    event.preventDefault()
    clearError()
    setValidationError('')
    setInfoMessage('')

    if (!token) {
      setValidationError('Reset token is required. Please check your email link.')
      return
    }

    if (newPassword.length < 8) {
      setValidationError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }

    const result = await resetPassword({ token, newPassword })
    if (result.ok) {
      setInfoMessage('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your new password below to reset your account credentials."
      footerText="Remembered password?"
      footerLink="/login"
      footerLabel="Login"
    >
      <form className="grid gap-3 mt-4" onSubmit={onSubmit}>
        <div className="grid gap-1">
          <label className="text-[13px] font-medium text-[#A1A1AA]">
            Reset Token
          </label>
          <input
            className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-[15px] text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1"
            type="text"
            placeholder="Enter token from email"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-1">
          <label className="text-[13px] font-medium text-[#A1A1AA]">
            New Password
          </label>
          <input
            className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-[15px] text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1"
            type="password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-1">
          <label className="text-[13px] font-medium text-[#A1A1AA]">
            Confirm New Password
          </label>
          <input
            className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-[15px] text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        {validationError && <p className="text-[13px] text-[#EF4444] font-medium">{validationError}</p>}
        {error && <p className="text-[13px] text-[#EF4444] font-medium">{error}</p>}
        {infoMessage && <p className="text-[13px] text-white font-medium">{infoMessage}</p>}

        <button
          className="h-11 rounded-lg bg-white text-black font-semibold transition-colors hover:bg-[#E4E4E7] disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'Resetting password...' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  )
}

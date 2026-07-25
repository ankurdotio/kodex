import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from '../components/AuthLayout'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const { user, verifyEmail, resendVerification, loading, error, clearError } = useAuth()
  
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  // Manage resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  async function onSubmit(event) {
    event.preventDefault()
    clearError()
    setInfoMessage('')

    const result = await verifyEmail({ email, otp })
    if (result.ok) {
      setInfoMessage('Email verified successfully! Redirecting...')
      setTimeout(() => {
        navigate('/chat')
      }, 1500)
    }
  }

  async function handleResend(event) {
    event.preventDefault()
    clearError()
    setInfoMessage('')

    if (!email) {
      setInfoMessage('Please enter your email to resend OTP')
      return
    }

    const result = await resendVerification({ email })
    if (result.ok) {
      setInfoMessage(result.message || 'OTP resent successfully!')
      setResendCooldown(60) // Cooldown for 60 seconds
    } else {
      setInfoMessage(result.message || 'Failed to resend OTP')
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit OTP code sent to your email address."
      footerText="Back to"
      footerLink="/login"
      footerLabel="Login"
    >
      <form className="grid gap-3 mt-4" onSubmit={onSubmit}>
        <div className="grid gap-1">
          <label className="text-[13px] font-medium text-[#A1A1AA]">
            Email Address
          </label>
          <input
            className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-[15px] text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1 disabled:opacity-50"
            type="email"
            placeholder="name@domain.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!!user?.email || loading}
            required
          />
        </div>

        <div className="grid gap-1">
          <label className="text-[13px] font-medium text-[#A1A1AA]">
            6-Digit OTP Code
          </label>
          <input
            className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-center text-lg font-semibold tracking-widest text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1 disabled:opacity-50"
            type="text"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(event) => {
              const val = event.target.value.replace(/\D/g, '')
              setOtp(val)
            }}
            disabled={loading}
            required
          />
        </div>

        {error && <p className="text-[13px] text-[#EF4444] font-medium">{error}</p>}
        {infoMessage && <p className="text-[13px] text-white font-medium">{infoMessage}</p>}

        <button
          className="h-11 rounded-lg bg-white text-black font-semibold transition-colors hover:bg-[#E4E4E7] disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={loading || otp.length < 6}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <button
          className="h-11 rounded-lg border border-[#27272A] bg-transparent text-white font-semibold transition-colors hover:bg-[#27272A] disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || loading}
        >
          {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
        </button>
      </form>
    </AuthLayout>
  )
}

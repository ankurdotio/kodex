import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from '../components/AuthLayout'

export function ForgotPasswordPage() {
  const { forgotPassword, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    clearError()
    setMessage('')

    const result = await forgotPassword({ email })
    if (result.ok) {
      setMessage(result.data.resetToken ? `Reset token (dev): ${result.data.resetToken}` : result.data.message)
    }
  }

  return (
    <AuthLayout
      title="Recover account"
      subtitle="Enter your email and we'll generate a reset flow."
      footerText="Remembered your password?"
      footerLink="/login"
      footerLabel="Back to login"
    >
      <form className="grid gap-3" onSubmit={onSubmit}>
        <input
          className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-[15px] text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {error && <p className="text-[13px] text-[#EF4444] font-medium">{error}</p>}
        {message && <p className="text-[13px] text-white font-medium">{message}</p>}
        <button
          className="h-11 rounded-lg bg-white text-black font-semibold transition-colors hover:bg-[#E4E4E7] disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  )
}

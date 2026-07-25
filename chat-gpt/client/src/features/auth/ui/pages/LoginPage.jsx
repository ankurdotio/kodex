import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from '../components/AuthLayout'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error, clearError } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })

  async function onSubmit(event) {
    event.preventDefault()
    clearError()
    const result = await login(form)
    if (result.ok) {
      navigate('/chat')
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your conversations."
      footerText="No account yet?"
      footerLink="/register"
      footerLabel="Create account"
    >
      <form className="grid gap-3" onSubmit={onSubmit}>
        <input
          className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-[15px] text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-[15px] text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
        <div className="flex justify-end">
          <Link
            className="text-xs font-semibold text-[#A1A1AA] transition-colors hover:text-white hover:underline"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-[13px] text-[#EF4444] font-medium">{error}</p>}
        <button
          className="h-11 rounded-lg bg-white text-black font-semibold transition-colors hover:bg-[#E4E4E7] disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </AuthLayout>
  )
}

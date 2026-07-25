import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from '../components/AuthLayout'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, loading, error, clearError } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  async function onSubmit(event) {
    event.preventDefault()
    clearError()
    const result = await register(form)
    if (result.ok) {
      navigate('/chat')
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Set up your workspace in seconds."
      footerText="Already have an account?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      <form className="grid gap-3" onSubmit={onSubmit}>
        <input
          className="h-11 rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-[15px] text-white outline-none ring-zinc-500 placeholder:text-[#71717A] focus:ring-1"
          type="text"
          placeholder="Full name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
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
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
        {error && <p className="text-[13px] text-[#EF4444] font-medium">{error}</p>}
        <button
          className="h-11 rounded-lg bg-white text-black font-semibold transition-colors hover:bg-[#E4E4E7] disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  )
}

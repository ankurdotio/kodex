import { Link } from 'react-router-dom'

export function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <div className="min-h-screen bg-[#09090B] px-4 py-6 text-[#FAFAFA] flex items-center justify-center">
      <div className="w-full max-w-[440px] rounded-xl border border-[#27272A] bg-[#18181B] p-8 shadow-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#A1A1AA] border-t border-[#27272A] pt-4">
          <span>{footerText}</span>
          <Link
            className="font-semibold text-white transition-colors hover:text-[#D4D4D8] hover:underline"
            to={footerLink}
          >
            {footerLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}

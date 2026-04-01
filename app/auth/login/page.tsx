'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Sign-in was cancelled.',
  server_error: 'Something went wrong. Please try again.',
}

function LoginContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const errorMessage = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? errorDescription ?? errorCode)
    : null

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background-landing flex flex-col relative font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* Background Gradient Accent - Optic Precision */}
      <div className="absolute top-0 left-0 w-full md:w-1/2 h-full bg-gradient-to-br from-[#A3FFB3]/30 to-[#80da92]/10 z-0 pointer-events-none mix-blend-multiply opacity-50"></div>

      {/* Header */}
      <header className="w-full flex justify-between items-center py-8 px-10 relative z-10">
        <Link href="/" className="font-extrabold text-zinc-900 text-2xl tracking-tighter">
          Rezoomed
        </Link>
        <Link href="#" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
          Support
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col justify-center items-center px-4 md:px-0 relative z-10">
        {/* Authentication Card */}
        <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-10 md:p-12 mb-8 border border-white">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-on-background mb-3">Welcome Back</h1>
            <p className="text-sm text-on-surface-variant">Please enter your details to sign in to Rezoomed AI.</p>
          </div>

          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-3 bg-surface-container-low hover:bg-zinc-100 transition-colors rounded-lg py-3 text-sm font-bold text-on-surface"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              className="flex items-center justify-center gap-3 bg-surface-container-low hover:bg-zinc-100 transition-colors rounded-lg py-3 text-sm font-bold text-on-surface"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              LinkedIn
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-zinc-100 flex-1"></div>
            <span className="text-[10px] uppercase font-bold tracking-[0.05em] text-zinc-400">Or continue with</span>
            <div className="h-px bg-zinc-100 flex-1"></div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold text-center border border-red-100">
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold tracking-widest text-zinc-900 block">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                className="w-full bg-surface-container-low px-4 py-4 rounded text-sm font-medium border-b-2 border-transparent focus:outline-none focus:border-[#026d32] transition-colors text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="text-[11px] uppercase font-bold tracking-widest text-zinc-900 block">Password</label>
                <Link href="#" className="text-xs font-bold text-[#026d32] hover:text-[#19793c] transition-colors">Forgot password?</Link>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-surface-container-low px-4 py-4 rounded text-sm font-medium border-b-2 border-transparent focus:outline-none focus:border-[#026d32] transition-colors text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded appearance-none border border-zinc-300 checked:bg-[#026d32] checked:border-[#026d32] transition-colors"
                style={{
                  backgroundImage: rememberMe ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E")` : 'none',
                  backgroundSize: '80%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <label htmlFor="remember" className="text-sm font-medium text-zinc-600 select-none cursor-pointer">Remember me for 30 days</label>
            </div>

            <button className="w-full bg-[#A3FFB3] hover:bg-[#80da92] text-[#19793c] font-black tracking-wide py-4 rounded-lg mt-2 transition-all flex justify-center items-center gap-2 group">
              Sign In 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            
            <div className="text-center pt-2">
              <span className="text-sm text-zinc-500 font-medium">Don't have an account? </span>
              <Link href="#" className="text-sm font-bold text-[#026d32] hover:text-[#19793c] transition-colors">Create Account</Link>
            </div>
          </div>
        </div>
        
        <div className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">
          PRECISION OPTICS FOR PROFESSIONAL RECRUITMENT
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 mt-10 border-t border-zinc-100 dark:border-zinc-800 bg-[#f8f9fa] dark:bg-zinc-950 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto text-sm text-zinc-500 font-semibold">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-zinc-600 text-lg">Rezoomed</span>
          </div>
          <div className="flex items-center gap-8 text-zinc-400">
            <Link className="hover:text-zinc-700 transition-colors" href="#">Privacy Policy</Link>
            <Link className="hover:text-zinc-700 transition-colors" href="#">Terms of Service</Link>
            <Link className="hover:text-zinc-700 transition-colors" href="#">Security</Link>
            <Link className="hover:text-zinc-700 transition-colors" href="#">Status</Link>
          </div>
          <div className="text-zinc-400 font-medium">
            © 2024 Rezoomed AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

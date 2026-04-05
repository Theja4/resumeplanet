'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  BarChart3,
  LayoutTemplate,
  Lock,
  ShieldCheck,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PRO_PLAN } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import { Analytics, setAuthIntent } from '@/lib/analytics'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

type AuthCopy = {
  badge: string
  heroTitle: string
  heroDescription: string
  cardTitle: string
  cardDescription: string
  submitLabel: string
  submitLoadingLabel: string
  switchPrompt: string
  switchLabel: string
  switchHref: string
  helperLabel: string
  securityNote: string
  googleLabel?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Authentication was cancelled.',
  server_error: 'Something went wrong. Please try again.',
}

function BrandLockup() {
  return (
    <Link href="/" className="inline-flex items-center">
      <span className="text-lg font-black tracking-tighter text-on-background">Rezoomed</span>
    </Link>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function AuthHighlight({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/70 bg-white/74 p-4 shadow-[0_16px_36px_rgba(25,28,29,0.05)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary-container/70 text-on-primary-container shadow-[0_12px_24px_rgba(2,109,50,0.08)]">
          <Icon size={18} strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-bold text-on-surface">{title}</p>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">{description}</p>
        </div>
      </div>
    </div>
  )
}

const AUTH_COPY: Record<AuthMode, AuthCopy> = {
  login: {
    badge: 'Secure sign in',
    heroTitle: 'Sign in and get back to your resume.',
    heroDescription:
      'Everything you need to tailor, score, and export is waiting inside. The page stays quiet so the login form remains the primary action.',
    cardTitle: 'Welcome back.',
    cardDescription: 'Continue with Google or use your email and password.',
    googleLabel: 'Continue with Google',
    submitLabel: 'Sign in',
    submitLoadingLabel: 'Signing in…',
    switchPrompt: 'New to Rezoomed?',
    switchLabel: 'Create account',
    switchHref: '/auth/register',
    helperLabel: 'Google can create your account automatically.',
    securityNote: 'Secure sessions with Google OAuth and password authentication.',
  },
  register: {
    badge: 'Create account',
    heroTitle: 'Create your account and start building faster.',
    heroDescription:
      'Set up your workspace once, then start tailoring resumes, checking ATS performance, and exporting polished versions from one place.',
    cardTitle: 'Create your account.',
    cardDescription: 'Use Google for the fastest setup or register with email and password.',
    googleLabel: 'Sign up with Google',
    submitLabel: 'Create account',
    submitLoadingLabel: 'Creating account…',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in',
    switchHref: '/auth/login',
    helperLabel: 'If email confirmation is enabled, we will send you a verification link.',
    securityNote: 'Secure sessions with Google OAuth and password authentication.',
  },
  forgot: {
    badge: 'Password recovery',
    heroTitle: 'Reset your password and get back inside.',
    heroDescription:
      'Enter the email tied to your account and Rezoomed will send a secure recovery link so you can choose a new password.',
    cardTitle: 'Forgot your password?',
    cardDescription: 'Send yourself a recovery link. It opens a secure page where you can set a new password.',
    submitLabel: 'Send reset link',
    submitLoadingLabel: 'Sending reset link…',
    switchPrompt: 'Remembered your password?',
    switchLabel: 'Back to sign in',
    switchHref: '/auth/login',
    helperLabel: 'The recovery email lands on a secure reset page in this app.',
    securityNote: 'Recovery links stay scoped to your account and expire automatically.',
  },
  reset: {
    badge: 'Choose new password',
    heroTitle: 'Create a new password for your workspace.',
    heroDescription:
      'Once the recovery link is verified, you can replace the old password and return to your dashboard without leaving the auth flow.',
    cardTitle: 'Create a new password.',
    cardDescription: 'Use a strong password you have not used elsewhere.',
    submitLabel: 'Update password',
    submitLoadingLabel: 'Updating password…',
    switchPrompt: 'Need a new recovery email?',
    switchLabel: 'Request another link',
    switchHref: '/auth/forgot-password',
    helperLabel: 'After the password is updated, you will be sent back into your workspace.',
    securityNote: 'Recovery links stay scoped to your account and expire automatically.',
  },
}

export default function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const copy = AUTH_COPY[mode]
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'
  const showGoogleAuth = mode === 'login' || mode === 'register'
  const showEmailField = !isReset
  const showPasswordField = !isForgot
  const showConfirmPasswordField = isRegister || isReset
  const templateFeature =
    PRO_PLAN.features.find(feature => feature.toLowerCase().includes('template')) ??
    'Highly customizable template'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'loading' | 'ready' | 'invalid'>(
    isReset ? 'loading' : 'idle'
  )

  const authErrorMessage =
    localError || (errorCode ? ERROR_MESSAGES[errorCode] ?? errorDescription ?? errorCode : null)

  const getAuthOrigin = () => window.location.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const authHighlights: Array<{ title: string; description: string; icon: LucideIcon }> = [
    {
      title: 'Tailor Mode',
      description: 'Match each resume to the exact role you want before you send it out.',
      icon: Target,
    },
    {
      title: 'Unlimited ATS scans',
      description: 'Keep revising and rescoring until the document reads correctly.',
      icon: BarChart3,
    },
    {
      title: 'Custom exports',
      description: `${templateFeature} with polished PDF and DOCX downloads.`,
      icon: LayoutTemplate,
    },
  ]

  useEffect(() => {
    if (!isReset) {
      return
    }

    const supabase = createClient()
    let isMounted = true
    let invalidationTimer: number | null = null

    const clearRecoveryUrl = () => {
      if (window.location.search || window.location.hash) {
        window.history.replaceState({}, document.title, '/auth/reset-password')
      }
    }

    const markReady = () => {
      if (!isMounted) {
        return
      }

      setRecoveryStatus('ready')
      setLocalError(null)
      clearRecoveryUrl()
    }

    const markInvalid = (message?: string) => {
      if (!isMounted) {
        return
      }

      setRecoveryStatus('invalid')
      setLocalError(message ?? 'Recovery link is invalid or expired. Request a new reset link.')
    }

    const ensureRecoverySession = async () => {
      const routeError = searchParams.get('error')
      const routeErrorDescription = searchParams.get('error_description')

      if (routeError) {
        markInvalid(ERROR_MESSAGES[routeError] ?? routeErrorDescription ?? routeError)
        return
      }

      const code = searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          markInvalid(error.message)
          return
        }
      }

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        markInvalid(error.message)
        return
      }

      if (data.session) {
        markReady()
        return
      }

      invalidationTimer = window.setTimeout(async () => {
        if (!isMounted) {
          return
        }

        const { data: latestData, error: latestError } = await supabase.auth.getSession()

        if (latestError) {
          markInvalid(latestError.message)
          return
        }

        if (latestData.session) {
          markReady()
          return
        }

        markInvalid('Recovery link is invalid or expired. Request a new reset link.')
      }, 1200)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return
      }

      if (
        (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        session
      ) {
        if (invalidationTimer) {
          window.clearTimeout(invalidationTimer)
        }

        markReady()
      }
    })

    void ensureRecoverySession()

    return () => {
      isMounted = false

      if (invalidationTimer) {
        window.clearTimeout(invalidationTimer)
      }

      authListener.subscription.unsubscribe()
    }
  }, [isReset, searchParams])

  async function handleGoogleAuth() {
    setLocalError(null)
    setSuccessNotice(null)
    setIsGoogleLoading(true)

    try {
      setAuthIntent({
        mode: isRegister ? 'register' : 'login',
        method: 'google',
      })

      const supabase = createClient()
      const origin = getAuthOrigin()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })

      if (error) {
        setLocalError(error.message)
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)
    setSuccessNotice(null)
    setIsPasswordLoading(true)

    try {
      const supabase = createClient()

      if (isForgot) {
        const origin = getAuthOrigin()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/reset-password`,
        })

        if (error) {
          setLocalError(error.message)
          return
        }

        setSuccessNotice(`Check ${email} for a password reset link.`)
        return
      }

      if (isReset) {
        if (recoveryStatus !== 'ready') {
          setLocalError('This recovery link is not ready yet. Request a new reset email if it keeps failing.')
          return
        }

        if (password !== confirmPassword) {
          setLocalError('Passwords do not match.')
          return
        }

        const { error } = await supabase.auth.updateUser({
          password,
        })

        if (error) {
          setLocalError(error.message)
          return
        }

        setSuccessNotice('Password updated. Redirecting to your dashboard…')
        setPassword('')
        setConfirmPassword('')

        window.setTimeout(() => {
          router.replace('/dashboard')
          router.refresh()
        }, 900)

        return
      }

      if (isRegister) {
        if (password !== confirmPassword) {
          setLocalError('Passwords do not match.')
          return
        }

        const origin = getAuthOrigin()
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
              full_name: fullName.trim() || undefined,
            },
          },
        })

        if (error) {
          setLocalError(error.message)
          return
        }

        Analytics.signupCompleted({ method: 'email' })

        if (data.user?.id) {
          Analytics.identify(data.user.id, {
            email: data.user.email,
            fullName: fullName.trim() || null,
            plan: 'free',
            signupDate: data.user.created_at,
          })
        }

        if (data.session) {
          router.replace('/dashboard')
          router.refresh()
          return
        }

        setSuccessNotice(`Check ${email} for a confirmation link to finish creating your account.`)
        setPassword('')
        setConfirmPassword('')
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLocalError(error.message)
        return
      }

      Analytics.loginCompleted({ method: 'email' })

      if (data.user?.id) {
        Analytics.identify(data.user.id, {
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name as string | undefined,
          plan: 'free',
          signupDate: data.user.created_at,
        })
      }

      router.replace('/dashboard')
      router.refresh()
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const isSubmitDisabled = isForgot
    ? !email || isPasswordLoading
    : isRegister
      ? !email || !password || !confirmPassword || isPasswordLoading || isGoogleLoading
      : isReset
        ? !password || !confirmPassword || isPasswordLoading || recoveryStatus !== 'ready'
        : !email || !password || isPasswordLoading || isGoogleLoading

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container lg:h-screen lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="login-aurora pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-container/60" />
      <div className="login-aurora login-aurora-two pointer-events-none absolute -right-10 top-1/4 h-80 w-80 rounded-full bg-[#cde4d1]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(163,255,179,0.2),transparent_65%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1320px] items-center px-4 py-4 sm:px-5 sm:py-5 lg:h-screen lg:px-6 lg:py-6">
        <div className="grid w-full gap-4 rounded-[2rem] border border-white/70 bg-white/40 p-4 shadow-[0_30px_100px_rgba(25,28,29,0.08)] backdrop-blur-2xl lg:h-[calc(100vh-3rem)] lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden xl:grid-cols-[minmax(0,0.94fr)_430px]">
          <section className="relative hidden overflow-hidden rounded-[1.8rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(243,244,245,0.92))] p-8 lg:flex xl:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_30%)]" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center">
                <BrandLockup />
              </div>

              <div className="mt-10 max-w-[36rem]">
                <h1 className="max-w-[31rem] text-[clamp(2.8rem,4vw,4.2rem)] font-black leading-[0.94] tracking-tighter text-on-background">
                  {copy.heroTitle}
                </h1>

                <p className="mt-4 max-w-[31rem] text-base leading-7 text-on-surface-variant">
                  {copy.heroDescription}
                </p>
              </div>

              <div className="mt-8 grid gap-3">
                {authHighlights.map(item => (
                  <AuthHighlight
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/72 shadow-[0_10px_24px_rgba(25,28,29,0.05)]">
                  <ShieldCheck size={16} className="text-primary" />
                </span>
                {copy.securityNote}
              </div>
            </div>
          </section>

          <aside className="rounded-[1.8rem] bg-white/88 p-6 shadow-[0_24px_70px_rgba(25,28,29,0.08)] backdrop-blur-2xl sm:p-7 lg:flex lg:h-full lg:flex-col lg:justify-center">
            <div className="flex items-center lg:hidden">
              <BrandLockup />
            </div>

            <div className="mt-6 flex h-full flex-col lg:mx-auto lg:mt-0 lg:w-full lg:max-w-[360px] lg:justify-center">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                  <Lock size={12} strokeWidth={2.5} />
                  {copy.badge}
                </span>
              </div>

              <div className="mt-5">
                <h2 className="text-3xl font-black tracking-tight text-on-background sm:text-[2.6rem]">
                  {copy.cardTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant sm:text-base">
                  {copy.cardDescription}
                </p>
              </div>

              {authErrorMessage ? (
                <div className="mt-5 rounded-[1.25rem] bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-[0_12px_30px_rgba(185,28,28,0.08)]">
                  {authErrorMessage}
                </div>
              ) : null}

              {successNotice ? (
                <div className="mt-5 rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-[0_12px_30px_rgba(5,150,105,0.08)]">
                  {successNotice}
                </div>
              ) : null}

              {showGoogleAuth ? (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isGoogleLoading || isPasswordLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-zinc-950 px-5 py-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <GoogleIcon />
                    <span>{isGoogleLoading ? 'Redirecting to Google…' : copy.googleLabel}</span>
                  </button>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-px flex-1 bg-zinc-900/8" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant/70">
                      Or use password
                    </span>
                    <div className="h-px flex-1 bg-zinc-900/8" />
                  </div>
                </div>
              ) : null}

              {isReset && recoveryStatus === 'loading' ? (
                <div className="mt-5 rounded-[1.35rem] border border-black/5 bg-surface-container-low px-4 py-4 shadow-[0_12px_30px_rgba(25,28,29,0.04)]">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                    <div>
                      <p className="text-sm font-bold text-on-surface">Verifying your recovery link…</p>
                      <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                        This usually takes a moment. Keep this page open while the secure session is prepared.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {(!isReset || recoveryStatus === 'ready') && (
                <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                  {isRegister ? (
                    <div className="group relative rounded-[1.25rem] bg-white/78 px-4 pb-4 pt-3 shadow-[0_12px_30px_rgba(25,28,29,0.04)] ring-1 ring-black/5 transition-all duration-300 focus-within:-translate-y-0.5 focus-within:ring-primary/20">
                      <label htmlFor="fullName" className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/70">
                        Full name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={event => setFullName(event.target.value)}
                        autoComplete="name"
                        placeholder="Jane Smith"
                        className="mt-2 w-full bg-transparent text-base font-semibold text-on-background outline-none placeholder:text-zinc-400"
                      />
                      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
                    </div>
                  ) : null}

                  {showEmailField ? (
                    <div className="group relative rounded-[1.25rem] bg-white/78 px-4 pb-4 pt-3 shadow-[0_12px_30px_rgba(25,28,29,0.04)] ring-1 ring-black/5 transition-all duration-300 focus-within:-translate-y-0.5 focus-within:ring-primary/20">
                      <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/70">
                        Work email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        autoComplete="email"
                        placeholder="name@company.com"
                        className="mt-2 w-full bg-transparent text-base font-semibold text-on-background outline-none placeholder:text-zinc-400"
                      />
                      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
                    </div>
                  ) : null}

                  {showPasswordField ? (
                    <div className="group relative rounded-[1.25rem] bg-white/78 px-4 pb-4 pt-3 shadow-[0_12px_30px_rgba(25,28,29,0.04)] ring-1 ring-black/5 transition-all duration-300 focus-within:-translate-y-0.5 focus-within:ring-primary/20">
                      <div className="flex items-center justify-between gap-4">
                        <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/70">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(value => !value)}
                          className="text-xs font-bold text-primary transition-colors hover:text-on-primary-container"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        autoComplete={isRegister || isReset ? 'new-password' : 'current-password'}
                        placeholder="••••••••"
                        className="mt-2 w-full bg-transparent text-base font-semibold text-on-background outline-none placeholder:text-zinc-400"
                      />
                      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
                    </div>
                  ) : null}

                  {mode === 'login' ? (
                    <div className="-mt-1 flex justify-end px-1">
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm font-bold text-primary transition-colors hover:text-on-primary-container"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  ) : null}

                  {showConfirmPasswordField ? (
                    <div className="group relative rounded-[1.25rem] bg-white/78 px-4 pb-4 pt-3 shadow-[0_12px_30px_rgba(25,28,29,0.04)] ring-1 ring-black/5 transition-all duration-300 focus-within:-translate-y-0.5 focus-within:ring-primary/20">
                      <label htmlFor="confirmPassword" className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/70">
                        Confirm password
                      </label>
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={event => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="mt-2 w-full bg-transparent text-base font-semibold text-on-background outline-none placeholder:text-zinc-400"
                      />
                      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="shimmer-effect group flex w-full cursor-pointer items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--signature-gradient)] px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-on-primary-container shadow-[0_16px_34px_rgba(2,109,50,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.03] hover:shadow-[0_22px_42px_rgba(2,109,50,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{isPasswordLoading ? copy.submitLoadingLabel : copy.submitLabel}</span>
                    <ArrowRight
                      size={16}
                      strokeWidth={2.8}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </button>
                </form>
              )}

              <div className="mt-5 space-y-3">
                <div className="relative overflow-hidden rounded-[1.35rem] border border-primary/14 bg-[linear-gradient(145deg,rgba(238,250,241,0.98),rgba(255,255,255,0.98))] px-4 py-4 shadow-[0_18px_42px_rgba(2,109,50,0.1)] ring-1 ring-white/70">
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-36 bg-[radial-gradient(circle_at_center,rgba(163,255,179,0.3),transparent_70%)]" />

                  <div className="relative flex items-center justify-between gap-4">
                    <p className="max-w-[12rem] text-[11px] font-bold uppercase tracking-[0.24em] text-primary/90 sm:max-w-[14rem]">
                      {copy.switchPrompt}
                    </p>

                    <button
                      type="button"
                      onClick={() => router.push(copy.switchHref)}
                      className="group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(24,24,27,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900 hover:shadow-[0_18px_34px_rgba(24,24,27,0.24),0_0_0_6px_rgba(163,255,179,0.18)]"
                    >
                      {copy.switchLabel}
                      <ArrowRight
                        size={16}
                        strokeWidth={2.8}
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      />
                    </button>
                  </div>
                </div>

                <p className="px-1 text-sm leading-6 text-on-surface-variant">{copy.helperLabel}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

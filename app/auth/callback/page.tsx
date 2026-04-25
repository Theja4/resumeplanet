'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Analytics, clearAuthIntent, readAuthIntent } from '@/lib/analytics'
import Image from 'next/image'

const MIN_LOADER_MS = 950

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const startedAt = Date.now()
    const requestedNext = searchParams.get('next')
    const nextPath =
      requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//')
        ? requestedNext
        : null

    async function handleCallback() {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const remainingDelay = Math.max(0, MIN_LOADER_MS - (Date.now() - startedAt))

      if (remainingDelay > 0) {
        await new Promise(resolve => window.setTimeout(resolve, remainingDelay))
      }

      if (data.session) {
        const authIntent = readAuthIntent()
        const provider = (data.session.user.app_metadata?.provider as string | undefined) ?? 'google'
        const [profileResult, resumesResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('plan, full_name')
            .eq('id', data.session.user.id)
            .maybeSingle(),
          supabase
            .from('resumes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', data.session.user.id),
        ])
        const profile = profileResult.data
        const resumeCount = resumesResult.count ?? 0

        if (authIntent?.mode === 'register') {
          Analytics.signupCompleted({ method: authIntent.method })
        } else {
          Analytics.loginCompleted({ method: authIntent?.method ?? provider })
        }

        Analytics.identify(data.session.user.id, {
          email: data.session.user.email,
          fullName:
            (profile?.full_name as string | undefined) ??
            (data.session.user.user_metadata?.full_name as string | undefined),
          plan: profile?.plan === 'pro' ? 'pro' : 'free',
          signupDate: data.session.user.created_at,
        })
        clearAuthIntent()
        if (!nextPath && authIntent?.mode === 'register' && resumeCount === 0) {
          router.replace('/dashboard/onboarding')
          return
        }

        router.replace(nextPath ?? '/dashboard')
      } else {
        clearAuthIntent()
        router.replace('/auth/login?error=server_error')
      }
    }

    void handleCallback()
  }, [router, searchParams])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(163,255,179,0.34),transparent_26%),radial-gradient(circle_at_84%_16%,rgba(2,109,50,0.08),transparent_22%),radial-gradient(circle_at_50%_92%,rgba(163,255,179,0.24),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(163,255,179,0.18))]" />

      <div className="callback-loader relative z-10 flex items-center justify-center gap-6 px-6">
        <div className="callback-logo-wrap shrink-0">
          <Image
            src="/auth-login-logo.png"
            alt="Rezoomed logo"
            width={80}
            height={80}
            className="h-20 w-20 object-contain drop-shadow-[0_20px_32px_rgba(2,109,50,0.18)]"
          />
        </div>
        <div className="callback-wordmark-wrap">
          <div className="callback-wordmark-glow" />
          <div className="callback-wordmark">Rezoomed</div>
        </div>
        <p className="mt-4 text-sm font-medium tracking-[0.02em] text-zinc-500 sm:text-base">
          Signing you in...
        </p>
      </div>

      <style jsx>{`
        .callback-loader {
          transform: translateY(38vh) scale(0.94);
          opacity: 0;
          animation: callback-rise 1.1s cubic-bezier(0.2, 0.9, 0.24, 1) forwards;
        }

        .callback-logo-wrap {
          animation: callback-bounce 2.25s ease-in-out infinite 0.4s;
        }

        @keyframes callback-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .callback-wordmark-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          min-height: 5rem;
          min-width: min-content;
        }

        .callback-wordmark {
          position: relative;
          z-index: 2;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: clamp(2.6rem, 8vw, 5rem);
          font-weight: 800;
          letter-spacing: -0.07em;
          line-height: 0.95;
          background-image: linear-gradient(
            110deg,
            #015026 0%,
            #026d32 26%,
            #a3ffb3 48%,
            #026d32 66%,
            #014521 100%
          );
          background-size: 220% 100%;
          background-position: 120% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 16px 34px rgba(2, 109, 50, 0.12));
          animation: callback-shimmer 2.25s ease-in-out infinite 0.4s;
        }

        .callback-wordmark-glow {
          position: absolute;
          inset: auto 10% 0 10%;
          height: 2.4rem;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(163, 255, 179, 0.55), rgba(163, 255, 179, 0));
          filter: blur(22px);
          transform: translateY(0.9rem);
          animation: callback-glow 2.25s ease-in-out infinite 0.4s;
        }

        @keyframes callback-rise {
          0% {
            transform: translateY(38vh) scale(0.94);
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes callback-shimmer {
          0% {
            background-position: 120% 50%;
          }
          100% {
            background-position: -20% 50%;
          }
        }

        @keyframes callback-glow {
          0%,
          100% {
            opacity: 0.55;
            transform: translateY(0.9rem) scale(0.94);
          }
          50% {
            opacity: 0.9;
            transform: translateY(0.75rem) scale(1.02);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .callback-loader,
          .callback-wordmark,
          .callback-wordmark-glow {
            animation: none;
            transform: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

'use client'

import { Suspense } from 'react'
import AuthScreen from '@/components/auth/AuthScreen'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <AuthScreen mode="reset" />
    </Suspense>
  )
}

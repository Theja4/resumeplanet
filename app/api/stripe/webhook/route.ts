import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Migrated to Paddle. Use /api/paddle/* endpoints.' },
    { status: 410 }
  )
}

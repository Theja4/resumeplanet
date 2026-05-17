import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Rezoomed — AI Resume Builder & ATS Checker'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #00a84d 0%, #007a37 55%, #023f1c 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.3em',
            opacity: 0.8,
          }}
        >
          REZOOMED
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              maxWidth: '900px',
            }}
          >
            AI Resume Builder & ATS Checker
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              opacity: 0.92,
              maxWidth: '900px',
              lineHeight: 1.35,
            }}
          >
            Build ATS-friendly resumes, score against any job description, and tailor in minutes.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            opacity: 0.85,
          }}
        >
          <span>rezoomed.com</span>
          <span
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.18)',
              fontWeight: 700,
            }}
          >
            Free to start
          </span>
        </div>
      </div>
    ),
    size
  )
}

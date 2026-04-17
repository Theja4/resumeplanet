'use client'

interface OrganizationLogoMarkProps {
  companyId: string
  className?: string
  compact?: boolean
}

function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g fill="currentColor">
        <circle cx="12" cy="3" r="2" />
        <circle cx="19" cy="7" r="2" />
        <circle cx="21" cy="15" r="2" />
        <circle cx="12" cy="21" r="2" />
        <circle cx="3" cy="15" r="2" />
        <circle cx="5" cy="7" r="2" />
      </g>
    </svg>
  )
}

function BankOfAmericaMark({ compact }: { compact: boolean }) {
  const stripeHeight = compact ? 'h-1' : 'h-1.5'

  return (
    <div className="flex items-center gap-2">
      <span className={`font-semibold tracking-tight text-[#0A3161] ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
        Bank of America
      </span>
      <div className="grid gap-0.5">
        <span className={`block w-6 -skew-x-[28deg] rounded-full bg-[#E31837] ${stripeHeight}`} />
        <span className={`block w-6 -skew-x-[28deg] rounded-full bg-[#E31837] ${stripeHeight}`} />
        <span className={`block w-6 -skew-x-[28deg] rounded-full bg-[#0A3161] ${stripeHeight}`} />
      </div>
    </div>
  )
}

function CapitalOneMark({ compact }: { compact: boolean }) {
  return (
    <div className="relative pr-4">
      <span className={`font-semibold tracking-tight text-[#003B70] ${compact ? 'text-[11px]' : 'text-[14px]'}`}>
        Capital One
      </span>
      <svg
        viewBox="0 0 56 18"
        className={`pointer-events-none absolute -right-1 ${compact ? '-top-1 h-4 w-10' : '-top-2 h-5 w-12'}`}
        aria-hidden="true"
      >
        <path
          d="M2 14c10-8 22-11 52-10"
          fill="none"
          stroke="#D03027"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
      </svg>
    </div>
  )
}

function PwcMark({ compact }: { compact: boolean }) {
  const textSize = compact ? 'text-[12px]' : 'text-[16px]'

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-0.5">
        <span className="block h-2.5 w-4 bg-[#F9B233]" />
        <span className="block h-2.5 w-5 bg-[#F17F21]" />
        <span className="block h-2.5 w-6 bg-[#D04A02]" />
      </div>
      <span className={`font-black tracking-[-0.05em] text-zinc-900 ${textSize}`}>pwc</span>
    </div>
  )
}

function EyMark({ compact }: { compact: boolean }) {
  return (
    <div className="flex items-end gap-2">
      <svg
        viewBox="0 0 34 10"
        className={compact ? 'mb-1 h-2.5 w-8' : 'mb-1 h-3 w-10'}
        aria-hidden="true"
      >
        <path d="M1 9 32 1" fill="none" stroke="#FFE600" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className={`font-black tracking-tight text-zinc-950 ${compact ? 'text-[12px]' : 'text-[16px]'}`}>EY</span>
    </div>
  )
}

function FidelityMark({ compact }: { compact: boolean }) {
  const triangleClass = compact ? 'h-2.5 w-3.5' : 'h-3 w-4'
  const triangleStyle = { clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end gap-0.5">
        <span className={`inline-block bg-[#006747] ${triangleClass}`} style={triangleStyle} />
        <span className={`inline-block bg-[#2E8B57] ${triangleClass}`} style={triangleStyle} />
        <span className={`inline-block bg-[#7DBA3D] ${triangleClass}`} style={triangleStyle} />
      </div>
      <span className={`font-semibold tracking-tight text-[#006747] ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
        Fidelity
      </span>
    </div>
  )
}

export default function OrganizationLogoMark({
  companyId,
  className = '',
  compact = false,
}: OrganizationLogoMarkProps) {
  const containerClassName = `inline-flex items-center ${className}`.trim()
  const textSize = compact ? 'text-[11px]' : 'text-[14px]'

  switch (companyId) {
    case 'google':
      return (
        <div className={containerClassName} aria-label="Google logo">
          <span className={`font-black tracking-[-0.04em] ${textSize}`}>
            <span style={{ color: '#4285F4' }}>G</span>
            <span style={{ color: '#EA4335' }}>o</span>
            <span style={{ color: '#FBBC05' }}>o</span>
            <span style={{ color: '#4285F4' }}>g</span>
            <span style={{ color: '#34A853' }}>l</span>
            <span style={{ color: '#EA4335' }}>e</span>
          </span>
        </div>
      )
    case 'amazon':
      return (
        <div className={`${containerClassName} flex-col items-start`} aria-label="Amazon logo">
          <span className={`font-black tracking-tight text-zinc-950 ${textSize}`}>amazon</span>
          <svg viewBox="0 0 48 12" className={compact ? 'h-2.5 w-11' : 'h-3 w-12'} aria-hidden="true">
            <path d="M3 4c8 6 23 6 42 0" fill="none" stroke="#FF9900" strokeLinecap="round" strokeWidth="2" />
          </svg>
        </div>
      )
    case 'apple':
      return (
        <div className={containerClassName} aria-label="Apple logo">
          <span className={`font-semibold tracking-[0.02em] text-zinc-950 ${textSize}`}>Apple</span>
        </div>
      )
    case 'jpmorgan-chase':
      return (
        <div className={containerClassName} aria-label="JPMorganChase logo">
          <span className={`font-semibold tracking-tight text-[#0F3D70] ${compact ? 'text-[10px]' : 'text-[13px]'}`}>
            JPMorganChase
          </span>
        </div>
      )
    case 'walmart':
      return (
        <div className={`${containerClassName} gap-2`} aria-label="Walmart logo">
          <span className={`font-semibold tracking-tight text-[#0071CE] ${textSize}`}>Walmart</span>
          <SparkIcon className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-[#FFC220]`} />
        </div>
      )
    case 'bank-of-america':
      return (
        <div className={containerClassName} aria-label="Bank of America logo">
          <BankOfAmericaMark compact={compact} />
        </div>
      )
    case 'wells-fargo':
      return (
        <div className={containerClassName} aria-label="Wells Fargo logo">
          <span
            className={`rounded-md bg-[#B31B1B] px-2.5 py-1 font-bold uppercase tracking-[0.08em] text-white ${
              compact ? 'text-[9px]' : 'text-[10px]'
            }`}
          >
            Wells Fargo
          </span>
        </div>
      )
    case 'capital-one':
      return (
        <div className={containerClassName} aria-label="Capital One logo">
          <CapitalOneMark compact={compact} />
        </div>
      )
    case 'pwc':
      return (
        <div className={containerClassName} aria-label="PwC logo">
          <PwcMark compact={compact} />
        </div>
      )
    case 'ey':
      return (
        <div className={containerClassName} aria-label="EY logo">
          <EyMark compact={compact} />
        </div>
      )
    case 'oracle':
      return (
        <div className={containerClassName} aria-label="Oracle logo">
          <span className={`font-black uppercase tracking-[0.12em] text-[#C74634] ${compact ? 'text-[10px]' : 'text-[13px]'}`}>
            Oracle
          </span>
        </div>
      )
    case 'nvidia':
      return (
        <div className={`${containerClassName} gap-2`} aria-label="NVIDIA logo">
          <span className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} rounded-[3px] bg-[#76B900]`} />
          <span className={`font-black uppercase tracking-[0.08em] text-[#76B900] ${compact ? 'text-[10px]' : 'text-[13px]'}`}>
            NVIDIA
          </span>
        </div>
      )
    case 'lockheed-martin':
      return (
        <div className={`${containerClassName} flex-col items-start`} aria-label="Lockheed Martin logo">
          <span className={`font-semibold tracking-tight text-[#005DAA] ${compact ? 'text-[10px]' : 'text-[13px]'}`}>
            Lockheed Martin
          </span>
          <svg viewBox="0 0 72 12" className={compact ? 'h-2 w-14' : 'h-2.5 w-16'} aria-hidden="true">
            <path d="M2 10c18-10 39-10 68-8" fill="none" stroke="#005DAA" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </div>
      )
    case 'morgan-stanley':
      return (
        <div className={containerClassName} aria-label="Morgan Stanley logo">
          <span className={`font-semibold tracking-tight text-zinc-950 ${compact ? 'text-[10px]' : 'text-[13px]'}`}>
            Morgan Stanley
          </span>
        </div>
      )
    case 'fidelity-investments':
      return (
        <div className={containerClassName} aria-label="Fidelity Investments logo">
          <FidelityMark compact={compact} />
        </div>
      )
    default:
      return (
        <div className={containerClassName}>
          <span className={`font-semibold text-zinc-900 ${textSize}`}>{companyId}</span>
        </div>
      )
  }
}

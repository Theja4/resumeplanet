import { describe, expect, it } from 'vitest'
import { normalizeCompanyName, sanitizeGeneratedBullet, sanitizeGeneratedBullets } from '@/lib/bulletSanitizer'

const ACME = { company: 'Acme Corp', title: 'Delivery Analyst' }

describe('normalizeCompanyName', () => {
  it('lowercases, trims, and collapses whitespace', () => {
    expect(normalizeCompanyName('  Acme   Technology  ')).toBe('acme technology')
  })

  it('strips the documented legal-form suffixes', () => {
    expect(normalizeCompanyName('Acme Ltd')).toBe('acme')
    expect(normalizeCompanyName('Acme Ltd.')).toBe('acme')
    expect(normalizeCompanyName('Acme Pvt')).toBe('acme')
    expect(normalizeCompanyName('Acme Inc.')).toBe('acme')
    expect(normalizeCompanyName('Acme Corp')).toBe('acme')
    expect(normalizeCompanyName('Acme LLC')).toBe('acme')
    expect(normalizeCompanyName('Acme Co.')).toBe('acme')
  })

  it('strips stacked suffixes', () => {
    expect(normalizeCompanyName('Northwind Global Technology Solutions Private Limited')).toBe(
      'northwind global technology solutions'
    )
  })

  it('does not strip a leading token that happens to be a suffix word', () => {
    expect(normalizeCompanyName('Limited Brands')).toBe('limited brands')
  })

  it('never reduces a name to nothing', () => {
    expect(normalizeCompanyName('Ltd')).toBe('ltd')
  })
})

describe('sanitizeGeneratedBullets — leading echo stripping', () => {
  it('strips a colon-delimited company prefix', () => {
    expect(sanitizeGeneratedBullets(['Acme Corp: Managed the delivery pipeline.'], ACME)).toEqual([
      'Managed the delivery pipeline.',
    ])
  })

  it('strips a dash-delimited company prefix', () => {
    expect(sanitizeGeneratedBullets(['Acme Corp - Managed the delivery pipeline.'], ACME)).toEqual([
      'Managed the delivery pipeline.',
    ])
  })

  it('strips en dash and em dash delimiters', () => {
    expect(sanitizeGeneratedBullets(['Acme Corp – Built dashboards.'], ACME)).toEqual(['Built dashboards.'])
    expect(sanitizeGeneratedBullets(['Acme Corp — Built dashboards.'], ACME)).toEqual(['Built dashboards.'])
  })

  it('strips a pipe-delimited company prefix', () => {
    expect(sanitizeGeneratedBullets(['Acme Corp | Managed the delivery pipeline.'], ACME)).toEqual([
      'Managed the delivery pipeline.',
    ])
  })

  it('strips the "At Company," form', () => {
    expect(sanitizeGeneratedBullets(['At Acme Corp, managed the delivery pipeline.'], ACME)).toEqual([
      'managed the delivery pipeline.',
    ])
  })

  it('strips a bare comma-delimited company prefix', () => {
    expect(sanitizeGeneratedBullets(['Acme Corp, managed the delivery pipeline.'], ACME)).toEqual([
      'managed the delivery pipeline.',
    ])
  })

  it('strips the short form when the resume stores the full legal name', () => {
    const context = { company: 'Northwind Global Technology Solutions Private Limited', title: 'Senior Delivery Manager' }
    expect(
      sanitizeGeneratedBullets(['Northwind Global Technology Solutions: Managed three enterprise accounts.'], context)
    ).toEqual(['Managed three enterprise accounts.'])
  })

  it('strips a job-title echo the same way', () => {
    expect(sanitizeGeneratedBullets(['Delivery Analyst: Built SQL reporting dashboards.'], ACME)).toEqual([
      'Built SQL reporting dashboards.',
    ])
    expect(sanitizeGeneratedBullets(['At Delivery Analyst, built SQL reporting dashboards.'], ACME)).toEqual([
      'built SQL reporting dashboards.',
    ])
  })

  it('handles multi-word company names', () => {
    const context = { company: 'Blue Ridge Analytics Group', title: 'Data Lead' }
    expect(sanitizeGeneratedBullets(['Blue Ridge Analytics Group | Led the churn model rollout.'], context)).toEqual([
      'Led the churn model rollout.',
    ])
  })

  it('collapses a stacked echo in a single pass (idempotent)', () => {
    const once = sanitizeGeneratedBullets(['Acme Corp: Acme Corp - Managed the pipeline.'], ACME)
    expect(once).toEqual(['Managed the pipeline.'])
    expect(sanitizeGeneratedBullets(once, ACME)).toEqual(once)
  })
})

describe('sanitizeGeneratedBullets — standalone company-name bullets', () => {
  it('drops a bullet that is exactly the company name', () => {
    expect(sanitizeGeneratedBullets(['Acme Corp'], ACME)).toEqual([])
  })

  it('drops a company-name bullet across suffix variants', () => {
    expect(sanitizeGeneratedBullets(['Acme Ltd.'], { company: 'Acme Corp' })).toEqual([])
    expect(sanitizeGeneratedBullets(['Acme Pvt Ltd'], { company: 'Acme' })).toEqual([])
    expect(sanitizeGeneratedBullets(['acme  corp '], ACME)).toEqual([])
  })

  it('drops the full legal name from the reported repro', () => {
    const context = { company: 'Northwind Global Technology Solutions Private Limited', title: 'Senior Delivery Manager' }
    expect(sanitizeGeneratedBullets(['Northwind Global Technology Solutions Private Limited'], context)).toEqual([])
  })

  it('drops a bullet that is nothing but an echo prefix', () => {
    expect(sanitizeGeneratedBullets(['At Acme Corp,'], ACME)).toEqual([])
  })

  it('drops empty and whitespace-only bullets', () => {
    expect(sanitizeGeneratedBullets(['', '   ', 'Managed the pipeline.'], ACME)).toEqual(['Managed the pipeline.'])
  })
})

describe('sanitizeGeneratedBullets — content that must survive', () => {
  it('never strips a mid-bullet company mention', () => {
    const bullets = [
      "Migrated Acme Corp's billing platform to a managed Postgres cluster.",
      'Led the Acme Corp integration workstream across three teams.',
      'Partnered with Acme Corp to close a two-year renewal.',
    ]
    expect(sanitizeGeneratedBullets(bullets, ACME)).toEqual(bullets)
  })

  it('never strips a company mention that leads without a delimiter', () => {
    const bullets = ['Acme Corp migrations were completed two weeks ahead of plan.']
    expect(sanitizeGeneratedBullets(bullets, ACME)).toEqual(bullets)
  })

  it('never strips a mid-bullet title mention', () => {
    const bullets = ['Mentored two junior Delivery Analyst hires through onboarding.']
    expect(sanitizeGeneratedBullets(bullets, ACME)).toEqual(bullets)
  })

  it('leaves already-clean bullets untouched and is idempotent', () => {
    const bullets = [
      'Managed end-to-end delivery for three enterprise accounts.',
      'Reduced average ticket resolution time from 48 hours to 12 hours.',
      'Built SQL reporting dashboards for operations leadership.',
    ]
    const first = sanitizeGeneratedBullets(bullets, ACME)
    expect(first).toEqual(bullets)
    expect(sanitizeGeneratedBullets(first, ACME)).toEqual(bullets)
  })

  it('is a no-op when no company or title context is available', () => {
    const bullets = ['Acme Corp: Managed the delivery pipeline.', 'Acme Corp']
    expect(sanitizeGeneratedBullets(bullets, {})).toEqual(bullets)
  })

  it('ignores a one-character company so a leading dash is never eaten', () => {
    expect(sanitizeGeneratedBullets(['- Managed the delivery pipeline.'], { company: 'A' })).toEqual([
      '- Managed the delivery pipeline.',
    ])
  })

  it('treats regex metacharacters in a company name literally', () => {
    const context = { company: 'A+ (Systems)', title: 'Engineer' }
    expect(sanitizeGeneratedBullets(['A+ (Systems): Rebuilt the deploy pipeline.'], context)).toEqual([
      'Rebuilt the deploy pipeline.',
    ])
    expect(sanitizeGeneratedBullets(['Rebuilt the A+ (Systems) deploy pipeline.'], context)).toEqual([
      'Rebuilt the A+ (Systems) deploy pipeline.',
    ])
  })
})

describe('sanitizeGeneratedBullet', () => {
  it('returns an empty string for a dropped bullet', () => {
    expect(sanitizeGeneratedBullet('Acme Corp', ACME)).toBe('')
  })

  it('returns the stripped text for an echoed bullet', () => {
    expect(sanitizeGeneratedBullet('Acme Corp: Shipped the migration.', ACME)).toBe('Shipped the migration.')
  })
})

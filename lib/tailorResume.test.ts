import { describe, expect, it } from 'vitest'
import { extractJSONPayload } from '@/lib/claude'
import { normalizeCompanyName } from '@/lib/bulletSanitizer'
import { syncResumeData } from '@/lib/resume-data'
import { applyTailorAnalysisToResumeData } from '@/lib/tailorResume'
import type { ResumeData, TailorAnalysis } from '@/types'

const COMPANY = 'Northwind Global Technology Solutions Private Limited'

function buildResume(overrides: Partial<ResumeData> = {}): ResumeData {
  return syncResumeData({
    name: 'Priya Raman',
    email: 'priya.raman@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, Karnataka',
    linkedin: '',
    website: '',
    summary: 'Delivery manager with seven years across enterprise support and implementation programs.',
    currentRole: 'Senior Delivery Manager',
    experience: [
      {
        title: 'Senior Delivery Manager',
        company: COMPANY,
        location: 'Bengaluru, Karnataka',
        startDate: 'Jan 2021',
        endDate: 'Present',
        bullets: [
          'Managed the end to end delivery pipeline for three enterprise accounts.',
          'Coordinated weekly updates with clients and implementation teams.',
          'Reduced average ticket resolution time from 48 hours to 12 hours.',
        ],
      },
      {
        title: 'Delivery Analyst',
        company: 'Acme Corp',
        location: 'Bengaluru, Karnataka',
        startDate: 'Jun 2018',
        endDate: 'Dec 2020',
        bullets: [
          'Built reporting dashboards using SQL for the operations leadership team.',
          'Owned the weekly capacity plan across four squads.',
        ],
      },
    ],
    education: [],
    skills: ['SQL', 'Stakeholder Management', 'Agile'],
    skillSections: [],
    certifications: [], projects: [], languages: [], volunteer: [], interests: [],
    awards: [], publications: [], references: [], customSections: [],
    ...overrides,
  } as unknown as ResumeData)
}

function buildAnalysis(overrides: Partial<TailorAnalysis> = {}): TailorAnalysis {
  return {
    intensity: 'balanced',
    matchScore: 78,
    matchTier: 'MODERATE_FIT',
    shortlistingProbability: 'MODERATE',
    overallStrategy: '',
    honestAssessment: '',
    tailoredHeadline: '',
    tailoredSummary: '',
    matchedKeywords: [],
    missingKeywords: [],
    skillsPlan: { recommendedOrder: [], add: [], deprioritize: [], rationale: '' },
    sectionFocus: [],
    bulletRewrites: [],
    bulletOrderPlans: [],
    ...overrides,
  } as TailorAnalysis
}

function allBullets(data: ResumeData) {
  return data.experience.flatMap(item => item.bullets)
}

// A raw model response of the shape the tailor route receives, complete with the
// markdown fence a non-strict provider adds and with every echo variant the
// paid-user report described.
const MOCKED_CLAUDE_RESPONSE = `Here is the tailoring plan:

\`\`\`json
{
  "intensity": "balanced",
  "matchScore": 78,
  "matchTier": "MODERATE_FIT",
  "shortlistingProbability": "MODERATE",
  "overallStrategy": "Front-load enterprise delivery ownership.",
  "honestAssessment": "Credible fit with one secondary gap.",
  "tailoredHeadline": "Senior Delivery Manager | Enterprise Support Delivery",
  "tailoredSummary": "",
  "matchedKeywords": [],
  "missingKeywords": [],
  "skillsPlan": { "recommendedOrder": [], "add": [], "deprioritize": [], "rationale": "" },
  "sectionFocus": [],
  "bulletRewrites": [
    {
      "sectionId": "experience",
      "companyOrProject": "${COMPANY}",
      "original": "Managed the end to end delivery pipeline for three enterprise accounts.",
      "tailored": "${COMPANY}: Managed end-to-end delivery for three enterprise accounts.",
      "keywordsHit": ["enterprise delivery"],
      "rationale": "Front-loads enterprise delivery ownership.",
      "impact": "high"
    },
    {
      "sectionId": "experience",
      "companyOrProject": "${COMPANY}",
      "original": "Coordinated weekly updates with clients and implementation teams.",
      "tailored": "At ${COMPANY}, coordinated weekly stakeholder updates with clients and implementation teams.",
      "keywordsHit": ["stakeholder communication"],
      "rationale": "Uses target-role stakeholder language.",
      "impact": "high"
    },
    {
      "sectionId": "experience",
      "companyOrProject": "Acme Corp",
      "original": "Built reporting dashboards using SQL for the operations leadership team.",
      "tailored": "Acme Corp | Built SQL reporting dashboards for operations leadership.",
      "keywordsHit": ["SQL", "reporting"],
      "rationale": "Front-loads SQL and reporting.",
      "impact": "high"
    },
    {
      "sectionId": "experience",
      "companyOrProject": "Acme Corp",
      "original": "Owned the weekly capacity plan across four squads.",
      "tailored": "Acme Corp",
      "keywordsHit": [],
      "rationale": "Degenerate rewrite that is nothing but the employer name.",
      "impact": "low"
    }
  ],
  "bulletOrderPlans": []
}
\`\`\`

Let me know if you want a more aggressive pass.`

describe('tailor merge — integration with a mocked Claude response', () => {
  it('produces a final resume with zero company-name bullets', () => {
    const analysis = JSON.parse(extractJSONPayload(MOCKED_CLAUDE_RESPONSE)) as TailorAnalysis

    // Sanity: the mocked model output really does contain the echoes.
    expect(analysis.bulletRewrites.some(rewrite => rewrite.tailored.startsWith(`${COMPANY}:`))).toBe(true)
    expect(analysis.bulletRewrites.some(rewrite => rewrite.tailored.startsWith(`At ${COMPANY},`))).toBe(true)
    expect(analysis.bulletRewrites.some(rewrite => rewrite.tailored === 'Acme Corp')).toBe(true)

    const result = applyTailorAnalysisToResumeData(buildResume(), analysis)
    const bullets = allBullets(result.data)

    expect(result.changed).toBe(true)

    // No bullet is a company name, and none leads with one.
    const companyNames = [COMPANY, 'Acme Corp']
    for (const bullet of bullets) {
      for (const company of companyNames) {
        expect(normalizeCompanyName(bullet)).not.toBe(normalizeCompanyName(company))
        expect(bullet.toLowerCase().startsWith(`${company.toLowerCase()}:`)).toBe(false)
        expect(bullet.toLowerCase().startsWith(`${company.toLowerCase()} |`)).toBe(false)
        expect(bullet.toLowerCase().startsWith(`at ${company.toLowerCase()},`)).toBe(false)
      }
    }

    expect(result.data.experience[0].bullets).toEqual([
      'Managed end-to-end delivery for three enterprise accounts.',
      'coordinated weekly stakeholder updates with clients and implementation teams.',
      'Reduced average ticket resolution time from 48 hours to 12 hours.',
    ])

    // The degenerate "Acme Corp" rewrite is discarded, leaving the original.
    expect(result.data.experience[1].bullets).toEqual([
      'Built SQL reporting dashboards for operations leadership.',
      'Owned the weekly capacity plan across four squads.',
    ])
  })

  it('drops a bare company-name bullet that the parser left in the source resume', () => {
    const resume = buildResume()
    resume.experience[0].bullets = [COMPANY, ...resume.experience[0].bullets]

    const analysis = buildAnalysis({
      bulletRewrites: [
        {
          sectionId: 'experience',
          companyOrProject: COMPANY,
          original: 'Managed the end to end delivery pipeline for three enterprise accounts.',
          tailored: 'Managed end-to-end delivery for three enterprise accounts.',
          keywordsHit: [],
          rationale: '',
          impact: 'high',
        },
      ] as TailorAnalysis['bulletRewrites'],
    })

    const result = applyTailorAnalysisToResumeData(resume, analysis)
    expect(result.data.experience[0].bullets).not.toContain(COMPANY)
    expect(result.data.experience[0].bullets).toEqual([
      'Managed end-to-end delivery for three enterprise accounts.',
      'Coordinated weekly updates with clients and implementation teams.',
      'Reduced average ticket resolution time from 48 hours to 12 hours.',
    ])
  })

  it('keeps bulletVisibility aligned when a bullet is dropped', () => {
    const resume = buildResume()
    resume.experience[0].bullets = [COMPANY, ...resume.experience[0].bullets]
    resume.experience[0].bulletVisibility = [true, true, false, true]

    const analysis = buildAnalysis({
      bulletRewrites: [
        {
          sectionId: 'experience',
          companyOrProject: COMPANY,
          original: 'Managed the end to end delivery pipeline for three enterprise accounts.',
          tailored: 'Managed end-to-end delivery for three enterprise accounts.',
          keywordsHit: [],
          rationale: '',
          impact: 'high',
        },
      ] as TailorAnalysis['bulletRewrites'],
    })

    const result = applyTailorAnalysisToResumeData(resume, analysis)
    const item = result.data.experience[0]
    expect(item.bullets).toHaveLength(3)
    expect(item.bulletVisibility).toEqual([true, false, true])
  })
})

describe('tailor merge — content that must survive', () => {
  it('never strips a mid-bullet company mention', () => {
    const analysis = buildAnalysis({
      bulletRewrites: [
        {
          sectionId: 'experience',
          companyOrProject: COMPANY,
          original: 'Managed the end to end delivery pipeline for three enterprise accounts.',
          tailored: `Migrated ${COMPANY}'s delivery pipeline onto a shared intake queue.`,
          keywordsHit: [],
          rationale: '',
          impact: 'high',
        },
      ] as TailorAnalysis['bulletRewrites'],
    })

    const result = applyTailorAnalysisToResumeData(buildResume(), analysis)
    expect(result.data.experience[0].bullets[0]).toBe(
      `Migrated ${COMPANY}'s delivery pipeline onto a shared intake queue.`
    )
  })

  it('leaves a clean tailor pass byte-identical to the pre-sanitizer behaviour', () => {
    const analysis = buildAnalysis({
      bulletRewrites: [
        {
          sectionId: 'experience',
          companyOrProject: 'Acme Corp',
          original: 'Built reporting dashboards using SQL for the operations leadership team.',
          tailored: 'Built SQL reporting dashboards for operations leadership.',
          keywordsHit: [],
          rationale: '',
          impact: 'high',
        },
      ] as TailorAnalysis['bulletRewrites'],
      bulletOrderPlans: [
        {
          sectionId: 'experience',
          companyOrProject: COMPANY,
          orderedOriginalBullets: [
            'Reduced average ticket resolution time from 48 hours to 12 hours.',
            'Managed the end to end delivery pipeline for three enterprise accounts.',
          ],
          reason: '',
        },
      ] as TailorAnalysis['bulletOrderPlans'],
    })

    const result = applyTailorAnalysisToResumeData(buildResume(), analysis)

    expect(result.data.experience[0].bullets).toEqual([
      'Reduced average ticket resolution time from 48 hours to 12 hours.',
      'Managed the end to end delivery pipeline for three enterprise accounts.',
      'Coordinated weekly updates with clients and implementation teams.',
    ])
    expect(result.data.experience[1].bullets).toEqual([
      'Built SQL reporting dashboards for operations leadership.',
      'Owned the weekly capacity plan across four squads.',
    ])
  })

  it('reports no change when the analysis has nothing to apply', () => {
    const result = applyTailorAnalysisToResumeData(buildResume(), buildAnalysis())
    expect(result.changed).toBe(false)
    expect(result.data.experience[0].bullets).toEqual(buildResume().experience[0].bullets)
  })
})

describe('extractJSONPayload', () => {
  it('pulls JSON out of a fenced block with surrounding prose', () => {
    const raw = 'Sure!\n```json\n{"a":1}\n```\nHope that helps.'
    expect(JSON.parse(extractJSONPayload(raw))).toEqual({ a: 1 })
  })

  it('handles an unlabelled fence', () => {
    expect(JSON.parse(extractJSONPayload('```\n{"a":1}\n```'))).toEqual({ a: 1 })
  })

  it('handles a fence that was never closed', () => {
    expect(JSON.parse(extractJSONPayload('```json\n{"a":1}'))).toEqual({ a: 1 })
  })

  it('passes bare JSON through untouched', () => {
    expect(JSON.parse(extractJSONPayload('{"a":1}'))).toEqual({ a: 1 })
  })

  it('strips a leading BOM', () => {
    expect(JSON.parse(extractJSONPayload('﻿{"a":1}'))).toEqual({ a: 1 })
  })
})

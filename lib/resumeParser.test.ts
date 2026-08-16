import { describe, expect, it } from 'vitest'
import { parseResumeText } from '@/lib/resumeParser'

const HEADER = `Priya Raman
priya.raman@example.com | +91 98765 43210 | Bengaluru, Karnataka
`

describe('parseJobLines — header lines must not leak into bullets', () => {
  it('does not emit the company name as a bullet when bullets are unmarked', async () => {
    const parsed = await parseResumeText(`${HEADER}
PROFESSIONAL EXPERIENCE

Senior Delivery Manager
Jan 2021 - Present
Northwind Global Technology Solutions Private Limited
Managed the end to end delivery pipeline for three enterprise accounts.
Coordinated weekly updates with clients and implementation teams.
Reduced average ticket resolution time from 48 hours to 12 hours.

EDUCATION
B.Tech, Computer Science
Anna University, 2018
`)

    const [role] = parsed.experience
    expect(role.company).toBe('Northwind Global Technology Solutions Private Limited')
    expect(role.bullets).toEqual([
      'Managed the end to end delivery pipeline for three enterprise accounts.',
      'Coordinated weekly updates with clients and implementation teams.',
      'Reduced average ticket resolution time from 48 hours to 12 hours.',
    ])
  })

  it('does not glue the next entry title onto the previous entry last bullet', async () => {
    const parsed = await parseResumeText(`${HEADER}
PROFESSIONAL EXPERIENCE

Senior Delivery Manager
Jan 2021 - Present
Northwind Global Technology Solutions Private Limited
Managed the end to end delivery pipeline for three enterprise accounts.
Reduced average ticket resolution time from 48 hours to 12 hours.

Delivery Analyst
Jun 2018 - Dec 2020
Acme Corp
Built reporting dashboards using SQL for the operations leadership team.
Owned the weekly capacity plan across four squads.

EDUCATION
B.Tech, Computer Science
Anna University, 2018
`)

    expect(parsed.experience).toHaveLength(2)
    const [first, second] = parsed.experience

    for (const bullet of first.bullets) {
      expect(bullet).not.toContain('Delivery Analyst')
      expect(bullet).not.toContain('Acme Corp')
    }

    expect(first.bullets).toEqual([
      'Managed the end to end delivery pipeline for three enterprise accounts.',
      'Reduced average ticket resolution time from 48 hours to 12 hours.',
    ])
    expect(second.title).toBe('Delivery Analyst')
    expect(second.company).toBe('Acme Corp')
    expect(second.bullets).toEqual([
      'Built reporting dashboards using SQL for the operations leadership team.',
      'Owned the weekly capacity plan across four squads.',
    ])
  })

  it('still parses short company names correctly (unchanged behaviour)', async () => {
    const parsed = await parseResumeText(`${HEADER}
PROFESSIONAL EXPERIENCE

Delivery Analyst
Jun 2018 - Dec 2020
Acme Corp
Built reporting dashboards using SQL for the operations leadership team.
Owned the weekly capacity plan across four squads.

EDUCATION
B.Tech, Computer Science
Anna University, 2018
`)

    const [role] = parsed.experience
    expect(role.company).toBe('Acme Corp')
    expect(role.bullets).toEqual([
      'Built reporting dashboards using SQL for the operations leadership team.',
      'Owned the weekly capacity plan across four squads.',
    ])
  })

  it('still parses glyph-marked bullets correctly (unchanged behaviour)', async () => {
    const parsed = await parseResumeText(`${HEADER}
PROFESSIONAL EXPERIENCE

Senior Delivery Manager
Jan 2021 - Present
Northwind Global Technology Solutions Private Limited
• Managed the end to end delivery pipeline for three enterprise accounts.
• Coordinated weekly updates with clients and implementation teams.

EDUCATION
B.Tech, Computer Science
Anna University, 2018
`)

    const [role] = parsed.experience
    expect(role.company).toBe('Northwind Global Technology Solutions Private Limited')
    expect(role.bullets).toEqual([
      'Managed the end to end delivery pipeline for three enterprise accounts.',
      'Coordinated weekly updates with clients and implementation teams.',
    ])
  })

  it('keeps a legitimate bullet that mentions the employer mid-sentence', async () => {
    const parsed = await parseResumeText(`${HEADER}
PROFESSIONAL EXPERIENCE

Senior Delivery Manager
Jan 2021 - Present
Northwind Global Technology Solutions Private Limited
Migrated the Northwind Global billing platform onto a shared intake queue.
Coordinated weekly updates with clients and implementation teams.

EDUCATION
B.Tech, Computer Science
Anna University, 2018
`)

    const [role] = parsed.experience
    expect(role.bullets[0]).toBe('Migrated the Northwind Global billing platform onto a shared intake queue.')
  })

  it('handles the company appearing above the date line', async () => {
    const parsed = await parseResumeText(`${HEADER}
PROFESSIONAL EXPERIENCE

Senior Delivery Manager
Northwind Global Technology Solutions Private Limited
Jan 2021 - Present
Managed the end to end delivery pipeline for three enterprise accounts.
Coordinated weekly updates with clients and implementation teams.

EDUCATION
B.Tech, Computer Science
Anna University, 2018
`)

    const [role] = parsed.experience
    expect(role.company).toBe('Northwind Global Technology Solutions Private Limited')
    for (const bullet of role.bullets) {
      expect(bullet).not.toBe('Northwind Global Technology Solutions Private Limited')
    }
  })
})

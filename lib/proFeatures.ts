export interface ProFeatureConfig {
  title: string
  description: string
  bullets: string[]
}

export const PRO_FEATURES = {
  tailor: {
    title: 'Tailor Mode is a Pro feature',
    description: 'Paste any job description and AI will highlight exactly what to improve.',
    bullets: [
      'Match score against the job',
      'Missing keyword detection',
      'Section-by-section suggestions',
    ],
  },
  docx_download: {
    title: 'DOCX export is a Pro feature',
    description: 'Download your resume as an editable Word document.',
    bullets: ['Word .docx format', 'ATS-friendly', 'Editable by recruiters'],
  },
  multi_resume: {
    title: 'Multiple resumes is a Pro feature',
    description: 'Store and manage multiple tailored resumes.',
    bullets: ['Unlimited resumes', 'Separate ATS scores', 'Quick switching'],
  },
} satisfies Record<string, ProFeatureConfig>

export type ProFeatureKey = keyof typeof PRO_FEATURES

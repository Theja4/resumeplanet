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
    title: 'Custom template exports are a Pro feature',
    description: 'Customize one polished template and export it as PDF or editable Word.',
    bullets: ['Highly customizable template', 'PDF + DOCX export', 'ATS-friendly formatting'],
  },
  multi_resume: {
    title: 'Multiple resumes is a Pro feature',
    description: 'Store and manage multiple tailored resumes.',
    bullets: ['Unlimited resumes', 'Separate ATS scores', 'Quick switching'],
  },
} satisfies Record<string, ProFeatureConfig>

export type ProFeatureKey = keyof typeof PRO_FEATURES

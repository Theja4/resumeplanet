export interface ProFeatureConfig {
  label: string
  description: string
  bullets: string[]
}

export const PRO_FEATURES = {
  tailor: {
    label: 'Tailor Mode',
    description: 'Paste any job description and AI will highlight exactly what to improve.',
    bullets: [
      'Match score against the job',
      'Missing keyword detection',
      'Section-by-section suggestions',
    ],
  },
  docx_download: {
    label: 'Custom Exports',
    description: 'Customize one polished template and export it as PDF or editable Word.',
    bullets: ['Highly customizable template', 'PDF + DOCX export', 'ATS-friendly formatting'],
  },
  multi_resume: {
    label: 'Multiple Resumes',
    description: 'Store and manage multiple tailored resumes.',
    bullets: ['Unlimited resumes', 'Separate ATS scores', 'Quick switching'],
  },
} satisfies Record<string, ProFeatureConfig>

export type ProFeatureKey = keyof typeof PRO_FEATURES

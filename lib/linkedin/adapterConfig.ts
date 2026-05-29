// DECLARATIVE SelectorConfig served by /api/linkedin/adapter-config to the
// Rezoomed LinkedIn extension. This is the source of truth for the latest
// selector strategy data; bumping CURRENT_VERSION and editing the fields
// below ships a hot-fix to all installed extensions without a Chrome Web
// Store re-review.
//
// CRITICAL: keep this strictly data — selector strings, JSON paths, field
// maps. Never include executable code, function references, or expressions
// the extension would have to evaluate. The extension treats the response
// as inert JSON and validates its shape before using it.

export const CURRENT_ADAPTER_CONFIG_VERSION = '2026-05-26.r1'

export interface AdapterConfigStrategySelector {
  strategy: 'embeddedJson' | 'semantic' | 'domClasses'
  confidence?: number
  selectors?: string[]
  rootSelectors?: string[]
  itemSelectors?: string[]
  bulletSelectors?: string[]
  attribute?: string
  sectionHeadings?: string[]
  ariaLabels?: string[]
  jsonPathHints?: string[]
  jsonKeyHints?: string[]
  textIncludes?: string[]
  excludeText?: string[]
  patterns?: string[]
}

export interface AdapterConfigField {
  field: string
  valueType: 'string' | 'string[]' | 'boolean' | 'number' | 'experience[]'
  threshold?: number
  strategies: AdapterConfigStrategySelector[]
}

export interface AdapterConfig {
  version: string
  minConfidence: number
  cache: { key: string; ttlMs: number }
  fields: Record<string, AdapterConfigField>
}

export const CURRENT_ADAPTER_CONFIG: AdapterConfig = {
  version: CURRENT_ADAPTER_CONFIG_VERSION,
  minConfidence: 0.55,
  cache: {
    key: 'rezoomed.selectorConfig.v1',
    ttlMs: 1000 * 60 * 60 * 12,
  },
  fields: {
    headline: {
      field: 'headline',
      valueType: 'string',
      threshold: 0.56,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.9,
          jsonPathHints: ['headline', 'occupation', 'profile.headline'],
          jsonKeyHints: ['headline', 'occupation'],
        },
        {
          strategy: 'semantic',
          confidence: 0.74,
          ariaLabels: ['headline'],
          excludeText: ['contact info', 'connections', 'followers'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.48,
          selectors: [
            '.pv-text-details__left-panel .text-body-medium',
            '.text-body-medium.break-words',
            'main h1 + div .text-body-medium',
          ],
        },
      ],
    },
    about: {
      field: 'about',
      valueType: 'string',
      threshold: 0.58,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.88,
          jsonPathHints: ['summary', 'about', 'profile.summary'],
          jsonKeyHints: ['summary', 'about'],
        },
        {
          strategy: 'semantic',
          confidence: 0.75,
          rootSelectors: [
            '#about',
            "div[data-section='summary']",
            "section [data-field='summary']",
          ],
          sectionHeadings: ['About'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.48,
          selectors: [
            'section.artdeco-card:has(#about) .display-flex.ph5.pv3',
            'section.artdeco-card:has(#about) .inline-show-more-text',
            'section.pv-profile-card:has(#about)',
            'section:has(#about)',
            '.pv-about-section',
            '.pv-shared-text-with-see-more',
          ],
        },
      ],
    },
    experience: {
      field: 'experience',
      valueType: 'experience[]',
      threshold: 0.56,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.84,
          jsonPathHints: ['experience', 'positions', 'positionView', 'elements'],
          jsonKeyHints: ['experience', 'positions', 'companyName', 'title'],
        },
        {
          strategy: 'semantic',
          confidence: 0.72,
          rootSelectors: ['#experience', "div[data-section='experience']"],
          sectionHeadings: ['Experience'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.45,
          selectors: [
            'section.artdeco-card:has(#experience)',
            'section.pv-profile-card:has(#experience)',
            'section:has(#experience)',
            '.experience-section',
          ],
          itemSelectors: [
            'li.artdeco-list__item',
            'li.pvs-list__item--with-top-padding',
            'li.pvs-list__paged-list-item',
            '.pv-entity__position-group-pager',
          ],
          bulletSelectors: ['li', '.pvs-list__item--with-top-padding'],
        },
      ],
    },
    skills: {
      field: 'skills',
      valueType: 'string[]',
      threshold: 0.55,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.83,
          jsonPathHints: ['skills', 'skillView', 'elements'],
          jsonKeyHints: ['skill', 'skillName'],
        },
        {
          strategy: 'semantic',
          confidence: 0.71,
          rootSelectors: ['#skills', "div[data-section='skills']"],
          sectionHeadings: ['Skills'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.45,
          selectors: [
            'section.artdeco-card:has(#skills)',
            'section.pv-profile-card:has(#skills)',
            'section:has(#skills)',
            '.pv-skill-categories-section',
          ],
          itemSelectors: [
            'li.artdeco-list__item',
            'li.pvs-list__item--with-top-padding',
            'li.pvs-list__paged-list-item',
            'li',
          ],
        },
      ],
    },
    education: {
      field: 'education',
      valueType: 'string[]',
      threshold: 0.55,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.82,
          jsonPathHints: ['education', 'educationView', 'schoolName'],
          jsonKeyHints: ['schoolName', 'degreeName', 'education'],
        },
        {
          strategy: 'semantic',
          confidence: 0.7,
          rootSelectors: ['#education', "div[data-section='education']"],
          sectionHeadings: ['Education'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.45,
          selectors: [
            'section.artdeco-card:has(#education)',
            'section.pv-profile-card:has(#education)',
            'section:has(#education)',
            '.education-section',
          ],
          itemSelectors: [
            'li.artdeco-list__item',
            'li.pvs-list__item--with-top-padding',
            'li.pvs-list__paged-list-item',
            'li',
          ],
        },
      ],
    },
    hasPhoto: {
      field: 'hasPhoto',
      valueType: 'boolean',
      threshold: 0.55,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.76,
          jsonKeyHints: [
            'profilePicture',
            'displayImageReference',
            'profilePictureDisplayImage',
          ],
        },
        {
          strategy: 'semantic',
          confidence: 0.68,
          ariaLabels: ['profile photo', 'profile picture'],
          patterns: ['profile photo', 'profile picture'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.44,
          selectors: [
            '.pv-top-card-profile-picture__image',
            '.pv-top-card__photo',
            "img[alt*='profile photo' i]",
            "img[alt*='profile picture' i]",
          ],
        },
      ],
    },
    hasBanner: {
      field: 'hasBanner',
      valueType: 'boolean',
      threshold: 0.52,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.7,
          jsonKeyHints: [
            'backgroundImage',
            'profileBackgroundImage',
            'backgroundPicture',
          ],
        },
        {
          strategy: 'semantic',
          confidence: 0.62,
          ariaLabels: ['background image', 'cover image'],
          patterns: ['background image', 'cover image'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.42,
          selectors: [
            '.profile-background-image__image',
            '.pv-top-card__background-image',
            "img[alt*='background image' i]",
            "img[alt*='cover image' i]",
          ],
        },
      ],
    },
    customUrl: {
      field: 'customUrl',
      valueType: 'boolean',
      threshold: 0.7,
      strategies: [
        {
          strategy: 'semantic',
          confidence: 0.9,
          patterns: ['^/in/[a-z0-9][a-z0-9-]{2,99}/?$'],
        },
      ],
    },
    openToWork: {
      field: 'openToWork',
      valueType: 'boolean',
      threshold: 0.52,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.72,
          jsonKeyHints: ['openToWork', 'jobSeekingPreferences', 'openTo'],
          patterns: ['open to work'],
        },
        {
          strategy: 'semantic',
          confidence: 0.66,
          patterns: ['open to work', 'open-to-work', '#opentowork'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.42,
          selectors: [
            "img[alt*='Open to work' i]",
            "[aria-label*='Open to work' i]",
          ],
        },
      ],
    },
    recommendationsCount: {
      field: 'recommendationsCount',
      valueType: 'number',
      threshold: 0.5,
      strategies: [
        {
          strategy: 'embeddedJson',
          confidence: 0.74,
          jsonKeyHints: [
            'recommendationsCount',
            'recommendationCount',
            'numRecommendations',
          ],
        },
        {
          strategy: 'semantic',
          confidence: 0.63,
          rootSelectors: [
            '#recommendations',
            "div[data-section='recommendations']",
          ],
          sectionHeadings: ['Recommendations'],
          patterns: ['(\\d+)\\s+recommendations?'],
        },
        {
          strategy: 'domClasses',
          confidence: 0.4,
          selectors: [
            'section.artdeco-card:has(#recommendations)',
            'section.pv-profile-card:has(#recommendations)',
            'section:has(#recommendations)',
            '.recommendations-section',
          ],
        },
      ],
    },
  },
}

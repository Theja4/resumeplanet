export type Confidence = number;

export type StrategyName = "embeddedJson" | "semantic" | "domClasses";

export type ProfileField =
  | "headline"
  | "about"
  | "experience"
  | "skills"
  | "education"
  | "hasPhoto"
  | "hasBanner"
  | "customUrl"
  | "openToWork"
  | "recommendationsCount";

export interface FieldValue<T> {
  value?: T;
  confidence: Confidence;
  source?: StrategyName;
  unread?: boolean;
}

export interface ExperienceEntry {
  title?: FieldValue<string>;
  company?: FieldValue<string>;
  description?: FieldValue<string>;
  bullets?: FieldValue<string[]>;
}

export interface ProfileData {
  headline?: FieldValue<string>;
  about?: FieldValue<string>;
  experience?: FieldValue<ExperienceEntry[]>;
  skills?: FieldValue<string[]>;
  education?: FieldValue<string[]>;
  hasPhoto?: FieldValue<boolean>;
  hasBanner?: FieldValue<boolean>;
  customUrl?: FieldValue<boolean>;
  openToWork?: FieldValue<boolean>;
  recommendationsCount?: FieldValue<number>;
}

export type FieldValueType =
  | "string"
  | "string[]"
  | "boolean"
  | "number"
  | "experience[]";

export interface StrategySelector {
  strategy: StrategyName;
  confidence?: Confidence;
  selectors?: string[];
  rootSelectors?: string[];
  itemSelectors?: string[];
  bulletSelectors?: string[];
  attribute?: string;
  sectionHeadings?: string[];
  ariaLabels?: string[];
  jsonPathHints?: string[];
  jsonKeyHints?: string[];
  textIncludes?: string[];
  excludeText?: string[];
  patterns?: string[];
}

export interface FieldSelectorConfig {
  field: ProfileField;
  valueType: FieldValueType;
  threshold?: Confidence;
  strategies: StrategySelector[];
}

export interface StrategyFieldConfig extends FieldSelectorConfig {
  strategyConfig: StrategySelector;
}

export interface SelectorConfig {
  version: string;
  minConfidence: Confidence;
  cache: {
    key: string;
    ttlMs: number;
  };
  fields: Partial<Record<ProfileField, FieldSelectorConfig>>;
}

export interface ExtractionResult<T = unknown> {
  value?: T;
  confidence: Confidence;
  source?: StrategyName;
  reason?: string;
}

export type ExtractionStrategy = (
  document: Document,
  fieldConfig: StrategyFieldConfig,
) => ExtractionResult;

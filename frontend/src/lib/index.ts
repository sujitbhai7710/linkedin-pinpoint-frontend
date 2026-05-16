// Re-exports for $lib convenience
export { renderExplanation, formatDate, formatDateShort, formatDateSlug, formatDateParts, getYesterdayDate, loadSolutionsFromJson, checkWordLocally } from './api';
export type { PinpointPuzzle, PinpointSummary, PaginatedResponse, CheckResult, SolutionsResponse } from './types';
export { buildMeta, websiteJsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd, SITE_NAME, SITE_URL } from './seo';
export type { SEOData } from './seo';

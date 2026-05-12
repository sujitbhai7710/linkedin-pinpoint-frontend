// Re-exports for $lib convenience
export { getToday, getYesterday, getLast, searchByClue, searchByAnswer, searchByNumber, searchByDate, getSolutions, checkWord, renderExplanation, formatDate, formatDateShort } from './api';
export type { PinpointPuzzle, PinpointSummary, PaginatedResponse, CheckResult, SolutionsResponse } from './types';
export { buildMeta, websiteJsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd, SITE_NAME, SITE_URL } from './seo';
export type { SEOData } from './seo';

/**
 * Closed value sets shared by the API and its clients. Each list mirrors a CHECK constraint
 * in `apps/api/migrations`; a database test fails if the two drift apart.
 */

export const newsStatuses = [
  'INGESTED', 'RESEARCHING', 'DRAFT', 'EDITOR_REVIEW', 'FACT_CHECK', 'READY',
  'SCHEDULED', 'PUBLISHED', 'UPDATED', 'CORRECTED', 'ARCHIVED',
] as const;
export const translationStatuses = ['original', 'machine_draft', 'human_reviewed', 'approved'] as const;
export const taxonomyStatuses = ['active', 'hidden', 'archived'] as const;
/** What kind of piece a news item is. The same address for all three; the site lists them apart. */
export const newsFormats = ['news', 'analysis', 'opinion'] as const;
export type NewsFormat = (typeof newsFormats)[number];

export const contributorKinds = ['person', 'organization'] as const;
export const contributorRoles = ['author', 'editor', 'photographer', 'translator'] as const;
export const localeDirections = ['ltr', 'rtl'] as const;
export const mediaProcessingStates = ['pending', 'processing', 'ready', 'failed'] as const;
export const revisionMediaRoles = ['lead', 'inline', 'gallery'] as const;
export const sourceKinds = ['web', 'document', 'social', 'interview', 'dataset', 'agency', 'other'] as const;
export const sourceValidationStatuses = ['unvalidated', 'valid', 'rejected'] as const;
export const ingestChannels = ['rss', 'partner_api', 'approved_url', 'telegram'] as const;
export const pollStatuses = ['draft', 'open', 'closed', 'archived'] as const;
export const feedStatuses = ['ok', 'not_modified', 'error'] as const;
export const inboxStatuses = ['new', 'used', 'rejected', 'duplicate'] as const;
export const sourceRelations = ['primary', 'secondary'] as const;
export const sourceUseTypes = ['quoted', 'background', 'data', 'media', 'attribution'] as const;
export const assignmentRoles = ['reporter', 'editor', 'copy_editor', 'fact_checker', 'translator'] as const;
export const assignmentStatuses = ['open', 'done', 'cancelled'] as const;
export const commentStatuses = ['open', 'resolved'] as const;
export const scheduleStatuses = ['pending', 'published', 'cancelled', 'failed'] as const;
export const cardAspectRatios = ['square', 'vertical', 'landscape'] as const;
export const cardTemplateStatuses = ['draft', 'active', 'retired'] as const;
export const advertiserStatuses = ['active', 'archived'] as const;
export const campaignStatuses = ['draft', 'active', 'paused', 'ended'] as const;
export const adFormats = ['image', 'html'] as const;
export const adDeviceTargets = ['all', 'desktop', 'mobile'] as const;
export const adEventTypes = ['impression', 'click'] as const;
export const auditActorTypes = ['human', 'system', 'ai'] as const;

// Temporary page only (FL-02). Every color token and type role, as written in
// color-system.md Section 2 and typography-system.md Section 3. Class names are
// written out in full so Tailwind generates them.

export type ColorGroup =
  "surfaces" | "ink" | "brand" | "accent" | "borders" | "status" | "utility";

export type ColorToken = { name: string; swatch: string };

export const colorTokens: Record<ColorGroup, ColorToken[]> = {
  surfaces: [
    { name: "background", swatch: "bg-background" },
    { name: "surface", swatch: "bg-surface" },
    { name: "surface-alt", swatch: "bg-surface-alt" },
    { name: "surface-elevated", swatch: "bg-surface-elevated" },
  ],
  ink: [
    { name: "ink", swatch: "bg-ink" },
    { name: "ink-secondary", swatch: "bg-ink-secondary" },
    { name: "ink-muted", swatch: "bg-ink-muted" },
    { name: "ink-disabled", swatch: "bg-ink-disabled" },
  ],
  brand: [
    { name: "brand", swatch: "bg-brand" },
    { name: "interactive", swatch: "bg-interactive" },
    { name: "interactive-hover", swatch: "bg-interactive-hover" },
    { name: "interactive-pressed", swatch: "bg-interactive-pressed" },
    { name: "on-interactive", swatch: "bg-on-interactive" },
  ],
  accent: [
    { name: "accent-soft", swatch: "bg-accent-soft" },
    { name: "accent-subtle", swatch: "bg-accent-subtle" },
  ],
  borders: [
    { name: "border", swatch: "bg-border" },
    { name: "border-soft", swatch: "bg-border-soft" },
    { name: "border-interactive", swatch: "bg-border-interactive" },
  ],
  status: [
    { name: "success", swatch: "bg-success" },
    { name: "success-subtle", swatch: "bg-success-subtle" },
    { name: "warning", swatch: "bg-warning" },
    { name: "warning-subtle", swatch: "bg-warning-subtle" },
    { name: "error", swatch: "bg-error" },
    { name: "error-subtle", swatch: "bg-error-subtle" },
    { name: "info", swatch: "bg-info" },
    { name: "info-subtle", swatch: "bg-info-subtle" },
    { name: "destructive", swatch: "bg-destructive" },
    { name: "on-destructive", swatch: "bg-on-destructive" },
    { name: "live", swatch: "bg-live" },
    { name: "on-live", swatch: "bg-on-live" },
  ],
  // `selection` and `shadow` have no Tailwind color in the spec. The page shows
  // their value; select text on the page to see `selection`.
  utility: [
    { name: "selection", swatch: "" },
    { name: "overlay", swatch: "bg-overlay" },
    { name: "shadow", swatch: "" },
    { name: "skeleton", swatch: "bg-skeleton" },
  ],
};

export type SampleKind = "headline" | "text" | "label" | "meta" | "ui";

export const typeRoles: { role: string; kind: SampleKind }[] = [
  { role: "type-display", kind: "headline" },
  { role: "type-page-title", kind: "headline" },
  { role: "type-article-title", kind: "headline" },
  { role: "type-story-lead", kind: "headline" },
  { role: "type-story-title-lg", kind: "headline" },
  { role: "type-story-title", kind: "headline" },
  { role: "type-story-title-sm", kind: "headline" },
  { role: "type-deck", kind: "text" },
  { role: "type-summary", kind: "text" },
  { role: "type-article-body", kind: "text" },
  { role: "type-article-h2", kind: "headline" },
  { role: "type-article-h3", kind: "headline" },
  { role: "type-blockquote", kind: "text" },
  { role: "type-pullquote", kind: "headline" },
  { role: "type-section-title", kind: "label" },
  { role: "type-eyebrow", kind: "label" },
  { role: "type-metadata", kind: "meta" },
  { role: "type-caption", kind: "text" },
  { role: "type-ui", kind: "ui" },
  { role: "type-ui-sm", kind: "ui" },
  { role: "type-button", kind: "ui" },
  { role: "type-input", kind: "ui" },
];

// Sample text in both languages. This is content, not interface text.
export const samples: Record<SampleKind, { bn: string; en: string }> = {
  headline: {
    bn: "ঢাকায় সীমান্ত আলোচনা আবার শুরু, দুই দেশের প্রতিনিধিরা নতুন প্রস্তাব নিয়ে বসছেন",
    en: "Border talks resume in Dhaka as both delegations bring new proposals",
  },
  text: {
    bn: "দুই দিনের বৈঠকে পানিবণ্টন, সীমান্ত হত্যা ও বাণিজ্য নিয়ে আলোচনা হবে। কর্মকর্তারা বলছেন, এবার একটি যৌথ বিবৃতির সম্ভাবনা আছে।",
    en: "The two-day meeting will cover water sharing, border killings and trade. Officials say a joint statement is possible this time.",
  },
  label: { bn: "বিশ্লেষণ", en: "Analysis" },
  meta: {
    bn: "রাশেদ করিম · ৭ অক্টোবর ২০২৬ · ৫ মিনিটে পড়ুন",
    en: "Rashed Karim · 7 October 2026 · 5 min read",
  },
  ui: { bn: "সর্বশেষ খবর পড়ুন", en: "Read the latest news" },
};

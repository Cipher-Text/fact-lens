// PostToolUse (Edit|Write): looks for raw design values in source files.
// The edit stays in place. Exit code 2 sends the list to Claude so it fixes it.
// Token files in src/styles/ are allowed to hold values, so they are skipped.
import { readFileSync, existsSync } from "node:fs";
import { readInput } from "./_input.mjs";

const { abs, rel } = readInput();
if (!abs || !rel.startsWith("src/") || rel.startsWith("src/styles/")) process.exit(0);
if (rel.startsWith("src/i18n/")) process.exit(0); // string tables: keys such as dark are not variants
if (!/\.(tsx?|jsx?|css)$/.test(rel) || /\.(test|spec|stories)\.tsx?$/.test(rel)) process.exit(0);
if (!existsSync(abs)) process.exit(0);

const CHECKS = [
  { re: /#[0-9a-fA-F]{3,8}\b/, rule: "COL-02", say: "hex color; use a color token utility" },
  { re: /\b(?:bg|text|border|ring|fill|stroke|outline|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3})?\b/, rule: "COL-01", say: "Tailwind palette color; use a Fact Lens token" },
  { re: /\bdark:(?=[\w\[!-])/, rule: "COL-03", say: "dark: variant; theme logic lives in the tokens" },
  { re: /\b(?:text|leading|tracking|font)-\[/, rule: "TYP-18", say: "arbitrary type value; use a type-* role utility" },
  { re: /\b(?:text-(?:xs|sm|base|lg|xl|\dxl))\b/, rule: "TYP-01", say: "Tailwind text size; use a type-* role utility" },
  { re: /\b[a-z-]+-\[[^\]]*\d(?:px|rem|em)\]/, rule: "LAY-01", say: "arbitrary size; use a spacing or container token" },
  { re: /\b2xl:/, rule: "LAY-06", say: "2xl tier; there is no 2xl" },
  { re: /\d+(?:\.\d+)?vw\b|\b[a-z-]+-\[[^\]]*vw\]/, rule: "LAY-02", say: "vw unit; keep content inside its container" },
  { re: /\border-(?:first|last|none|\d+)\b|\border:\s*-?\d/, rule: "LAY-14", say: "CSS order; source order must equal reading order" },
  { re: /\b(?:sticky|fixed)\b/, rule: "LAY-11/LAY-15", say: "sticky or fixed; only the top bar may be sticky (check this is the top bar, drawer or dialog)" },
  { re: /ফ্যাক্টচেক|fact[\s-]?check/i, rule: "DR-18", say: "fact-check wording; Fact Lens has no fact-checking product" },
  { re: /\brounded(?!-none\b)(?:-[a-z0-9]+)?\b|border-radius:(?!\s*0(?:px)?\s*[;}"'])/, rule: "CPT-05", say: "rounded corner; only the ThemeToggle switch has a radius" },
  { re: /\bline-clamp-/, rule: "CPT-08", say: "line clamp; let news titles wrap" },
];

const lines = readFileSync(abs, "utf8").split(/\r?\n/);
const found = [];
lines.forEach((line, i) => {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
  for (const c of CHECKS) {
    if (c.re.test(line)) found.push(`  ${rel}:${i + 1}  ${c.rule}  ${c.say}`);
  }
});

const isAllowedSticky = (s) => /LAY-11\/LAY-15/.test(s) && /(header|top-bar|topbar|drawer|dialog|sheet)/i.test(rel);
const isAllowedRadius = (s) => /CPT-05/.test(s) && /(themetoggle|ui\/switch)/i.test(rel);
const report = found.filter((s) => !isAllowedSticky(s) && !isAllowedRadius(s));

if (report.length) {
  console.error(
    "Raw-value check found possible rule breaks. Fix them, or say in your summary why a line is correct:\n" +
      report.slice(0, 30).join("\n") +
      (report.length > 30 ? `\n  ... and ${report.length - 30} more` : "")
  );
  process.exit(2);
}
process.exit(0);

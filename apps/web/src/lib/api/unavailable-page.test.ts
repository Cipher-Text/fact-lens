import { describe, expect, it } from "vitest";

import { unavailableHtml } from "./unavailable-page";

describe("unavailableHtml", () => {
  it("renders the English title and escaped text", () => {
    const html = unavailableHtml("en");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<h1>News is not available right now</h1>");
    expect(html).toContain("<p>Please try again in a few minutes.</p>");
    expect(html).toContain('href="/en"');
    expect(html).not.toContain("<News");
  });

  it("renders the Bangla title and a localized home link", () => {
    const html = unavailableHtml("bn");
    expect(html).toContain('<html lang="bn">');
    expect(html).toContain("<h1>এই মুহূর্তে খবর পাওয়া যাচ্ছে না</h1>");
    expect(html).toContain('href="/"');
  });
});

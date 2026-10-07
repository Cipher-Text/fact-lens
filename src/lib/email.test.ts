import { describe, expect, it } from "vitest";

import { isValidEmail } from "./email";

describe("isValidEmail", () => {
  it("accepts a normal address, with spaces around it", () => {
    expect(isValidEmail("reader@example.com")).toBe(true);
    expect(isValidEmail("  a.b+news@mail.example.org ")).toBe(true);
  });

  it("rejects empty and malformed addresses", () => {
    for (const value of ["", "   ", "reader", "reader@", "@example.com", "reader@example", "a b@example.com", "a@@example.com", "a@example..com"]) {
      expect(isValidEmail(value), value).toBe(false);
    }
  });
});

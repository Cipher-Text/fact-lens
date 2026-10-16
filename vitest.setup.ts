import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without globals, so Testing Library does not clean up by itself.
afterEach(cleanup);

// jsdom has no ResizeObserver. The tests do not resize anything, so a no-op is enough.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

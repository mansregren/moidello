import { describe, expect, test } from "vitest";
import { johnhenric } from "./johnhenric";

describe("johnhenric.rewriteForLocale", () => {
  const rewrite = (path: string, target: "se" | "no" | "dk" | "fi") =>
    johnhenric
      .rewriteForLocale(new URL(`https://johnhenric.com${path}`), target)
      .pathname;

  test("replaces existing /gb/ locale segment", () => {
    // Real-world bug from 2026-05-13 — SE visitor on /gb/foo got
    // rewritten to /se/gb/foo instead of /se/foo.
    expect(rewrite("/gb/dark-brown-suede-loafers-a02976", "se")).toBe(
      "/se/dark-brown-suede-loafers-a02976",
    );
  });

  test("replaces existing /uk/ locale segment", () => {
    expect(rewrite("/uk/foo", "se")).toBe("/se/foo");
  });

  test("prepends when no locale segment in URL", () => {
    expect(rewrite("/foo", "se")).toBe("/se/foo");
  });

  test("is idempotent when URL already matches target locale", () => {
    expect(rewrite("/se/foo", "se")).toBe("/se/foo");
  });
});

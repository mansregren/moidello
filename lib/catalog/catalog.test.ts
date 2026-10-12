import { describe, expect, it } from "vitest";
import { catalogUrlKey, cleanBuyUrl, guessColor, guessGarment } from "./guess";
import { CANVAS_H, CANVAS_W, autoLayout, suggestTitle } from "./layout";

describe("guessGarment", () => {
  it.each([
    ["Forét Haze T-Shirt White", "T-shirt"],
    ["Wool Overshirt Navy", "Outerwear"],
    ["Merino Crewneck Sweater", "Sweater"],
    ["Oxford Shirt", "Shirt"],
    ["Carlson Cut Jeans", "Jeans"],
    ["Pleated Chinos", "Chinos"],
    ["Cup 72 Sneakers", "Shoes"],
    ["Cashmere Beanie White", "Accessories"],
    ["Stickad kofta", "Knitwear"],
  ])("%s → %s", (name, garment) => {
    expect(guessGarment(name)).toBe(garment);
  });
  it("returns null when unsure", () => {
    expect(guessGarment("Inspired by Althair")).toBeNull();
  });
});

describe("guessColor", () => {
  it("maps palette names and Swedish aliases", () => {
    expect(guessColor(null, "Haze T-Shirt White")).toBe("White");
    expect(guessColor("marinblå")).toBe("Navy");
    expect(guessColor("Off-white")).toBe("Cream");
    expect(guessColor(undefined, "Plain tee")).toBeNull();
  });
});

describe("catalogUrlKey / cleanBuyUrl", () => {
  it("dedupes on host + path, ignoring tracking", () => {
    expect(catalogUrlKey("https://www.Example.com/p/shirt/?gclid=1")).toBe("example.com/p/shirt");
    expect(cleanBuyUrl("https://a.se/p?utm_source=x&size=m&gclid=y#top")).toBe("https://a.se/p?size=m");
  });
});

describe("autoLayout", () => {
  const items = [
    { id: "shoes", garment: "Shoes", aspect: 1.6 },
    { id: "tee", garment: "T-shirt", aspect: 0.8 },
    { id: "jeans", garment: "Jeans", aspect: 0.5 },
    { id: "cap", garment: "Accessories", aspect: 1 },
  ];
  const rects = autoLayout(items);
  it("keeps every rect inside the canvas", () => {
    for (const r of rects.values()) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(CANVAS_W);
      expect(r.y + r.h).toBeLessThanOrEqual(CANVAS_H);
    }
  });
  it("stacks in body order and keeps the photo aspect", () => {
    expect(rects.get("tee")!.y).toBeLessThan(rects.get("jeans")!.y);
    expect(rects.get("jeans")!.y).toBeLessThan(rects.get("shoes")!.y);
    const t = rects.get("tee")!;
    expect(t.w / t.h).toBeCloseTo(0.8, 5);
  });
  it("puts accessories in the side column", () => {
    expect(rects.get("cap")!.x).toBeGreaterThan(rects.get("tee")!.x + rects.get("tee")!.w);
  });
});

describe("suggestTitle", () => {
  it("builds a colour-led title in body order", () => {
    expect(
      suggestTitle([
        { garment: "Shoes", color: "White" },
        { garment: "Chinos", color: "Beige" },
        { garment: "Blazer", color: "Navy" },
      ]),
    ).toBe("Navy, Beige & White");
  });
});

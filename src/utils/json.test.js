import { describe, it, expect } from "vitest";
import { parseJSON, repairJSON, sanitizeJ } from "./json.js";

describe("parseJSON", () => {
  it("parses valid JSON object", () => {
    expect(parseJSON('{"a":1}')).toEqual({ a: 1 });
    expect(parseJSON('  {"yemekler":[{"isim":"Test"}]}')).toEqual({
      yemekler: [{ isim: "Test" }],
    });
  });

  it("extracts first complete object from text", () => {
    const raw = 'x y {"menu_adi":"Gün 1","yemekler":[]} tail';
    expect(parseJSON(raw)).toEqual({ menu_adi: "Gün 1", yemekler: [] });
  });

  it("throws when no object found", () => {
    expect(() => parseJSON("no json here")).toThrow("JSON yok");
  });
});

describe("repairJSON", () => {
  it("returns null when no brace", () => {
    expect(repairJSON("text")).toBeNull();
  });

  it("extracts balanced object", () => {
    const s = '{"a":1';
    const out = repairJSON(s);
    expect(out).toBe('{"a":1}');
  });
});

describe("sanitizeJ", () => {
  it("removes trailing commas before ] or }", () => {
    expect(sanitizeJ('{"a":1,}')).toBe('{"a":1}');
  });
});

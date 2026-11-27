import { describe, expect, it } from "vitest";
import { Settings } from "../src";

/** Parse, serialize to JSON and parse again; the result must be stable. */
function roundTrip(value: unknown): Settings {
  const first = Settings.parse(value);
  const second = Settings.parse(JSON.parse(JSON.stringify(first)));
  expect(second).toEqual(first);
  return second;
}

describe("UI language setting", () => {
  it("follows the browser by default, also for files saved before the setting existed", () => {
    expect(Settings.parse({}).appearance.language).toBe("auto");
    const s = roundTrip({ appearance: { theme: "light" } });
    expect(s.appearance).toEqual({ theme: "light", language: "auto" });
  });

  it("round-trips a chosen language", () => {
    expect(roundTrip({ appearance: { language: "pt-BR" } }).appearance.language).toBe("pt-BR");
    expect(roundTrip({ appearance: { language: "en" } }).appearance.language).toBe("en");
  });

  it("rejects a language the UI isn't translated into", () => {
    expect(Settings.safeParse({ appearance: { language: "pt" } }).success).toBe(false);
    expect(Settings.safeParse({ appearance: { language: "fr" } }).success).toBe(false);
  });
});

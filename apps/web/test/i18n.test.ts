import { afterEach, describe, expect, it } from "vitest";
import { applyLanguage, i18n, resolveLanguage } from "@/lib/i18n";

describe("resolveLanguage", () => {
  it("keeps an explicit choice whatever the browser says", () => {
    expect(resolveLanguage("en", ["pt-BR"])).toBe("en");
    expect(resolveLanguage("pt-BR", ["en-US"])).toBe("pt-BR");
  });

  it("follows the first translated browser language on auto", () => {
    expect(resolveLanguage("auto", ["pt-BR", "en-US"])).toBe("pt-BR");
    expect(resolveLanguage("auto", ["pt-PT"])).toBe("pt-BR");
    expect(resolveLanguage("auto", ["PT"])).toBe("pt-BR");
    expect(resolveLanguage("auto", ["de-DE", "en-GB", "pt-BR"])).toBe("en");
  });

  it("falls back to English when nothing matches", () => {
    expect(resolveLanguage("auto", ["fr-FR", "ja"])).toBe("en");
    expect(resolveLanguage("auto", [])).toBe("en");
  });
});

describe("applyLanguage", () => {
  afterEach(async () => {
    await applyLanguage("en");
  });

  it("renders English before any language is applied", () => {
    expect(i18n.t("sidebar.inbox")).toBe("Inbox");
  });

  it("loads Brazilian Portuguese on demand and sets the page language", async () => {
    await applyLanguage("pt-BR");
    expect(i18n.t("sidebar.inbox")).toBe("Caixa de entrada");
    expect(document.documentElement.lang).toBe("pt-BR");
    await applyLanguage("en");
    expect(i18n.t("sidebar.inbox")).toBe("Inbox");
    expect(document.documentElement.lang).toBe("en");
  });
});

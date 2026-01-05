import formatDate from "../../../utils/formatDate";

describe("formatDate util", () => {
  const iso = "2025-12-30";

  it("formats with explicit lang 'fr'", () => {
    const result = formatDate(iso, "LL", "fr");
    // Should contain French month name
    expect(result).toContain("décembre");
    expect(result).toContain("2025");
  });

  it("formats with explicit lang 'en'", () => {
    const result = formatDate(iso, "LL", "en");
    // Should contain English month name
    expect(result).toContain("December");
    expect(result).toContain("2025");
  });

  it("formats date with default lang (from i18next mock = en)", () => {
    // The i18next mock returns 'en' as default language
    const result = formatDate(iso);
    // Should return a non-empty formatted date
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns empty string for falsy date", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });
});

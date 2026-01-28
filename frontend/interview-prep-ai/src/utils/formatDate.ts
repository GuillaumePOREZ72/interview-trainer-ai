import i18next from "i18next";

/**
 * Format a date string using Intl.DateTimeFormat (native browser API).
 * replaces the heavy moment.js library.
 *
 * - date: ISO string or anything Date accepts
 * - format: 'LL' (date) or 'LLL' (date + time)
 * - lang: optional override language code (e.g. 'fr' or 'en-US')
 */
export const formatDate = (
  date?: string | null,
  format: string = "LL",
  lang?: string,
): string => {
  if (!date) return "";

  const active = (lang || i18next.language || "en").split("-")[0];
  const d = new Date(date);

  // Map short codes to fuller locales for Intl
  const intlLocale =
    active === "fr" ? "fr-FR" : active === "en" ? "en-US" : active;

  try {
    if (format === "LLL") {
      return new Intl.DateTimeFormat(intlLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      }).format(d);
    }

    // Default to 'LL' (Date only)
    return new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch (e) {
    return d.toLocaleDateString(intlLocale);
  }
};

export default formatDate;

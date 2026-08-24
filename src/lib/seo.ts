export const SITE_URL = "https://worldmodels101.com";
export const SITE_NAME = "World Models 101";

/** Safely serialize JSON-LD embedded in an HTML script element. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

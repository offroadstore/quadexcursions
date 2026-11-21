export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function siteUrl(value: string): string {
  if (/^https?:\/\/(?:www\.)?quadexcursions\.com(?:\/|$)/i.test(value)) {
    const url = new URL(value);
    value = `${url.pathname}${url.search}${url.hash}`;
  }
  if (/^(?:https?:|mailto:|tel:|#|javascript:)/i.test(value)) return value;
  if (value === BASE || value.startsWith(`${BASE}/`)) return value;
  return `${BASE}/${value.replace(/^\/+/, "")}`;
}

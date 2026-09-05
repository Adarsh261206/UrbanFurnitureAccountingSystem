import { API_BASE_URL } from "@/lib/api/client";

/**
 * Resolves image URLs to absolute paths.
 *
 * Backend uploads return `/uploads/...` paths that only work when the page is
 * served from the same origin as the API. The frontend runs on a different
 * port, so relative upload paths must be prefixed with the API origin.
 */
export function imgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) {
    const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${base}${url}`;
  }
  return url;
}

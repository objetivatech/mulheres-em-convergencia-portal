/**
 * Utility functions for R2 storage URL handling.
 *
 * R2 public URLs follow the pattern:
 *   {R2_PUBLIC_URL}/{folder}/{filename}
 *
 * The "key" is everything after the public URL base, e.g. "blog-images/abc123.webp"
 */

/**
 * Extract the object key from an R2 public URL.
 * Works by removing the protocol + domain portion and returning the path.
 */
export function extractR2KeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Remove leading slash
    const key = parsed.pathname.replace(/^\//, '');
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Maps the old Supabase bucket names to R2 folder prefixes.
 * This keeps backward-compatible folder structure in R2.
 */
export const BUCKET_TO_FOLDER: Record<string, string> = {
  'blog-images': 'blog-images',
  'branding': 'branding',
  'ambassador-materials': 'ambassador-materials',
  'partner-logos': 'partner-logos',
};

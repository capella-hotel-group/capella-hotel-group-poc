/**
 * Environment detection and asset URL resolution utilities.
 * Environment configuration lives in @/configs/environments.
 */

import { ENV_CONFIG, ENV } from '@/configs/environments';

/**
 * Detect the current environment based on window.location.hostname.
 * Checks ENV_CONFIG in order; the last entry (hostnames: []) is the fallback.
 * Feature branches not listed in ENV_CONFIG default to 'prod' with a console warning.
 *
 * @returns The detected environment (Env.PROD | Env.STAGE | Env.DEV | Env.RDE)
 */
export function getEnv(): ENV {
  if (typeof window === 'undefined') {
    return ENV.RDE;
  }

  const hostname = window.location.hostname;

  for (const entry of ENV_CONFIG) {
    if (entry.hostnames.length === 0) {
      // Fallback entry
      console.warn(`[env] Unknown hostname: ${hostname}. Falling back to RDE.`);
      return entry.env;
    }
    if (entry.hostnames.includes(hostname)) {
      return entry.env;
    }
  }

  // Should never reach here (fallback entry handles it), but TS needs a return
  return ENV.RDE;
}

/**
 * Map of environment to AEM publish base URLs.
 * Derived from ENV_CONFIG — update ENV_CONFIG to change these values.
 */
export const ENV_PUBLISH_URLS: Record<ENV, string> = Object.fromEntries(
  [ENV.PROD, ENV.STAGE, ENV.DEV, ENV.RDE].map((env) => [env, ENV_CONFIG.find((e) => e.env === env)!.publishUrl]),
) as Record<ENV, string>;

/**
 * Get the AEM publish base URL for the current environment.
 *
 * @returns The publish base URL (e.g., 'https://publish-p{programId}-e{environmentId}.adobeaemcloud.com')
 */
export function getPublishBaseUrl(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const entry =
    ENV_CONFIG.find((e) => e.hostnames.length > 0 && e.hostnames.includes(hostname)) ??
    ENV_CONFIG[ENV_CONFIG.length - 1];
  return entry.publishUrl;
}

/**
 * Resolve an asset URL to use the correct AEM publish origin for the current environment.
 * Rewrites absolute URLs; returns relative paths unchanged.
 *
 * @param src - The source URL (absolute or relative)
 * @returns The rewritten URL with the publish origin for the current environment
 *
 * @example
 * // Absolute URL → rewritten to publish origin
 * resolveDAMUrl('https://author-p{programId}-e{environmentId}.adobeaemcloud.com/content/dam/video.mp4')
 * // → 'https://publish-p{programId}-e{environmentId}.adobeaemcloud.com/content/dam/video.mp4'
 *
 * @example
 * // Relative path → publish origin prepended
 * resolveDAMUrl('/content/dam/video.mp4')
 * // → 'https://publish-p{programId}-e{environmentId}.adobeaemcloud.com/content/dam/video.mp4'
 */
export function resolveDAMUrl(src: string): string {
  const publishBaseUrl = getPublishBaseUrl();
  try {
    // Absolute URL → rewrite origin to publish
    const url = new URL(src);
    return `${new URL(publishBaseUrl).origin}${url.pathname}${url.search}`;
  } catch {
    // Relative path → prepend publish origin
    return `${publishBaseUrl}${src}`;
  }
}

/**
 * Detects if the page is being viewed in the AEM Universal Editor.
 * @returns {boolean} True if in Universal Editor, false otherwise.
 */
export function isUniversalEditor() {
  return (
    window.location.search.includes('universal-editor=true') ||
    window.location.pathname.startsWith('/editor.html') ||
    window.location.hash.includes('universal-editor') ||
    window.location.hostname.includes('adobeaemcloud') ||
    !!document.querySelector('[data-universal-editor]')
  );
}

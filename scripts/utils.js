/**
 * Resolves a DAM asset URL to use the proxy origin when running on localhost.
 * This is needed because local AEM CLI dev server cannot serve /content/dam/ assets directly.
 * The proxy URL is read from <meta property="hlx:proxyUrl">.
 * @param {string} src
 * @returns {string}
 */
export function resolveDAMUrl(src) {
  if (!src || window.location.hostname !== 'localhost') return src;
  const proxyMeta = document.querySelector('meta[property="hlx:proxyUrl"]');
  if (!proxyMeta) return src;
  const proxyOrigin = new URL(proxyMeta.content).origin;
  try {
    const url = new URL(src);
    if (url.hostname === 'localhost') return `${proxyOrigin}${url.pathname}${url.search}`;
  } catch {
    // src is already a relative path
    return `${proxyOrigin}${src}`;
  }
  return src;
}

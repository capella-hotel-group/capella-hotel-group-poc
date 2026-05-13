/**
 * Core proxy middleware — forwards requests to the Turneo API
 * with the server-side API key injected. The key is never exposed to the client.
 */

import type { Request, Response } from 'express';
import { getConfig } from '../config.js';

/**
 * Builds the upstream Turneo URL from the incoming request.
 * - Path comes from req.originalUrl (full path, unaffected by router mounting)
 * - Query params come from req.query (includes any params injected by route middleware, e.g. storeId)
 */
function buildUpstreamUrl(req: Request): string {
  const { turneoBaseUrl } = getConfig();
  const upstreamPath = req.originalUrl.split('?')[0].replace(/^\/api/, '');
  const url = new URL(`${turneoBaseUrl}${upstreamPath}`);

  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Proxy handler — forwards the request to Turneo and pipes the response back.
 */
export async function proxyToTurneo(req: Request, res: Response): Promise<void> {
  const { turneoApiKey } = getConfig();
  const upstreamUrl = buildUpstreamUrl(req);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-api-key': turneoApiKey,
  };

  // Forward Content-Type for POST/PUT/PATCH requests
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward request body for non-GET methods
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    fetchOptions.body = JSON.stringify(req.body);
  }

  const startMs = Date.now();
  console.log(`[turneo-proxy]     upstream → ${req.method} ${upstreamUrl}`);

  try {
    const upstream = await fetch(upstreamUrl, fetchOptions);
    const elapsed = Date.now() - startMs;

    console.log(`[turneo-proxy]     upstream ← ${upstream.status} ${upstream.statusText} (${elapsed}ms)`);

    // Forward status code
    res.status(upstream.status);

    // Forward relevant headers from Turneo
    const contentType = upstream.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const body = await upstream.text();
    res.send(body);
  } catch (error) {
    const elapsed = Date.now() - startMs;
    console.error(`[turneo-proxy]     upstream ✗ failed after ${elapsed}ms —`, error);
    res.status(502).json({ error: 'Bad Gateway — failed to reach Turneo API' });
  }
}

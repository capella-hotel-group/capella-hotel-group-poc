/**
 * Core proxy middleware — forwards requests to the Turneo API
 * with the server-side API key injected. The key is never exposed to the client.
 */

import type { Request, Response } from 'express';
import { getConfig } from '../config.js';

/**
 * Builds the upstream Turneo URL from the incoming request path.
 * Strips the `/api` prefix so `/api/experiences` → `/experiences`.
 */
function buildUpstreamUrl(req: Request): string {
  const { turneoBaseUrl } = getConfig();
  const upstreamPath = req.originalUrl.replace(/^\/api/, '');
  return `${turneoBaseUrl}${upstreamPath}`;
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

  try {
    const upstream = await fetch(upstreamUrl, fetchOptions);

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
    console.error('[turneo-proxy] Upstream request failed:', error);
    res.status(502).json({ error: 'Bad Gateway — failed to reach Turneo API' });
  }
}

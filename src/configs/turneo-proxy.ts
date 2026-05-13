/**
 * Turneo Proxy configuration.
 * Returns the proxy server URL based on the current environment.
 * API key is NOT included — the proxy server handles authentication.
 */

import { ENV } from '@/configs/environments';
import { getEnv } from '@/utils/env';

export interface TurneoProxyConfig {
  baseUrl: string;
}

// TODO: Replace with actual deployed proxy URL for production
// const TURNEO_PROXY_PROD_URL = 'https://turneo-proxy.example.com/api';
const TURNEO_PROXY_DEV_URL = 'http://localhost:3001/api';

/**
 * Returns Turneo proxy server URL for the current environment.
 * In development, points to localhost:3001; in production, to the deployed proxy.
 */
export function getTurneoProxyConfig(): TurneoProxyConfig {
  const env = getEnv();

  if (env === ENV.PROD || env === ENV.STAGE) {
    return {
      baseUrl: TURNEO_PROXY_DEV_URL,
    };
  }

  return {
    baseUrl: TURNEO_PROXY_DEV_URL,
  };
}

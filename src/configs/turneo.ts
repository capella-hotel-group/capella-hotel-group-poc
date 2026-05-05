/**
 * Turneo API configuration.
 * Returns the appropriate base URL and API key based on the current environment.
 */

import { ENV } from '@/configs/environments';
import { getEnv } from '@/utils/env';

export interface TurneoConfig {
  baseUrl: string;
  apiKey: string;
  dynamicMock: boolean;
}

// const TURNEO_PRODUCTION_URL = 'https://api.pro.turneo.co';
const TURNEO_MOCK_URL = 'https://stoplight.io/mocks/turneo/turneo-experiences-api/45542131';

/**
 * Returns Turneo API configuration for the current environment.
 * Uses mock server for non-production environments.
 */
export function getTurneoConfig(): TurneoConfig {
  const env = getEnv();

  if (env === ENV.PROD) {
    return {
      baseUrl: TURNEO_MOCK_URL,
      // TODO: Replace with actual production API key (ideally from a server proxy)
      apiKey: 'TURNEO_PROD_API_KEY',
      dynamicMock: false,
    };
  }

  return {
    baseUrl: TURNEO_MOCK_URL,
    apiKey: 'mock',
    dynamicMock: false,
  };
}

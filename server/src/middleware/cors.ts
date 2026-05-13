/**
 * CORS middleware configuration.
 * Restricts access to whitelisted origins defined in environment variables.
 */

import cors from 'cors';
import { getConfig } from '../config.js';

export function createCorsMiddleware() {
  const { allowedOrigins } = getConfig();

  return cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, Postman)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false,
  });
}

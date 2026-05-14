/**
 * Turneo API Proxy Server — entry point.
 *
 * Proxies requests from the frontend to the Turneo Experiences API,
 * injecting the API key server-side so it's never exposed in the browser.
 */

import express from 'express';
import helmet from 'helmet';
import { getConfig } from './config.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { rateLimiter } from './middleware/rate-limit.js';
import { experiencesRouter } from './routes/experiences.js';
import { ordersRouter } from './routes/orders.js';

const config = getConfig();
const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(createCorsMiddleware());

// Rate limiting
app.use(rateLimiter);

// Parse JSON bodies (for POST requests)
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  const origin = req.headers.origin ?? req.headers.referer ?? '-';
  console.log(`[turneo-proxy] --> ${req.method} ${req.originalUrl} (origin: ${origin})`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Index
app.get('/', (_req, res) => {
  res.json({ message: '👋 Hello, dev! Turneo proxy is up and running.', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/experiences', experiencesRouter);
app.use('/api/orders', ordersRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(config.port, () => {
  console.log(`[turneo-proxy] Server running on http://localhost:${config.port}`);
  console.log(`[turneo-proxy] Proxying to: ${config.turneoBaseUrl}`);
  console.log(`[turneo-proxy] Store ID: ${config.turneoStoreId ?? '(none — all experiences)'}`);
  console.log(`[turneo-proxy] Allowed origins: ${config.allowedOrigins.join(', ')}`);
});

export default app;

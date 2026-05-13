/**
 * Experiences routes — proxies GET requests to Turneo experiences endpoints.
 *
 * Routes:
 *   GET /api/experiences                         → GET /experiences
 *   GET /api/experiences/:id/rates               → GET /experiences/:id/rates
 *   GET /api/experiences/:id/availabilities      → GET /experiences/:id/availabilities
 */

import { Router } from 'express';
import { proxyToTurneo } from '../middleware/turneo-proxy.js';
import { getConfig } from '../config.js';

export const experiencesRouter = Router();

// Validate experienceId format (basic UUID or alphanumeric check)
function isValidId(id: string): boolean {
  return /^[\w-]{1,64}$/.test(id);
}

// GET /api/experiences — search experiences
// Auto-injects storeId from env if set and not already provided by the client.
experiencesRouter.get(
  '/',
  (req, res, next) => {
    const { turneoStoreId } = getConfig();
    if (turneoStoreId && !req.query['storeId']) {
      req.query['storeId'] = turneoStoreId;
    }
    next();
  },
  proxyToTurneo,
);

// GET /api/experiences/:id/rates — get rates for an experience
experiencesRouter.get(
  '/:id/rates',
  (req, res, next) => {
    const id = String(req.params.id);
    if (!isValidId(id)) {
      res.status(400).json({ error: 'Invalid experience ID format' });
      return;
    }
    next();
  },
  proxyToTurneo,
);

// GET /api/experiences/:id/availabilities — get availabilities for an experience
experiencesRouter.get(
  '/:id/availabilities',
  (req, res, next) => {
    const id = String(req.params.id);
    if (!isValidId(id)) {
      res.status(400).json({ error: 'Invalid experience ID format' });
      return;
    }
    next();
  },
  proxyToTurneo,
);

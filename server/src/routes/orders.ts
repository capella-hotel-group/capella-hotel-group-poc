/**
 * Orders routes — proxies POST requests to Turneo orders endpoints.
 *
 * Routes:
 *   POST /api/orders                → POST /orders
 *   POST /api/orders/:id/confirm    → POST /orders/:id/confirm
 *   POST /api/orders/:id/add        → POST /orders/:id/add
 *   POST /api/orders/:id/remove     → POST /orders/:id/remove
 */

import { Router } from 'express';
import { proxyToTurneo } from '../middleware/turneo-proxy.js';

export const ordersRouter = Router();

// Validate orderId format
function isValidId(id: string): boolean {
  return /^[\w-]{1,64}$/.test(id);
}

// POST /api/orders — create a new order
ordersRouter.post('/', proxyToTurneo);

// POST /api/orders/:id/confirm — confirm an order
ordersRouter.post(
  '/:id/confirm',
  (req, res, next) => {
    const id = String(req.params.id);
    if (!isValidId(id)) {
      res.status(400).json({ error: 'Invalid order ID format' });
      return;
    }
    next();
  },
  proxyToTurneo,
);

// POST /api/orders/:id/add — add a booking to an order
ordersRouter.post(
  '/:id/add',
  (req, res, next) => {
    const id = String(req.params.id);
    if (!isValidId(id)) {
      res.status(400).json({ error: 'Invalid order ID format' });
      return;
    }
    next();
  },
  proxyToTurneo,
);

// POST /api/orders/:id/remove — remove a booking from an order
ordersRouter.post(
  '/:id/remove',
  (req, res, next) => {
    const id = String(req.params.id);
    if (!isValidId(id)) {
      res.status(400).json({ error: 'Invalid order ID format' });
      return;
    }
    next();
  },
  proxyToTurneo,
);

import { Router } from 'express';

export const lookupRoutes = Router();

lookupRoutes.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'lookup' });
});

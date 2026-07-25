import mongoose from 'mongoose';
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const status = mongoReady ? 'ok' : 'degraded';
  const code = mongoReady ? 200 : 503;

  res.status(code).json({
    data: {
      status,
      mongo: mongoReady ? 'up' : 'down',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import analysesRouter from './routes/analyses.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin/tools (no Origin header) and the configured frontends
      if (!origin || config.clientUrls.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', db: mongoose.connection.readyState === 1 } })
);
app.use('/api/analyses', analysesRouter);
app.use(notFound);
app.use(errorHandler);

async function start() {
  if (!config.mongoUri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
  app.listen(config.port, () => console.log(`API listening on :${config.port}`));
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

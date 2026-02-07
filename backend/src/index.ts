import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { intentRouter } from './routes/intents';
import { agentRouter } from './routes/agents';
import { matchRouter } from './routes/matches';
import { initDb } from './db/init';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/intents', intentRouter);
app.use('/api/agents', agentRouter);
app.use('/api/matches', matchRouter);

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Intent Market API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB failed:', err.message, '— starting in demo mode');
    app.listen(PORT, () => {
      console.log(`Intent Market API running on port ${PORT} (no database)`);
    });
  });

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { intentRouter } from './routes/intents';
import { agentRouter } from './routes/agents';
import { matchRouter } from './routes/matches';
import { openClawRouter } from './routes/openclaw';
import { initDb } from './db/init';
import { openClawSyncService } from './services/openclawSync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/intents', intentRouter);
app.use('/api/agents', agentRouter);
app.use('/api/matches', matchRouter);
app.use('/api/openclaw', openClawRouter);

// Initialize database and start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Intent Market API running on port ${PORT}`);
      
      // Start OpenClaw sync service if API key is configured
      if (process.env.OPENCLAW_API_KEY) {
        const syncInterval = parseInt(process.env.OPENCLAW_SYNC_INTERVAL_MINUTES || '5');
        openClawSyncService.start(syncInterval);
      } else {
        console.log('ℹ️  OpenClaw sync disabled (no API key configured)');
      }
    });
  })
  .catch((error) => {
    console.error('⚠️  Database connection failed:', error.message);
    console.log('⚠️  Starting server without database (some features may not work)');
    console.log('💡 To enable full functionality, start PostgreSQL and update .env file');
    
    // Start server anyway for demo purposes
    app.listen(PORT, () => {
      console.log(`🚀 Intent Market API running on port ${PORT} (demo mode - no database)`);
      console.log('⚠️  Note: Database features are disabled');
    });
  });

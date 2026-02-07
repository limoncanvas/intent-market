import { Router } from 'express';
import { z } from 'zod';
import { matchRepository } from '../repositories/MatchRepository';
import { intentRepository } from '../repositories/IntentRepository';
import { calculateMatchScore } from '../services/matching';
import { handleError, isDatabaseError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { MATCH_STATUSES, MATCH_SCORE_THRESHOLD, DEFAULT_MATCH_LIMIT } from '../../shared/constants';

export const matchRouter = Router();

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'completed'] as [string, ...string[]]),
});

// Get matches for an intent
matchRouter.get('/intent/:intentId', async (req, res) => {
  try {
    const intentId = parseInt(req.params.intentId);
    if (isNaN(intentId)) {
      return sendError(res, 'Invalid intent ID', 400);
    }

    const matches = await matchRepository.findByIntentId(intentId);
    sendSuccess(res, { matches });
  } catch (error) {
    if (isDatabaseError(error)) {
      return sendSuccess(res, { matches: [] });
    }
    handleError(error, res);
  }
});

// Get all matches
matchRouter.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      intentId: req.query.intentId ? parseInt(req.query.intentId as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const matches = await matchRepository.findAll(filters);
    sendSuccess(res, { matches });
  } catch (error) {
    if (isDatabaseError(error)) {
      return sendSuccess(res, { matches: [] });
    }
    handleError(error, res);
  }
});

// Update match status
matchRouter.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 'Invalid match ID', 400);
    }

    const { status } = updateStatusSchema.parse(req.body);

    const match = await matchRepository.updateStatus(id, status);

    if (!match) {
      return sendError(res, 'Match not found', 404);
    }

    sendSuccess(res, { match });
  } catch (error) {
    handleError(error, res);
  }
});

// Trigger matching for an intent
matchRouter.post('/find/:intentId', async (req, res) => {
  try {
    const intentId = parseInt(req.params.intentId);
    if (isNaN(intentId)) {
      return sendError(res, 'Invalid intent ID', 400);
    }

    const limit = parseInt(req.body.limit as string) || DEFAULT_MATCH_LIMIT;
    
    // Get the intent
    const intent = await intentRepository.findById(intentId);
    if (!intent || intent.status !== 'active') {
      return sendError(res, 'Active intent not found', 404);
    }

    // Get all other active intents
    const allIntents = await intentRepository.findAll({
      status: 'active',
      limit: limit * 2, // Get more to filter
    });

    const matches = [];
    for (const otherIntent of allIntents) {
      if (otherIntent.id === intentId) continue;

      const score = calculateMatchScore(intent, otherIntent);
      
      if (score > MATCH_SCORE_THRESHOLD) {
        // Check if match already exists
        const exists = await matchRepository.exists(intentId, otherIntent.id);
        
        if (!exists) {
          const match = await matchRepository.create({
            intent_id: intentId,
            matched_intent_id: otherIntent.id,
            match_score: score,
            status: 'pending',
          });
          matches.push(match);
        }
      }
    }

    sendSuccess(res, { matches, count: matches.length });
  } catch (error) {
    if (isDatabaseError(error)) {
      return sendError(res, 'Database not connected', 503);
    }
    handleError(error, res);
  }
});

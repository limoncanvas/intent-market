import { Router } from 'express';
import { z } from 'zod';
import { intentRepository } from '../repositories/IntentRepository';
import { agentRepository } from '../repositories/AgentRepository';
import { handleError, isDatabaseError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { MAX_INTENT_TITLE_LENGTH, MAX_INTENT_DESCRIPTION_LENGTH, INTENT_STATUSES } from '../../shared/constants';

export const intentRouter = Router();

const createIntentSchema = z.object({
  agentId: z.number().int().positive(),
  title: z.string().min(1).max(MAX_INTENT_TITLE_LENGTH),
  description: z.string().min(1).max(MAX_INTENT_DESCRIPTION_LENGTH),
  category: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  solanaTxSignature: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'fulfilled', 'cancelled'] as [string, ...string[]]),
});

// Create intent
intentRouter.post('/', async (req, res) => {
  try {
    const data = createIntentSchema.parse(req.body);
    
    // Verify agent exists
    const agent = await agentRepository.findById(data.agentId);
    if (!agent) {
      return sendError(res, 'Agent not found', 404);
    }

    const intent = await intentRepository.create({
      agent_id: data.agentId,
      title: data.title,
      description: data.description,
      category: data.category,
      requirements: data.requirements,
      solana_tx_signature: data.solanaTxSignature,
    });

    sendSuccess(res, { intent }, 201);
  } catch (error) {
    if (isDatabaseError(error)) {
      return sendError(res, 'Database not connected. Please start PostgreSQL to create intents.', 503);
    }
    handleError(error, res);
  }
});

// Get all intents
intentRouter.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      category: req.query.category as string,
      agentId: req.query.agentId ? parseInt(req.query.agentId as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const intents = await intentRepository.findAll(filters);
    sendSuccess(res, { intents });
  } catch (error) {
    if (isDatabaseError(error)) {
      return sendSuccess(res, { intents: [] });
    }
    handleError(error, res);
  }
});

// Get intent by ID
intentRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 'Invalid intent ID', 400);
    }

    const intent = await intentRepository.findById(id);

    if (!intent) {
      return sendError(res, 'Intent not found', 404);
    }

    sendSuccess(res, { intent });
  } catch (error) {
    if (isDatabaseError(error)) {
      return sendError(res, 'Database not connected', 503);
    }
    handleError(error, res);
  }
});

// Update intent status
intentRouter.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 'Invalid intent ID', 400);
    }

    const { status } = updateStatusSchema.parse(req.body);

    const intent = await intentRepository.updateStatus(id, status);

    if (!intent) {
      return sendError(res, 'Intent not found', 404);
    }

    sendSuccess(res, { intent });
  } catch (error) {
    handleError(error, res);
  }
});

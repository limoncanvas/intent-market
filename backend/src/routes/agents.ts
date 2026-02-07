import { Router } from 'express';
import { z } from 'zod';
import { agentRepository } from '../repositories/AgentRepository';
import { handleError, isDatabaseError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { SOLANA_WALLET_ADDRESS_LENGTH, MAX_AGENT_NAME_LENGTH } from '../../shared/constants';

export const agentRouter = Router();

const createAgentSchema = z.object({
  walletAddress: z.string().length(SOLANA_WALLET_ADDRESS_LENGTH, 'Wallet address must be 44 characters'),
  name: z.string().min(1).max(MAX_AGENT_NAME_LENGTH),
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
});

// Register or update agent
agentRouter.post('/', async (req, res) => {
  try {
    const data = createAgentSchema.parse(req.body);
    
    const agent = await agentRepository.createOrUpdate({
      wallet_address: data.walletAddress,
      name: data.name,
      description: data.description,
      capabilities: data.capabilities,
    });

    sendSuccess(res, { agent }, 201);
  } catch (error) {
    handleError(error, res);
  }
});

// Get agent by wallet address
agentRouter.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (walletAddress.length !== SOLANA_WALLET_ADDRESS_LENGTH) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    const agent = await agentRepository.findByWalletAddress(walletAddress);

    if (!agent) {
      return sendError(res, 'Agent not found', 404);
    }

    sendSuccess(res, { agent });
  } catch (error) {
    if (isDatabaseError(error)) {
      return sendError(res, 'Database not connected', 503);
    }
    handleError(error, res);
  }
});

// Get all agents
agentRouter.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const agents = await agentRepository.findAll(limit);
    sendSuccess(res, { agents });
  } catch (error) {
    if (isDatabaseError(error)) {
      return sendSuccess(res, { agents: [] });
    }
    handleError(error, res);
  }
});

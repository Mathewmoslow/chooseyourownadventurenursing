import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { advanceSimulation } from '../server/src/engine';
import { decodeState, encodeState } from '../server/src/signing';
import type { SimulationState } from '../server/src/types';

const requestSchema = z.object({
  action: z.string().max(280).optional(),
  token: z.string().optional(),
});

const withCors = (res: VercelResponse) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const getStateFromToken = (token: string | undefined): SimulationState | undefined => {
  if (!token) return undefined;
  return decodeState(token);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const bodySource = (() => {
      if (typeof req.body === 'string') {
        return req.body;
      }
      if (Buffer.isBuffer(req.body)) {
        return req.body.toString('utf8');
      }
      if (req.body) {
        return req.body;
      }
      return '{}';
    })();

    const rawBody = typeof bodySource === 'string' ? JSON.parse(bodySource || '{}') : bodySource;

    const parsed = requestSchema.parse(rawBody);
    const existingState = getStateFromToken(parsed.token);

    const { state, publicState, logEntry } = advanceSimulation(parsed.action ?? null, existingState);
    const token = encodeState(state);

    res.status(200).json({ state: publicState, token, logEntry });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid request' });
  }
}

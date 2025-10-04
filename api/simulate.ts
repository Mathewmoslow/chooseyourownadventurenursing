import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { advanceSimulation } from './_lib/engine';
import { decodeState, encodeState } from './_lib/signing';
import type { SimulationState } from './_lib/types';

const requestSchema = z.object({
  action: z.string().max(280).optional(),
  token: z.string().optional(),
});

const parseRequestBody = (req: VercelRequest): unknown => {
  if (req.body === undefined || req.body === null) {
    return {};
  }

  if (typeof req.body === 'string') {
    const trimmed = req.body.trim();
    if (!trimmed) return {};
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error('INVALID_JSON');
    }
  }

  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString('utf8').trim();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('INVALID_JSON');
    }
  }

  return req.body;
};

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
    const rawBody = parseRequestBody(req);
    const parsed = requestSchema.parse(rawBody);
    const existingState = getStateFromToken(parsed.token);

    const { state, publicState, logEntry } = advanceSimulation(parsed.action ?? null, existingState);
    const token = encodeState(state);

    res.status(200).json({ state: publicState, token, logEntry });
  } catch (error) {
    const isInvalidJson = (error as Error)?.message === 'INVALID_JSON';
    if (!isInvalidJson) {
      console.error(error);
    }
    if (!isInvalidJson) {
      console.error(error);
    }
    res
      .status(isInvalidJson ? 400 : 500)
      .json({ error: isInvalidJson ? 'Request body must be valid JSON' : 'Server error' });
  }
}

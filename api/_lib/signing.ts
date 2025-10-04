import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { SimulationState } from './types.js';

const SECRET_ENV_KEY = 'SIM_SIGNATURE_SECRET';
const DEV_FALLBACK = 'choose-your-own-adventure-dev-secret-key';

const getKey = () => {
  const secret = process.env[SECRET_ENV_KEY] || DEV_FALLBACK;
  const hash = createHash('sha256');
  hash.update(secret);
  return hash.digest();
};

const KEY = getKey();
const IV_LENGTH = 12;

const toBase64Url = (input: Buffer) =>
  input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '');

const fromBase64Url = (input: string) => {
  const padLength = (4 - (input.length % 4 || 4)) % 4;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
  return Buffer.from(padded, 'base64');
};

export const encodeState = (state: SimulationState): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const json = JSON.stringify(state);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [toBase64Url(iv), toBase64Url(encrypted), toBase64Url(tag)].join('.');
};

export const decodeState = (token: string): SimulationState => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid state token format');
  }

  const [ivB64, payloadB64, tagB64] = parts;
  const iv = fromBase64Url(ivB64);
  const payload = fromBase64Url(payloadB64);
  const tag = fromBase64Url(tagB64);

  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8');
  return JSON.parse(decrypted);
};

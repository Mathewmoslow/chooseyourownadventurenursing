import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it } from 'vitest';
import handler from './simulate';

describe('simulate api handler', () => {
  const run = async (body: unknown) => {
    const req: Pick<VercelRequest, 'method' | 'body' | 'headers'> = {
      method: 'POST',
      body,
      headers: {},
    };

    const response: Partial<VercelResponse> & {
      headers: Record<string, string>;
      statusCode: number;
      payload?: unknown;
      ended?: boolean;
    } = {
      headers: {},
      statusCode: 200,
      setHeader(name: string, value: string) {
        this.headers[name] = value;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.payload = payload;
      },
      end() {
        this.ended = true;
      },
    };

    await handler(req, response);
    return response;
  };

  it('returns state when body is empty string', async () => {
    const res = await run('');
    expect(res.statusCode).toBe(200);
    expect(res.payload).toHaveProperty('state');
  });
});

import type { SimulationPayload } from '../types/simulation';

const DEFAULT_BASE = '';

const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE;

export const postSimulation = async (params: {
  action?: string;
  token?: string;
}): Promise<SimulationPayload> => {
  const response = await fetch(`${getBaseUrl()}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: params.action, token: params.token }),
  });

  if (!response.ok) {
    const message = await safeParseError(response);
    throw new Error(message ?? 'Simulation service error');
  }

  const data = (await response.json()) as SimulationPayload;
  return data;
};

const safeParseError = async (response: Response) => {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string') {
      return body.error;
    }
  } catch (error) {
    console.error('Failed to parse error payload', error);
  }
  return null;
};

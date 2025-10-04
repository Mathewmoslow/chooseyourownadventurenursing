import OpenAI from 'openai';
import type { SimulationState, ActionLogEntry } from './types.js';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

export const generateDynamicNarration = async (
  actionId: string,
  actionText: string,
  state: SimulationState,
  previousState: SimulationState,
): Promise<{ narration: string; notices: string[] }> => {
  const client = getOpenAIClient();

  if (!client) {
    // Fallback to default behavior
    return { narration: '', notices: [] };
  }

  try {
    const vitalChanges = describeVitalChanges(state, previousState);
    const activeInterventions = getActiveInterventions(state);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a clinical narrator for a nursing simulation. Generate realistic, immediate patient responses to interventions.

Current patient state:
- Vitals: MAP ${state.vitals.map}, HR ${state.vitals.heartRate}, Temp ${state.vitals.temperatureC}°C, SpO2 ${state.vitals.spo2}%, Lactate ${state.vitals.lactate}
- Neuro: ${state.neuro}, Skin: ${state.skin}, Urine: ${state.urineOutputTrend}
- Labs: Hgb ${state.labs.hgb}, Platelets ${state.labs.platelets}, ANC ${state.labs.anc}
- Active treatments: ${activeInterventions}
- Time elapsed: ${state.elapsedMinutes} minutes

Vital changes from last action:
${vitalChanges}

Write a SHORT, IMMEDIATE clinical response (1-2 sentences) describing what happens RIGHT NOW when the nurse performs this action. Be specific about visible patient changes.

Then provide 2-3 bullet points of clinical observations or monitor alerts that would appear immediately.

Format as JSON:
{
  "narration": "brief immediate response",
  "notices": ["observation 1", "observation 2", "observation 3"]
}`
        },
        {
          role: 'user',
          content: `Action performed: ${actionText}\nAction type: ${actionId}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 250
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      narration: result.narration || 'Intervention in progress.',
      notices: Array.isArray(result.notices) ? result.notices : []
    };
  } catch (error) {
    console.error('AI narration error:', error);
    return { narration: '', notices: [] };
  }
};

const describeVitalChanges = (current: SimulationState, previous: SimulationState): string => {
  const changes: string[] = [];

  const mapDiff = current.vitals.map - previous.vitals.map;
  if (Math.abs(mapDiff) > 1) {
    changes.push(`MAP ${mapDiff > 0 ? 'increased' : 'decreased'} ${Math.abs(mapDiff).toFixed(0)} mmHg`);
  }

  const hrDiff = current.vitals.heartRate - previous.vitals.heartRate;
  if (Math.abs(hrDiff) > 3) {
    changes.push(`HR ${hrDiff > 0 ? 'increased' : 'decreased'} ${Math.abs(hrDiff)} bpm`);
  }

  const lactateDiff = current.vitals.lactate - previous.vitals.lactate;
  if (Math.abs(lactateDiff) > 0.2) {
    changes.push(`Lactate ${lactateDiff > 0 ? 'rose' : 'fell'} ${Math.abs(lactateDiff).toFixed(1)} mmol/L`);
  }

  if (current.neuro !== previous.neuro) {
    changes.push(`Mental status changed from ${previous.neuro} to ${current.neuro}`);
  }

  if (current.skin !== previous.skin) {
    changes.push(`Skin changed from ${previous.skin} to ${current.skin}`);
  }

  return changes.length > 0 ? changes.join(', ') : 'No significant vital changes yet';
};

const getActiveInterventions = (state: SimulationState): string => {
  const active: string[] = [];

  if (state.infusions.antibiotic.active) active.push('antibiotics');
  if (state.infusions.fluids.active) active.push('fluid bolus');
  if (state.infusions.pressor.active) active.push('pressors');
  if (state.infusions.prbc.active) active.push('blood transfusion');
  if (state.infusions.platelets.active) active.push('platelets');

  return active.length > 0 ? active.join(', ') : 'none';
};

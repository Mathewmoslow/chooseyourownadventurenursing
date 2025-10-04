import OpenAI from 'openai';

const AVAILABLE_ACTIONS = [
  'ANTIBIOTIC',
  'CULTURES',
  'FLUID_BOLUS',
  'PRBC',
  'PLATELETS',
  'PRESSOR',
  'STOP_PRESSOR',
  'OXYGEN',
  'NEUTROPENIC_PRECAUTIONS',
  'PAGE_PROVIDER',
  'RAPID_RESPONSE',
  'CHECK_VITALS',
  'WAIT',
  'UNKNOWN'
] as const;

type ActionId = typeof AVAILABLE_ACTIONS[number];

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

export const parseActionWithAI = async (userInput: string): Promise<ActionId> => {
  const client = getOpenAIClient();

  if (!client) {
    console.warn('OpenAI API key not configured, falling back to regex matching');
    return 'UNKNOWN';
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nursing simulation assistant. Parse the user's input and determine which action they want to take.

Available actions:
- ANTIBIOTIC: Start broad-spectrum antibiotics (zosyn, cefepime, meropenem, pip-tazo)
- CULTURES: Draw blood cultures
- FLUID_BOLUS: Give IV fluid bolus (NS, lactated ringers, crystalloid)
- PRBC: Start blood transfusion (packed red blood cells)
- PLATELETS: Start platelet transfusion
- PRESSOR: Start vasopressor/norepinephrine/levophed
- STOP_PRESSOR: Stop the pressor
- OXYGEN: Apply oxygen (nasal cannula, non-rebreather)
- NEUTROPENIC_PRECAUTIONS: Implement neutropenic precautions/isolation
- PAGE_PROVIDER: Call/page the doctor/provider/oncologist
- RAPID_RESPONSE: Call rapid response team/RRT/code sepsis
- CHECK_VITALS: Check vitals/reassess patient
- WAIT: Wait/observe/hold
- UNKNOWN: If the action doesn't match any of the above

Return ONLY the action ID, nothing else.`
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      temperature: 0,
      max_tokens: 20
    });

    const actionId = response.choices[0]?.message?.content?.trim() as ActionId;

    if (AVAILABLE_ACTIONS.includes(actionId)) {
      return actionId;
    }

    return 'UNKNOWN';
  } catch (error) {
    console.error('AI parsing error:', error);
    return 'UNKNOWN';
  }
};

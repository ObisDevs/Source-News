import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { getCached, setCache } from '@/lib/redis/client';

type AIProvider = 'gemini' | 'openai' | 'groq' | 'grok';

const providers: AIProvider[] = ['gemini', 'openai', 'groq', 'grok'];

async function checkProviderHealth(provider: AIProvider): Promise<boolean> {
  const health = await getCached<string>(`ai:health:${provider}`);
  return health !== 'down';
}

async function markProviderDown(provider: AIProvider): Promise<void> {
  await setCache(`ai:health:${provider}`, 'down', 300); // 5 min
}

export async function generateAICompletion(
  prompt: string
): Promise<string> {
  for (const provider of providers) {
    if (!(await checkProviderHealth(provider))) continue;

    try {
      switch (provider) {
        case 'gemini':
          if (!process.env.GOOGLE_GEMINI_API_KEY) continue;
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
          const result = await model.generateContent(prompt);
          return result.response.text();

        case 'openai':
          if (!process.env.OPENAI_API_KEY) continue;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });
          return completion.choices[0].message.content || '';

        default:
          continue;
      }
    } catch (error) {
      console.error(`${provider} failed:`, error);
      await markProviderDown(provider);
      continue;
    }
  }

  throw new Error('All AI providers unavailable');
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { getCached, setCache } from '@/lib/redis/client';

type AIProvider = 'gemini' | 'openai' | 'mistral' | 'groq' | 'grok';

const providers: AIProvider[] = ['gemini', 'openai', 'mistral', 'groq', 'grok'];

async function checkProviderHealth(provider: AIProvider): Promise<boolean> {
  const health = await getCached<string>(`ai:health:${provider}`);
  return health !== 'down';
}

async function markProviderDown(provider: AIProvider): Promise<void> {
  await setCache(`ai:health:${provider}`, 'down', 300); // 5 min
}

export async function generateStoryAI(
  prompt: string,
  options?: { maxTokens?: number }
): Promise<string> {
  const storyProviders: AIProvider[] = ['grok', 'mistral', 'groq'];
  
  for (const provider of storyProviders) {
    if (!(await checkProviderHealth(provider))) continue;

    try {
      switch (provider) {
        case 'grok':
          if (!process.env.XAI_GROK_API_KEY) continue;
          const grok = new OpenAI({ 
            apiKey: process.env.XAI_GROK_API_KEY,
            baseURL: 'https://api.x.ai/v1'
          });
          const grokCompletion = await grok.chat.completions.create({
            model: 'grok-beta',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });
          return grokCompletion.choices[0].message.content || '';

        case 'mistral':
          if (!process.env.MISTRAL_API_KEY) continue;
          const mistral = new OpenAI({ 
            apiKey: process.env.MISTRAL_API_KEY,
            baseURL: 'https://api.mistral.ai/v1'
          });
          const mistralCompletion = await mistral.chat.completions.create({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });
          return mistralCompletion.choices[0].message.content || '';

        case 'groq':
          if (!process.env.GROQ_API_KEY) continue;
          const groq = new OpenAI({ 
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1'
          });
          const groqCompletion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });
          return groqCompletion.choices[0].message.content || '';

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

export async function generateAICompletion(
  prompt: string,
  options?: { maxTokens?: number }
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

        case 'mistral':
          if (!process.env.MISTRAL_API_KEY) continue;
          const mistral = new OpenAI({ 
            apiKey: process.env.MISTRAL_API_KEY,
            baseURL: 'https://api.mistral.ai/v1'
          });
          const mistralCompletion = await mistral.chat.completions.create({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });
          return mistralCompletion.choices[0].message.content || '';

        case 'groq':
          if (!process.env.GROQ_API_KEY) continue;
          const groq = new OpenAI({ 
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1'
          });
          const groqCompletion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });
          return groqCompletion.choices[0].message.content || '';

        case 'grok':
          if (!process.env.XAI_GROK_API_KEY) continue;
          const grok = new OpenAI({ 
            apiKey: process.env.XAI_GROK_API_KEY,
            baseURL: 'https://api.x.ai/v1'
          });
          const grokCompletion = await grok.chat.completions.create({
            model: 'grok-beta',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });
          return grokCompletion.choices[0].message.content || '';

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

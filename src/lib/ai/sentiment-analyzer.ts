import { generateAICompletion } from './orchestrator';

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'negative' | 'neutral' | 'positive';
  emotions: string[];
}

export async function analyzeSentiment(title: string, content: string): Promise<SentimentAnalysis> {
  const prompt = `Analyze the sentiment of this Nigerian news article. Provide a score from -1 (very negative) to 1 (very positive).

Title: ${title}
Content: ${content.substring(0, 500)}

Respond in JSON format:
{
  "score": 0.2,
  "label": "neutral",
  "emotions": ["concern", "hope"]
}`;

  const response = await generateAICompletion(prompt);
  
  try {
    const parsed = JSON.parse(response);
    return {
      score: parsed.score || 0,
      label: parsed.label || 'neutral',
      emotions: parsed.emotions || [],
    };
  } catch {
    return {
      score: 0,
      label: 'neutral',
      emotions: [],
    };
  }
}

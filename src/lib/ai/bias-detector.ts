import { generateAICompletion } from './orchestrator';

export type BiasLean = 'left' | 'centre' | 'right' | 'government' | 'independent';

export interface BiasAnalysis {
  bias: BiasLean;
  confidence: number;
  reasoning: string;
}

export async function detectBias(title: string, content: string): Promise<BiasAnalysis> {
  const prompt = `Analyze the political bias of this Nigerian news article. Classify as: left, centre, right, government, or independent.

Title: ${title}
Content: ${content.substring(0, 500)}

Respond in JSON format:
{
  "bias": "centre",
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}`;

  const response = await generateAICompletion(prompt);
  
  try {
    const parsed = JSON.parse(response);
    return {
      bias: parsed.bias || 'centre',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'No reasoning provided',
    };
  } catch {
    return {
      bias: 'centre',
      confidence: 0.5,
      reasoning: 'Failed to parse AI response',
    };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { tools, executeTool } from '@/lib/ai/tools';
import { getPersonalityPrompt } from '@/lib/ai/personalities';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], deepThinking = false, storyId, personality = 'professional', customPersonality } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    let attachedStoryContext = '';
    let attachedStoryData = null;
    if (storyId) {
      const { data: attachedStory } = await supabaseAdmin
        .from('stories_raw')
        .select('id, title, content, url, published_at, category, metadata, sources(name, bias_lean, credibility_score)')
        .eq('id', storyId)
        .single();

      if (attachedStory) {
        attachedStoryData = attachedStory;
        const source = Array.isArray(attachedStory.sources) ? attachedStory.sources[0] : attachedStory.sources;
        attachedStoryContext = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 USER ATTACHED THIS SPECIFIC STORY 🔗
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: ${attachedStory.title}
Source: ${source?.name} (${source?.bias_lean}, Credibility: ${source?.credibility_score}/100)
Category: ${attachedStory.category || 'General'}
Published: ${new Date(attachedStory.published_at).toLocaleString()}
URL: ${attachedStory.url}

FULL ARTICLE CONTENT:
${attachedStory.content || 'No content available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: The user is asking about THIS SPECIFIC STORY above.
You MUST use the content above to answer their question.
DO NOT say you don't have access - the story is RIGHT ABOVE.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      }
    }

    let summaryContext = '';
    try {
      const { data: summaries } = await supabaseAdmin
        .from('story_summaries')
        .select('story_id, summary, key_entities, key_facts')
        .order('generated_at', { ascending: false })
        .limit(500);

      summaryContext = summaries?.map(s => 
        `[${s.story_id}] ${s.summary} | Entities: ${JSON.stringify(s.key_entities)} | Facts: ${s.key_facts?.join('; ')}`
      ).join('\n') || '';
    } catch (e) {
      console.log('Story summaries not available yet');
    }

    let similarStories = [];
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: message,
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;

      const { data } = await supabaseAdmin.rpc('match_stories', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 50,
      });
      similarStories = data || [];
    } catch (embeddingError) {
      console.log('Embeddings unavailable, using keyword search only');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: allStories } = await supabaseAdmin
      .from('stories_raw')
      .select('id, title, content, url, published_at, category, metadata, fingerprint, sources(id, name, bias_lean, credibility_score, type)')
      .gte('published_at', yesterday.toISOString())
      .order('published_at', { ascending: false })
      .limit(200);

    const searchTerms = message.toLowerCase()
      .replace(/[\[\]]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .split(' ')
      .filter((w: string) => w.length > 2);
    
    const keywordMatches = allStories?.filter((s: any) => {
      const searchText = `${s.title} ${s.content}`.toLowerCase();
      return searchTerms.some((term: string) => searchText.includes(term));
    }) || [];

    const storyIds = similarStories.map((s: any) => s.story_id) || [];
    const { data: vectorStories } = await supabaseAdmin
      .from('stories_raw')
      .select('id, title, content, url, published_at, category, metadata, sources(id, name, bias_lean, credibility_score)')
      .in('id', storyIds);

    const combinedStories = [...keywordMatches, ...(vectorStories || [])]
      .filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
      .slice(0, deepThinking ? 100 : 50);

    const matchedIds = combinedStories.map(s => s.id);

    const { data: sentimentData } = await supabaseAdmin
      .from('social_sentiment')
      .select('*')
      .in('story_id', matchedIds);

    const { data: commentsData } = await supabaseAdmin
      .from('comments')
      .select('story_id, content, likes_count, created_at')
      .in('story_id', matchedIds)
      .order('likes_count', { ascending: false })
      .limit(20);

    const { data: reactionsData } = await supabaseAdmin
      .from('story_reactions')
      .select('story_id, reaction_type')
      .in('story_id', matchedIds);

    const { data: aiExplanations } = await supabaseAdmin
      .from('ai_explanations')
      .select('story_id, explanation_type, content')
      .in('story_id', matchedIds);

    const storiesContext = combinedStories.map((s: any) => {
      const sentiment = sentimentData?.find(sd => sd.story_id === s.id);
      const reactions = reactionsData?.filter(r => r.story_id === s.id);
      const storyComments = commentsData?.filter(c => c.story_id === s.id);
      const aiAnalysis = aiExplanations?.find(e => e.story_id === s.id);
      
      const publishedDate = new Date(s.published_at);
      const now = new Date();
      const hoursAgo = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
      const daysAgo = Math.floor(hoursAgo / 24);
      const timeAgo = daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;

      return `
STORY: ${s.title}
SOURCE: ${s.sources?.name} (${s.sources?.bias_lean}, credibility: ${s.sources?.credibility_score}/100)
CATEGORY: ${s.category || 'General'}
PUBLISHED: ${publishedDate.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })} (${timeAgo})
URL: ${s.url}
FULL CONTENT: ${s.content || 'No content'}

${sentiment ? `TWITTER SENTIMENT:
- Positive: ${sentiment.positive_count} | Negative: ${sentiment.negative_count} | Neutral: ${sentiment.neutral_count}
- Total Engagement: ${sentiment.total_count}
- Keywords: ${sentiment.keywords?.join(', ')}
- Sample Tweets: ${(sentiment.sample_tweets || []).slice(0, 5).map((t: any) => `"${t.text}" (${t.sentiment})`).join(' | ')}` : ''}

${reactions?.length ? `USER REACTIONS: ${reactions.map(r => r.reaction_type).join(', ')}` : ''}

${storyComments?.length ? `TOP COMMENTS:\n${storyComments.slice(0, 3).map(c => `- "${c.content}" (${c.likes_count} likes)`).join('\n')}` : ''}

${aiAnalysis ? `AI ANALYSIS: ${aiAnalysis.content}` : ''}
---`;
    }).join('\n\n');

    const conversationHistory = history
      ?.slice(-5)
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n') || '';

    const lastUserMessage = history?.slice(-1)[0];
    const contextHint = lastUserMessage ? `\n\nIMPORTANT CONTEXT: The user's previous question was about: "${lastUserMessage.content}". If the current question uses words like "this", "that", "it", they are referring to the previous topic.` : '';

    let pinnedStoryContext = '';
    if (attachedStoryData && !message.toLowerCase().includes('[story:')) {
      pinnedStoryContext = attachedStoryContext;
    }

    const thinkingSteps = deepThinking ? `
DEEP ANALYSIS MODE - Think through these steps:
1. Parse the user's question - what exactly are they asking?
2. Identify relevant stories from the ${combinedStories.length} stories in database
3. Analyze sentiment data and user reactions
4. Cross-reference multiple sources for accuracy
5. Formulate comprehensive answer with citations
` : `
FAST MODE - Quick analysis:
1. What is being asked?
2. Which stories match?
3. Provide concise answer
`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const personalityPrompt = getPersonalityPrompt(personality, customPersonality?.prompt);
      
      const currentDateTime = new Date();
      const dateTimeContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ CURRENT DATE & TIME AWARENESS ⏰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT DATE: ${currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
CURRENT TIME: ${currentDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
TIMEZONE: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
DAY OF WEEK: ${currentDateTime.toLocaleDateString('en-US', { weekday: 'long' })}

IMPORTANT:
- You are FULLY AWARE of the current date and time
- When users ask "today", "yesterday", "this week", you know exactly what that means
- All story publication dates are provided with "X hours/days ago" for context
- You can calculate time differences and understand recency
- When discussing events, always consider their temporal context

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      
      const systemIdentity = `You are Source AI, the AI News Analyst for Source-News - Nigeria's premier news intelligence platform.

${personalityPrompt}

YOUR CAPABILITIES:
- Access to real-time Nigerian news from 10+ verified sources
- Twitter sentiment analysis and public opinion tracking
- Multi-source fact-checking and bias detection
- Deep contextual understanding of Nigerian affairs
- FULL DATE/TIME AWARENESS - You know the current date and time

ALWAYS STAY IN CHARACTER. Never break character or mention you're an AI.`;

      const prompt = `${systemIdentity}

${dateTimeContext}

You are Source-News AI Assistant with COMPLETE DATABASE ACCESS.

${attachedStoryContext}${conversationHistory ? `\n\nCONVERSATION HISTORY:\n${conversationHistory}${contextHint}\n\n` : ''}

STORY SUMMARIES (500 recent stories for quick scanning):
${summaryContext}

DETAILED DATABASE CONTEXT (${combinedStories.length} stories with FULL content, sentiment, reactions):
${storiesContext}

USER QUESTION: ${message}

${thinkingSteps}

CRITICAL INSTRUCTIONS:
${attachedStoryContext ? `
⚠️ PRIORITY: User attached a story marked with 🔗 above
- Answer their question using THAT SPECIFIC STORY
- The full content is provided above between the ━━━ lines
- DO NOT search other stories - use the attached story
- DO NOT say "not in database" - it IS in the database and shown above

` : ''}- The database context contains ${combinedStories.length} REAL stories from our database
- You MUST search through ALL stories to find matches
- NEVER say "I don't have access", "unable to provide", or "not in the provided excerpts"
- The stories ARE provided - search carefully through all ${combinedStories.length} stories
- If you find a matching story, cite its exact title, source, and details
- CONTEXT AWARENESS: If user says "this", "that", "it" - check conversation history
- AUTO-PIN: When you reference a specific story, it will be auto-pinned
${deepThinking ? '- Provide in-depth analysis with multiple perspectives' : '- Keep response under 200 words'}

REMEMBER: 
1. Search through ALL ${combinedStories.length} stories above before answering
2. Check conversation history for context when user uses pronouns
3. Stay on topic - don't switch to random stories

Answer now:`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const mentionedStory = combinedStories.find((s: any) => 
        responseText.toLowerCase().includes(s.title.toLowerCase().substring(0, 20))
      );

      try {
        await supabaseAdmin.from('ai_interactions').insert({
          query: message,
          response: responseText,
          stories_referenced: mentionedStory ? [mentionedStory.id] : [],
          personality,
        });
      } catch (e) {
        console.log('AI interactions logging not available yet');
      }

      return NextResponse.json({ 
        response: responseText,
        thinking: deepThinking ? thinkingSteps : undefined,
        referencedStory: mentionedStory ? {
          id: mentionedStory.id,
          title: mentionedStory.title,
          image: mentionedStory.metadata?.image || mentionedStory.metadata?.og_image,
          url: mentionedStory.url,
        } : undefined,
      });
    } catch (geminiError) {
      console.error('Gemini error, trying fallbacks:', geminiError);

      const personalityPrompt = getPersonalityPrompt(personality, customPersonality?.prompt);
      const currentDateTime = new Date();
      const dateTimeContext = `Current Date: ${currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${currentDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}. You are fully time-aware.`;
      
      const systemIdentity = `You are Source AI, the AI News Analyst for Source-News.

${personalityPrompt}

${dateTimeContext}

You have access to real-time news database, Twitter sentiment, and multi-source verification.

STAY IN CHARACTER. Never break character.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `${systemIdentity}\n\nYou have full database access to ${combinedStories.length} stories.` },
            { role: 'user', content: `${storiesContext}\n\nUser: ${message}` },
          ],
          max_tokens: deepThinking ? 500 : 250,
        });

        const responseText = completion.choices[0].message.content || '';
        const mentionedStory = combinedStories.find((s: any) => 
          responseText.toLowerCase().includes(s.title.toLowerCase().substring(0, 20))
        );

        return NextResponse.json({ 
          response: responseText,
          referencedStory: mentionedStory ? {
            id: mentionedStory.id,
            title: mentionedStory.title,
            image: mentionedStory.metadata?.image || mentionedStory.metadata?.og_image,
            url: mentionedStory.url,
          } : undefined,
        });
      } catch (openaiError) {
        console.error('OpenAI error, trying Mistral:', openaiError);
        
        if (process.env.MISTRAL_API_KEY) {
          const mistral = new OpenAI({ 
            apiKey: process.env.MISTRAL_API_KEY,
            baseURL: 'https://api.mistral.ai/v1'
          });
          
          const mistralCompletion = await mistral.chat.completions.create({
            model: 'mistral-small-latest',
            messages: [
              { role: 'system', content: `${systemIdentity}\n\nYou have full database access to ${combinedStories.length} stories.` },
              { role: 'user', content: `${storiesContext}\n\nUser: ${message}` },
            ],
            max_tokens: deepThinking ? 500 : 250,
          });

          const responseText = mistralCompletion.choices[0].message.content || '';
          const mentionedStory = combinedStories.find((s: any) => 
            responseText.toLowerCase().includes(s.title.toLowerCase().substring(0, 20))
          );

          return NextResponse.json({ 
            response: responseText,
            referencedStory: mentionedStory ? {
              id: mentionedStory.id,
              title: mentionedStory.title,
              image: mentionedStory.metadata?.image || mentionedStory.metadata?.og_image,
              url: mentionedStory.url,
            } : undefined,
          });
        }
        
        throw openaiError;
      }
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      error: 'Failed to process message',
      details: error?.message || 'Unknown error',
      response: 'I apologize, but I encountered an error processing your request. Please try again.'
    }, { status: 500 });
  }
}

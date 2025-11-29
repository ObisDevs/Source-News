import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase/admin';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function generateStorySummary(storyId: string) {
  console.log('\x1b[36m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\x1b[1m\x1b[33m[SUMMARY GENERATOR]\x1b[0m Starting summary generation');
  console.log('\x1b[90m└─ Story ID:\x1b[0m', storyId);
  
  const { data: story } = await supabaseAdmin
    .from('stories_raw')
    .select('title, content, source')
    .eq('id', storyId)
    .single();

  if (!story) {
    console.log('\x1b[31m✗ Story not found\x1b[0m');
    return null;
  }

  console.log('\x1b[32m✓\x1b[0m Story fetched:', story.title.substring(0, 60) + '...');
  console.log('\x1b[90m└─ Content length:\x1b[0m', story.content?.length || 0, 'chars');

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Analyze this Nigerian news story and extract:
1. A 2-sentence summary
2. Key entities (people, organizations, locations)
3. 3-5 key facts

Story: ${story.title}
${story.content}

Return JSON:
{
  "summary": "...",
  "key_entities": {"people": [], "organizations": [], "locations": []},
  "key_facts": []
}`;

  console.log('\x1b[33m⚡\x1b[0m Calling Gemini API...');
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log('\x1b[32m✓\x1b[0m AI response received');
  
  const json = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
  console.log('\x1b[32m✓\x1b[0m JSON parsed successfully');
  console.log('\x1b[90m└─ Summary:\x1b[0m', json.summary.substring(0, 80) + '...');
  console.log('\x1b[90m└─ Entities:\x1b[0m', Object.keys(json.key_entities).length, 'types');
  console.log('\x1b[90m└─ Facts:\x1b[0m', json.key_facts.length, 'items');

  console.log('\x1b[33m💾\x1b[0m Saving to database...');
  await supabaseAdmin.from('story_summaries').upsert({
    story_id: storyId,
    summary: json.summary,
    key_entities: json.key_entities,
    key_facts: json.key_facts,
  });
  console.log('\x1b[32m✓ Summary saved successfully\x1b[0m');
  console.log('\x1b[36m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return json;
}

export async function generateBatchSummaries(limit = 10) {
  console.log('\x1b[1m\x1b[35m[BATCH SUMMARY]\x1b[0m Starting batch generation');
  console.log('\x1b[90m└─ Limit:\x1b[0m', limit, 'stories\n');
  
  const { data: stories } = await supabaseAdmin
    .from('stories_raw')
    .select('id')
    .not('id', 'in', supabaseAdmin.from('story_summaries').select('story_id'))
    .order('published_at', { ascending: false })
    .limit(limit);

  if (!stories) {
    console.log('\x1b[31m✗ No stories found\x1b[0m\n');
    return;
  }

  console.log('\x1b[32m✓\x1b[0m Found', stories.length, 'stories to process\n');

  for (let i = 0; i < stories.length; i++) {
    console.log('\x1b[1m\x1b[36m[' + (i + 1) + '/' + stories.length + ']\x1b[0m Processing story...');
    await generateStorySummary(stories[i].id);
    if (i < stories.length - 1) {
      console.log('\x1b[90m⏳ Rate limiting (1s)...\x1b[0m\n');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log('\x1b[1m\x1b[32m✓ BATCH COMPLETE\x1b[0m Processed', stories.length, 'stories\n');
}

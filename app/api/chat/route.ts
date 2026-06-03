import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are AstroBot, an expert astronomical guide for the AstroLens website. 
You provide accurate, scientific, and fascinating information about stars, planets, and the universe.
Keep your answers concise, engaging, and easy to understand. Do not use overly complex jargon unless explained.
Format your responses with markdown for readability (bullet points, bold text).`,
      messages,
    });
    
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Groq API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to communicate with AI provider' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: `You are AstroBot, an expert astronomical guide for the Astroneo website. 
You provide accurate, scientific, and fascinating information about stars, planets, and the universe.
Keep your answers concise, engaging, and easy to understand. Do not use overly complex jargon unless explained. Format your responses with markdown for readability (bullet points, bold text).`,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to communicate with AI provider' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

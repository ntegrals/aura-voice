import { BadRequest, InternalServerError } from '@/utils/server/response';
import { ElevenLabsClient } from 'elevenlabs';
import { TextToSpeechRequest } from 'elevenlabs/api';
import { NextRequest, NextResponse } from 'next/server';

const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { text } = (await req.json()) as TextToSpeechRequest;

  if (!text) {
    return BadRequest('text cannot be empty');
  }

  try {
    const audio = await textToSpeech(text);
    const response = new NextResponse(audio as any, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="audio.mp3"',
      },
    });
    return response;
  } catch (error) {
    console.error('ElevenLabs text to speech error: ', error);
    return InternalServerError();
  }
}

const textToSpeech = async (text: string) => {
  const readable = await elevenLabsClient.textToSpeech.convert(
    process.env.ELEVENLABS_VOICE_ID as string,
    {
      output_format: 'mp3_44100_128',
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    },
  );
  return readable;
};

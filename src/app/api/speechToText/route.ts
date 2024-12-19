import { SpeechToTextResponse } from '@/apiTypes/speechToText/speechToTextResponse';
import { BadRequest, InternalServerError, Ok } from '@/utils/server/response';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const audioWebm = formData.get('audio') as File | null;

  if (!audioWebm) {
    return BadRequest('audio is required in form data');
  }

  const audioFile = new File([audioWebm], 'audio.webm', {
    type: audioWebm.type,
  });

  try {
    const { text } = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });
    return Ok<SpeechToTextResponse>({
      text,
    });
  } catch (error) {
    console.error('OpenAI create audio transcription error: ', error);
    return InternalServerError();
  }
}

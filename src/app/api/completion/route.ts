import { CreateCompletionRequest } from '@/apiTypes/completion/createCompletionRequest';
import { CreateCompletionResponse } from '@/apiTypes/completion/createCompletionResponse';
import { BadRequest, InternalServerError, Ok } from '@/utils/server/response';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { message } = (await req.json()) as CreateCompletionRequest;

  if (!message) {
    return BadRequest('message cannot be empty');
  }

  try {
    const completion = await createCompletion(message);
    return Ok<CreateCompletionResponse>({
      completion,
    });
  } catch (error) {
    console.error('OpenAI create completion error: ', error);
    return InternalServerError();
  }
}

const createCompletion = async (message: string): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    stream: false,
    messages: [
      {
        role: 'user',
        content: `${message}. Reply in the same language as the input. Keep it concise and friendly, like you're chatting with a friend.`,
      },
    ],
  });

  return response.choices[0].message.content ?? '';
};

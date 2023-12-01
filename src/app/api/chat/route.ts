// ./app/api/chat/route.js
import OpenAI from "openai";
// import { OpenAIStream, StreamingTextResponse} from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
});

export const runtime = "edge";

import { NextResponse } from "next/server";

export async function POST(req: any) {
  const { messages } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: false,
    messages,
  });

  return NextResponse.json(response.choices[0].message.content);
}

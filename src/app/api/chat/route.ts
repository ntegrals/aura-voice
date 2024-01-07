import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: false,
    messages,
  });

  return NextResponse.json(response.choices[0].message.content);
}

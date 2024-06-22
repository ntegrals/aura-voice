"use server";

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  StreamableValue,
  createStreamableValue,
  readStreamableValue,
} from "ai/rsc";
import WebSocket from "ws";

export async function* generate(
  input: string
): AsyncGenerator<string, void, unknown> {
  // create a async process that will push the values from textStream to stream
  const { textStream } = await streamText({
    model: openai("gpt-3.5-turbo"),
    prompt: input,
  });

  for await (const delta of textStream) {
    yield delta;
  }
}

// async function* textChunker(chunks: AsyncIterable<string>) {
async function* textChunker(input: string) {
  const splitters = [
    ".",
    ",",
    "?",
    "!",
    ";",
    ":",
    "—",
    "-",
    "(",
    ")",
    "[",
    "]",
    "}",
  ];
  let buffer = "";

  for await (const text of generate(input)) {
    const isEndOfSentence = splitters.includes(buffer.slice(-1));
    const ifChunkStartsWithNewSentence = splitters.includes(text[0]);

    if (isEndOfSentence) {
      // console.log(`isEndOfSentence:${isEndOfSentence}, buffer:${buffer}`);
      console.log(`yeilding eos:${buffer}`);
      yield buffer + " ";
      // reset buffer
      buffer = text;
    } else if (ifChunkStartsWithNewSentence) {
      console.log(`yeilding:${buffer}${text[0] + " "}`);
      yield buffer + text[0] + " ";
      buffer = text.slice(1);
    } else {
      buffer += text;
    }
  }

  if (buffer) {
    yield buffer + " ";
  }
}

let socket: WebSocket;

export async function textToSpeechInputStreaming(
  voiceId: string,
  input: string
) {
  try {
    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_turbo_v2&output_format=pcm_44100`;
    const streamableAudio = createStreamableValue("");
    if (!socket) {
      console.log(url);
      socket = new WebSocket(url);
      console.log("---key---");
      console.log(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY);
      console.log("---key---");
      socket.on("open", () => {
        console.log("---open event socket");
        socket.send(
          JSON.stringify({
            text: " ",
            voice_settings: { stability: 0.5, similarity_boost: 0.8 },
            "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "",
          })
        );
        console.log("connecting...");

        (async () => {
          for await (const chunk of textChunker(input)) {
            // console.log(`chunk: ${chunk}`);
            socket.send(
              JSON.stringify({
                text: chunk,
                try_trigger_generation: true,
              })
            );
            // for (const chunk of textChunker(text, 1000)) {
            // console.log(`chunk: ${chunk}`);
            // socket.send(
            //   JSON.stringify({
            //     text: chunk,
            //     try_trigger_generation: true,
            //   })
            // );
            // }
          }
          socket.send(JSON.stringify({ text: "" }));
        })();
      });

      socket.on("message", (chunk) => {
        console.log("---got message");
        const data = JSON.parse(chunk.toString());
        if (data.audio) {
          streamableAudio.update(
            JSON.stringify({
              audio: data.audio,
            })
          );
        }
      });
      socket.on("error", (e) => {
        console.log(e);
      });
      socket.on("close", () => {
        console.log("---closing socket");
        streamableAudio.done();
      });
    }
    return { tts: streamableAudio.value };
  } catch (e) {
    console.log(e);
    return { tts: null };
  }
}

"use server";

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
		StreamableValue,
		createStreamableValue,
		readStreamableValue,
} from "ai/rsc";
import WebSocket from "ws";

async function* generate(input: string): AsyncGenerator<string, void, unknown> {
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

export async function textToSpeechInputStreaming(
		voiceId: string,
		input: string,
): Promise<{ tts: StreamableValue<string> }>{
		try {
				const url = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_turbo_v2`;
				const streamableAudio = createStreamableValue("");
				console.log(url);
				const socket: WebSocket = new WebSocket(url);
				socket.onopen = async function (_event: WebSocket.Event): Promise<void> {
						console.log("open event socket");
						const bosMessage = {
								text: " ",
								voice_settings: {
										stability: 0.5,
										similarity_boost: 0.5,
								},
								xi_api_key: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "",
						};
						socket.send(JSON.stringify(bosMessage));
						for await (const chunk of textChunker(input)) {
								socket.send(
										JSON.stringify({
												text: chunk,
												try_trigger_generation: true,
										}),
								);
						}
						// okay... so it seems that we may be closing the socket, before we are finished receiving all the bytes
						const eosMessage = { text: "" };
						socket.send(JSON.stringify(eosMessage));
				};
				socket.onmessage = async function (
						event: WebSocket.MessageEvent,
				): Promise<void> {
						console.log("---got message");
						const data = JSON.parse(event.data.toString());
						console.log(data)
						if (data.audio) {
								streamableAudio.update(
										JSON.stringify({
												audio: data.audio,
										})
								);
						}
				};

				socket.onerror = async function (error): Promise<void> {
						console.error(`Websocket Error: ${error}`);
						streamableAudio.done();
				};
				socket.onclose = async function (
						event: WebSocket.CloseEvent,
				): Promise<void> {
						if (event.wasClean) {
								console.info(`Connection closed cleanly, code=${event.code}`);
								streamableAudio.done();
						} else {
								console.warn("Connection died");
								streamableAudio.done();
						}
				};
				return { tts: streamableAudio.value };
		} catch (e) {
				console.log(e);
				return { tts: null };
		}
}

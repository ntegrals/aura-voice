"use server";

import {CoreSystemMessage, CoreUserMessage, streamText} from "ai";
import { openai } from "@ai-sdk/openai";
import {
		StreamableValue,
		createStreamableValue,
		readStreamableValue,
} from "ai/rsc";
import WebSocket from "ws";

type CharTiming = {
  chars: string[];
  charStartTimesMs: number[];
  charDurationsMs: number[];
};

type ElevenLabsResponse = {
  audio: string;
  isFinal: null | boolean;
  normalizedAlignment: CharTiming;
  alignment: CharTiming;
};

const messages: (CoreUserMessage|CoreSystemMessage)[] =[]
let socket: WebSocket | null = null;
let conversationEnded = false;

async function* generateMock(_input:string){
		let text = "";
		const upTo = 10
		for (let i = 1; i <= upTo; i++) {
			text += `${i} mississippi${i < upTo ? ", " : ""}`;
		}

		const chunks = text.split(' ')
		for (const chunk of chunks) {
				yield chunk + ' ';
		}
}



async function* generate(input: string): AsyncGenerator<string, void, unknown> {
		// create a async process that will push the values from textStream to stream
		const userMessage: CoreUserMessage = {
				role: "user",
				content: input,
		};
		messages.push(userMessage)
		const { textStream } = await streamText({
				model: openai("gpt-3.5-turbo"),
				// prompt: input + "Your answer has to sound human-like, easy to understand and not too technical.",
				messages: messages
		});
		let completeResponse = "";
		for await (const delta of textStream) {
				completeResponse += delta;
				yield delta;
		}
		const systemMessage: CoreSystemMessage = {
				role: "system",
				content: completeResponse,
		};
		messages.push(systemMessage)
		console.log(completeResponse);
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
		// for await (const text of generateMock(input)) {
				console.log(`text:${text}`);
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
		userPrompt: string,
): Promise<{ tts: StreamableValue<string> }>{
		try {
				conversationEnded = false;
				const url = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_turbo_v2`;
				const streamableAudio = createStreamableValue("");
				console.log(url);
				console.log('userPrompt',userPrompt)
				if(!socket || socket.readyState === WebSocket.CLOSED){
						socket = new WebSocket(url);
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
								if(socket && socket.readyState === WebSocket.OPEN){
										socket.send(JSON.stringify(bosMessage));
										// okay... so it seems that we may be closing the socket, before we are finished receiving all the bytes
										// const eosMessage = { text: "" };
										// socket.send(JSON.stringify(eosMessage));
								}
						};
				}
				socket.onmessage = async function (
						event: WebSocket.MessageEvent,
				): Promise<void> {
						console.log("---got message");
						const data = JSON.parse(event.data.toString()) as ElevenLabsResponse;
						// console.log(data)
						if (data.audio) {
								const debugData = {...data, audio:''};
								console.log(debugData)
								streamableAudio.update(
										JSON.stringify({
												audio: data.audio,
												chars: data.alignment?.chars
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

				for await (const chunk of textChunker(userPrompt)) {
						socket.send(
								JSON.stringify({
										text: chunk,
										try_trigger_generation: true,
								}),
						);
				}
				return { tts: streamableAudio.value };
		} catch (e) {
				console.log(e);
				console.log('some error occurred in textToSpeechInputStreaming')
				return { tts: null };
		}
}

export async function endConversation(){
		if(socket && socket.readyState === WebSocket.OPEN){
				const eosMessage = { text: "" };
				// socket.send(JSON.stringify(eosMessage));
				// conversationEnded = true;
				// console.log('connection closed cleanly')
		}
}

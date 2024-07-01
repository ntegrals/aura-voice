"use client";
import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { generate, textToSpeechInputStreaming } from "@/app/actions";
import { readStreamableValue } from "ai/rsc";
import queueMicrotask from "queue-microtask";

interface VoiceSettings {
		stability: number;
		similarity_boost: number;
}

interface TextToSpeechData {
		text: string;
		model_id: string;
		voice_settings: VoiceSettings;
}

const AssistantButton: React.FC = () => {
		const [mediaRecorderInitialized, setMediaRecorderInitialized] =
				useState<boolean>(false);
		const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
		const inputRef = useRef<HTMLInputElement | null>(null);
		const [inputValue, setInputValue] = useState<string>("");
		const [recording, setRecording] = useState<boolean>(false);
		const [thinking, setThinking] = useState<boolean>(false);
		const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
				null,
		);
		const sourceQueue = useRef<AudioBufferSourceNode[]>([]);
		const base64Queue = useRef<string[]>([]);
		const nextPlayTime = useRef<number>(0);
		const audioContext = useRef<AudioContext | null>();

		let chunks: BlobPart[] = [];

		const [generation, setGeneration] = useState<string>("");
		useEffect(() => {
				if (mediaRecorder && mediaRecorderInitialized) {
						// Additional setup if needed
				}

				audioContext.current = new (window.AudioContext ||
						(window as any).webkitAudioContext)();
		}, [mediaRecorder, mediaRecorderInitialized]);

		const processQueue = async () => {
				while (true) {
						if (base64Queue.current.length > 0) {
								console.log("---decoding data--");
								decode();
						}
						await new Promise((resolve) => setTimeout(resolve, 0));
				}
		};
		processQueue();
		const playAudio = async (input: string): Promise<void> => {
				console.time("Text-to-Speech");
				// when handling streaming data, data is often processed in chunks.
				// chunk is a piece of the data that's processed as a unit.
				// 1024 bytes at a time
				const CHUNK_SIZE = 1024;
				const url =
						"https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream";
				const headers: Record<string, string> = {
						Accept: "audio/mpeg",
						"Content-Type": "application/json",
						"xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "",
				};
				const data: TextToSpeechData = {
						text: input,
						model_id: "eleven_multilingual_v2",
						voice_settings: {
								stability: 0.5,
								similarity_boost: 0.5,
						},
				};

				try {
						const response = await fetch(url, {
								method: "POST",
								headers,
								body: JSON.stringify(data),
						});
						if (!response.ok) {
								throw new Error("Network response was not ok.");
						}

						const audioContext = new (window.AudioContext ||
								(window as any).webkitAudioContext)();
						const source = audioContext.createBufferSource();

						// array buffer contains binary audio data
						const audioBuffer = await response.arrayBuffer();
						const audioBufferDuration = audioBuffer.byteLength / CHUNK_SIZE;

						//once the audio data is decoded, the decoded audio data is passed
						// to this function as an AudioBuffer
						audioContext.decodeAudioData(audioBuffer, (buffer) => {
								source.buffer = buffer;
								// this is connecting the BuffferSourceNode to the destination of the AudioContext
								source.connect(audioContext.destination);
								// this start playing the audio
								source.start();
								console.timeEnd("Text-to-Speech");
						});

						// start  a timmer that will execute a function after a specified delay
						// audioBufferDuration * 1000 milliseconds or (audioBufferDuration seconds)
						setTimeout(() => {
								source.stop();
								audioContext.close();
								setAudioPlaying(false);
						}, audioBufferDuration * 1000);
				} catch (error) {
						console.error("Error:", error);
						setAudioPlaying(false);
				}
		};

		const handlePlayButtonClick = (input: string): void => {
				setAudioPlaying(true);
				playAudio(input);
		};

		const startRecording = (): void => {
				if (mediaRecorder && mediaRecorderInitialized) {
						mediaRecorder.start();
						setRecording(true);
				}
		};

		const stopRecording = (): void => {
				setThinking(true);
				toast("Thinking", {
						duration: 5000,
						icon: "💭",
						style: {
								borderRadius: "10px",
								background: "#1E1E1E",
								color: "#F9F9F9",
								border: "0.5px solid #3B3C3F",
								fontSize: "14px",
						},
						position: "top-right",
				});
				if (mediaRecorder) {
						mediaRecorder.stop();
						setRecording(false);
				}
		};

		const base64ToArrayBuffer = (
				base64: string,
		): { arrayBuffer: ArrayBuffer; length: number } => {
				const binaryData = atob(base64);
				const arrayBuffer = new ArrayBuffer(binaryData.length);
				const uint8Array = new Uint8Array(arrayBuffer);

				for (let i = 0; i < binaryData.length; i++) {
						uint8Array[i] = binaryData.charCodeAt(i);
				}

				return { arrayBuffer, length: uint8Array.length };
		};

		const createAudioBuffer = (
				arrayBuffer: ArrayBuffer,
				length: number,
				audioContext: AudioContext,
		): AudioBuffer => {
				const data = new DataView(arrayBuffer);

				//channel=1,number_of_frames=length/2,sample_rate=44100
				//length gives you total number of bytes
				//each frame is 2 bytes
				const audioBuffer = audioContext.createBuffer(1, length / 2, 44100);
				const channelData = audioBuffer.getChannelData(0);

				// run a pointer algorithm to fetch the frames
				// what is little-endain??
				for (let i = 0; i < data.byteLength; i += 2) {
						// 1 sample point  = 2 bytes
						const sample = data.getInt16(i, true);
						// normalize the 16-bit signed integer, which
						//channelData length is half the size of data...so the pointer needs to be halfed
						channelData[i / 2] = sample / 32768;
				}

				return audioBuffer;
		};

		const decode = () => {
				if (!audioContext.current) {
						throw new Error("Audio Context is null");
				}
				const base64 = base64Queue.current.shift();

				if (!base64) return;

				const { arrayBuffer, length } = base64ToArrayBuffer(base64);
				const audioBuffer = createAudioBuffer(
						arrayBuffer,
						length,
						audioContext.current,
				);

				const source = audioContext.current.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(audioContext.current.destination);
				sourceQueue.current.push(source);

				if (nextPlayTime.current < audioContext.current.currentTime) {
						nextPlayTime.current = audioContext.current.currentTime;
				}

				schedulePlaySource(source);

				nextPlayTime.current += audioBuffer.duration;

				decode();
		};

		const playChunk = (chunkBase64:string): void => {
				//convert base64 to array buffer
				const binaryData = atob(chunkBase64);
				let len = binaryData.length;
				let bytes = new Uint8Array(len);
				for (let i = 0; i < len; i++) {
						bytes[i] = binaryData.charCodeAt(i);
				}

				//create an instance of Audio context
				const audioContext = new (window.AudioContext ||
						(window as any).webkitAudioContext)();
				audioContext.decodeAudioData(bytes.buffer, (decodedData) => {
						//create a new buffer source for each chunk
						let source = audioContext.createBufferSource();
						source.buffer = decodedData;
						source.connect(audioContext.destination);

						//if nextPlayTime is in the past, set it to the current time
						if(nextPlayTime.current < audioContext.currentTime){
								nextPlayTime.current = audioContext.currentTime
						}

						//Start palaying the chunk at the nextPlayTime
						source.start(nextPlayTime.current);

						// Schedule the next chunk to playing when this chunk finishes
						nextPlayTime.current += source.buffer.duration
				});
		}

		const schedulePlaySource = (source: AudioBufferSourceNode) => {
				source.start(nextPlayTime.current);
				source.addEventListener("ended", () => sourceEnded());
		};

		const sourceEnded = () => {
				sourceQueue.current.shift();
				if (!sourceQueue.current.length) console.log("Audio finished playing");
		};

		return (
				<div>
						<div>
								<button
										onClick={async () => {
												const { tts } = await textToSpeechInputStreaming(
														"21m00Tcm4TlvDq8ikWAM",
														"Why is the sky blue?",
												);
												if (tts == null) {
														console.log("output is null");
												}
												else {
														for await (const chunk of readStreamableValue(tts)) {
																if (!chunk) {
																		console.error('Chunk is undefined or null');
																		continue;
																}

																let chunkObject;
																try {
																		chunkObject = JSON.parse(chunk);
																} catch (error) {
																		console.error('Error parsing JSON', error);
																}

																if (chunkObject) {
																		// Now you can access properties of the chunkObject
																		if (chunkObject.audio) {
																				playChunk(chunkObject.audio);
																		}
																}
														}
												}
										}}
								>
										Ask
								</button>

								<div>{generation}</div>
						</div>
				</div>
		);
};

export default AssistantButton;

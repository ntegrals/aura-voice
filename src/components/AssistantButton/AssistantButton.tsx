"use client";
import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {textToSpeechInputStreaming} from "@/app/actions";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { readStreamableValue } from "ai/rsc";
import {speechToText} from "@/lib/utils/speech-to-text";
import {resolve} from "dns";

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
		const nextPlayTime = useRef<number>(0);
		const audioContext = useRef<AudioContext | null>();

		const [generation, setGeneration] = useState<string>("");
		useEffect(() => {
				audioContext.current = new (window.AudioContext ||
						(window as any).webkitAudioContext)();

		}, []);

		const {isRecording,startRecording,stopRecording,audioChunks,isMediaRecorderInitialized}= useAudioRecorder()

		const decodeAudioDataAsync = (audioContext: AudioContext, audioData: ArrayBuffer): Promise<AudioBuffer> => {
		  return new Promise((resolve, reject) => {
			audioContext.decodeAudioData(audioData, resolve, reject);
		  });
		};

		// play audio chunks sequentially
		const playChunkSequentially = async (chunkBase64:string): Promise<void>=> {
				if (!audioContext.current) {
						console.error("AudioContext is not initialized");
						return;
				}

				//convert base64 to array buffer
				const binaryData = atob(chunkBase64);
				let len = binaryData.length;
				let bytes = new Uint8Array(len);
				for (let i = 0; i < len; i++) {
						bytes[i] = binaryData.charCodeAt(i);
				}

				// The playChunkSequentially function waits for audioContext.current.decodeAudioData to finish decoding the audio data
				// The callback function provided to decodeAudioData sets up the audio source and returns a promise that resolves when source.onended is triggered.
				// This ensures that playChunkSequentially waits for the current chunk to finish playing before proceeding.
				try{
						const decodedData = await decodeAudioDataAsync(audioContext.current, bytes.buffer);
						//create a new buffer source for each chunk
						let source = audioContext.current!.createBufferSource();
						source.buffer = decodedData;
						source.connect(audioContext.current!.destination);

						//if nextPlayTime is in the past, set it to the current time
						if(nextPlayTime.current < audioContext.current!.currentTime){
								nextPlayTime.current = audioContext.current!.currentTime
						}

						//Start playing the chunk at the nextPlayTime
						source.start(nextPlayTime.current);

						// Schedule the next chunk to playing when this chunk finishes
						nextPlayTime.current += source.buffer.duration

						return new Promise((resolve)=>{
								source.onended = () => resolve();
						})
				}catch(error){
						console.error("Error decoding audio data", error)
				}

		}

		  const textToSpeechHandler = async (userPrompt:string) => {
					console.log('calling textToSpeechHandler')
					const { tts } = await textToSpeechInputStreaming(
					  "21m00Tcm4TlvDq8ikWAM",
					  userPrompt
					);
				  console.log('called textToSpeechHandler')
					if (tts == null) {
					  console.log("output is null");
					} else {
					  for await (const chunk of readStreamableValue(tts)) {
						if (!chunk) {
						  console.error("Chunk is undefined or null");
						  continue;
						}

						let chunkObject;
						try {
						  chunkObject = JSON.parse(chunk);
						} catch (error) {
						  console.error("Error parsing JSON", error);
						}

						if (chunkObject && chunkObject.audio) {
						  await playChunkSequentially(chunkObject.audio);
						}
					  }
					}
				  };


		const handleRecordingComplete = async (audioChunks:BlobPart[]): Promise<void> => {
				console.log('handelRecordingComplete')
				console.log('audioChunks:',audioChunks.length)
				// combine multiple blob parts into a single blob
				const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

				// test that blob is playable by creating a URL and playing with an audio element
				const audioUrl = URL.createObjectURL(audioBlob);
				const audio = new Audio(audioUrl);
				audio.onerror = (error) => {
						console.error('audio error:',error)
				}

				// pass the blob to the server for speech-to-text conversion
				const text = await speechToText(audioBlob)
				console.log('text:',text)
				await textToSpeechHandler(text)
		}



		const onClickHandler = async () => {
				if(!isMediaRecorderInitialized){
						console.log('media recorder not initialized')
						return
				}

				if(isRecording){
						console.log('stop recording',isRecording)
						const audioChunks = await  stopRecording();
						await handleRecordingComplete(audioChunks)
				}else {
						startRecording();
				}
		}

		const dummy = async () => {console.log('dummy handler pressed')}
		return (
				<div>
						<div>
								<button
										onClick={onClickHandler}
								>
										Ask
								</button>

								<div>{generation}</div>
						</div>
				</div>
		);
};

export default AssistantButton;

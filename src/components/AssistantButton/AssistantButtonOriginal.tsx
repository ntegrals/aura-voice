"use client";
import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {useAudioRecorder} from "@/lib/hooks/useAudioRecorder";
import {speechToText,blobToBase64} from "@/lib/utils/speech-to-text";
import {useTextToSpeech} from "@/lib/hooks/useTextToSpeech";

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
  const { startRecording, stopRecording, isRecording, audioChunks,mediaRecorderInitialized} = useAudioRecorder();
  const {speak, isLoading,error} = useTextToSpeech();
  const [thinking, setThinking] = useState(false);

  const playAudio = async (input: string): Promise<void> => {
    const CHUNK_SIZE = 1024;

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID}/stream`;
    const headers = {

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

      const audioBuffer = await response.arrayBuffer();
      const audioBufferDuration = audioBuffer.byteLength / CHUNK_SIZE;

      audioContext.decodeAudioData(audioBuffer, (buffer) => {
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      });

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

  const handleRecordingComplete = async (): Promise<void> => {
     if (audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      try {
        // Speech to text
        const text = await processAudioAndConvertToText(audioBlob);

        // Get Response
        // Use the converted text as needed, for example, sending it to another API
        const completion = await axios.post("/api/chat", {
          messages: [
            {
              role: "user",
              content: `${text} Your answer has to be concise as possible.`,
            },
          ],
        });

        //Text to speech (evleven labs)
        // Handle the response from the chat API
      } catch (error) {
        console.error("Error processing audio for speech to text:", error);
      }
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      handleRecordingComplete();
    } else {
      startRecording();
    }
  };

  return (
    <div>
      <motion.div
        onClick={() => {

          // If assistant is thinking, don't do anything
          if (thinking) {
            toast("Please wait for the assistant to finish.", {
              duration: 5000,
              icon: "🙌",
              style: {
                borderRadius: "10px",
                background: "#1E1E1E",
                color: "#F9F9F9",
                border: "0.5px solid #3B3C3F",
                fontSize: "14px",
              },
              position: "top-right",
            });
            //Timer to reset thinking state
            setTimeout(() => {
              setThinking(false);
            }, 1500);
            return;
          }

          if (!mediaRecorderInitialized) {
            toast(
              "Please grant access to your microphone. Click the button again to speak.",
              {
                duration: 5000,
                icon: "🙌",
                style: {
                  borderRadius: "10px",
                  background: "#1E1E1E",
                  color: "#F9F9F9",
                  border: "0.5px solid #3B3C3F",
                  fontSize: "14px",
                },
                position: "top-right",
              }
            );
            return;
          }

          isRecording
            ? null
            : toast("Listening - Click again to send", {
                icon: "🟢",
                style: {
                  borderRadius: "10px",
                  background: "#1E1E1E",
                  color: "#F9F9F9",
                  border: "0.5px solid #3B3C3F",
                  fontSize: "14px",
                },
                position: "top-right",
              });

          isRecording ? stopRecording() : startRecording();
        }}
        className="hover:scale-105 ease-in-out duration-500 hover:cursor-pointer text-[70px]"
      >
        <div className="rainbow-container">
          <div className="green"></div>
          <div className="pink"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default AssistantButton;

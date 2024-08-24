"use client";
import React, { useState, useEffect, useRef } from "react";
import { textToSpeechInputStreaming } from "@/app/actions";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { readStreamableValue } from "ai/rsc";
import { speechToText } from "@/lib/utils/speech-to-text";
import toast from "react-hot-toast";

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
  const audioContext = useRef<AudioContext | null>(null);
  const [generation, setGeneration] = useState<string>("");
  const [thinking, setThinking] = useState<boolean>(false); // New state for tracking processing status

  useEffect(() => {
    audioContext.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }, []);

  const {
    isRecording,
    startRecording,
    stopRecording,
    isMediaRecorderInitialized,
  } = useAudioRecorder();

  const decodeAudioDataAsync = (
    audioContext: AudioContext,
    audioData: ArrayBuffer
  ): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
      audioContext.decodeAudioData(audioData, resolve, reject);
    });
  };

  const playChunkSequentially = async (chunkBase64: string): Promise<void> => {
    if (!audioContext.current) {
      console.error("AudioContext is not initialized");
      return;
    }

    const binaryData = atob(chunkBase64);
    let len = binaryData.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    try {
      const decodedData = await decodeAudioDataAsync(
        audioContext.current,
        bytes.buffer
      );
      let source = audioContext.current!.createBufferSource();
      source.buffer = decodedData;
      source.connect(audioContext.current!.destination);

      if (nextPlayTime.current < audioContext.current!.currentTime) {
        nextPlayTime.current = audioContext.current!.currentTime;
      }

      source.start(nextPlayTime.current);
      nextPlayTime.current += source.buffer.duration;

      return new Promise((resolve) => {
        source.onended = () => resolve();
      });
    } catch (error) {
      console.error("Error decoding audio data", error);
    }
  };

  const textToSpeechHandler = async (userPrompt: string) => {
    const { tts } = await textToSpeechInputStreaming(
      "21m00Tcm4TlvDq8ikWAM",
      userPrompt
    );
    if (tts == null) {
      console.log("output is null");
    } else {
      for await (const chunk of readStreamableValue(tts)) {
        if (!chunk) {
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

  const handleRecordingComplete = async (
    audioChunks: BlobPart[]
  ): Promise<void> => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.onerror = (error) => {
      console.error("audio error:", error);
    };

    const text = await speechToText(audioBlob);
    await textToSpeechHandler(text);
  };

  const onClickHandler = async () => {
    if (!isMediaRecorderInitialized) {
      toast.error("Media recorder not initialized");
      return;
    }

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
      return;
    }


    if (isRecording) {
      toast("Thinking...", {
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
      setThinking(true);
      const audioChunks = await stopRecording();
      await handleRecordingComplete(audioChunks);
    } else {
      toast("Listening...", {
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
      startRecording();
    }

    setThinking(false);
  };

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

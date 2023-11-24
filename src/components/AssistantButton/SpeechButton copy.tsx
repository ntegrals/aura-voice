"use client";
import React, { useState, useRef } from "react";
import axios from "axios";

export default function SpeechButton() {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = React.useState("");

  const playAudio = async (input: string) => {
    const CHUNK_SIZE = 1024;
    const url =
      "https://api.elevenlabs.io/v1/text-to-speech/nWM88eUzTWbyiJW1K8NX/stream";
    // 'https://api.elevenlabs.io/v1/text-to-speech/a2uc8mOUbUDoGMdeJwH0/stream';
    const headers = {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": "02e5b3d20986160c37d6d48e9960ffe4",
    };
    const data = {
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
        // @ts-ignore
        window.webkitAudioContext)();
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
        setAudioPlaying(false); // Reset audioPlaying state after audio ends
      }, audioBufferDuration * 1000);
    } catch (error) {
      console.error("Error:", error);
      setAudioPlaying(false); // Reset audioPlaying state on error
    }
  };

  const handlePlayButtonClick = (input: string) => {
    setAudioPlaying(true);
    playAudio(input);
  };

  return (
    <div>
      {/* <input
        // ref={inputRef}
        placeholder=""
        className="pt-8 bg-red text-xl focus:outline-none"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            // const audioInput = inputValue;
            // handleTextSubmit();
            // setInputValue("");

            // if (!isMuted) {
            handlePlayButtonClick("Hey, I'm Siri. How can I help you?");
            // }
          }
        }}
      /> */}
      <div
        onClick={async () => {
          const completion = await axios.post("/api/chat", {
            messages: [
              {
                role: "user",
                content:
                  "What is the meaning of life? Your answer has to be as consise as possible.",
              },
            ],
          });

          console.log(completion);

          handlePlayButtonClick(completion.data);
        }}
        // onClick={(e) => {
        // if (e.key === "Enter") {
        // const audioInput = inputValue;
        // handleTextSubmit();
        // setInputValue("");

        // if (!isMuted) {
        //   handlePlayButtonClick("Hi, I'm Siri. How can I help you?");
        // }
        // }
        // }}
        className="hover:scale-105 ease-in-out duration-500 hover:cursor-pointer text-[70px]"
      >
        <div className="rainbow-container">
          <div className="green"></div>
          <div className="pink"></div>
        </div>
      </div>
    </div>
  );
}

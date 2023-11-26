"use client";

// Import necessary libraries
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

// This is the main component of our application
export default function AssistantButton() {
  const [loading, setLoading] = useState(false);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  const playAudio = async (input: string) => {
    const CHUNK_SIZE = 1024;
    const url =
      "https://api.elevenlabs.io/v1/text-to-speech/nWM88eUzTWbyiJW1K8NX/stream";
    // 'https://api.elevenlabs.io/v1/text-to-speech/a2uc8mOUbUDoGMdeJwH0/stream';
    const headers = {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "",
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

  // Define state variables for the result, recording status, and media recorder
  const [result, setResult] = useState();
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  // This array will hold the audio data
  let chunks: any = [];
  // This useEffect hook sets up the media recorder when the component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const newMediaRecorder = new MediaRecorder(stream);
          newMediaRecorder.onstart = () => {
            chunks = [];
          };
          newMediaRecorder.ondataavailable = (e) => {
            chunks.push(e.data);
          };
          newMediaRecorder.onstop = async () => {
            console.time("Entire function");

            const audioBlob = new Blob(chunks, { type: "audio/webm" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.onerror = function (err) {
              console.error("Error playing audio:", err);
            };
            // audio.play();
            try {
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async function () {
                //@ts-ignore
                const base64Audio = reader.result.split(",")[1]; // Remove the data URL prefix

                // Speech to text
                const response = await fetch("/api/speechToText", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ audio: base64Audio }),
                });
                const data = await response.json();
                if (response.status !== 200) {
                  throw (
                    data.error ||
                    new Error(`Request failed with status ${response.status}`)
                  );
                }
                console.timeEnd("Speech to Text");

                // Get LLM completion
                const completion = await axios.post("/api/chat", {
                  messages: [
                    {
                      role: "user",
                      content: `${data.result} Your answer has to be as consise as possible.`,
                    },
                  ],
                });

                // Convert to speech
                handlePlayButtonClick(completion.data);
              };
            } catch (error) {
              console.error(error);
              //@ts-ignore
              alert(error.message);
            }
          };
          //@ts-ignore
          setMediaRecorder(newMediaRecorder);
        })
        .catch((err) => console.error("Error accessing microphone:", err));
    }
  }, []);
  // Function to start recording
  const startRecording = () => {
    if (mediaRecorder) {
      //@ts-ignore

      mediaRecorder.start();
      setRecording(true);
    }
  };
  // Function to stop recording
  const stopRecording = () => {
    toast("Thinking", {
      duration: 3000,
      icon: "💭",
      style: {
        borderRadius: "10px",
        background: "#1E1E1E",
        color: "#F9F9F9",
        border: "0.5px solid #3B3C3F",
      },
      position: "top-right",
    });
    if (mediaRecorder) {
      //@ts-ignore

      mediaRecorder.stop();
      setRecording(false);
    }
  };

  // Framer motion
  // Different states
  // intro (x)
  // idle (auto)
  // listening
  // thinking

  return (
    <div>
      <motion.div
        onClick={() => {
          recording
            ? null
            : toast("Listening - Click again to send", {
                icon: "🟢",
                style: {
                  borderRadius: "10px",
                  background: "#1E1E1E",
                  color: "#F9F9F9",
                  border: "0.5px solid #3B3C3F",
                },
                position: "top-right",
              });

          recording ? stopRecording() : startRecording();
        }}
        // onClick={recording ? stopRecording : startRecording}
        className="hover:scale-105 ease-in-out duration-500 hover:cursor-pointer text-[70px]"
      >
        <div className="rainbow-container">
          <div className="green"></div>
          <div className="pink"></div>
        </div>
      </motion.div>
    </div>
  );
}

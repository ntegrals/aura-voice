import { useState, useCallback, useEffect,useRef} from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID}/stream`;
    const headers = {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "",
    };
    const data = {
      text,
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

      const audioBuffer = await response.arrayBuffer();
      const CHUNK_SIZE = 1024;
      const audioBufferDuration = audioBuffer.byteLength / CHUNK_SIZE;
      const source = audioContextRef.current?.createBufferSource();

      await audioContextRef.current?.decodeAudioData(audioBuffer, (buffer) => {
        if (source && audioContextRef.current) {
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          source.start();
        }
      });

        setTimeout(() => {
            source?.stop();
            setIsLoading(false);
            audioContextRef.current?.close();
        }, audioBufferDuration * 1000);

    } catch (error) {
      console.error("Error:", error);
      setError('An error occurred during text-to-speech conversion.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { speak, isLoading, error };
};

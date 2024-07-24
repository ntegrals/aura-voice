import { useState, useEffect } from 'react';

interface UseAudioRecorderReturn{
		isRecording: boolean;
		startRecording: () => void;
		stopRecording: () => void;
		audioChunks: BlobPart[];
        mediaRecorderInitialized: boolean;
}

export const useAudioRecorder = () : UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [mediaRecorderInitialized, setMediaRecorderInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (navigator.mediaDevices && !mediaRecorder) {
      // prompt the user to grant permission to record audio
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream: MediaStream):void => {
        // initialize the MediaRecorder with audio stream
        const newMediaRecorder = new MediaRecorder(stream);
        setMediaRecorder(newMediaRecorder);

        newMediaRecorder.ondataavailable = (event) => {
          setAudioChunks((prevChunks) => [...prevChunks, event.data]);
        };
      });
    }
  }, [mediaRecorder]);

  const startRecording = () => {
    if (mediaRecorderInitialized && mediaRecorder) {
      mediaRecorder.start();
      setIsRecording(true);
      setAudioChunks([]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return { isRecording, startRecording, stopRecording, audioChunks,mediaRecorderInitialized };
};

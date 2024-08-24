import {useRef,useState, useEffect } from 'react';

interface UseAudioRecorderReturn{
		isRecording: boolean;
		startRecording: () => void;
		stopRecording: () => Promise<BlobPart[]>;
		audioChunks: BlobPart[];
        isMediaRecorderInitialized: boolean;
}

export const useAudioRecorder = () : UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isMediaRecorderInitialized, setMediaRecorderInitialized] = useState<boolean>(false);


    useEffect(() => {
    if (navigator.mediaDevices && !mediaRecorder) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream: MediaStream): void => {
        const newMediaRecorder = new MediaRecorder(stream);
        newMediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        newMediaRecorder.onstart  = () =>{
          audioChunksRef.current = []
        }

        setMediaRecorder(newMediaRecorder);
        setMediaRecorderInitialized(true);
      });
    }
  }, [mediaRecorder]);

  const startRecording = () => {
    if (isMediaRecorderInitialized && mediaRecorder) {
      mediaRecorder.start();
      setIsRecording(true);
      audioChunksRef.current = []
    }
  };

  const stopRecording = (): Promise<BlobPart[]> => {
    return new Promise((resolve)=>{
      if (mediaRecorder) {
        mediaRecorder.onstop = () => {
          resolve(audioChunksRef.current)
        }
        mediaRecorder.stop();
        setIsRecording(false);
      }else {
        resolve(audioChunksRef.current)
      }
    })
  };

  return { isRecording, startRecording, stopRecording, audioChunks:audioChunksRef.current,isMediaRecorderInitialized };
};

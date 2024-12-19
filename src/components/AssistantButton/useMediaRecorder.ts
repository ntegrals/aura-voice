import {
  createMediaRecorder,
  createMediaRecorderErrorIcons,
  createMediaRecorderErrorMessages,
  parseCreateMediaErrorCode,
} from '@/utils/client/mediaRecorder';
import { RefObject, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export type UseMediaRecorder = {
  recording: boolean;
  initMediaRecorder: () => Promise<MediaRecorder | undefined>;
  mediaRecorderRef: RefObject<MediaRecorder | undefined>;
  startRecording: () => void;
  /**
   * @returns The recorded audio blob.
   */
  stopRecording: () => Promise<Blob | undefined>;
  clearChunk: () => void;
};

export const useMediaRecorder = (): UseMediaRecorder => {
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | undefined>();
  const chunkRef = useRef<Blob | undefined>();

  const stopRecordingIntervalIdRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    return () => {
      const intervalId = stopRecordingIntervalIdRef.current;
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const initMediaRecorder = async (): Promise<MediaRecorder | undefined> => {
    if (mediaRecorderRef.current) {
      console.warn('media recorder is already initialized');
      return;
    }
    try {
      const mediaRecorder = await createMediaRecorder();
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.onstart = () => {
        chunkRef.current = undefined;
      };
      mediaRecorder.ondataavailable = (e) => {
        chunkRef.current = e.data;
      };
      return mediaRecorder;
    } catch (error) {
      const errorCode = parseCreateMediaErrorCode(error);
      if (errorCode) {
        toast(createMediaRecorderErrorMessages[errorCode], {
          icon: createMediaRecorderErrorIcons[errorCode],
        });
      } else {
        toast.error('Something went wrong when setting up media recorder');
      }
      console.error('Init media recorder: ', error);
      return undefined;
    }
  };

  const startRecording = (): void => {
    const mediaRecorder = mediaRecorderRef.current;

    if (!mediaRecorder) {
      console.warn(
        'startRecording can only be called after media recorder is initializaed',
      );
      return;
    }

    mediaRecorder.start();
    setRecording(true);
    toast('Listening - Click again to send', {
      icon: '🟢',
    });
  };

  const stopRecording = async (): Promise<Blob | undefined> => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder?.state !== 'recording') {
      console.warn(
        'stopRecording can only be called when media recorder is in recording state',
      );
      return;
    }

    mediaRecorder.stop();

    // The `ondataavailable` event of MediaRecorder is triggered after `stop()`
    // is called. To simplify the code and improve maintainability, we return
    // the recorded audio directly from this function, which requires accessing
    // a value that becomes available only after `stop()` executes.
    // To achieve this, we use a Promise combined with an interval.
    return new Promise((resolve, reject) => {
      let timer = 0;
      const interval = 100;
      const timeout = 3000;
      stopRecordingIntervalIdRef.current = setInterval(() => {
        if (chunkRef.current) {
          const audioBlob = chunkRef.current;

          clearInterval(stopRecordingIntervalIdRef.current);
          setRecording(false);

          if (audioBlob.size > 0) {
            return resolve(audioBlob);
          } else {
            // No audio recorded (e.g., the user remained silent during recording)
            return resolve(undefined);
          }
        } else if (timer >= timeout) {
          clearInterval(stopRecordingIntervalIdRef.current);
          setRecording(false);
          return reject(
            'Timed out waiting for recorder data. This should not be happening',
          );
        } else {
          timer += interval;
        }
      }, interval);
    });
  };

  const clearChunk = (): void => {
    chunkRef.current = undefined;
  };

  return {
    recording,
    initMediaRecorder,
    mediaRecorderRef,
    startRecording,
    stopRecording,
    clearChunk,
  };
};

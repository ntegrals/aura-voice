'use client';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useMediaRecorder } from './useMediaRecorder';
import { useSpeechToTextApi } from '@/utils/client/api/speechToText';
import { useCompletionApi } from '@/utils/client/api/completion';
import { useTextToSpeechApi } from '@/utils/client/api/textToSpeech';

const AssistantButton: React.FC = () => {
  const [thinking, setThinking] = useState(false);

  const { speechToText } = useSpeechToTextApi();
  const { createCompletion } = useCompletionApi();
  const { textToSpeech } = useTextToSpeechApi();

  const {
    recording,
    initMediaRecorder,
    mediaRecorderRef,
    startRecording,
    stopRecording,
    clearChunk,
  } = useMediaRecorder();

  const onClick = async () => {
    if (thinking) {
      toast('Please wait for the assistant to finish.');
    } else if (!recording) {
      await initRecorderAndStartRecording();
    } else {
      const audio = await stopRecording();
      if (audio) {
        await generateAssistantResponse(audio);
      }
    }
  };

  const initRecorderAndStartRecording = async () => {
    let mediaRecorder = mediaRecorderRef.current;

    if (!mediaRecorder) {
      mediaRecorder = await initMediaRecorder();
    }

    if (mediaRecorder) {
      startRecording();
    }
  };

  const generateAssistantResponse = async (userAudio: Blob) => {
    setThinking(true);

    toast('Thinking...', {
      icon: '💭',
    });

    try {
      const { text: userInput } = await speechToText(userAudio);
      const { completion } = await createCompletion(userInput);
      const assistantAudio = await textToSpeech(completion);
      await playAudio(assistantAudio);
    } catch (error) {
      toast.error(
        'Uh oh, something went wrong with Aura. Please try again later.',
      );
      console.error('Generate assistant response error: ', error);
    } finally {
      clearChunk();
      setThinking(false);
    }
  };

  const playAudio = async (audio: Blob) => {
    let objectUrl: string | undefined = undefined;

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    try {
      objectUrl = URL.createObjectURL(audio);
      const audioElement = new Audio(objectUrl);
      audioElement.addEventListener('ended', () => {
        cleanup();
      });
      audioElement.play();
    } catch (error) {
      cleanup();
      console.error('Error playing audio:', error);
    }
  };

  return (
    <motion.div
      onClick={onClick}
      className="hover:scale-105 ease-in-out duration-500 hover:cursor-pointer text-[70px]"
    >
      <div className="rainbow-container">
        <div className="green"></div>
        <div className="pink"></div>
      </div>
    </motion.div>
  );
};

export default AssistantButton;

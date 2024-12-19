import { SpeechToTextRequest } from '@/apiTypes/speechToText/speechToTextRequest';
import { SpeechToTextResponse } from '@/apiTypes/speechToText/speechToTextResponse';
import { client } from './axios-client';

export type UseSpeechToTextApi = {
  speechToText: (audio: Blob) => Promise<SpeechToTextResponse>;
};

export const useSpeechToTextApi = (): UseSpeechToTextApi => {
  const speechToText = async (audio: Blob): Promise<SpeechToTextResponse> => {
    // Create an additional object to ensure request body aligns with
    // the TS API interface.
    const request: SpeechToTextRequest = {
      audio,
    };

    const formData = new FormData();
    Object.entries(request).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await client.post<SpeechToTextResponse>(
      '/speechToText',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  };

  return {
    speechToText,
  };
};

import { TextToSpeechRequest } from '@/apiTypes/textToSpeech/textToSpeechRequest';
import { client } from './axios-client';

export type UseTextToSpeechApi = {
  textToSpeech: (text: string) => Promise<Blob>;
};

export const useTextToSpeechApi = (): UseTextToSpeechApi => {
  const textToSpeech = async (text: string): Promise<Blob> => {
    const body: TextToSpeechRequest = {
      text,
    };
    const response = await client.post('/textToSpeech', body, {
      responseType: 'blob',
    });
    return response.data;
  };

  return {
    textToSpeech,
  };
};

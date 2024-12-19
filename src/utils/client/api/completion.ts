import { CreateCompletionRequest } from '@/apiTypes/completion/createCompletionRequest';
import { CreateCompletionResponse } from '@/apiTypes/completion/createCompletionResponse';
import { client } from './axios-client';

export type UseCompletionApi = {
  createCompletion: (message: string) => Promise<CreateCompletionResponse>;
};

export const useCompletionApi = (): UseCompletionApi => {
  const createCompletion = async (
    message: string,
  ): Promise<CreateCompletionResponse> => {
    const body: CreateCompletionRequest = {
      message,
    };
    const response = await client.post<CreateCompletionResponse>(
      '/completion',
      body,
    );
    return response.data;
  };

  return {
    createCompletion,
  };
};

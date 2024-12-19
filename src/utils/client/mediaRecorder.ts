export enum CreateMediaRecorderErrorCode {
  NotSupported = 'notSupported',
  PermissionDenied = 'permissionDenied',
}

export const createMediaRecorderErrorMessages: Record<
  CreateMediaRecorderErrorCode,
  string
> = {
  [CreateMediaRecorderErrorCode.NotSupported]:
    'Audio recording is not supported in your browser',
  [CreateMediaRecorderErrorCode.PermissionDenied]:
    'Please grant access to your microphone. Click the button again to speak.',
};

export const createMediaRecorderErrorIcons: Record<
  CreateMediaRecorderErrorCode,
  string
> = {
  [CreateMediaRecorderErrorCode.NotSupported]: '😢',
  [CreateMediaRecorderErrorCode.PermissionDenied]: '🙌',
};

export class CreateMediaRecorderError extends Error {
  private readonly _code: CreateMediaRecorderErrorCode;

  constructor(code: CreateMediaRecorderErrorCode) {
    super();
    this._code = code;
  }

  get code(): CreateMediaRecorderErrorCode {
    return this._code;
  }
}

export const createMediaRecorder = async (): Promise<MediaRecorder> => {
  if (navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return new MediaRecorder(stream);
    } catch {
      throw new CreateMediaRecorderError(
        CreateMediaRecorderErrorCode.PermissionDenied,
      );
    }
  } else {
    throw new CreateMediaRecorderError(
      CreateMediaRecorderErrorCode.NotSupported,
    );
  }
};

export const parseCreateMediaErrorCode = (
  error: unknown,
): CreateMediaRecorderErrorCode | undefined => {
  if (error instanceof CreateMediaRecorderError) {
    return error.code;
  } else {
    return undefined;
  }
};

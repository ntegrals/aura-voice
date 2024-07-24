// src/lib/utils/processAudioAndConvertToText.ts

/**
 * Processes an audio blob by converting it to base64 and sending it to a server endpoint for speech-to-text conversion.
 * @param audioBlob The audio blob to process.
 * @returns A promise that resolves with the speech-to-text conversion result.
 */
export const processAudioAndConvertToText = async (audioBlob: Blob): Promise<string> => {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    const response = await fetch("/api/speechToText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio: base64Audio }),
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    return data.result; // Assuming the API returns the conversion result in a property named 'result'.
  } catch (error) {
    console.error("Error processing audio for speech to text:", error);
    throw error; // Rethrow the error to be handled by the caller.
  }
};

/**
 * Converts a Blob to a base64 string.
 * @param blob The Blob to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(",")[1]); // Split and return only the base64 content, not the data URL prefix.
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

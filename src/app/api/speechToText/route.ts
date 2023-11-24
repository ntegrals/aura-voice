// Import necessary libraries
import { OpenAI } from "openai";
import { exec } from "child_process";
import fs from "fs";
import { NextResponse } from "next/server";

const ffmpegPath = require("ffmpeg-static");

// Promisify the exec function from child_process
const util = require("util");
const execAsync = util.promisify(exec);
// Configure the OpenAI API client

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// This function handles POST requests to the /api/speechToText route
export async function POST(request: any) {
  // Check if the OpenAI API key is configured
  //   if (!configuration.apiKey) {
  //     return NextResponse.json(
  //       {
  //         error:
  //           "OpenAI API key not configured, please follow instructions in README.md",
  //       },
  //       { status: 500 }
  //     );
  //   }
  // Parse the request body
  const req = await request.json();
  // Extract the audio data from the request body
  const base64Audio = req.audio;
  // Convert the Base64 audio data back to a Buffer
  const audio = Buffer.from(base64Audio, "base64");
  try {
    // Convert the audio data to text
    const text = await convertAudioToText(audio);
    // Return the transcribed text in the response
    return NextResponse.json({ result: text }, { status: 200 });
  } catch (error) {
    // Handle any errors that occur during the request
    //@ts-ignore
    if (error.response) {
      //@ts-ignore

      console.error(error.response.status, error.response.data);
      //@ts-ignore

      return NextResponse.json({ error: error.response.data }, { status: 500 });
    } else {
      //@ts-ignore

      console.error(`Error with OpenAI API request: ${error.message}`);
      return NextResponse.json(
        { error: "An error occurred during your request." },
        { status: 500 }
      );
    }
  }
}
// This function converts audio data to text using the OpenAI API
async function convertAudioToText(audioData: any) {
  // Convert the audio data to MP3 format
  // const mp3AudioData = await convertAudioToMp3(audioData);
  // // Write the MP3 audio data to a file
  // const outputPath = "/tmp/output.mp3";
  // fs.writeFileSync(outputPath, mp3AudioData);
  const outputPath = "/tmp/input.webm";
  fs.writeFileSync(outputPath, audioData);

  // Transcribe the audio
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(outputPath),
    model: "whisper-1",
  });
  // Delete the temporary file
  fs.unlinkSync(outputPath);
  // The API response contains the transcribed text
  const transcribedText = response.text;
  return transcribedText;
}
// // This function converts audio data to MP3 format using ffmpeg
// async function convertAudioToMp3(audioData: any) {
//   // Write the audio data to a file
//   const inputPath = "/tmp/input.webm";
//   fs.writeFileSync(inputPath, audioData);
//   // Convert the audio to MP3 using ffmpeg
//   const outputPath = "/tmp/output.mp3";
//   await execAsync(`${ffmpegPath} -i ${inputPath} ${outputPath}`);
//   // Read the converted audio data
//   const mp3AudioData = fs.readFileSync(outputPath);
//   // Delete the temporary files
//   fs.unlinkSync(inputPath);
//   fs.unlinkSync(outputPath);
//   return mp3AudioData;
// }

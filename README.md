<a name="readme-top"></a>

<br />
<div align="center">

<h3 align="center">Voice Assistant for the Web</h3>

  <p align="center">
    A smart voice assistant optimized for low latency responses. Uses Vercel Edge Functions, Whisper Speech Recognition, GPT-3.5 Turbo and Eleven Labs TTS streaming.
    <br />
    <br />
    <a href="https://heyassistant.co">View Demo</a>
    ·
    <a href="https://github.com/ntegrals/voice-assistant/issues">Report Bug</a>
    ·
    <a href="https://github.com/ntegrals/voice-assistant/issues">Request Feature</a>
  </p>
</div>
<a href="https://github.com/ntegrals/voice-assistant">
    <img src="images/header.png" alt="Logo">
  </a>

## Features

    ✅ A Siri-like voice assistant within your browser
    ✅ Optimized for low latency responses
    ✅ With the combined power of OpenAI, Whisper Speech Recognition and Eleven Labs

## Demo

You can test the voice assistant here: [https://heyassistant.co](https://heyassistant.co)

## Motivation

Voice Assistants have become an integral part of our lives. They are everywhere. In our phones, in our cars, in our homes. Why not also on the web?

Until recently the main problem with voice assistants on the web was the latency. It took too long to send the audio to the server, generate an LLM completion and send speech back. The recent advances of OpenAI, Eleven Labs and Vercel have made it possible to build a voice assistant that is fast enough to be used on the web.

I would love to for this repo to become the go-to place for people who want to build their own voice assistant. I've been working on this project for a while now and I'm really excited to share it with you.

## Thoughts on latency and user experience

The latency of the voice assistant is the most important factor for a good user experience. Currently there are 3 main factors that contribute to the latency:

- The time it takes to transcribe the audio (Via Whisper Speech Recognition)
- The time it takes to generate the response (Via GPT-3.5 Turbo)
- The time it takes to stream the speech response (Via Eleven Labs TTS)

Based on some tests I've done, the speech generation takes the most time. The longer the text to be synthesized, the longer it takes to generate the speech. The latency of the speech generation is also the most unpredictable.

A possible mitigation strategy might be splitting the response into multiple parts and streaming them one after another. This would allow the user to start listening to the response while the rest of the response is being generated. I haven't implemented this yet, but it's something I'm considering. If you have any ideas on how to improve the latency, please let me know.

Another thing to keep in mind is perceived wait time. Based on some research, it seems that the perceived wait time is shorter if the user is given some kind of feedback while waiting. I've implemented a simple "thinking" notification that is shown while the assistant is processing the response, but I'm sure there are better ways to improve the perceived wait time.

## Installation

1. Clone the repo

   ```sh
   git clone https://github.com/ntegrals/voice-assistant
   ```

2. Get an API Key from [https://openai.com/](https://openai.com/) and [https://elevenlabs.com/](https://elevenlabs.com/)

   Copy the .env.example file to .env.local and add your API keys

   ```sh
   OPENAI_API_KEY="YOUR OPENAI API KEY"
   OPENAI_BASE_URL=(Optional)
   NEXT_PUBLIC_ELEVENLABS_API_KEY="YOUR ELEVENLABS API KEY"
   NEXT_PUBLIC_ELEVENLABS_VOICE_ID="YOUR ELEVENLABS VOICE ID"
   ```

3. Install the dependencies

   ```sh
   npm install
   ```

4. Run the app
   ```sh
   npm run dev
   ```
5. Deploy to vercel

## Contact

Hi! Thanks for checking out and using this library. If you are interested in discussing your project, require mentorship, consider hiring me, or just wanna chat - I'm happy to talk.

You can send me an email to get in touch: j.schoen@mail.com or message me on Twitter: [@julianschoen](https://twitter.com/julianschoen)

If you'd just want to give something back, I've got a Buy Me A Coffee account:

<a href="https://www.buymeacoffee.com/ntegrals">
<img src="images/buymeacoffee.png" alt="buymeacoffee" width="192">
</a>

Thanks and have an awesome day 👋

## Disclaimer

Voice Assistant, is an experimental application and is provided "as-is" without any warranty, express or implied. By using this software, you agree to assume all risks associated with its use, including but not limited to data loss, system failure, or any other issues that may arise.

The developers and contributors of this project do not accept any responsibility or liability for any losses, damages, or other consequences that may occur as a result of using this software. You are solely responsible for any decisions and actions taken based on the information provided by Voice Assistant.

Please note that the use of the GPT-4 language model can be expensive due to its token usage. By utilizing this project, you acknowledge that you are responsible for monitoring and managing your own token usage and the associated costs. It is highly recommended to check your OpenAI API usage regularly and set up any necessary limits or alerts to prevent unexpected charges.

By using Voice Assistant, you agree to indemnify, defend, and hold harmless the developers, contributors, and any affiliated parties from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from your use of this software or your violation of these terms.

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

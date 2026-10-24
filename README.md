# Voice-over Studio

Simple text-to-speech app. Type a script, pick a voice, generate, download MP3 or WAV.
Engine: Fish Audio API (`s2.1-pro-free` model).

## Setup
1. Install Node.js 18 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and paste your Fish Audio API key into `FISH_API_KEY`.
4. `npm start`, then open http://localhost:3000

## Notes
- The API key stays on the server (`.env`). Never put it in the frontend or commit `.env`.
- This app has no login. Run it locally, or add authentication before putting it online.
- Scripts are limited to 5,000 characters per clip. Split longer scripts into parts.
- If Fish Audio ends the free model, change `FISH_MODEL` in `.env`.
- Voice search and the language filter use Fish Audio's voice library. Use "Use a specific voice ID" to paste an exact voice you have chosen on fish.audio.
- To add another engine (e.g. YarnGPT), add `engines/<name>.js` and register it in `engines/index.js`.

## Hosting on Render
1. Push this folder to a private GitHub repository (`.env` is git-ignored, so your key is not uploaded).
2. On render.com: New > Web Service > connect the repo.
3. Runtime: Node. Build command: `npm install`. Start command: `npm start`.
4. Under Environment, add: `FISH_API_KEY`, `FISH_MODEL` (s2.1-pro-free), `ACCESS_USER`, `ACCESS_PASSWORD`.
5. Deploy, then open the `.onrender.com` link and log in with ACCESS_USER / ACCESS_PASSWORD.

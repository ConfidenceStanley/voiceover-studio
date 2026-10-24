require('dotenv').config();
const path = require('path');
const express = require('express');
const engines = require('./engines');

const MAX_CHARS = 5000;
const engine = engines.get(process.env.TTS_ENGINE || 'fish');
const app = express();


// Optional password protection (HTTP Basic Auth). Enabled when ACCESS_PASSWORD is set.
app.use((req, res, next) => {
  const password = process.env.ACCESS_PASSWORD;
  if (!password) return next();
  const user = process.env.ACCESS_USER || 'admin';
  const [scheme, encoded] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const [u, ...rest] = Buffer.from(encoded, 'base64').toString().split(':');
    if (u === user && rest.join(':') === password) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Voice-over Studio"').status(401).send('Login required.');
});

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const fail = (res, err) => res.status(err.status || 500).json({ error: err.message });

app.get('/api/config', (_req, res) => {
  res.json({ engine: engine.name, formats: engine.formats, maxChars: MAX_CHARS });
});

app.get('/api/voices', async (req, res) => {
  try {
    res.json(await engine.listVoices({ q: String(req.query.q || ''), language: String(req.query.language || '') }));
  } catch (err) {
    fail(res, err);
  }
});

app.post('/api/tts', async (req, res) => {
  const { text, voiceId, format, speed } = req.body || {};
  const clean = typeof text === 'string' ? text.trim() : '';
  if (!clean) return res.status(400).json({ error: 'Enter some text to convert.' });
  if (clean.length > MAX_CHARS) {
    return res.status(400).json({ error: `Text is too long (${clean.length}/${MAX_CHARS} characters). Split it into parts.` });
  }
  try {
    const { buffer, contentType } = await engine.synthesize({
      text: clean,
      voiceId: voiceId ? String(voiceId).trim() : undefined,
      format: format || 'mp3',
      speed: Number(speed) || 1,
    });
    res.set('Content-Type', contentType).send(buffer);
  } catch (err) {
    fail(res, err);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Voice-over Studio running at http://localhost:${port} (${engine.name})`));

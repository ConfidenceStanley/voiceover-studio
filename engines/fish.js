const BASE = 'https://api.fish.audio';
const CONTENT_TYPES = { mp3: 'audio/mpeg', wav: 'audio/wav' };

class EngineError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function apiKey() {
  const key = process.env.FISH_API_KEY;
  if (!key || key === 'your_api_key_here') {
    throw new EngineError('FISH_API_KEY is missing. Add it to your .env file and restart the server.', 500);
  }
  return key;
}

async function explain(res) {
  const messages = {
    401: 'Fish Audio rejected the API key. Check FISH_API_KEY in your .env file.',
    402: 'Fish Audio reports insufficient credit or an unavailable plan for this model.',
    422: 'Fish Audio could not process the request. Check the voice ID and text.',
    429: 'Too many requests. Wait a moment and try again.',
  };
  if (messages[res.status]) return messages[res.status];
  let detail = '';
  try { detail = (await res.text()).slice(0, 200); } catch (_) {}
  return `Fish Audio error ${res.status}${detail ? `: ${detail}` : ''}`;
}

async function listVoices({ q = '', language = '' } = {}) {
  const params = new URLSearchParams({ page_size: '20', page_number: '1', sort_by: 'score' });
  if (q) params.set('title', q);
  if (language) params.set('language', language);

  const res = await fetch(`${BASE}/model?${params}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) throw new EngineError(await explain(res), res.status);

  const data = await res.json();
  return (data.items || []).map((v) => ({
    id: v._id,
    title: v.title,
    description: v.description || '',
    languages: v.languages || [],
    sample: (v.samples && v.samples[0] && v.samples[0].audio) || null,
  }));
}

async function synthesize({ text, voiceId, format = 'mp3', speed = 1 }) {
  if (!CONTENT_TYPES[format]) throw new EngineError(`Unsupported format "${format}".`, 400);

  const body = {
    text,
    format,
    normalize: true,
    prosody: { speed: Math.min(2, Math.max(0.5, speed || 1)), volume: 0 },
  };
  if (format === 'mp3') body.mp3_bitrate = 192;
  if (voiceId) body.reference_id = voiceId;

  const res = await fetch(`${BASE}/v1/tts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      model: process.env.FISH_MODEL || 's2.1-pro-free',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new EngineError(await explain(res), res.status);

  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: CONTENT_TYPES[format] };
}

module.exports = { name: 'Fish Audio', formats: Object.keys(CONTENT_TYPES), listVoices, synthesize };

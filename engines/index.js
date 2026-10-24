// Engine registry. To add another engine (e.g. YarnGPT), create engines/<name>.js
// exporting { name, formats, listVoices(), synthesize() } and register it here.
const engines = {
  fish: require('./fish'),
};

module.exports = {
  get(name) {
    const engine = engines[name];
    if (!engine) throw new Error(`Unknown TTS_ENGINE "${name}". Available: ${Object.keys(engines).join(', ')}`);
    return engine;
  },
};

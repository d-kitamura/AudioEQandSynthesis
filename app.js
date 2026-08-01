const canvas = document.getElementById("plot");
const ctx2d = canvas.getContext("2d");
const plotHitLayer = document.getElementById("plotHitLayer");

const FREQ_MIN = 20;
const FREQ_AUDIO_MIN = 20;
const FREQ_MAX = 20000;
const GAIN_MIN = -20;
const GAIN_MAX = 20;
const MAX_BANDS = 8;
const RTA_MIN_UPDATE_MS = 1000 / 60;

const BASE_MARGIN = { left: 78, right: 26, top: 22, bottom: 54 };

const makeFlatBand = (f = 1000) => ({ type: "peaking", f, q: 1, gain: 0 });

const state = {
  mode: "eq",
  running: false,
  transportBusy: false,
  selectedBand: 0,
  selectedComponent: null,
  drag: null,
  pinch: null,
  pointers: new Map(),
  animation: null,
  audio: null,
  noiseType: "white",
  musicBuffer: null,
  musicLoadPromise: null,
  musicLoadStatus: "idle",
  audioFileBuffer: null,
  audioFileName: "",
  language: "en",
  rtaSmooth: [],
  rtaLastTime: null,
  waveTrigger: "zero",
  waveformMode: "cycles",
  bands: [makeFlatBand()],
  components: [
    { f: 400, amp: 0.7, phase: 0 },
    { f: 800, amp: 0.35, phase: 0 },
    { f: 1200, amp: 0.2, phase: 0 },
  ],
};

const el = {
  modeEq: document.getElementById("modeEq"),
  modeSynth: document.getElementById("modeSynth"),
  startStop: document.getElementById("startStop"),
  masterGain: document.getElementById("masterGain"),
  languageSelect: document.getElementById("languageSelect"),
  noiseType: document.getElementById("noiseType"),
  audioFile: document.getElementById("audioFile"),
  audioFileField: document.getElementById("audioFileField"),
  audioFileStatus: document.getElementById("audioFileStatus"),
  plotTitle: document.getElementById("plotTitle"),
  plotHint: document.getElementById("plotHint"),
  readout: document.getElementById("readout"),
  eqPanel: document.getElementById("eqPanel"),
  synthPanel: document.getElementById("synthPanel"),
  bandList: document.getElementById("bandList"),
  componentList: document.getElementById("componentList"),
  resetEq: document.getElementById("resetEq"),
  addBand: document.getElementById("addBand"),
  clearSynth: document.getElementById("clearSynth"),
  baseFreq: document.getElementById("baseFreq"),
  waveformMode: document.getElementById("waveformMode"),
  normalizeSynth: document.getElementById("normalizeSynth"),
};

const i18n = {
  en: {
    title: "Audio EQ and Synthesis",
    subtitle: "White/Pink noise EQ and sine additive synthesis",
    language: "Language",
    eqTitle: "Parametric EQ",
    synthTitle: "Additive Sine Spectrum",
    eqHint: "Drag point: frequency/gain. Wheel or two-finger pinch: Q. Double click: flatten band.",
    synthHint: "Click: add sine. Drag: frequency/level. Double click: remove.",
    stopped: "Stopped",
    start: "Start",
    stop: "Stop",
    eqBands: "EQ Bands",
    add: "Add",
    flat: "Flat",
    source: "Source",
    whiteNoise: "White noise",
    pinkNoise: "Pink noise",
    synthSource: "Synthesis",
    musicSource: "Music",
    fileSource: "Audio file",
    musicSample: "Sample: mix.mp3",
    musicLoading: "Loading sample music...",
    musicLoadError: "Could not load the sample music.",
    audioFile: "Audio file",
    noFileLoaded: "No file loaded",
    loadingFile: "Loading...",
    fileLoaded: "Loaded",
    fileLoadError: "Could not load this audio file.",
    band: "Band",
    remove: "Remove",
    type: "Type",
    freq: "Freq",
    q: "Q",
    gain: "Gain",
    sineComponents: "Sine Components",
    clear: "Clear",
    baseFrequency: "Base frequency",
    waveformView: "Waveform view",
    fiveCycles: "5 cycles",
    fixedTime: "Fixed time",
    harmonics: "Harmonics",
    saw: "Saw",
    square: "Square",
    triangle: "Triangle",
    sine: "Sine",
    level: "Level",
    db: "dB",
    safety: "Safety",
    safetyText: "Start with a low Master level. High gain and high-frequency components can sound harsh.",
    normalize: "Normalize synthesis level",
    noisePlaying: "noise",
    sinesPlaying: "sines",
    waveform: "Waveform",
    peaking: "Peaking",
    lowShelf: "Low shelf",
    highShelf: "High shelf",
    lowPass: "Low pass",
    highPass: "High pass",
  },
  ja: {
    title: "Audio EQ and Synthesis",
    subtitle: "ホワイト/ピンクノイズEQと正弦波加算合成",
    language: "言語",
    eqTitle: "パラメトリックEQ",
    synthTitle: "加算合成スペクトル",
    eqHint: "点をドラッグ: 周波数/ゲイン。ホイールまたは2本指ピンチ: Q。ダブルクリック: そのバンドをフラット化。",
    synthHint: "クリック: 正弦波を追加。ドラッグ: 周波数/レベル。ダブルクリック: 削除。",
    stopped: "停止中",
    start: "開始",
    stop: "停止",
    eqBands: "EQバンド",
    add: "追加",
    flat: "フラット",
    source: "音源",
    whiteNoise: "ホワイトノイズ",
    pinkNoise: "ピンクノイズ",
    synthSource: "合成音",
    musicSource: "Music",
    fileSource: "音声ファイル",
    musicSample: "サンプル: mix.mp3",
    musicLoading: "サンプル音源を読込中...",
    musicLoadError: "サンプル音源を読み込めませんでした。",
    audioFile: "音声ファイル",
    noFileLoaded: "ファイル未読込",
    loadingFile: "読込中...",
    fileLoaded: "読込済み",
    fileLoadError: "この音声ファイルを読み込めませんでした。",
    band: "バンド",
    remove: "削除",
    type: "種類",
    freq: "周波数",
    q: "Q",
    gain: "ゲイン",
    sineComponents: "正弦波成分",
    clear: "クリア",
    baseFrequency: "基音周波数",
    waveformView: "波形表示",
    fiveCycles: "5周期",
    fixedTime: "固定時間",
    harmonics: "倍音",
    saw: "のこぎり波",
    square: "矩形波",
    triangle: "三角波",
    sine: "正弦波",
    level: "レベル",
    db: "dB",
    safety: "安全",
    safetyText: "Masterを小さめにして開始してください。高いゲインや高周波成分は強く感じることがあります。",
    normalize: "合成音量を正規化",
    noisePlaying: "ノイズ",
    sinesPlaying: "個の正弦波",
    waveform: "波形",
    peaking: "ピーキング",
    lowShelf: "ローシェルフ",
    highShelf: "ハイシェルフ",
    lowPass: "ローパス",
    highPass: "ハイパス",
  },
};

function t(key) {
  return i18n[state.language][key] || i18n.en[key] || key;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function canvasScale() {
  const rect = canvas.getBoundingClientRect();
  return rect.width ? canvas.width / rect.width : window.devicePixelRatio || 1;
}

function canvasPx(cssPx) {
  return Math.round(cssPx * canvasScale());
}

function plotMargin() {
  const scale = canvasScale();
  return {
    left: Math.round(BASE_MARGIN.left * scale),
    right: Math.round(BASE_MARGIN.right * scale),
    top: Math.round(BASE_MARGIN.top * scale),
    bottom: Math.round(BASE_MARGIN.bottom * scale),
  };
}

function plotRect() {
  const margin = plotMargin();
  const bottomReserve = state.mode === "synth" ? canvas.height * 0.24 : 0;
  return {
    x: margin.left,
    y: margin.top,
    w: canvas.width - margin.left - margin.right,
    h: canvas.height - margin.top - margin.bottom - bottomReserve,
  };
}

function waveformRect() {
  const spectrum = plotRect();
  const top = spectrum.y + spectrum.h + canvasPx(64);
  return {
    x: spectrum.x,
    y: top,
    w: spectrum.w,
    h: Math.max(canvasPx(80), canvas.height - top - canvasPx(18)),
  };
}

function isMajorFreq(freq) {
  const mantissa = freq / 10 ** Math.floor(Math.log10(freq));
  return Math.abs(mantissa - 1) < 0.0001;
}

function isMajorGain(gain) {
  return gain % 10 === 0;
}

function logFreqToX(freq) {
  const rect = plotRect();
  const min = Math.log10(FREQ_MIN);
  const max = Math.log10(FREQ_MAX);
  return rect.x + ((Math.log10(freq) - min) / (max - min)) * rect.w;
}

function xToLogFreq(x) {
  const rect = plotRect();
  const min = Math.log10(FREQ_MIN);
  const max = Math.log10(FREQ_MAX);
  return 10 ** lerp(min, max, clamp((x - rect.x) / rect.w, 0, 1));
}

function gainToY(gain) {
  const rect = plotRect();
  return rect.y + ((GAIN_MAX - gain) / (GAIN_MAX - GAIN_MIN)) * rect.h;
}

function yToGain(y) {
  const rect = plotRect();
  return clamp(GAIN_MAX - ((y - rect.y) / rect.h) * (GAIN_MAX - GAIN_MIN), GAIN_MIN, GAIN_MAX);
}

function ampToY(amp, lowerHalf = false) {
  const rect = plotRect();
  const top = lowerHalf ? rect.y + rect.h * 0.58 : rect.y;
  const h = lowerHalf ? rect.h * 0.38 : rect.h;
  return top + (1 - clamp(amp, 0, 1)) * h;
}

function yToAmp(y) {
  const rect = plotRect();
  return clamp(1 - (y - rect.y) / rect.h, 0, 1);
}

function isInsideRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function updateHitLayer() {
  const canvasRect = canvas.getBoundingClientRect();
  const scale = canvasRect.width ? canvas.width / canvasRect.width : 1;
  const rect = plotRect();
  plotHitLayer.style.left = `${rect.x / scale}px`;
  plotHitLayer.style.top = `${rect.y / scale}px`;
  plotHitLayer.style.width = `${rect.w / scale}px`;
  plotHitLayer.style.height = `${rect.h / scale}px`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(820, Math.round(rect.width * ratio));
  const scale = rect.width ? width / rect.width : ratio;
  canvas.width = width;
  canvas.height = Math.max(460, Math.round(rect.height * scale));
  updateHitLayer();
  draw();
}

function createNoiseBuffer(audioContext, type) {
  const length = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    if (type === "pink") {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = clamp((b0 + b1 + b2 + white * 0.1848) * 0.12, -1, 1);
    } else {
      data[i] = white * 0.75;
    }
  }
  return buffer;
}

async function ensureAudio() {
  if (state.audio) return state.audio;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  const master = context.createGain();
  const analyser = context.createAnalyser();
  const compressor = context.createDynamicsCompressor();

  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0.82;
  analyser.minDecibels = -110;
  analyser.maxDecibels = 0;
  compressor.threshold.value = -18;
  compressor.knee.value = 18;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.006;
  compressor.release.value = 0.12;
  master.gain.value = Number(el.masterGain.value);
  analyser.connect(master).connect(compressor).connect(context.destination);

  state.audio = {
    context,
    master,
    analyser,
    freqData: new Uint8Array(analyser.frequencyBinCount),
    floatFreqData: new Float32Array(analyser.frequencyBinCount),
    timeData: new Uint8Array(analyser.fftSize),
    noise: null,
    eqInput: null,
    filters: [],
    oscillators: [],
  };
  return state.audio;
}

function ramp(param, value, time = 0.03) {
  const now = state.audio.context.currentTime;
  param.cancelScheduledValues(now);
  param.setTargetAtTime(value, now, time);
}

function stopSources() {
  if (!state.audio) return;
  if (state.audio.noise) {
    try { state.audio.noise.stop(); } catch {}
    try { state.audio.noise.disconnect(); } catch {}
  }
  state.audio.oscillators.forEach(({ osc, gain }) => {
    try { osc.stop(); } catch {}
    try { osc.disconnect(); } catch {}
    try { gain.disconnect(); } catch {}
  });
  state.audio.filters.forEach((filter) => {
    try { filter.disconnect(); } catch {}
  });
  if (state.audio.eqInput) {
    try { state.audio.eqInput.disconnect(); } catch {}
  }
  state.audio.noise = null;
  state.audio.eqInput = null;
  state.audio.filters = [];
  state.audio.oscillators = [];
}

function applyFilterParams(filter, band) {
  filter.type = band.type;
  filter.frequency.value = clamp(band.f, FREQ_AUDIO_MIN, FREQ_MAX);
  filter.Q.value = clamp(band.q, 0.2, 20);
  filter.gain.value = clamp(band.gain, -18, 18);
}

function startEqAudio() {
  const { context, analyser } = state.audio;
  state.rtaSmooth = [];
  state.rtaLastTime = null;
  const input = context.createGain();
  state.audio.eqInput = input;

  let previous = input;
  state.audio.filters = state.bands.map((band) => {
    const filter = context.createBiquadFilter();
    applyFilterParams(filter, band);
    previous.connect(filter);
    previous = filter;
    return filter;
  });

  previous.connect(analyser);

  if (state.noiseType === "synth") {
    const startAt = context.currentTime + 0.02;
    state.audio.oscillators = state.components.map((component) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const real = new Float32Array(2);
      const imag = new Float32Array(2);
      real[1] = Math.sin(component.phase || 0);
      imag[1] = Math.cos(component.phase || 0);
      osc.setPeriodicWave(context.createPeriodicWave(real, imag, { disableNormalization: true }));
      osc.frequency.value = component.f;
      gain.gain.value = normalizedAmp(component);
      osc.connect(gain).connect(input);
      osc.start(startAt);
      return { osc, gain, component };
    });
  } else if (state.noiseType === "music" || state.noiseType === "file") {
    const buffer = state.noiseType === "music" ? state.musicBuffer : state.audioFileBuffer;
    if (!buffer) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(input);
    source.start();
    state.audio.noise = source;
  } else {
    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context, state.noiseType);
    source.loop = true;
    source.connect(input);
    source.start();
    state.audio.noise = source;
  }
}

function normalizedAmp(component) {
  if (!el.normalizeSynth.checked) return component.amp;
  const total = state.components.reduce((sum, item) => sum + item.amp, 0) || 1;
  return component.amp / Math.max(1, total);
}

function startSynthAudio() {
  const { context, analyser } = state.audio;
  const startAt = context.currentTime + 0.02;
  state.audio.oscillators = state.components.map((component) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    const real = new Float32Array(2);
    const imag = new Float32Array(2);
    real[1] = Math.sin(component.phase || 0);
    imag[1] = Math.cos(component.phase || 0);
    osc.setPeriodicWave(context.createPeriodicWave(real, imag, { disableNormalization: true }));
    osc.frequency.value = component.f;
    gain.gain.value = normalizedAmp(component);
    osc.connect(gain).connect(analyser);
    osc.start(startAt);
    return { osc, gain, component };
  });
}

function syncAudio() {
  if (!state.audio) return;
  if (state.running && state.mode === "eq") {
    state.bands.forEach((band, index) => {
      const filter = state.audio.filters[index];
      if (!filter) return;
      if (filter.type !== band.type) filter.type = band.type;
      ramp(filter.frequency, clamp(band.f, FREQ_AUDIO_MIN, FREQ_MAX));
      ramp(filter.Q, band.q);
      ramp(filter.gain, band.gain);
    });
    if (state.noiseType === "synth") {
      state.audio.oscillators.forEach(({ osc, gain, component }) => {
        ramp(osc.frequency, component.f);
        ramp(gain.gain, normalizedAmp(component));
      });
    }
  }
  if (state.running && state.mode === "synth") {
    state.audio.oscillators.forEach(({ osc, gain, component }) => {
      ramp(osc.frequency, component.f);
      ramp(gain.gain, normalizedAmp(component));
    });
  }
  ramp(state.audio.master.gain, Number(el.masterGain.value));
}

async function loadAudioFile(file) {
  if (!file) return;
  el.audioFileStatus.textContent = t("loadingFile");
  try {
    const audio = await ensureAudio();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await audio.context.decodeAudioData(arrayBuffer.slice(0));
    state.audioFileBuffer = decoded;
    state.audioFileName = file.name;
    updateSourceUi();
    if (state.running && state.mode === "eq" && state.noiseType === "file") {
      restartForMode();
    }
  } catch (error) {
    state.audioFileBuffer = null;
    state.audioFileName = "";
    el.audioFileStatus.textContent = t("fileLoadError");
    if (state.running && state.mode === "eq" && state.noiseType === "file") {
      stopSources();
      state.running = false;
      updateTransport();
      draw();
    }
  }
}

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function loadMusicSample() {
  if (state.musicBuffer) return state.musicBuffer;
  if (state.musicLoadPromise) {
    try {
      return await state.musicLoadPromise;
    } catch {
      return null;
    }
  }

  state.musicLoadStatus = "loading";
  updateSourceUi();
  state.musicLoadPromise = (async () => {
    const encodedAudio = globalThis.MUSIC_SAMPLE_BASE64;
    if (!encodedAudio) throw new Error("Embedded music sample is unavailable");
    const audio = await ensureAudio();
    const decoded = await audio.context.decodeAudioData(decodeBase64(encodedAudio));
    state.musicBuffer = decoded;
    state.musicLoadStatus = "loaded";
    globalThis.MUSIC_SAMPLE_BASE64 = null;
    return decoded;
  })();

  try {
    return await state.musicLoadPromise;
  } catch (error) {
    console.error(error);
    state.musicBuffer = null;
    state.musicLoadStatus = "error";
    return null;
  } finally {
    state.musicLoadPromise = null;
    updateSourceUi();
  }
}

async function prepareEqSource(source = state.noiseType) {
  if (source === "music") return Boolean(await loadMusicSample());
  if (source === "file") return Boolean(state.audioFileBuffer);
  return true;
}

function startAnimation() {
  if (state.animation) return;
  const tick = () => {
    draw();
    state.animation = state.running ? requestAnimationFrame(tick) : null;
  };
  state.animation = requestAnimationFrame(tick);
}

async function toggleAudio() {
  if (state.transportBusy) return;
  state.transportBusy = true;
  updateTransport();
  try {
    await ensureAudio();
    if (state.audio.context.state === "suspended") await state.audio.context.resume();

    if (state.running) {
      stopSources();
      state.running = false;
    } else {
      const requestedMode = state.mode;
      const requestedSource = state.noiseType;
      if (requestedMode === "eq" && !(await prepareEqSource(requestedSource))) {
        updateSourceUi();
        return;
      }
      if (state.mode !== requestedMode || state.noiseType !== requestedSource) return;
      state.running = true;
      if (state.mode === "eq") startEqAudio();
      else startSynthAudio();
      startAnimation();
    }
    draw();
  } finally {
    state.transportBusy = false;
    updateTransport();
  }
}

function restartForMode() {
  if (!state.running || !state.audio) return;
  stopSources();
  if (state.mode === "eq") startEqAudio();
  else startSynthAudio();
}

function setMode(mode) {
  state.mode = mode;
  state.drag = null;
  state.pinch = null;
  state.pointers.clear();
  document.body.classList.toggle("synthMode", mode === "synth");
  el.modeEq.classList.toggle("active", mode === "eq");
  el.modeSynth.classList.toggle("active", mode === "synth");
  el.eqPanel.classList.toggle("hidden", mode !== "eq");
  el.synthPanel.classList.toggle("hidden", mode !== "synth");
  el.plotTitle.textContent = mode === "eq" ? t("eqTitle") : t("synthTitle");
  el.plotHint.textContent = mode === "eq" ? t("eqHint") : t("synthHint");
  restartForMode();
  renderControls();
  draw();
}

function updateTransport() {
  el.startStop.textContent = state.running ? t("stop") : t("start");
  el.startStop.disabled = state.transportBusy;
  el.startStop.classList.toggle("running", state.running);
  el.readout.textContent = state.running
    ? (state.mode === "eq" ? `${el.noiseType.options[el.noiseType.selectedIndex].textContent}` : `${state.components.length} ${t("sinesPlaying")}`)
    : t("stopped");
}

function applyLanguage() {
  document.documentElement.lang = state.language === "ja" ? "ja" : "en";
  document.title = t("title");
  document.querySelector("h1").textContent = t("title");
  document.querySelector(".topbar p").textContent = t("subtitle");
  document.querySelector(".languageField").firstChild.textContent = `${t("language")} `;
  document.querySelector(".volume").firstChild.textContent = "Master ";
  document.querySelector("#eqPanel h3").textContent = t("eqBands");
  el.addBand.textContent = t("add");
  el.resetEq.textContent = t("flat");
  document.querySelector(".sourceInPanel").firstChild.textContent = `${t("source")} `;
  el.noiseType.options[0].textContent = t("whiteNoise");
  el.noiseType.options[1].textContent = t("pinkNoise");
  el.noiseType.options[2].textContent = t("synthSource");
  el.noiseType.options[3].textContent = t("musicSource");
  el.noiseType.options[4].textContent = t("fileSource");
  el.audioFileField.firstChild.textContent = `${t("audioFile")} `;
  updateSourceUi();
  document.querySelector("#synthPanel h3").textContent = t("sineComponents");
  el.clearSynth.textContent = t("clear");
  document.querySelector("#synthPanel .field").firstChild.textContent = `${t("baseFrequency")} `;
  document.querySelector("#waveformMode").closest(".field").firstChild.textContent = `${t("waveformView")} `;
  el.waveformMode.options[0].textContent = t("fiveCycles");
  el.waveformMode.options[1].textContent = t("fixedTime");
  document.querySelector('[data-preset="harmonic"]').textContent = t("harmonics");
  document.querySelector('[data-preset="saw"]').textContent = t("saw");
  document.querySelector('[data-preset="square"]').textContent = t("square");
  document.querySelector('[data-preset="triangle"]').textContent = t("triangle");
  document.querySelector(".panelBlock:last-child h3").textContent = t("safety");
  document.querySelector(".panelBlock:last-child .small").textContent = t("safetyText");
  document.querySelector(".check").lastChild.textContent = ` ${t("normalize")}`;
  el.plotTitle.textContent = state.mode === "eq" ? t("eqTitle") : t("synthTitle");
  el.plotHint.textContent = state.mode === "eq" ? t("eqHint") : t("synthHint");
  renderControls();
  draw();
}

function updateSourceUi() {
  const isFileSource = state.noiseType === "file";
  const isMusicSource = state.noiseType === "music";
  el.audioFileField.classList.toggle("hidden", !isFileSource);
  el.audioFileStatus.classList.toggle("hidden", !isFileSource && !isMusicSource);
  if (isMusicSource) {
    el.audioFileStatus.textContent = state.musicLoadStatus === "loading"
      ? t("musicLoading")
      : state.musicLoadStatus === "error"
        ? t("musicLoadError")
        : t("musicSample");
    return;
  }
  if (!isFileSource) return;
  el.audioFileStatus.textContent = state.audioFileName
    ? `${t("fileLoaded")}: ${state.audioFileName}`
    : t("noFileLoaded");
}

function filterMagnitude(band, freq, attenuationFloor = GAIN_MIN) {
  const f = clamp(band.f, FREQ_AUDIO_MIN, FREQ_MAX);
  const q = clamp(band.q, 0.2, 20);
  const gain = clamp(band.gain, -18, 18);
  if (band.type === "peaking") {
    const octaves = Math.log2(freq / f);
    const shape = Math.exp(-0.5 * (octaves * q * 1.65) ** 2);
    return gain * shape;
  }
  if (band.type === "lowshelf") {
    const slope = 2.4 + q * 0.25;
    return gain / (1 + (freq / f) ** slope);
  }
  if (band.type === "highshelf") {
    const slope = 2.4 + q * 0.25;
    return gain / (1 + (f / freq) ** slope);
  }
  if (band.type === "lowpass") {
    if (freq <= f) return 0;
    return clamp(-24 * Math.log2(freq / f) * Math.sqrt(q / 1.2), attenuationFloor, 0);
  }
  if (band.type === "highpass") {
    if (freq >= f) return 0;
    return clamp(-24 * Math.log2(f / freq) * Math.sqrt(q / 1.2), attenuationFloor, 0);
  }
  return 0;
}

function eqMagnitude(freq, attenuationFloor = GAIN_MIN) {
  return state.bands.reduce((sum, band) => sum + filterMagnitude(band, freq, attenuationFloor), 0);
}

function setDashForMajor(major) {
  ctx2d.setLineDash(major ? [] : [7, 7]);
}

function drawRta(area = plotRect()) {
  if (!state.running || !state.audio) return;
  const now = performance.now();
  const elapsedMs = state.rtaLastTime === null ? RTA_MIN_UPDATE_MS : now - state.rtaLastTime;
  const shouldUpdate = state.rtaLastTime === null || elapsedMs >= RTA_MIN_UPDATE_MS;
  const elapsedFrames = clamp(elapsedMs / RTA_MIN_UPDATE_MS, 0, 4);
  const barsPerOctave = 8;
  const totalBars = Math.ceil(Math.log2(FREQ_MAX / FREQ_MIN) * barsPerOctave);
  if (state.noiseType === "synth") {
    if (shouldUpdate) state.rtaLastTime = now;
    drawSynthSourceRta(area, barsPerOctave, totalBars, shouldUpdate ? elapsedFrames : 0);
    return;
  }
  const barDefs = [];
  for (let bar = 0; bar < totalBars; bar += 1) {
    const f1 = FREQ_MIN * 2 ** (bar / barsPerOctave);
    if (f1 > FREQ_MAX) break;
    const visualF2 = FREQ_MIN * 2 ** ((bar + 1) / barsPerOctave);
    barDefs.push({ f1, f2: Math.min(visualF2, FREQ_MAX) });
  }
  if (!shouldUpdate) {
    drawRtaBars(area, barDefs);
    return;
  }
  state.rtaLastTime = now;
  const { analyser, floatFreqData } = state.audio;
  analyser.getFloatFrequencyData(floatFreqData);
  const barLevels = [];

  barDefs.forEach(({ f1, f2 }) => {
    const lowBlend = clamp((360 - f1) / 340, 0, 1);
    const analysisWidth = 1 + lowBlend * 0.85;
    const analysisF2 = f1 * 2 ** (analysisWidth / barsPerOctave);
    const i1 = Math.max(1, Math.floor((f1 * analyser.fftSize) / state.audio.context.sampleRate));
    const i2 = Math.min(floatFreqData.length - 1, Math.ceil((Math.min(analysisF2, FREQ_MAX) * analyser.fftSize) / state.audio.context.sampleRate));
    const values = [];
    for (let i = i1; i <= i2; i += 1) {
      if (Number.isFinite(floatFreqData[i])) {
        values.push(floatFreqData[i]);
      }
    }
    if (values.length) {
      values.sort((a, b) => a - b);
      const low = Math.floor(values.length * 0.2);
      const high = Math.max(low + 1, Math.ceil(values.length * 0.8));
      const trimmed = values.slice(low, high);
      const db = trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
      barLevels.push({
        f1,
        f2,
        db,
      });
    }
  });

  if (!barLevels.length) {
    return;
  }

  const topLimit = GAIN_MAX - 0.6;
  const bottomLimit = GAIN_MIN;

  barLevels.forEach((bar, index) => {
    const targetTopDb = absoluteRtaDbToGraphDb(bar.db);
    const previous = state.rtaSmooth[index] ?? targetTopDb;
    const smoothing = (0.8 + clamp((220 - bar.f1) / 200, 0, 1) * 0.05) ** elapsedFrames;
    const smoothedTopDb = clamp(previous * smoothing + targetTopDb * (1 - smoothing), bottomLimit, topLimit);
    state.rtaSmooth[index] = smoothedTopDb;
  });

  if (state.rtaSmooth.length > barLevels.length) {
    state.rtaSmooth.length = barLevels.length;
  }
  drawRtaBars(area, barLevels);
}

function drawRtaBars(area, bars) {
  if (!state.rtaSmooth.length) return;
  ctx2d.save();
  ctx2d.globalAlpha = 0.58;
  ctx2d.setLineDash([]);
  bars.forEach((bar, index) => {
    const smoothedTopDb = state.rtaSmooth[index];
    if (!Number.isFinite(smoothedTopDb)) return;
    const x1 = logFreqToX(bar.f1);
    const x2 = logFreqToX(bar.f2);
    const width = Math.max(2, x2 - x1 - 1);
    const yTop = clamp(gainToY(smoothedTopDb), area.y, area.y + area.h);
    const yBottom = gainToY(GAIN_MIN);
    const height = clamp(yBottom - yTop, 1, area.h);
    const intensity = clamp((smoothedTopDb - GAIN_MIN) / (GAIN_MAX - GAIN_MIN), 0, 1);
    const hue = 132 - intensity * 32;
    ctx2d.fillStyle = `hsl(${hue}, 100%, ${38 + intensity * 25}%)`;
    ctx2d.fillRect(x1 + 0.5, yTop, width, height);
  });
  ctx2d.restore();
}

function absoluteRtaDbToGraphDb(db) {
  const floorDb = -72;
  const ceilingDb = -30;
  const normalized = (db - floorDb) / (ceilingDb - floorDb);
  return clamp(GAIN_MIN + normalized * (GAIN_MAX - GAIN_MIN - 6), GAIN_MIN, GAIN_MAX - 0.6);
}

function absoluteSynthDbToGraphDb(db) {
  const floorDb = -54;
  const ceilingDb = -6;
  const normalized = (db - floorDb) / (ceilingDb - floorDb);
  return clamp(GAIN_MIN + normalized * (GAIN_MAX - GAIN_MIN - 6), GAIN_MIN, GAIN_MAX - 0.6);
}

function drawSynthSourceRta(area, barsPerOctave, totalBars, elapsedFrames = 1) {
  ctx2d.save();
  ctx2d.globalAlpha = 0.62;
  ctx2d.setLineDash([]);

  const components = state.components
    .filter((component) => component.f >= FREQ_MIN && component.f <= FREQ_MAX && component.amp > 0)
    .sort((a, b) => a.f - b.f);
  components.forEach((component, index) => {
    const eqDb = eqMagnitude(component.f, -90);
    const amp = normalizedAmp(component) * 10 ** (eqDb / 20);
    const componentDb = 20 * Math.log10(Math.max(amp, 0.00001));
    const targetTopDb = absoluteSynthDbToGraphDb(componentDb);
    const previous = state.rtaSmooth[index] ?? targetTopDb;
    const smoothing = 0.72 ** elapsedFrames;
    const smoothedTopDb = clamp(previous * smoothing + targetTopDb * (1 - smoothing), GAIN_MIN, GAIN_MAX - 0.6);
    state.rtaSmooth[index] = smoothedTopDb;
    const x = logFreqToX(component.f);
    const width = clamp(canvas.width / 230, 3, 7);
    const x1 = clamp(x - width / 2, area.x, area.x + area.w - width);
    const yTop = clamp(gainToY(smoothedTopDb), area.y, area.y + area.h);
    const yBottom = gainToY(GAIN_MIN);
    const height = clamp(yBottom - yTop, 1, area.h);
    const intensity = clamp((smoothedTopDb - GAIN_MIN) / (GAIN_MAX - GAIN_MIN), 0, 1);
    const hue = 132 - intensity * 32;
    ctx2d.fillStyle = `hsl(${hue}, 100%, ${38 + intensity * 25}%)`;
    ctx2d.fillRect(x1, yTop, width, height);
    ctx2d.strokeStyle = "rgba(2, 6, 23, 0.75)";
    ctx2d.lineWidth = 1;
    ctx2d.strokeRect(x1, yTop, width, height);
  });
  if (state.rtaSmooth.length > components.length) state.rtaSmooth.length = components.length;
  ctx2d.restore();
}

function drawWaveform() {
  const area = waveformRect();
  ctx2d.save();
  ctx2d.fillStyle = "#070b12";
  ctx2d.fillRect(area.x, area.y, area.w, area.h);
  ctx2d.strokeStyle = "rgba(148, 163, 184, 0.45)";
  ctx2d.strokeRect(area.x, area.y, area.w, area.h);
  ctx2d.strokeStyle = "rgba(203, 213, 225, 0.24)";
  ctx2d.beginPath();
  ctx2d.moveTo(area.x, area.y + area.h / 2);
  ctx2d.lineTo(area.x + area.w, area.y + area.h / 2);
  ctx2d.stroke();
  ctx2d.strokeStyle = "#67e8f9";
  ctx2d.lineWidth = 2;
  ctx2d.beginPath();
  if (state.components.length) {
    drawSynthesizedWaveformPath(area);
  } else {
    ctx2d.moveTo(area.x, area.y + area.h / 2);
    ctx2d.lineTo(area.x + area.w, area.y + area.h / 2);
  }
  ctx2d.stroke();
  ctx2d.fillStyle = "#cbd5e1";
  ctx2d.font = `600 ${canvasPx(14)}px sans-serif`;
  ctx2d.textBaseline = "alphabetic";
  ctx2d.fillText(t("waveform"), area.x, area.y - canvasPx(8));
  ctx2d.restore();
}

function drawSynthesizedWaveformPath(area) {
  const sampleCount = 1800;
  const minFreq = Math.max(FREQ_AUDIO_MIN, Math.min(...state.components.map((component) => component.f)));
  const duration = state.waveformMode === "cycles" ? 5 / minFreq : 0.12;
  const raw = new Float32Array(sampleCount);
  let maxAbs = 0.0001;

  for (let i = 0; i < sampleCount; i += 1) {
    const time = (i / sampleCount) * duration;
    let value = 0;
    state.components.forEach((component) => {
      value += normalizedAmp(component) * Math.sin(Math.PI * 2 * component.f * time + (component.phase || 0));
    });
    raw[i] = value;
    maxAbs = Math.max(maxAbs, Math.abs(value));
  }

  const start = findGeneratedWaveformTrigger(raw);
  const visible = sampleCount - start;
  for (let i = 0; i < visible; i += 1) {
    const value = raw[start + i] / maxAbs;
    const x = area.x + (i / Math.max(1, visible - 1)) * area.w;
    const y = area.y + area.h * 0.5 - value * area.h * 0.42;
    if (i === 0) ctx2d.moveTo(x, y);
    else ctx2d.lineTo(x, y);
  }
}

function findGeneratedWaveformTrigger(samples) {
  const center = 0;
  const searchEnd = Math.floor(samples.length * 0.45);
  if (state.waveTrigger === "saw") {
    let bestIndex = 0;
    let bestDrop = 0;
    for (let i = 3; i < searchEnd; i += 1) {
      const drop = samples[i - 3] - samples[i + 3];
      if (drop > bestDrop) {
        bestDrop = drop;
        bestIndex = i;
      }
    }
    return bestIndex;
  }
  if (state.waveTrigger === "square") {
    let bestIndex = 0;
    let bestRise = 0;
    for (let i = 3; i < searchEnd; i += 1) {
      const rise = samples[i + 3] - samples[i - 3];
      if (rise > bestRise) {
        bestRise = rise;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  for (let i = 1; i < searchEnd; i += 1) {
    if (samples[i - 1] < center && samples[i] >= center) return i;
  }
  return 0;
}

function drawGrid(kind) {
  const rect = plotRect();
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  ctx2d.fillStyle = "#05070b";
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);
  ctx2d.fillStyle = "#080d13";
  ctx2d.fillRect(rect.x, rect.y, rect.w, rect.h);

  if (kind === "eq") drawRta(rect);

  const freqTicks = [];
  for (let decade = 10; decade <= FREQ_MAX; decade *= 10) {
    [1, 2, 5].forEach((m) => {
      const freq = decade * m;
      if (freq >= FREQ_MIN && freq <= FREQ_MAX) freqTicks.push(freq);
    });
  }

  const axisFontSize = canvas.getBoundingClientRect().width <= 520 ? 11 : 15;
  ctx2d.font = `600 ${canvasPx(axisFontSize)}px sans-serif`;
  ctx2d.textBaseline = "alphabetic";
  freqTicks.forEach((freq) => {
    const major = isMajorFreq(freq);
    const x = logFreqToX(freq);
    setDashForMajor(major);
    ctx2d.strokeStyle = major ? "rgba(226, 232, 240, 0.55)" : "rgba(203, 213, 225, 0.28)";
    ctx2d.lineWidth = major ? 1.2 : 1;
    ctx2d.beginPath();
    ctx2d.moveTo(x, rect.y);
    ctx2d.lineTo(x, rect.y + rect.h);
    ctx2d.stroke();
    ctx2d.setLineDash([]);
    ctx2d.fillStyle = "#cbd5e1";
    const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
    const labelWidth = ctx2d.measureText(label).width;
    const halfLabel = labelWidth / 2;
    const labelX = freq === FREQ_MIN || freq === FREQ_MAX ? x : clamp(x, rect.x + halfLabel, rect.x + rect.w - halfLabel);
    ctx2d.textAlign = "center";
    ctx2d.fillText(label, labelX, rect.y + rect.h + canvasPx(32));
  });
  ctx2d.textAlign = "start";

  if (kind === "eq") {
    const gainTicks = [GAIN_MIN, -15, -10, -5, 0, 5, 10, 15, 20];
    gainTicks.forEach((gain) => {
      const major = isMajorGain(gain);
      const y = gainToY(gain);
      setDashForMajor(major);
      ctx2d.strokeStyle = major ? "rgba(226, 232, 240, 0.58)" : "rgba(203, 213, 225, 0.28)";
      ctx2d.lineWidth = major ? 1.2 : 1;
      ctx2d.beginPath();
      ctx2d.moveTo(rect.x, y);
      ctx2d.lineTo(rect.x + rect.w, y);
      ctx2d.stroke();
      ctx2d.setLineDash([]);
      ctx2d.fillStyle = gain === 0 ? "#39ff14" : "#cbd5e1";
      ctx2d.textAlign = "right";
      ctx2d.fillText(`${gain} dB`, rect.x - canvasPx(10), y + canvasPx(5));
    });
    ctx2d.textAlign = "start";
  } else {
    [0, 0.25, 0.5, 0.75, 1].forEach((amp) => {
      const y = ampToY(amp);
      ctx2d.strokeStyle = amp === 0 || amp === 1 ? "rgba(226, 232, 240, 0.5)" : "rgba(203, 213, 225, 0.25)";
      ctx2d.setLineDash(amp === 0 || amp === 1 ? [] : [7, 7]);
      ctx2d.beginPath();
      ctx2d.moveTo(rect.x, y);
      ctx2d.lineTo(rect.x + rect.w, y);
      ctx2d.stroke();
      ctx2d.setLineDash([]);
      ctx2d.fillStyle = "#cbd5e1";
      ctx2d.textAlign = "right";
      ctx2d.fillText(`${Math.round(amp * 100)}%`, rect.x - canvasPx(10), y + canvasPx(5));
    });
    ctx2d.textAlign = "start";
  }

  ctx2d.strokeStyle = "#e2e8f0";
  ctx2d.lineWidth = 1.5;
  ctx2d.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function drawEqCurveForBand(band, color, width) {
  ctx2d.strokeStyle = color;
  ctx2d.lineWidth = width;
  ctx2d.setLineDash([]);
  ctx2d.beginPath();
  for (let x = plotRect().x; x <= plotRect().x + plotRect().w; x += 2) {
    const freq = xToLogFreq(x);
    const y = gainToY(clamp(filterMagnitude(band, freq), GAIN_MIN, GAIN_MAX));
    if (x === plotRect().x) ctx2d.moveTo(x, y);
    else ctx2d.lineTo(x, y);
  }
  ctx2d.stroke();
}

function drawEq() {
  drawGrid("eq");
  state.bands.forEach((band) => drawEqCurveForBand(band, "rgba(255, 255, 255, 0.72)", 1.2));

  ctx2d.strokeStyle = "#39ff14";
  ctx2d.lineWidth = Math.max(3, canvas.width / 330);
  ctx2d.beginPath();
  const rect = plotRect();
  for (let x = rect.x; x <= rect.x + rect.w; x += 2) {
    const freq = xToLogFreq(x);
    const y = gainToY(clamp(eqMagnitude(freq), GAIN_MIN, GAIN_MAX));
    if (x === rect.x) ctx2d.moveTo(x, y);
    else ctx2d.lineTo(x, y);
  }
  ctx2d.stroke();

  state.bands.forEach((band, index) => {
    const x = logFreqToX(band.f);
    const y = gainToY(band.gain);
    const radius = index === state.selectedBand ? 14 : 10;
    ctx2d.beginPath();
    ctx2d.arc(x, y, canvasPx(radius), 0, Math.PI * 2);
    ctx2d.fillStyle = index === state.selectedBand ? "#f97316" : "#94a3b8";
    ctx2d.fill();
    ctx2d.strokeStyle = "#0f172a";
    ctx2d.lineWidth = canvasPx(2);
    ctx2d.stroke();
    ctx2d.fillStyle = "#020617";
    ctx2d.font = `bold ${canvasPx(14)}px sans-serif`;
    ctx2d.textAlign = "center";
    ctx2d.textBaseline = "middle";
    ctx2d.fillText(String(index + 1), x, y + canvasPx(0.5));
    ctx2d.textAlign = "start";
    ctx2d.textBaseline = "alphabetic";
  });
}

function drawSynth() {
  drawGrid("synth");
  state.components.forEach((component, index) => {
    const x = logFreqToX(component.f);
    const y = ampToY(component.amp);
    ctx2d.strokeStyle = index === state.selectedComponent ? "#f97316" : "#39ff14";
    ctx2d.lineWidth = Math.max(3, canvas.width / 250);
    ctx2d.beginPath();
    ctx2d.moveTo(x, plotRect().y + plotRect().h);
    ctx2d.lineTo(x, y);
    ctx2d.stroke();
    ctx2d.beginPath();
    ctx2d.arc(x, y, index === state.selectedComponent ? 13 : 10, 0, Math.PI * 2);
    ctx2d.fillStyle = index === state.selectedComponent ? "#f97316" : "#39ff14";
    ctx2d.fill();
    ctx2d.strokeStyle = "#020617";
    ctx2d.lineWidth = 2;
    ctx2d.stroke();
  });
  drawWaveform();
}

function draw() {
  updateHitLayer();
  if (state.mode === "eq") drawEq();
  else drawSynth();
}

function renderBandControls() {
  el.bandList.innerHTML = "";
  state.bands.forEach((band, index) => {
    const card = document.createElement("div");
    card.className = `bandCard${index === state.selectedBand ? " active" : ""}`;
    card.innerHTML = `
      <div class="row between">
        <strong>${t("band")} ${index + 1}</strong>
        <button data-remove-band="${index}" type="button" ${state.bands.length === 1 ? "disabled" : ""}>${t("remove")}</button>
      </div>
      <label class="field">${t("type")}
        <select data-band="${index}" data-key="type">
          <option value="peaking" ${band.type === "peaking" ? "selected" : ""}>${t("peaking")}</option>
          <option value="lowshelf" ${band.type === "lowshelf" ? "selected" : ""}>${t("lowShelf")}</option>
          <option value="highshelf" ${band.type === "highshelf" ? "selected" : ""}>${t("highShelf")}</option>
          <option value="lowpass" ${band.type === "lowpass" ? "selected" : ""}>${t("lowPass")}</option>
          <option value="highpass" ${band.type === "highpass" ? "selected" : ""}>${t("highPass")}</option>
        </select>
      </label>
      <div class="fieldGrid">
        <label class="field">${t("freq")}<input data-band="${index}" data-key="f" type="number" min="20" max="20000" step="1" value="${Math.round(band.f)}"></label>
        <label class="field">${t("q")}<input data-band="${index}" data-key="q" type="number" min="0.2" max="20" step="0.1" value="${band.q.toFixed(1)}"></label>
        <label class="field">${t("gain")}<input data-band="${index}" data-key="gain" type="number" min="-18" max="18" step="0.5" value="${band.gain.toFixed(1)}"></label>
      </div>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.closest("input, select, button")) return;
      state.selectedBand = index;
      renderControls();
      draw();
    });
    el.bandList.appendChild(card);
  });
}

function renderComponentControls() {
  el.componentList.innerHTML = "";
  state.components.forEach((component, index) => {
    const card = document.createElement("div");
    card.className = `componentCard${index === state.selectedComponent ? " active" : ""}`;
    card.innerHTML = `
      <div class="row between">
        <strong>${t("sine")} ${index + 1}</strong>
        <button data-remove="${index}" type="button">${t("remove")}</button>
      </div>
      <div class="fieldGrid">
        <label class="field">${t("freq")}<input data-comp="${index}" data-key="f" type="number" min="20" max="20000" step="1" value="${Math.round(component.f)}"></label>
        <label class="field">${t("level")}<input data-comp="${index}" data-key="amp" type="number" min="0" max="1" step="0.01" value="${component.amp.toFixed(2)}"></label>
        <label class="field">${t("db")}<input data-comp="${index}" data-key="db" type="number" min="-80" max="0" step="1" value="${ampToDb(component.amp)}"></label>
      </div>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.closest("input, button")) return;
      state.selectedComponent = index;
      renderControls();
      draw();
    });
    el.componentList.appendChild(card);
  });
}

function renderControls() {
  renderBandControls();
  renderComponentControls();
  el.addBand.disabled = state.bands.length >= MAX_BANDS;
  updateTransport();
}

function ampToDb(amp) {
  if (amp <= 0.0001) return -80;
  return Math.round(20 * Math.log10(amp));
}

function dbToAmp(db) {
  return clamp(10 ** (clamp(db, -80, 0) / 20), 0, 1);
}

function updateBand(index, key, value) {
  const band = state.bands[index];
  if (!band) return;
  if (key === "type") band.type = value;
  if (key === "f") band.f = clamp(value, FREQ_AUDIO_MIN, FREQ_MAX);
  if (key === "q") band.q = clamp(value, 0.2, 20);
  if (key === "gain") band.gain = clamp(value, -18, 18);
  state.selectedBand = index;
  syncAudio();
  draw();
}

function syncBandInputs(index) {
  const band = state.bands[index];
  if (!band) return;
  const freqInput = el.bandList.querySelector(`input[data-band="${index}"][data-key="f"]`);
  const qInput = el.bandList.querySelector(`input[data-band="${index}"][data-key="q"]`);
  const gainInput = el.bandList.querySelector(`input[data-band="${index}"][data-key="gain"]`);
  if (freqInput && document.activeElement !== freqInput) freqInput.value = String(Math.round(band.f));
  if (qInput && document.activeElement !== qInput) qInput.value = band.q.toFixed(1);
  if (gainInput && document.activeElement !== gainInput) gainInput.value = band.gain.toFixed(1);
}

function updateComponent(index, key, value) {
  const component = state.components[index];
  if (!component) return;
  state.waveTrigger = "auto";
  if (key === "f") component.f = clamp(value, FREQ_AUDIO_MIN, FREQ_MAX);
  if (key === "amp") component.amp = clamp(value, 0, 1);
  if (key === "db") component.amp = dbToAmp(value);
  state.selectedComponent = index;
  syncAudio();
  draw();
}

function syncComponentInputs(index) {
  const component = state.components[index];
  if (!component) return;
  const freqInput = el.componentList.querySelector(`input[data-comp="${index}"][data-key="f"]`);
  const ampInput = el.componentList.querySelector(`input[data-comp="${index}"][data-key="amp"]`);
  const dbInput = el.componentList.querySelector(`input[data-comp="${index}"][data-key="db"]`);
  if (freqInput && document.activeElement !== freqInput) freqInput.value = String(Math.round(component.f));
  if (ampInput && document.activeElement !== ampInput) ampInput.value = component.amp.toFixed(2);
  if (dbInput && document.activeElement !== dbInput) dbInput.value = String(ampToDb(component.amp));
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * sx,
    y: (event.clientY - rect.top) * sy,
  };
}

function nearestBand(point) {
  let best = { index: -1, dist: Infinity };
  state.bands.forEach((band, index) => {
    const dist = Math.hypot(logFreqToX(band.f) - point.x, gainToY(band.gain) - point.y);
    if (dist < best.dist) best = { index, dist };
  });
  return best.dist < 44 ? best.index : -1;
}

function nearestComponent(point) {
  let best = { index: -1, dist: Infinity };
  const touchRadius = canvas.getBoundingClientRect().width <= 520 ? canvasPx(15) : 44;
  state.components.forEach((component, index) => {
    const dist = Math.hypot(logFreqToX(component.f) - point.x, ampToY(component.amp) - point.y);
    if (dist < best.dist) best = { index, dist };
  });
  return best.dist < touchRadius ? best.index : -1;
}

function addComponent(point) {
  if (state.components.length >= 20) return;
  state.waveTrigger = "auto";
  const component = {
    f: clamp(xToLogFreq(point.x), FREQ_AUDIO_MIN, FREQ_MAX),
    amp: yToAmp(point.y),
    phase: Math.random() * Math.PI * 2,
  };
  state.components.push(component);
  state.selectedComponent = state.components.length - 1;
  if (state.running && state.mode === "synth") restartForMode();
  renderControls();
  draw();
}

function removeComponent(index) {
  state.components.splice(index, 1);
  state.selectedComponent = state.components.length ? clamp(index - 1, 0, state.components.length - 1) : null;
  if (state.running && state.mode === "synth") restartForMode();
  renderControls();
  draw();
}

function pointerDistance() {
  const points = Array.from(state.pointers.values());
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

plotHitLayer.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  const point = canvasPoint(event);
  state.pointers.set(event.pointerId, point);
  event.currentTarget.setPointerCapture(event.pointerId);

  if (state.mode === "eq" && state.pointers.size === 2 && state.selectedBand !== null) {
    state.pinch = {
      index: state.selectedBand,
      distance: pointerDistance(),
      q: state.bands[state.selectedBand].q,
    };
    state.drag = null;
    return;
  }

  if (state.mode === "eq") {
    const index = nearestBand(point);
    if (index >= 0) {
      state.selectedBand = index;
      state.drag = { type: "band", index, lockX: event.ctrlKey, lockY: event.shiftKey };
    }
  } else {
    if (!isInsideRect(point, plotRect())) {
      state.drag = null;
      return;
    }
    const index = nearestComponent(point);
    if (index >= 0) {
      state.selectedComponent = index;
      state.drag = { type: "component", index, lockX: event.ctrlKey, lockY: event.shiftKey };
    } else {
      addComponent(point);
      state.drag = { type: "component", index: state.selectedComponent, lockX: false, lockY: false };
    }
  }
  renderControls();
  draw();
});

plotHitLayer.addEventListener("pointermove", (event) => {
  if (state.drag || state.pinch) event.preventDefault();
  const point = canvasPoint(event);
  if (state.pointers.has(event.pointerId)) state.pointers.set(event.pointerId, point);

  if (state.pinch && state.pointers.size >= 2) {
    const distance = pointerDistance();
    const band = state.bands[state.pinch.index];
    if (distance > 0 && band) {
      band.q = clamp(state.pinch.q * (Math.max(1, state.pinch.distance) / distance), 0.2, 20);
      syncAudio();
      syncBandInputs(state.pinch.index);
      draw();
    }
    return;
  }

  if (!state.drag) return;
  if (state.drag.type === "band") {
    const band = state.bands[state.drag.index];
    if (!state.drag.lockX) band.f = clamp(xToLogFreq(point.x), FREQ_AUDIO_MIN, FREQ_MAX);
    if (!state.drag.lockY) band.gain = yToGain(point.y);
    syncBandInputs(state.drag.index);
  } else {
    const component = state.components[state.drag.index];
    if (!component) return;
    state.waveTrigger = "auto";
    if (!state.drag.lockX) component.f = clamp(xToLogFreq(point.x), FREQ_AUDIO_MIN, FREQ_MAX);
    if (!state.drag.lockY) component.amp = yToAmp(point.y);
    syncComponentInputs(state.drag.index);
  }
  syncAudio();
  draw();
});

function endPointer(event) {
  state.pointers.delete(event.pointerId);
  if (state.pinch && state.pointers.size < 2) {
    state.pinch = null;
    renderControls();
  }
  state.drag = null;
}

plotHitLayer.addEventListener("pointerup", endPointer);
plotHitLayer.addEventListener("pointercancel", endPointer);
plotHitLayer.addEventListener("lostpointercapture", endPointer);
plotHitLayer.addEventListener("dragstart", (event) => event.preventDefault());
canvas.addEventListener("dragstart", (event) => event.preventDefault());

plotHitLayer.addEventListener("dblclick", (event) => {
  const point = canvasPoint(event);
  if (state.mode === "eq") {
    const index = nearestBand(point);
    if (index >= 0) {
      state.bands[index].gain = 0;
      state.bands[index].q = 1;
      syncAudio();
    }
  } else {
    const index = nearestComponent(point);
    if (index >= 0) removeComponent(index);
  }
  renderControls();
  draw();
});

plotHitLayer.addEventListener("wheel", (event) => {
  if (state.mode !== "eq") return;
  event.preventDefault();
  const point = canvasPoint(event);
  const index = nearestBand(point);
  if (index < 0) return;
  const band = state.bands[index];
  const factor = event.deltaY < 0 ? 1.08 : 0.92;
  band.q = clamp(band.q * factor, 0.2, 20);
  state.selectedBand = index;
  syncAudio();
  syncBandInputs(index);
  renderControls();
  draw();
}, { passive: false });

el.bandList.addEventListener("input", (event) => {
  const input = event.target;
  if (!input.dataset.band) return;
  updateBand(Number(input.dataset.band), input.dataset.key, input.dataset.key === "type" ? input.value : Number(input.value));
});

el.bandList.addEventListener("change", (event) => {
  const input = event.target;
  if (input.dataset.band) {
    updateBand(Number(input.dataset.band), input.dataset.key, input.dataset.key === "type" ? input.value : Number(input.value));
  }
  renderControls();
});

el.bandList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-band]");
  if (!button) return;
  event.stopPropagation();
  const index = Number(button.dataset.removeBand);
  if (state.bands.length <= 1) return;
  state.bands.splice(index, 1);
  state.selectedBand = clamp(index - 1, 0, state.bands.length - 1);
  if (state.running && state.mode === "eq") restartForMode();
  renderControls();
  draw();
});

el.componentList.addEventListener("input", (event) => {
  const input = event.target;
  if (!input.dataset.comp) return;
  updateComponent(Number(input.dataset.comp), input.dataset.key, Number(input.value));
});

el.componentList.addEventListener("change", (event) => {
  const input = event.target;
  if (input.dataset.comp) {
    updateComponent(Number(input.dataset.comp), input.dataset.key, Number(input.value));
  }
  renderControls();
});

el.componentList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  event.stopPropagation();
  removeComponent(Number(button.dataset.remove));
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

function applyPreset(kind) {
  const base = clamp(Number(el.baseFreq.value) || 400, 40, 2000);
  const next = [];
  state.waveTrigger = kind === "saw" || kind === "square" ? kind : "auto";
  const maxHarmonics = Math.floor(FREQ_MAX / base);
  for (let k = 1; k <= maxHarmonics; k += 1) {
    let amp = 0;
    if (kind === "harmonic") amp = k <= 6 ? 0.75 / k : 0;
    if (kind === "saw") amp = 0.8 / k;
    if (kind === "square" && k % 2 === 1) amp = 0.8 / k;
    if (kind === "triangle" && k % 2 === 1) amp = 0.95 / (k * k);
    const keep = kind === "saw" || kind === "square" ? amp > 0 : amp > (kind === "triangle" ? 0.0006 : 0.005);
    if (keep) {
      const phase = (kind === "triangle" && k % 4 === 3) || (kind === "saw" && k % 2 === 0) ? Math.PI : 0;
      next.push({ f: base * k, amp, phase });
    }
  }
  state.components = next;
  state.selectedComponent = 0;
  if (state.running && state.mode === "synth") restartForMode();
  renderControls();
  draw();
}

el.modeEq.addEventListener("click", () => setMode("eq"));
el.modeSynth.addEventListener("click", () => setMode("synth"));
el.startStop.addEventListener("click", toggleAudio);
el.masterGain.addEventListener("input", syncAudio);
el.normalizeSynth.addEventListener("change", syncAudio);
el.waveformMode.addEventListener("change", () => {
  state.waveformMode = el.waveformMode.value;
  draw();
});
el.languageSelect.addEventListener("change", () => {
  state.language = el.languageSelect.value;
  applyLanguage();
});
el.noiseType.addEventListener("change", async () => {
  const selectedSource = el.noiseType.value;
  const wasRunning = state.running && state.mode === "eq";
  state.noiseType = selectedSource;
  if (wasRunning) stopSources();
  updateSourceUi();
  updateTransport();
  draw();

  if (!wasRunning) return;
  const ready = await prepareEqSource(selectedSource);
  if (state.noiseType !== selectedSource || state.mode !== "eq") return;
  if (ready) {
    startEqAudio();
  } else {
    state.running = false;
    updateTransport();
    draw();
  }
});
el.audioFile.addEventListener("change", () => {
  loadAudioFile(el.audioFile.files?.[0]);
});

el.addBand.addEventListener("click", () => {
  if (state.bands.length >= MAX_BANDS) return;
  const base = [250, 500, 1000, 2000, 4000, 8000, 12000, 16000][state.bands.length] || 1000;
  state.bands.push(makeFlatBand(base));
  state.selectedBand = state.bands.length - 1;
  if (state.running && state.mode === "eq") restartForMode();
  renderControls();
  draw();
});

el.resetEq.addEventListener("click", () => {
  state.bands = state.bands.map((band) => ({ ...band, q: 1, gain: 0 }));
  if (state.bands.length === 0) state.bands = [makeFlatBand()];
  state.selectedBand = 0;
  syncAudio();
  renderControls();
  draw();
});

el.clearSynth.addEventListener("click", () => {
  state.components = [];
  state.selectedComponent = null;
  if (state.running && state.mode === "synth") restartForMode();
  renderControls();
  draw();
});

window.addEventListener("resize", resizeCanvas);
applyLanguage();
resizeCanvas();

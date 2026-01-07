// Audio Analysis Metrics for Voice Energy App

export interface VolumeResult {
  averageDb: number;
  score: number;
  tag: 'ENERGY';
}

export interface SpeechRateResult {
  wordsPerMinute: number;
  syllablesPerSecond: number;
  score: number;
  tag: 'FLUENCY';
}

export interface AccelerationResult {
  score: number;
  accelerationEvents: number;
  tag: 'DYNAMICS';
}

export interface ResponseTimeResult {
  responseTimeMs: number;
  score: number;
  tag: 'READINESS';
}

export interface PauseManagementResult {
  pauseCount: number;
  avgPauseDuration: number;
  score: number;
  tag: 'FLUIDITY';
}

export interface AnalysisResult {
  volume: VolumeResult;
  speechRate: SpeechRateResult;
  acceleration: AccelerationResult;
  responseTime: ResponseTimeResult;
  pauseManagement: PauseManagementResult;
  overallScore: number;
  emotionalFeedback: 'excellent' | 'good' | 'poor';
}

// Volume Level Analysis
export function calculateVolumeLevel(audioBuffer: Float32Array): VolumeResult {
  const rms = Math.sqrt(
    audioBuffer.reduce((sum, sample) => sum + sample * sample, 0) / audioBuffer.length
  );
  
  const reference = 0.00001;
  const averageDb = 20 * Math.log10(Math.max(rms, reference));
  
  const MIN_DB = -40;
  const TARGET_DB = -10;
  
  let score: number;
  if (averageDb < MIN_DB) {
    score = 0;
  } else if (averageDb >= TARGET_DB) {
    score = 100;
  } else {
    score = ((averageDb - MIN_DB) / (TARGET_DB - MIN_DB)) * 100;
  }
  
  return {
    averageDb,
    score: Math.round(Math.max(0, Math.min(100, score))),
    tag: 'ENERGY'
  };
}

// Speech Rate Analysis - Energy Peak Detection
function detectEnergyPeaks(audioBuffer: Float32Array, sampleRate: number): number[] {
  const windowSize = Math.floor(0.02 * sampleRate);
  const minPeakDistance = Math.floor(0.1 * sampleRate / windowSize);
  const threshold = -30;
  
  const windows: number[] = [];
  
  for (let i = 0; i < audioBuffer.length - windowSize; i += windowSize) {
    const window = audioBuffer.slice(i, i + windowSize);
    const rms = Math.sqrt(
      window.reduce((sum, sample) => sum + sample * sample, 0) / window.length
    );
    const db = 20 * Math.log10(Math.max(rms, 0.00001));
    windows.push(db);
  }
  
  const peaks: number[] = [];
  let lastPeakIndex = -minPeakDistance;
  
  for (let i = 1; i < windows.length - 1; i++) {
    if (i - lastPeakIndex >= minPeakDistance &&
        windows[i] > threshold &&
        windows[i] > windows[i-1] &&
        windows[i] > windows[i+1]) {
      peaks.push(i);
      lastPeakIndex = i;
    }
  }
  
  return peaks;
}

export function calculateSpeechRate(
  audioBuffer: Float32Array, 
  sampleRate: number,
  duration: number
): SpeechRateResult {
  const peaks = detectEnergyPeaks(audioBuffer, sampleRate);
  const syllablesPerSecond = peaks.length / Math.max(duration, 0.1);
  const wordsPerMinute = syllablesPerSecond * 60 * 0.6;
  
  const MIN_WPM = 80;
  const IDEAL_MIN = 140;
  const IDEAL_MAX = 180;
  const MAX_WPM = 220;
  
  let score: number;
  if (wordsPerMinute < MIN_WPM || wordsPerMinute > MAX_WPM) {
    score = Math.max(0, 50 - Math.abs(wordsPerMinute - 160) / 2);
  } else if (wordsPerMinute >= IDEAL_MIN && wordsPerMinute <= IDEAL_MAX) {
    score = 100;
  } else if (wordsPerMinute < IDEAL_MIN) {
    score = ((wordsPerMinute - MIN_WPM) / (IDEAL_MIN - MIN_WPM)) * 100;
  } else {
    score = ((MAX_WPM - wordsPerMinute) / (MAX_WPM - IDEAL_MAX)) * 100;
  }
  
  return {
    wordsPerMinute: Math.round(wordsPerMinute),
    syllablesPerSecond: Math.round(syllablesPerSecond * 10) / 10,
    score: Math.round(Math.max(0, Math.min(100, score))),
    tag: 'FLUENCY'
  };
}

// Acceleration Analysis
export function calculateAcceleration(
  audioBuffer: Float32Array,
  sampleRate: number
): AccelerationResult {
  const segmentDuration = 2.0;
  const samplesPerSegment = Math.floor(segmentDuration * sampleRate);
  const segments: Float32Array[] = [];
  
  for (let i = 0; i < audioBuffer.length; i += samplesPerSegment) {
    const segment = audioBuffer.slice(i, Math.min(i + samplesPerSegment, audioBuffer.length));
    if (segment.length > sampleRate * 0.5) {
      segments.push(segment);
    }
  }
  
  if (segments.length < 2) {
    return { score: 50, accelerationEvents: 0, tag: 'DYNAMICS' };
  }
  
  const segmentMetrics = segments.map(segment => ({
    volumeDb: calculateVolumeLevel(segment).averageDb,
    speechRate: calculateSpeechRate(segment, sampleRate, segment.length / sampleRate).wordsPerMinute
  }));
  
  let accelerationEvents = 0;
  for (let i = 1; i < segmentMetrics.length; i++) {
    const speedIncrease = segmentMetrics[i].speechRate > segmentMetrics[i-1].speechRate;
    const volumeIncrease = segmentMetrics[i].volumeDb > segmentMetrics[i-1].volumeDb;
    if (speedIncrease && volumeIncrease) {
      accelerationEvents++;
    }
  }
  
  const score = (accelerationEvents / (segmentMetrics.length - 1)) * 100;
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score + 30))), // Base boost for natural speech
    accelerationEvents,
    tag: 'DYNAMICS'
  };
}

// Response Time Analysis
export function calculateResponseTime(
  audioBuffer: Float32Array,
  sampleRate: number
): ResponseTimeResult {
  const SILENCE_THRESHOLD = -45;
  const MIN_SPEECH_DURATION = 0.2;
  const minSpeechSamples = Math.floor(MIN_SPEECH_DURATION * sampleRate);
  
  let firstSpeechTime = audioBuffer.length / sampleRate;
  
  for (let t = 0; t < audioBuffer.length - minSpeechSamples; t += Math.floor(sampleRate * 0.05)) {
    const window = audioBuffer.slice(t, t + minSpeechSamples);
    const rms = Math.sqrt(
      window.reduce((sum, sample) => sum + sample * sample, 0) / window.length
    );
    const db = 20 * Math.log10(Math.max(rms, 0.00001));
    
    if (db > SILENCE_THRESHOLD) {
      firstSpeechTime = t / sampleRate;
      break;
    }
  }
  
  const responseTimeMs = firstSpeechTime * 1000;
  
  const INSTANT = 200;
  const POOR = 2000;
  
  let score: number;
  if (responseTimeMs <= INSTANT) {
    score = 100;
  } else if (responseTimeMs >= POOR) {
    score = 0;
  } else {
    score = 100 - ((responseTimeMs - INSTANT) / (POOR - INSTANT)) * 100;
  }
  
  return {
    responseTimeMs: Math.round(responseTimeMs),
    score: Math.round(Math.max(0, Math.min(100, score))),
    tag: 'READINESS'
  };
}

// Pause Management Analysis
interface Pause {
  start: number;
  duration: number;
}

function detectPauses(
  audioBuffer: Float32Array, 
  sampleRate: number
): Pause[] {
  const SILENCE_THRESHOLD = -45;
  const MIN_PAUSE_DURATION = 0.15;
  const windowSize = Math.floor(0.05 * sampleRate);
  
  const pauses: Pause[] = [];
  let inPause = false;
  let pauseStart = 0;
  
  for (let i = 0; i < audioBuffer.length - windowSize; i += windowSize) {
    const window = audioBuffer.slice(i, i + windowSize);
    const rms = Math.sqrt(
      window.reduce((sum, sample) => sum + sample * sample, 0) / window.length
    );
    const db = 20 * Math.log10(Math.max(rms, 0.00001));
    
    const isSilent = db < SILENCE_THRESHOLD;
    
    if (isSilent && !inPause) {
      inPause = true;
      pauseStart = i / sampleRate;
    } else if (!isSilent && inPause) {
      inPause = false;
      const duration = (i / sampleRate) - pauseStart;
      if (duration >= MIN_PAUSE_DURATION) {
        pauses.push({ start: pauseStart, duration });
      }
    }
  }
  
  return pauses;
}

export function calculatePauseManagement(
  audioBuffer: Float32Array,
  sampleRate: number,
  duration: number
): PauseManagementResult {
  const pauses = detectPauses(audioBuffer, sampleRate);
  
  if (pauses.length === 0) {
    return {
      pauseCount: 0,
      avgPauseDuration: 0,
      score: 85, // Good continuous speech
      tag: 'FLUIDITY'
    };
  }
  
  const excessivePauses = pauses.filter(p => p.duration >= 2.0);
  const longPauses = pauses.filter(p => p.duration >= 1.0 && p.duration < 2.0);
  
  if (excessivePauses.length > 0) {
    return {
      pauseCount: pauses.length,
      avgPauseDuration: pauses.reduce((sum, p) => sum + p.duration, 0) / pauses.length,
      score: 0,
      tag: 'FLUIDITY'
    };
  }
  
  let score = 100;
  
  // Penalty for long pauses
  const MAX_ACCEPTABLE_LONG_PAUSES = 2;
  const longPausePenalty = Math.max(0, longPauses.length - MAX_ACCEPTABLE_LONG_PAUSES) * 20;
  score -= longPausePenalty;
  
  // Penalty for pause frequency
  const pauseFrequency = (pauses.length / duration) * 60;
  const IDEAL_PAUSE_FREQUENCY = 4;
  const frequencyDeviation = Math.abs(pauseFrequency - IDEAL_PAUSE_FREQUENCY);
  const frequencyPenalty = (frequencyDeviation / IDEAL_PAUSE_FREQUENCY) * 30;
  score -= frequencyPenalty;
  
  // Penalty for long average duration
  const avgDuration = pauses.reduce((sum, p) => sum + p.duration, 0) / pauses.length;
  if (avgDuration > 0.8) {
    score -= (avgDuration - 0.8) * 25;
  }
  
  return {
    pauseCount: pauses.length,
    avgPauseDuration: Math.round(avgDuration * 100) / 100,
    score: Math.round(Math.max(0, Math.min(100, score))),
    tag: 'FLUIDITY'
  };
}

// Main Analysis Function
export function analyzeAudio(audioBuffer: Float32Array, sampleRate: number): AnalysisResult {
  const duration = audioBuffer.length / sampleRate;
  
  const volume = calculateVolumeLevel(audioBuffer);
  const speechRate = calculateSpeechRate(audioBuffer, sampleRate, duration);
  const acceleration = calculateAcceleration(audioBuffer, sampleRate);
  const responseTime = calculateResponseTime(audioBuffer, sampleRate);
  const pauseManagement = calculatePauseManagement(audioBuffer, sampleRate, duration);
  
  // Weighted overall score
  const overallScore = Math.round(
    volume.score * 0.20 +
    speechRate.score * 0.20 +
    acceleration.score * 0.15 +
    responseTime.score * 0.15 +
    pauseManagement.score * 0.30
  );
  
  let emotionalFeedback: 'excellent' | 'good' | 'poor';
  if (overallScore >= 71) {
    emotionalFeedback = 'excellent';
  } else if (overallScore >= 41) {
    emotionalFeedback = 'good';
  } else {
    emotionalFeedback = 'poor';
  }
  
  return {
    volume,
    speechRate,
    acceleration,
    responseTime,
    pauseManagement,
    overallScore,
    emotionalFeedback
  };
}

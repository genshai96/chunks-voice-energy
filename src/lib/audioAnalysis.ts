// Audio Analysis Metrics for Voice Energy App

import { supabase } from "@/integrations/supabase/client";

// Types for speech rate method
export type SpeechRateMethod = "energy-peaks" | "deepgram-stt";

// Config interface matching admin settings
export interface MetricConfig {
  id: string;
  weight: number;
  thresholds: {
    min: number;
    ideal: number;
    max: number;
  };
  method?: SpeechRateMethod;
}

// Load config from localStorage or use defaults
function getConfig(): MetricConfig[] {
  try {
    const saved = localStorage.getItem("metricConfig");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load metric config:", e);
  }

  // Default config (matches AdminSettings defaults)
  return [
    { id: "volume", weight: 40, thresholds: { min: -35, ideal: -15, max: 0 } },
    { id: "speechRate", weight: 40, thresholds: { min: 90, ideal: 150, max: 220 }, method: "energy-peaks" },
    { id: "acceleration", weight: 5, thresholds: { min: 0, ideal: 50, max: 100 } },
    { id: "responseTime", weight: 5, thresholds: { min: 2000, ideal: 200, max: 0 } },
    { id: "pauseManagement", weight: 10, thresholds: { min: 0, ideal: 0, max: 2.71 } },
  ];
}

function getMetricConfig(id: string): MetricConfig | undefined {
  return getConfig().find((m) => m.id === id);
}

function getSpeechRateMethod(): SpeechRateMethod {
  const config = getMetricConfig("speechRate");
  return config?.method || "energy-peaks";
}

export interface VolumeResult {
  averageDb: number;
  score: number;
  tag: "ENERGY";
}

export interface SpeechRateResult {
  wordsPerMinute: number;
  syllablesPerSecond: number;
  score: number;
  tag: "FLUENCY";
  method: SpeechRateMethod;
  transcript?: string; // Only for STT method
}

export interface AccelerationResult {
  score: number;
  segment1Volume: number;
  segment2Volume: number;
  segment1Rate: number;
  segment2Rate: number;
  isAccelerating: boolean;
  tag: "DYNAMICS";
}

export interface ResponseTimeResult {
  responseTimeMs: number;
  score: number;
  tag: "READINESS";
}

export interface PauseManagementResult {
  pauseCount: number;
  avgPauseDuration: number;
  maxPauseDuration: number;
  score: number;
  tag: "FLUIDITY";
}

export interface AnalysisResult {
  volume: VolumeResult;
  speechRate: SpeechRateResult;
  acceleration: AccelerationResult;
  responseTime: ResponseTimeResult;
  pauseManagement: PauseManagementResult;
  overallScore: number;
  emotionalFeedback: "excellent" | "good" | "poor";
}

// Calculate RMS in dB for a buffer segment
function calculateSegmentDb(buffer: Float32Array): number {
  const rms = Math.sqrt(buffer.reduce((sum, sample) => sum + sample * sample, 0) / buffer.length);
  return 20 * Math.log10(Math.max(rms, 0.00001));
}

// Volume Level Analysis - uses configured thresholds
export function calculateVolumeLevel(audioBuffer: Float32Array): VolumeResult {
  const config = getMetricConfig("volume");
  const MIN_DB = config?.thresholds.min ?? -40;
  const TARGET_DB = config?.thresholds.ideal ?? -10;

  const averageDb = calculateSegmentDb(audioBuffer);

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
    tag: "ENERGY",
  };
}

// Speech Rate Analysis - Volume-compensated peak detection
// When volume is low, we use a more lenient threshold to avoid false "fast" detection
function detectEnergyPeaks(audioBuffer: Float32Array, sampleRate: number, volumeDb: number): number[] {
  const windowSize = Math.floor(0.02 * sampleRate);
  const minPeakDistance = Math.floor((0.1 * sampleRate) / windowSize);

  // VOLUME COMPENSATION: When audio is quiet, use stricter threshold
  // This prevents quiet audio from appearing "faster" than it is
  // Normal volume (-10dB to 0dB): threshold -30dB
  // Quiet volume (-40dB to -10dB): threshold scales from -50dB to -30dB relative
  let threshold: number;
  if (volumeDb >= -10) {
    threshold = -30; // Normal detection threshold
  } else if (volumeDb >= -40) {
    // Scale threshold based on volume: quieter audio needs higher relative threshold
    // This means we need more prominent peaks to count as syllables
    const volumeRange = -10 - -40; // 30dB range
    const volumePosition = (volumeDb - -40) / volumeRange; // 0 to 1
    // Threshold goes from volumeDb+5 (very strict for quiet) to -30 (normal)
    threshold = volumeDb + 5 + volumePosition * (-30 - (volumeDb + 5));
  } else {
    threshold = volumeDb + 5; // Very quiet: only detect peaks clearly above noise
  }

  const windows: number[] = [];

  for (let i = 0; i < audioBuffer.length - windowSize; i += windowSize) {
    const window = audioBuffer.slice(i, i + windowSize);
    const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);
    const db = 20 * Math.log10(Math.max(rms, 0.00001));
    windows.push(db);
  }

  const peaks: number[] = [];
  let lastPeakIndex = -minPeakDistance;

  for (let i = 1; i < windows.length - 1; i++) {
    if (
      i - lastPeakIndex >= minPeakDistance &&
      windows[i] > threshold &&
      windows[i] > windows[i - 1] &&
      windows[i] > windows[i + 1]
    ) {
      peaks.push(i);
      lastPeakIndex = i;
    }
  }

  return peaks;
}

export function calculateSpeechRate(
  audioBuffer: Float32Array,
  sampleRate: number,
  duration: number,
  volumeDb?: number,
): SpeechRateResult {
  const config = getMetricConfig("speechRate");
  const MIN_WPM = config?.thresholds.min ?? 80;
  const IDEAL_WPM = config?.thresholds.ideal ?? 160;

  // Calculate volume if not provided (for volume-compensated detection)
  const actualVolumeDb = volumeDb ?? calculateSegmentDb(audioBuffer);

  const peaks = detectEnergyPeaks(audioBuffer, sampleRate, actualVolumeDb);
  const syllablesPerSecond = peaks.length / Math.max(duration, 0.1);
  const wordsPerMinute = syllablesPerSecond * 60 * 0.6;

  // Scoring: >= IDEAL = 100 points (faster is always better, no max penalty)
  let score: number;
  if (wordsPerMinute >= IDEAL_WPM) {
    // At or above target = perfect score
    score = 100;
  } else if (wordsPerMinute < MIN_WPM) {
    // Below minimum: scale from 0 to 50
    score = Math.max(0, (wordsPerMinute / MIN_WPM) * 50);
  } else {
    // Between MIN and IDEAL: scale 50 to 100
    score = 50 + ((wordsPerMinute - MIN_WPM) / (IDEAL_WPM - MIN_WPM)) * 50;
  }

  return {
    wordsPerMinute: Math.round(wordsPerMinute),
    syllablesPerSecond: Math.round(syllablesPerSecond * 10) / 10,
    score: Math.round(Math.max(0, Math.min(100, score))),
    tag: "FLUENCY",
    method: "energy-peaks",
  };
}

// Speech Rate via Deepgram STT
export async function calculateSpeechRateWithSTT(audioBase64: string, duration: number): Promise<SpeechRateResult> {
  const config = getMetricConfig("speechRate");
  const MIN_WPM = config?.thresholds.min ?? 80;
  const IDEAL_WPM = config?.thresholds.ideal ?? 160;

  try {
    const { data, error } = await supabase.functions.invoke("deepgram-transcribe", {
      body: { audio: audioBase64 },
    });

    if (error) throw error;

    const wordsPerMinute = data.wordsPerMinute || 0;
    const transcript = data.transcript || "";

    // Scoring: >= IDEAL = 100 points (faster is always better)
    let score: number;
    if (wordsPerMinute >= IDEAL_WPM) {
      score = 100;
    } else if (wordsPerMinute < MIN_WPM) {
      score = Math.max(0, (wordsPerMinute / MIN_WPM) * 50);
    } else {
      score = 50 + ((wordsPerMinute - MIN_WPM) / (IDEAL_WPM - MIN_WPM)) * 50;
    }

    return {
      wordsPerMinute,
      syllablesPerSecond: wordsPerMinute / 60 / 0.6,
      score: Math.round(Math.max(0, Math.min(100, score))),
      tag: "FLUENCY",
      method: "deepgram-stt",
      transcript,
    };
  } catch (error) {
    console.error("Deepgram STT error, falling back to energy peaks:", error);
    // Fallback: return a placeholder (caller should handle this)
    return {
      wordsPerMinute: 0,
      syllablesPerSecond: 0,
      score: 0,
      tag: "FLUENCY",
      method: "deepgram-stt",
      transcript: "Error: Could not transcribe audio",
    };
  }
}

// Acceleration Analysis - 2 Segment Comparison
// Score is based on: segment2 > segment1 for BOTH volume AND speech rate
// AND segment2 must exceed configured target thresholds
export function calculateAcceleration(audioBuffer: Float32Array, sampleRate: number): AccelerationResult {
  const volumeConfig = getMetricConfig("volume");
  const speechConfig = getMetricConfig("speechRate");

  const targetVolumeDb = volumeConfig?.thresholds.ideal ?? -10;
  const targetSpeechRate = speechConfig?.thresholds.ideal ?? 160;

  // Split audio into exactly 2 segments (first half vs second half)
  const midPoint = Math.floor(audioBuffer.length / 2);
  const segment1 = audioBuffer.slice(0, midPoint);
  const segment2 = audioBuffer.slice(midPoint);

  // Minimum segment length check (at least 0.5 seconds)
  if (segment1.length < sampleRate * 0.5 || segment2.length < sampleRate * 0.5) {
    return {
      score: 50,
      segment1Volume: 0,
      segment2Volume: 0,
      segment1Rate: 0,
      segment2Rate: 0,
      isAccelerating: false,
      tag: "DYNAMICS",
    };
  }

  // Calculate metrics for each segment
  const segment1Volume = calculateSegmentDb(segment1);
  const segment2Volume = calculateSegmentDb(segment2);

  const segment1Rate = calculateSpeechRate(
    segment1,
    sampleRate,
    segment1.length / sampleRate,
    segment1Volume,
  ).wordsPerMinute;

  const segment2Rate = calculateSpeechRate(
    segment2,
    sampleRate,
    segment2.length / sampleRate,
    segment2Volume,
  ).wordsPerMinute;

  // Condition 1: Segment 2 must be louder AND faster than Segment 1
  const volumeIncreased = segment2Volume > segment1Volume;
  const rateIncreased = segment2Rate > segment1Rate;

  // Condition 2: Segment 2 must exceed target thresholds (loud enough & fast enough)
  const volumeAboveTarget = segment2Volume >= targetVolumeDb;
  const rateAboveTarget = segment2Rate >= targetSpeechRate;

  // Calculate score based on conditions
  let score = 0;
  const isAccelerating = volumeIncreased && rateIncreased;

  if (isAccelerating) {
    // Base 50 points for acceleration pattern
    score = 50;

    // Additional points for meeting targets
    if (volumeAboveTarget) {
      score += 25;
    } else {
      // Partial credit based on how close to target
      const volumeProgress = Math.max(0, (segment2Volume - -40) / (targetVolumeDb - -40));
      score += Math.round(volumeProgress * 25);
    }

    if (rateAboveTarget) {
      score += 25;
    } else {
      // Partial credit based on how close to target
      const rateProgress = Math.max(0, segment2Rate / targetSpeechRate);
      score += Math.round(Math.min(1, rateProgress) * 25);
    }
  } else {
    // No acceleration pattern - check if at least one dimension improved
    if (volumeIncreased || rateIncreased) {
      score = 30; // Partial credit for partial improvement
    } else {
      score = 10; // Minimal score for flat/declining energy
    }
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    segment1Volume: Math.round(segment1Volume * 10) / 10,
    segment2Volume: Math.round(segment2Volume * 10) / 10,
    segment1Rate,
    segment2Rate,
    isAccelerating,
    tag: "DYNAMICS",
  };
}

// Response Time Analysis
export function calculateResponseTime(audioBuffer: Float32Array, sampleRate: number): ResponseTimeResult {
  const config = getMetricConfig("responseTime");
  const INSTANT = config?.thresholds.ideal ?? 200;
  const POOR = config?.thresholds.min ?? 2000;

  const SILENCE_THRESHOLD = -45;
  const MIN_SPEECH_DURATION = 0.2;
  const minSpeechSamples = Math.floor(MIN_SPEECH_DURATION * sampleRate);

  let firstSpeechTime = audioBuffer.length / sampleRate;

  for (let t = 0; t < audioBuffer.length - minSpeechSamples; t += Math.floor(sampleRate * 0.05)) {
    const window = audioBuffer.slice(t, t + minSpeechSamples);
    const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);
    const db = 20 * Math.log10(Math.max(rms, 0.00001));

    if (db > SILENCE_THRESHOLD) {
      firstSpeechTime = t / sampleRate;
      break;
    }
  }

  const responseTimeMs = firstSpeechTime * 1000;

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
    tag: "READINESS",
  };
}

// Pause Management Analysis
// Rule: No pause = 100 score (perfect)
// Any pause > 2.71s = 0 score (critical failure)
interface Pause {
  start: number;
  duration: number;
}

function detectPauses(audioBuffer: Float32Array, sampleRate: number): Pause[] {
  const SILENCE_THRESHOLD = -45;
  const MIN_PAUSE_DURATION = 0.15;
  const windowSize = Math.floor(0.05 * sampleRate);

  const pauses: Pause[] = [];
  let inPause = false;
  let pauseStart = 0;
  let speechStarted = false; // Track if speech has started

  for (let i = 0; i < audioBuffer.length - windowSize; i += windowSize) {
    const window = audioBuffer.slice(i, i + windowSize);
    const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);
    const db = 20 * Math.log10(Math.max(rms, 0.00001));

    const isSilent = db < SILENCE_THRESHOLD;

    // Only start tracking pauses AFTER first speech is detected
    if (!isSilent && !speechStarted) {
      speechStarted = true;
    }

    // Only count pauses that occur AFTER speech has started (mid-speech pauses)
    if (speechStarted) {
      if (isSilent && !inPause) {
        inPause = true;
        pauseStart = i / sampleRate;
      } else if (!isSilent && inPause) {
        inPause = false;
        const duration = i / sampleRate - pauseStart;
        if (duration >= MIN_PAUSE_DURATION) {
          pauses.push({ start: pauseStart, duration });
        }
      }
    }
  }

  return pauses;
}

export function calculatePauseManagement(
  audioBuffer: Float32Array,
  sampleRate: number,
  duration: number,
): PauseManagementResult {
  const config = getMetricConfig("pauseManagement");
  const MAX_PAUSE_DURATION = config?.thresholds.max ?? 2.71; // seconds - any pause > this = 0 score
  const MAX_PAUSE_COUNT = config?.thresholds.min ?? 3; // max allowed pauses - more = 0 score

  const pauses = detectPauses(audioBuffer, sampleRate);

  // No pauses = PERFECT score (100)
  if (pauses.length === 0) {
    return {
      pauseCount: 0,
      avgPauseDuration: 0,
      maxPauseDuration: 0,
      score: 100,
      tag: "FLUIDITY",
    };
  }

  const maxPauseDuration = Math.max(...pauses.map((p) => p.duration));
  const avgDuration = pauses.reduce((sum, p) => sum + p.duration, 0) / pauses.length;

  // CRITICAL FAILURE: Any single pause > max duration = 0 score
  if (maxPauseDuration > MAX_PAUSE_DURATION) {
    return {
      pauseCount: pauses.length,
      avgPauseDuration: Math.round(avgDuration * 100) / 100,
      maxPauseDuration: Math.round(maxPauseDuration * 100) / 100,
      score: 0,
      tag: "FLUIDITY",
    };
  }

  // CRITICAL FAILURE: Too many pauses = 0 score
  if (pauses.length > MAX_PAUSE_COUNT) {
    return {
      pauseCount: pauses.length,
      avgPauseDuration: Math.round(avgDuration * 100) / 100,
      maxPauseDuration: Math.round(maxPauseDuration * 100) / 100,
      score: 0,
      tag: "FLUIDITY",
    };
  }

  // Score decreases based on pause count and duration
  // Start from 100, penalize for pauses
  let score = 100;

  // Penalty for each pause (fewer pauses = better)
  const pauseCountPenalty = (pauses.length / MAX_PAUSE_COUNT) * 30;
  score -= pauseCountPenalty;

  // Penalty based on max pause duration relative to threshold
  const maxPauseRatio = maxPauseDuration / MAX_PAUSE_DURATION;
  score -= Math.round(maxPauseRatio * 40);

  // Penalty for pauses approaching critical threshold (>50% of max)
  const warningPauses = pauses.filter((p) => p.duration > MAX_PAUSE_DURATION * 0.5);
  score -= warningPauses.length * 10;

  return {
    pauseCount: pauses.length,
    avgPauseDuration: Math.round(avgDuration * 100) / 100,
    maxPauseDuration: Math.round(maxPauseDuration * 100) / 100,
    score: Math.round(Math.max(0, Math.min(100, score))),
    tag: "FLUIDITY",
  };
}

// Main Analysis Function - uses configured weights (sync version for energy peaks)
export function analyzeAudio(audioBuffer: Float32Array, sampleRate: number): AnalysisResult {
  const duration = audioBuffer.length / sampleRate;
  const config = getConfig();

  const volume = calculateVolumeLevel(audioBuffer);
  const speechRate = calculateSpeechRate(audioBuffer, sampleRate, duration, volume.averageDb);
  const acceleration = calculateAcceleration(audioBuffer, sampleRate);
  const responseTime = calculateResponseTime(audioBuffer, sampleRate);
  const pauseManagement = calculatePauseManagement(audioBuffer, sampleRate, duration);

  // Get weights from config (defaults: volume 30%, speech 30%, response 10%, pause 15%, acceleration 15%)
  const volumeWeight = (config.find((m) => m.id === "volume")?.weight ?? 30) / 100;
  const speechWeight = (config.find((m) => m.id === "speechRate")?.weight ?? 30) / 100;
  const accelerationWeight = (config.find((m) => m.id === "acceleration")?.weight ?? 15) / 100;
  const responseWeight = (config.find((m) => m.id === "responseTime")?.weight ?? 10) / 100;
  const pauseWeight = (config.find((m) => m.id === "pauseManagement")?.weight ?? 15) / 100;

  const overallScore = Math.min(
    100,
    Math.round(
      volume.score * volumeWeight +
        speechRate.score * speechWeight +
        acceleration.score * accelerationWeight +
        responseTime.score * responseWeight +
        pauseManagement.score * pauseWeight,
    ),
  );

  let emotionalFeedback: "excellent" | "good" | "poor";
  if (overallScore >= 71) {
    emotionalFeedback = "excellent";
  } else if (overallScore >= 41) {
    emotionalFeedback = "good";
  } else {
    emotionalFeedback = "poor";
  }

  return {
    volume,
    speechRate,
    acceleration,
    responseTime,
    pauseManagement,
    overallScore,
    emotionalFeedback,
  };
}

// Async Analysis Function - supports both methods including STT
export async function analyzeAudioAsync(
  audioBuffer: Float32Array,
  sampleRate: number,
  audioBase64?: string,
): Promise<AnalysisResult> {
  const duration = audioBuffer.length / sampleRate;
  const config = getConfig();
  const method = getSpeechRateMethod();

  const volume = calculateVolumeLevel(audioBuffer);

  // Use STT method if configured and audioBase64 is available
  let speechRate: SpeechRateResult;
  if (method === "deepgram-stt" && audioBase64) {
    speechRate = await calculateSpeechRateWithSTT(audioBase64, duration);
  } else {
    speechRate = calculateSpeechRate(audioBuffer, sampleRate, duration, volume.averageDb);
  }

  const acceleration = calculateAcceleration(audioBuffer, sampleRate);
  const responseTime = calculateResponseTime(audioBuffer, sampleRate);
  const pauseManagement = calculatePauseManagement(audioBuffer, sampleRate, duration);

  // Get weights from config
  const volumeWeight = (config.find((m) => m.id === "volume")?.weight ?? 30) / 100;
  const speechWeight = (config.find((m) => m.id === "speechRate")?.weight ?? 30) / 100;
  const accelerationWeight = (config.find((m) => m.id === "acceleration")?.weight ?? 15) / 100;
  const responseWeight = (config.find((m) => m.id === "responseTime")?.weight ?? 10) / 100;
  const pauseWeight = (config.find((m) => m.id === "pauseManagement")?.weight ?? 15) / 100;

  const overallScore = Math.min(
    100,
    Math.round(
      volume.score * volumeWeight +
        speechRate.score * speechWeight +
        acceleration.score * accelerationWeight +
        responseTime.score * responseWeight +
        pauseManagement.score * pauseWeight,
    ),
  );

  let emotionalFeedback: "excellent" | "good" | "poor";
  if (overallScore >= 71) {
    emotionalFeedback = "excellent";
  } else if (overallScore >= 41) {
    emotionalFeedback = "good";
  } else {
    emotionalFeedback = "poor";
  }

  return {
    volume,
    speechRate,
    acceleration,
    responseTime,
    pauseManagement,
    overallScore,
    emotionalFeedback,
  };
}

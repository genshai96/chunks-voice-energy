import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { RecordButton } from '@/components/RecordButton';
import { RecordingTimer } from '@/components/RecordingTimer';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { ResultsView } from '@/components/ResultsView';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { analyzeAudio, AnalysisResult } from '@/lib/audioAnalysis';

type AppState = 'idle' | 'recording' | 'processing' | 'results';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const {
    isRecording,
    recordingTime,
    audioBuffer,
    sampleRate,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    getAudioLevel,
  } = useAudioRecorder();

  // Update audio level for visualization
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      setAudioLevel(getAudioLevel());
    }, 50);
    
    return () => clearInterval(interval);
  }, [isRecording, getAudioLevel]);

  // Process audio when recording stops
  useEffect(() => {
    if (audioBuffer && appState === 'processing') {
      const analysisResults = analyzeAudio(audioBuffer, sampleRate);
      
      // Small delay for UX
      setTimeout(() => {
        setResults(analysisResults);
        setAppState('results');
      }, 1000);
    }
  }, [audioBuffer, sampleRate, appState]);

  const handleStartRecording = useCallback(async () => {
    setResults(null);
    await startRecording();
    setAppState('recording');
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    setAppState('processing');
    await stopRecording();
  }, [stopRecording]);

  const handleRetry = useCallback(() => {
    resetRecording();
    setResults(null);
    setAppState('idle');
  }, [resetRecording]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-foreground overflow-hidden relative">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <AnimatePresence mode="wait">
            {appState !== 'results' ? (
              <motion.div
                key="recording"
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {/* Timer */}
                <div className="mb-8">
                  <RecordingTimer 
                    seconds={recordingTime} 
                    isRecording={isRecording} 
                  />
                </div>
                
                {/* Audio Visualizer */}
                <AudioVisualizer 
                  isRecording={isRecording} 
                  getAudioLevel={getAudioLevel}
                />
                
                {/* Record Button */}
                <div className="my-8">
                  <RecordButton
                    isRecording={isRecording}
                    isProcessing={appState === 'processing'}
                    audioLevel={audioLevel}
                    onStart={handleStartRecording}
                    onStop={handleStopRecording}
                  />
                </div>
                
                {/* Error message */}
                {error && (
                  <motion.p
                    className="text-destructive text-sm mt-4 text-center max-w-xs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
                
                {/* Instructions */}
                {appState === 'idle' && (
                  <motion.div
                    className="mt-16 text-center max-w-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Measure your vocal energy across 5 key metrics: Volume, Speed, 
                      Dynamics, Response Time, and Flow.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="results"
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {results && (
                  <ResultsView results={results} onRetry={handleRetry} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-xs text-muted-foreground/50">
            Voice Energy Measurement App
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;

import { Info, Waves, Mic, TrendingUp, Clock, Pause } from 'lucide-react';

interface MetricMethodInfoProps {
  metricId: string;
}

const methodDescriptions: Record<string, {
  title: string;
  titleVi: string;
  icon: React.ReactNode;
  method: string;
  description: string;
  descriptionVi: string;
  formula?: string;
  details: string[];
}> = {
  volume: {
    title: 'RMS Volume Detection',
    titleVi: 'Phát hiện âm lượng RMS',
    icon: <Waves className="w-4 h-4" />,
    method: 'Root Mean Square (RMS)',
    description: 'Calculates average audio energy level using RMS algorithm, then converts to decibel (dB) scale.',
    descriptionVi: 'Tính năng lượng âm thanh trung bình bằng thuật toán RMS, sau đó chuyển đổi sang thang dB.',
    formula: 'dB = 20 × log₁₀(RMS)',
    details: [
      'Analyzes raw audio buffer samples',
      'Squares each sample value',
      'Calculates mean of squared values',
      'Takes square root for RMS',
      'Converts to decibel scale'
    ]
  },
  speechRate: {
    title: 'Speech Rate Detection',
    titleVi: 'Phát hiện tốc độ nói',
    icon: <Mic className="w-4 h-4" />,
    method: 'Energy Peaks / Speech-to-Text',
    description: 'Detects syllables via energy peaks or uses AI transcription for accurate word count.',
    descriptionVi: 'Phát hiện âm tiết qua đỉnh năng lượng hoặc sử dụng AI phiên âm để đếm từ chính xác.',
    formula: 'WPM = (wordCount / duration) × 60',
    details: [
      'Energy Peaks: Detects syllables from audio energy spikes',
      'STT (Deepgram): Transcribes audio to text',
      'Counts words/syllables per minute',
      'Volume-compensated threshold for quiet speech',
      'Returns Words Per Minute (WPM)'
    ]
  },
  acceleration: {
    title: 'Energy Acceleration',
    titleVi: 'Tăng tốc năng lượng',
    icon: <TrendingUp className="w-4 h-4" />,
    method: 'Segment Comparison',
    description: 'Compares volume and speech rate between first and second half of recording.',
    descriptionVi: 'So sánh âm lượng và tốc độ nói giữa nửa đầu và nửa sau của bản ghi.',
    formula: 'Score based on: ΔVolume + ΔSpeechRate',
    details: [
      'Splits audio into 2 equal segments',
      'Measures volume (dB) for each half',
      'Measures speech rate for each half',
      'Calculates improvement ratio',
      'Awards points if 2nd half > 1st half'
    ]
  },
  responseTime: {
    title: 'Voice Onset Detection',
    titleVi: 'Phát hiện thời điểm bắt đầu nói',
    icon: <Clock className="w-4 h-4" />,
    method: 'Threshold Crossing',
    description: 'Measures time from recording start until voice energy exceeds threshold.',
    descriptionVi: 'Đo thời gian từ lúc bắt đầu ghi đến khi năng lượng giọng nói vượt ngưỡng.',
    formula: 'responseTime = firstVoiceFrame / sampleRate',
    details: [
      'Scans audio from the beginning',
      'Uses -35dB as voice detection threshold',
      'Finds first frame exceeding threshold',
      'Converts frame index to milliseconds',
      'Lower time = faster response = higher score'
    ]
  },
  pauseManagement: {
    title: 'Pause Analysis',
    titleVi: 'Phân tích khoảng dừng',
    icon: <Pause className="w-4 h-4" />,
    method: 'Silence Detection',
    description: 'Detects silent periods and measures their count and duration.',
    descriptionVi: 'Phát hiện các khoảng im lặng và đo số lượng cùng thời lượng của chúng.',
    formula: 'Score: 100 if no pauses, else check limits',
    details: [
      'Scans for silent segments (< -40dB)',
      'Minimum pause duration: 300ms',
      'Counts total number of pauses',
      'Measures longest pause duration',
      '0 score if exceeds max count/duration'
    ]
  }
};

export function MetricMethodInfo({ metricId }: MetricMethodInfoProps) {
  const info = methodDescriptions[metricId];
  
  if (!info) return null;

  return (
    <div className="glass-card p-5 border border-primary/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {info.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground">{info.title}</h4>
            <Info className="w-3 h-3 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">{info.titleVi}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Method Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Method:</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/50 text-accent-foreground">
            {info.method}
          </span>
        </div>

        {/* Description */}
        <div className="text-sm text-foreground/80">
          {info.description}
        </div>

        {/* Formula */}
        {info.formula && (
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <code className="text-xs font-mono text-primary">
              {info.formula}
            </code>
          </div>
        )}

        {/* Details */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            How it works:
          </span>
          <ul className="space-y-1">
            {info.details.map((detail, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-foreground/70">
                <span className="text-primary mt-0.5">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

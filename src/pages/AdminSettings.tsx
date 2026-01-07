import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Volume2, Zap, TrendingUp, Clock, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MetricConfigCard } from '@/components/admin/MetricConfigCard';
import { ScoreRangeChart } from '@/components/admin/ScoreRangeChart';
import { toast } from '@/hooks/use-toast';

export interface MetricConfig {
  id: string;
  name: string;
  nameVi: string;
  icon: React.ReactNode;
  weight: number;
  tag: string;
  tagColor: string;
  thresholds: {
    min: number;
    ideal: number;
    max: number;
  };
  labels: {
    low: string;
    ideal: string;
    high: string;
  };
  unit: string;
}

const defaultMetrics: MetricConfig[] = [
  {
    id: 'volume',
    name: 'Volume Level',
    nameVi: 'Độ lớn âm thanh',
    icon: <Volume2 className="w-5 h-5" />,
    weight: 30,
    tag: 'ENERGY',
    tagColor: 'tag-energy',
    thresholds: { min: -40, ideal: -10, max: 0 },
    labels: { low: 'Too Quiet', ideal: 'Perfect', high: 'Too Loud' },
    unit: 'dB'
  },
  {
    id: 'speechRate',
    name: 'Speech Rate',
    nameVi: 'Tốc độ nói',
    icon: <Zap className="w-5 h-5" />,
    weight: 30,
    tag: 'FLUENCY',
    tagColor: 'tag-fluency',
    thresholds: { min: 80, ideal: 160, max: 220 },
    labels: { low: 'Too Slow', ideal: 'Optimal', high: 'Too Fast' },
    unit: 'WPM'
  },
  {
    id: 'acceleration',
    name: 'Acceleration',
    nameVi: 'Tăng tốc & âm lượng',
    icon: <TrendingUp className="w-5 h-5" />,
    weight: 15,
    tag: 'DYNAMICS',
    tagColor: 'tag-dynamics',
    thresholds: { min: 0, ideal: 50, max: 100 },
    labels: { low: 'Flat', ideal: 'Dynamic', high: 'Energetic' },
    unit: '%'
  },
  {
    id: 'responseTime',
    name: 'Response Time',
    nameVi: 'Tốc độ phản hồi',
    icon: <Clock className="w-5 h-5" />,
    weight: 10,
    tag: 'READINESS',
    tagColor: 'tag-readiness',
    thresholds: { min: 2000, ideal: 200, max: 0 },
    labels: { low: 'Slow Start', ideal: 'Quick', high: 'Instant' },
    unit: 'ms'
  },
  {
    id: 'pauseManagement',
    name: 'Pause Management',
    nameVi: 'Quản lý ngừng nghỉ',
    icon: <Pause className="w-5 h-5" />,
    weight: 15,
    tag: 'FLUIDITY',
    tagColor: 'tag-fluidity',
    thresholds: { min: 0, ideal: 0, max: 2.71 },
    labels: { low: 'Perfect (No Pause)', ideal: 'Fluent', high: 'Critical (>2.71s)' },
    unit: 's max'
  },
];

export default function AdminSettings() {
  const [metrics, setMetrics] = useState<MetricConfig[]>(defaultMetrics);
  const [selectedMetric, setSelectedMetric] = useState<string>('volume');

  const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);

  const handleWeightChange = (id: string, newWeight: number) => {
    setMetrics(prev => prev.map(m => 
      m.id === id ? { ...m, weight: newWeight } : m
    ));
  };

  const handleThresholdChange = (id: string, key: 'min' | 'ideal' | 'max', value: number) => {
    setMetrics(prev => prev.map(m => 
      m.id === id ? { ...m, thresholds: { ...m.thresholds, [key]: value } } : m
    ));
  };

  const handleSave = () => {
    // In a real app, this would save to the database
    localStorage.setItem('metricConfig', JSON.stringify(metrics));
    toast({
      title: "Settings Saved",
      description: "Your metric configuration has been saved.",
    });
  };

  const currentMetric = metrics.find(m => m.id === selectedMetric);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Admin Settings</h1>
              <p className="text-sm text-muted-foreground">Configure metrics & scoring</p>
            </div>
          </div>
          <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Metrics List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">
              Metrics Configuration
            </h2>
            
            {/* Weight Summary */}
            <div className={`glass-card p-4 mb-6 ${totalWeight !== 100 ? 'border-destructive' : 'border-energy-green/30'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Weight</span>
                <span className={`text-2xl font-bold ${totalWeight !== 100 ? 'text-destructive' : 'text-energy-green'}`}>
                  {totalWeight}%
                </span>
              </div>
              {totalWeight !== 100 && (
                <p className="text-xs text-destructive mt-2">
                  Weights must equal 100%
                </p>
              )}
            </div>

            {/* Metric Cards */}
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MetricConfigCard
                  metric={metric}
                  isSelected={selectedMetric === metric.id}
                  onClick={() => setSelectedMetric(metric.id)}
                  onWeightChange={(w) => handleWeightChange(metric.id, w)}
                />
              </motion.div>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {currentMetric && (
              <motion.div
                key={currentMetric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Metric Header */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl bg-${currentMetric.tagColor}/20 text-${currentMetric.tagColor}`}>
                      {currentMetric.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-foreground">
                        {currentMetric.name}
                      </h3>
                      <p className="text-muted-foreground">{currentMetric.nameVi}</p>
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium bg-${currentMetric.tagColor}/20 text-${currentMetric.tagColor} border border-${currentMetric.tagColor}/30`}>
                      {currentMetric.tag}
                    </span>
                  </div>

                  {/* Score Range Chart */}
                  <ScoreRangeChart metric={currentMetric} />
                </div>

                {/* Threshold Configuration */}
                <div className="glass-card p-6">
                  <h4 className="text-lg font-display font-semibold text-foreground mb-6">
                    Threshold Configuration
                  </h4>
                  
                  <div className="space-y-8">
                    {/* Min Threshold */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-foreground">
                          Minimum ({currentMetric.labels.low})
                        </label>
                        <span className="text-sm text-muted-foreground">
                          {currentMetric.thresholds.min} {currentMetric.unit}
                        </span>
                      </div>
                      <Slider
                        value={[currentMetric.thresholds.min]}
                        onValueChange={([v]) => handleThresholdChange(currentMetric.id, 'min', v)}
                        min={currentMetric.id === 'volume' ? -60 : 0}
                        max={currentMetric.id === 'volume' ? 0 : 300}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Ideal Threshold */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-foreground">
                          Ideal Target ({currentMetric.labels.ideal})
                        </label>
                        <span className="text-sm text-energy-green">
                          {currentMetric.thresholds.ideal} {currentMetric.unit}
                        </span>
                      </div>
                      <Slider
                        value={[currentMetric.thresholds.ideal]}
                        onValueChange={([v]) => handleThresholdChange(currentMetric.id, 'ideal', v)}
                        min={currentMetric.id === 'volume' ? -60 : 0}
                        max={currentMetric.id === 'volume' ? 0 : 300}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Max Threshold */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-foreground">
                          Maximum ({currentMetric.labels.high})
                        </label>
                        <span className="text-sm text-muted-foreground">
                          {currentMetric.thresholds.max} {currentMetric.unit}
                        </span>
                      </div>
                      <Slider
                        value={[currentMetric.thresholds.max]}
                        onValueChange={([v]) => handleThresholdChange(currentMetric.id, 'max', v)}
                        min={currentMetric.id === 'volume' ? -60 : 0}
                        max={currentMetric.id === 'volume' ? 0 : 300}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Tags Legend */}
                <div className="glass-card p-6">
                  <h4 className="text-lg font-display font-semibold text-foreground mb-4">
                    Performance Tags
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-energy-red/10 border border-energy-red/30">
                      <span className="text-energy-red text-sm font-medium">{currentMetric.labels.low}</span>
                      <p className="text-xs text-muted-foreground mt-1">Below threshold</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-energy-green/10 border border-energy-green/30">
                      <span className="text-energy-green text-sm font-medium">{currentMetric.labels.ideal}</span>
                      <p className="text-xs text-muted-foreground mt-1">Target range</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-energy-yellow/10 border border-energy-yellow/30">
                      <span className="text-energy-yellow text-sm font-medium">{currentMetric.labels.high}</span>
                      <p className="text-xs text-muted-foreground mt-1">Above threshold</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

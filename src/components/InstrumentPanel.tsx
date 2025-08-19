import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';

export interface InstrumentConfig {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  volume: number;
}

interface InstrumentPanelProps {
  instruments: InstrumentConfig[];
  tempo: number[];
  masterVolume: number[];
  onToggleInstrument: (instrumentId: string) => void;
  onVolumeChange: (instrumentId: string, volume: number) => void;
  onTempoChange: (tempo: number[]) => void;
  onMasterVolumeChange: (volume: number[]) => void;
  onTrackChange: (direction: 'next' | 'prev') => void;
}

export const InstrumentPanel = ({ 
  instruments, 
  tempo,
  masterVolume,
  onToggleInstrument, 
  onVolumeChange,
  onTempoChange,
  onMasterVolumeChange, 
  onTrackChange 
}: InstrumentPanelProps) => {
  return (
    <div className="space-y-6">
      {/* Transport Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="text-center">
            <label className="text-lg font-semibold mb-3 block">Tempo</label>
            <div className="text-2xl font-mono mb-2">{tempo[0]} BPM</div>
            <Slider
              value={tempo}
              onValueChange={onTempoChange}
              min={40}
              max={120}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <label className="text-lg font-semibold mb-3 block flex items-center justify-center gap-2">
              <Volume2 className="w-5 h-5" />
              Master Volume
            </label>
            <div className="text-xl font-mono mb-2">{Math.round(masterVolume[0] * 100)}%</div>
            <Slider
              value={masterVolume}
              onValueChange={onMasterVolumeChange}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Instruments */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Instruments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {instruments.map((instrument) => (
        <div key={instrument.id} className="space-y-3">
          <div 
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
              instrument.active 
                ? 'border-primary/50 bg-primary/10 shadow-lg scale-105' 
                : 'border-border hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.02]'
            }`}
            onClick={() => onToggleInstrument(instrument.id)}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{instrument.icon}</div>
              <Badge variant={instrument.active ? "default" : "outline"}>
                {instrument.name}
              </Badge>
            </div>
          </div>
          
          {instrument.active && (
            <div className="space-y-3">
                  {/* Field Recordings Controls */}
                  {instrument.id === 'fieldRecordings' && (
                    <div className="bg-card/50 p-3 rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">Track Controls</div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onTrackChange('prev')}
                          className="flex-1 text-xs py-1"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onTrackChange('next')}
                          className="flex-1 text-xs py-1"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
              
              {/* Volume Control */}
              <div className="px-2">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Volume: {Math.round(instrument.volume * 100)}%
                </label>
                <Slider
                  value={[instrument.volume * 100]}
                  onValueChange={(value) => onVolumeChange(instrument.id, value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      ))}
        </div>
      </div>
    </div>
  );
};
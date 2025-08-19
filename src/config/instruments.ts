import { InstrumentConfig } from '@/components/InstrumentPanel';

export const DEFAULT_INSTRUMENTS: InstrumentConfig[] = [
  { id: 'pad', name: 'Pad', icon: '🌊', active: true, volume: 0.05 },
  { id: 'piano', name: 'Piano', icon: '🎹', active: true, volume: 0.65 },
  { id: 'synth', name: 'Synth', icon: '🎛️', active: true, volume: 0.05 },
  { id: 'bell', name: 'Bell', icon: '🔔', active: true, volume: 0.05 },
  { id: 'bass', name: 'Bass', icon: '🎵', active: false, volume: 0.4 },
  { id: 'fieldRecordings', name: 'Field Recordings', icon: '🎙️', active: true, volume: 0.2 },
];

export const INSTRUMENT_SETTINGS = {
  DEFAULT_VOLUME: 0.5,
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
  VOLUME_STEP: 0.1,
} as const;
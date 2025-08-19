import * as Tone from 'tone';
import { InstrumentConfig } from '@/components/InstrumentPanel';
import { AudioSystemRefs } from '@/hooks/useAudioSystem';

export const toggleInstrument = (
  instruments: InstrumentConfig[],
  instrumentId: string
): InstrumentConfig[] => {
  return instruments.map(inst => 
    inst.id === instrumentId 
      ? { ...inst, active: !inst.active }
      : inst
  );
};

export const updateInstrumentVolume = (
  instruments: InstrumentConfig[],
  instrumentId: string,
  volume: number,
  audioSystem: AudioSystemRefs,
  soundCloudSetVolume?: (volume: number) => void
): InstrumentConfig[] => {
  const newVolume = volume / 100;
  
  // Update Tone.js synth volume immediately
  const synth = audioSystem.synthsRef.current.get(instrumentId);
  if (synth) {
    synth.volume.value = Tone.gainToDb(newVolume);
  }
  
  // Update SoundCloud widget volume for field recordings
  if (instrumentId === 'fieldRecordings' && soundCloudSetVolume) {
    soundCloudSetVolume(newVolume * 100);
  }
  
  return instruments.map(inst =>
    inst.id === instrumentId
      ? { ...inst, volume: newVolume }
      : inst
  );
};

export const getActiveInstruments = (instruments: InstrumentConfig[]): InstrumentConfig[] => {
  return instruments.filter(instrument => instrument.active);
};

export const getInstrumentById = (
  instruments: InstrumentConfig[], 
  id: string
): InstrumentConfig | undefined => {
  return instruments.find(instrument => instrument.id === id);
};
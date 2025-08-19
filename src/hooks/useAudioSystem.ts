import { useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { createGlobalEffects } from '@/audio/effects';
import {
  createPadInstrument,
  createPianoInstrument,
  createSynthInstrument,
  createBellInstrument,
  createBassInstrument,
  InstrumentConfig
} from '@/audio/instruments';

export interface AudioSystemRefs {
  synthsRef: React.MutableRefObject<Map<string, Tone.Synth | Tone.PolySynth | Tone.FMSynth | Tone.AMSynth | Tone.PolySynth<Tone.DuoSynth>>>;
  effectsRef: React.MutableRefObject<Map<string, any>>;
  instrumentConfigsRef: React.MutableRefObject<Map<string, InstrumentConfig>>;
  loopsRef: React.MutableRefObject<Map<string, Tone.Loop>>;
  masterGainRef: React.MutableRefObject<Tone.Gain | null>;
}

export const useAudioSystem = () => {
  const synthsRef = useRef<Map<string, Tone.Synth | Tone.PolySynth | Tone.FMSynth | Tone.AMSynth | Tone.PolySynth<Tone.DuoSynth>>>(new Map());
  const effectsRef = useRef<Map<string, any>>(new Map());
  const instrumentConfigsRef = useRef<Map<string, InstrumentConfig>>(new Map());
  const loopsRef = useRef<Map<string, Tone.Loop>>(new Map());
  const masterGainRef = useRef<Tone.Gain | null>(null);

  const initializeAudio = async (masterVolume: number) => {
    try {
      // Initialize master gain
      masterGainRef.current = new Tone.Gain(masterVolume).toDestination();
      
      // Create global effects
      const globalEffects = await createGlobalEffects();
      
      effectsRef.current.set('reverb', globalEffects.reverb);
      effectsRef.current.set('delay', globalEffects.delay);
      effectsRef.current.set('filter', globalEffects.filter);
      effectsRef.current.set('chorus', globalEffects.chorus);
      
      // Create synthesizers after effects are ready
      await createSynthesizers();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Tone.js:', error);
      return false;
    }
  };

  const createSynthesizers = async () => {
    const reverb = effectsRef.current.get('reverb');
    const delay = effectsRef.current.get('delay');
    const filter = effectsRef.current.get('filter');
    const chorus = effectsRef.current.get('chorus');
    
    if (!reverb || !delay || !filter || !chorus || !masterGainRef.current) {
      console.error('Effects not ready for synthesizer creation');
      return;
    }
    
    // Clear existing synths and configs
    synthsRef.current.forEach(synth => synth.dispose());
    synthsRef.current.clear();
    instrumentConfigsRef.current.forEach(config => {
      config.effects.forEach(effect => effect.dispose());
    });
    instrumentConfigsRef.current.clear();
    
    try {
      // Create instruments using individual instrument files
      const padConfig = await createPadInstrument(masterGainRef.current);
      const pianoConfig = await createPianoInstrument(masterGainRef.current!);
      const synthConfig = await createSynthInstrument(masterGainRef.current);
      const bellConfig = await createBellInstrument(masterGainRef.current);
      const bassConfig = createBassInstrument(masterGainRef.current);
      
      // Store synths and configs
      synthsRef.current.set('pad', padConfig.synth);
      synthsRef.current.set('piano', pianoConfig.synth);
      synthsRef.current.set('synth', synthConfig.synth);
      synthsRef.current.set('bell', bellConfig.synth);
      synthsRef.current.set('bass', bassConfig.synth);
      
      instrumentConfigsRef.current.set('pad', padConfig);
      instrumentConfigsRef.current.set('piano', pianoConfig);
      instrumentConfigsRef.current.set('synth', synthConfig);
      instrumentConfigsRef.current.set('bell', bellConfig);
      instrumentConfigsRef.current.set('bass', bassConfig);
      
      console.log('Synthesizers created successfully:', Array.from(synthsRef.current.keys()));
    } catch (error) {
      console.error('Error creating synthesizers:', error);
    }
  };

  const cleanup = () => {
    synthsRef.current.forEach(synth => synth.dispose());
    effectsRef.current.forEach(effect => effect.dispose());
    instrumentConfigsRef.current.forEach(config => {
      config.effects.forEach(effect => effect.dispose());
    });
    loopsRef.current.forEach(loop => loop.dispose());
    masterGainRef.current?.dispose();
  };

  return {
    synthsRef,
    effectsRef,
    instrumentConfigsRef,
    loopsRef,
    masterGainRef,
    initializeAudio,
    cleanup
  };
};
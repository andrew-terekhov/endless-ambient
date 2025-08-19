import * as Tone from 'tone';
import { musicalScales } from '@/components/MoodSelector';
import type { InstrumentConfig } from '@/components/InstrumentPanel';
import type { AudioSystemRefs } from '@/hooks/useAudioSystem';

export const getMoodNoteSequence = (scaleName: string, instrumentId: string): string[] => {
  const currentScale = musicalScales.find(s => s.name === scaleName);
  if (!currentScale) return ['C3', 'E3', 'G3'];
  
  // Generate notes in appropriate octaves for each instrument - capped at C5
  const octaveMap: Record<string, number[]> = {
    pad: [2, 3, 4],      // Lower pad tones
    piano: [3, 4],       // Mid-range melody (capped at 4)
    synth: [3, 4, 5],    // Lead synth range (capped at 5)
    bell: [4, 5],        // Higher bell tones (capped at 5)
    bass: [1, 2]         // Deep bass notes
  };
  
  const octaves = octaveMap[instrumentId] || [4];
  const notes: string[] = [];
  
  // Generate notes from the scale in the appropriate octaves
  octaves.forEach(octave => {
    currentScale.scale.forEach(note => {
      notes.push(note + octave);
    });
  });
  
  return notes;
};

export const getMoodPattern = (scaleName: string, instrumentId: string): string[] => {
  // Map scale characteristics to complementary rhythm patterns that interlock
  const scalePatterns: Record<string, Record<string, string[]>> = {
    Lydian: { // Bright, floating - staggered entries
      pad: ['1n', '2n.'], piano: ['4n.', '8n', '2n'], synth: ['8n', '4n', '8n.'], bell: ['2n.', '1n'], bass: ['1n.', '0:0:8']
    },
    Dorian: { // Cool, cinematic - offset rhythms
      pad: ['2n', '1n.'], piano: ['8n.', '4n', '8n'], synth: ['4n', '8n.', '4n'], bell: ['1n.', '2n'], bass: ['1n', '0:0:6']
    },
    Aeolian: { // Warm melancholy - flowing patterns  
      pad: ['2n.', '1n'], piano: ['4n.', '8n.', '4n'], synth: ['8n.', '4n.', '8n'], bell: ['2n', '1n.'], bass: ['1n.', '0:0:8']
    },
    Mixolydian: { // Bright with soft tension - interlocked
      pad: ['2n', '2n.'], piano: ['8n', '4n.'], synth: ['4n.', '8n', '4n'], bell: ['1n', '2n.'], bass: ['1n', '0:0:6']
    },
    Phrygian: { // Misty, exotic - sparse and mysterious
      pad: ['1n.', '2n.'], piano: ['4n', '8n.'], synth: ['8n.', '4n'], bell: ['2n.', '1n.'], bass: ['0:0:8', '1n.']
    },
    'Whole Tone': { // Floating weightlessness - dreamlike spacing
      pad: ['1n', '2n.'], piano: ['8n.', '4n.'], synth: ['4n.', '8n.'], bell: ['2n', '1n.'], bass: ['1n.', '0:0:8']
    },
    'Pentatonic Major': { // Clear watercolor tones - clean spacing
      pad: ['2n', '1n.'], piano: ['4n', '8n.'], synth: ['8n', '4n.'], bell: ['1n.', '2n'], bass: ['1n', '0:0:6']
    },
    Hirajoshi: { // Glassy meditation - zen-like spacing
      pad: ['1n.', '2n'], piano: ['8n.', '4n.'], synth: ['4n.', '8n'], bell: ['2n.', '1n'], bass: ['0:0:8', '1n.']
    }
  };
  
  return scalePatterns[scaleName]?.[instrumentId] || scalePatterns.Lydian[instrumentId];
};

export const getChordFromNote = (rootNote: string, scaleName: string): string[] => {
  const currentScale = musicalScales.find(s => s.name === scaleName);
  if (!currentScale) return ['C4', 'E4', 'G4'];
  
  const octave = rootNote.match(/\d/)?.[0] || '4';
  const noteWithoutOctave = rootNote.replace(/\d/, '');
  
  // Find the root note index in the scale
  const rootIndex = currentScale.scale.indexOf(noteWithoutOctave);
  if (rootIndex === -1) return [rootNote];
  
  // Generate harmonically intelligent triads with consonant intervals
  const chordNotes: string[] = [];
  
  // Probability weighting for consonant intervals (favor 3rds and 5ths)
  const intervalWeights = [1.0, 0.3, 0.8, 0.4, 0.9, 0.2, 0.7]; // 1st, 2nd, 3rd, 4th, 5th, 6th, 7th
  
  // Always include root
  chordNotes.push(rootNote);
  
  // Add 3rd and 5th with slight probability variation for organic feel
  for (let i = 1; i < 3; i++) {
    const intervalIndex = i * 2; // 3rd (index 2), 5th (index 4)
    if (Math.random() < intervalWeights[intervalIndex]) {
      const scaleIndex = (rootIndex + intervalIndex) % currentScale.scale.length;
      chordNotes.push(currentScale.scale[scaleIndex] + octave);
    }
  }
  
  return chordNotes;
};

export const getLoopInterval = (scaleName: string, instrumentId: string): string => {
  const intervals: Record<string, Record<string, string>> = {
    Lydian: { pad: '2n', piano: '1n.', synth: '1n', bell: '2n.', bass: '0:0:8' },
    Dorian: { pad: '2n.', piano: '1n', synth: '1n.', bell: '2n', bass: '1n.' },
    Aeolian: { pad: '1n', piano: '2n', synth: '1n', bell: '1n.', bass: '1n' },
    Mixolydian: { pad: '2n', piano: '1n.', synth: '1n.', bell: '2n.', bass: '1n.' },
    Phrygian: { pad: '1n.', piano: '2n.', synth: '2n', bell: '1n', bass: '2n' },
    'Whole Tone': { pad: '2n.', piano: '1n', synth: '1n', bell: '2n', bass: '1n.' },
    'Pentatonic Major': { pad: '2n', piano: '1n', synth: '1n.', bell: '2n.', bass: '1n.' },
    Hirajoshi: { pad: '1n.', piano: '2n', synth: '2n.', bell: '1n.', bass: '2n.' }
  };
  
  return intervals[scaleName]?.[instrumentId] || '2n';
};

export const generateAmbientMusic = async (
  audioRefs: AudioSystemRefs,
  instruments: InstrumentConfig[],
  currentMood: string,
  tempo: number,
  onFieldRecordingsPlay?: () => void
) => {
  if (Tone.Transport.state === 'stopped') {
    await Tone.start();
  }
  
  // Clear existing loops
  audioRefs.loopsRef.current.forEach(loop => {
    loop.stop();
    loop.dispose();
  });
  audioRefs.loopsRef.current.clear();
  
  // Set tempo
  Tone.Transport.bpm.value = tempo;
  
  // Generate loops for each active instrument
  for (const instrument of instruments) {
    console.log(`Processing instrument: ${instrument.id}, active: ${instrument.active}`);
    if (!instrument.active) continue;
    
    // Handle field recordings separately
    if (instrument.id === 'fieldRecordings') {
      console.log('Activating field recordings (SoundCloud)');
      onFieldRecordingsPlay?.();
      continue;
    }
    
    const synth = audioRefs.synthsRef.current.get(instrument.id);
    console.log(`Synth for ${instrument.id}:`, !!synth);
    if (!synth) {
      console.warn(`Synth not found for instrument: ${instrument.id}`);
      continue;
    }
    
    try {
      // Set instrument volume
      synth.volume.value = Tone.gainToDb(instrument.volume);
      
      const notes = getMoodNoteSequence(currentMood, instrument.id);
      const pattern = getMoodPattern(currentMood, instrument.id);
      const loopInterval = getLoopInterval(currentMood, instrument.id);
      
      console.log(`Creating loop for ${instrument.id} - Notes:`, notes.slice(0, 3), 'Pattern:', pattern, 'Interval:', loopInterval);
      
      const loop = new Tone.Loop((time) => {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const duration = pattern[Math.floor(Math.random() * pattern.length)];
        
        // Add slight humanization to timing (±20ms)
        const humanizedTime = time + (Math.random() - 0.5) * 0.02;
        
        if (instrument.id === 'piano' || instrument.id === 'pad') {
          // Play chords for harmonic instruments with intelligent voice leading
          const chord = getChordFromNote(note, currentMood);
          console.log(`Playing chord for ${instrument.id}:`, chord);
          (synth as Tone.PolySynth).triggerAttackRelease(chord, duration, humanizedTime);
        } else {
          console.log(`Playing note for ${instrument.id}:`, note, duration);
          synth.triggerAttackRelease(note, duration, humanizedTime);
        }
      }, loopInterval);
      
      // Stagger start times based on instrument role for better layering
      const startDelayMap: Record<string, number> = {
        bass: 0,           // Foundation starts first
        pad: 0.3,          // Harmonic layer
        piano: 0.6,        // Melodic layer  
        synth: 0.9,        // Lead layer
        bell: 1.2          // Textural layer last
      };
      const startDelay = startDelayMap[instrument.id] || Math.random() * 2;
      loop.start(`+${startDelay}`);
      audioRefs.loopsRef.current.set(instrument.id, loop);
      
      console.log(`✓ Loop created for instrument: ${instrument.id} (starts in ${startDelay.toFixed(2)}s)`);
    } catch (error) {
      console.error(`Error creating loop for ${instrument.id}:`, error);
    }
  }
  
  Tone.Transport.start();
  console.log('Transport started');
};
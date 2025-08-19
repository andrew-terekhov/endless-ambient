import * as Tone from 'tone';

export interface InstrumentConfig {
  synth: Tone.PolySynth | Tone.Synth | Tone.FMSynth | Tone.AMSynth;
  effects: Tone.ToneAudioNode[];
}

// Backward-compatible export + signature
export const createBassInstrument = (masterGain: Tone.Gain): InstrumentConfig => {
  // --- Engine: AMSynth gives a richer, rounder bass than plain Synth (still monophonic)
  const bassSynth = new Tone.AMSynth({
    portamento: 0.03,
    harmonicity: 1.0,
    oscillator: { type: 'sine' as const },         // pure sub core
    modulation: { type: 'triangle' as const },      // gentle inharmonics, not harsh
    envelope: { attack: 0.12, decay: 0.9, sustain: 0.6, release: 3.2 },
    modulationEnvelope: { attack: 0.0, decay: 0.4, sustain: 0.0, release: 1.2 }
  });

  // Give headroom before FX (prevents hidden overdrive on long notes)
  bassSynth.volume.value = -6;

  // --- FX: focused, dark, and stable
  // Remove rumble below the fundamental; keep sub tight
  const subHPF = new Tone.Filter({ type: 'highpass' as const, frequency: 20, Q: 0.707 });

  // Keep bass dark even on higher MIDI notes but allow more fundamental clarity
  const toneLPF = new Tone.Filter({ type: 'lowpass' as const, frequency: 220, Q: 0.8 });

  // Slow movement for ambient without wobble pumping
  const slowAuto = new Tone.AutoFilter({
    frequency: 0.03,                                  // very slow (~33s period)
    type: 'sine' as const,
    baseFrequency: 70,
    octaves: 1.2,
    filter: { type: 'lowpass' as const, rolloff: -24 as const, Q: 0.5 },
    wet: 0.25
  }).start();

  // Tiny saturation to add audibility on small speakers, but keep it clean
  const softSat = new Tone.Distortion({ distortion: 0.05, oversample: '2x', wet: 0.12 });

  // Gentle glue; limiter for safety
  const comp = new Tone.Compressor({ threshold: -30, ratio: 1.8, attack: 0.01, release: 0.22, knee: 8 });
  const limiter = new Tone.Limiter({ threshold: -3 });

  // Chain: synth → HPF → LPF → Slow AutoFilter → Soft Saturation → Comp → Limiter → Master
  bassSynth.chain(subHPF, toneLPF, slowAuto, softSat, comp, limiter, masterGain);

  // Return in your existing shape
  return {
    synth: bassSynth,
    effects: [subHPF, toneLPF, slowAuto, softSat, comp, limiter]
  };
};
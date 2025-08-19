import * as Tone from "tone";

export interface InstrumentConfig {
  synth: Tone.PolySynth;
  effects: Tone.ToneAudioNode[];
}

const AMBIENT_BELL_PRESET = {
  poly: { maxPolyphony: 8 },

  voice: {
    // FMSynth is great for bells
    harmonicity: 2,
    modulationIndex: 8,                   // smoother, less harsh overtones
    oscillator: { type: "sine" as const },
    modulation: { type: "sine" as const },
    envelope: { attack: 0.005, decay: 4.0, sustain: 0.0, release: 6.0 },
    modulationEnvelope: { attack: 0.0, decay: 2.5, sustain: 0.0, release: 5.0 },
    detune: Math.random() * 4 - 2        // slight random detuning for organic feel
  },

  fx: {
    // Gentle LPF to tame harsh highs
    toneLPF: { type: "lowpass" as const, frequency: 4500, Q: 0.7 },
    chorus: { frequency: 0.2, delayTime: 3.5, depth: 0.5, feedback: 0.05, spread: 180, wet: 0.3 },
    pingPong: { delayTime: "3n" as const, feedback: 0.4, wet: 0.35 },
    reverb: { decay: 14, preDelay: 0.1, wet: 0.6 },
    limiter: { threshold: -3 }
  },

  gain: { synthVolumeDb: -8 }
} as const;

export const createBellInstrument = async (masterGain: Tone.Gain): Promise<InstrumentConfig> => {
  // Synth engine (PolySynth of FMSynth voices)
  const synth = new Tone.PolySynth({
    voice: Tone.FMSynth,
    maxPolyphony: AMBIENT_BELL_PRESET.poly.maxPolyphony,
    options: AMBIENT_BELL_PRESET.voice
  });
  synth.volume.value = AMBIENT_BELL_PRESET.gain.synthVolumeDb;

  // FX chain
  const toneLPF  = new Tone.Filter(AMBIENT_BELL_PRESET.fx.toneLPF);
  const chorus   = new Tone.Chorus(AMBIENT_BELL_PRESET.fx.chorus).start();
  const pingPong = new Tone.PingPongDelay(AMBIENT_BELL_PRESET.fx.pingPong);
  const reverb   = new Tone.Reverb(AMBIENT_BELL_PRESET.fx.reverb);
  const limiter  = new Tone.Limiter(AMBIENT_BELL_PRESET.fx.limiter);

  await reverb.ready;

  synth.chain(toneLPF, chorus, pingPong, reverb, limiter, masterGain);

  return { synth, effects: [toneLPF, chorus, pingPong, reverb, limiter] };
};
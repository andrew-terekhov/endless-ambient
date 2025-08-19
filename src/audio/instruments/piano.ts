import * as Tone from "tone";

export interface InstrumentConfig {
  synth: Tone.PolySynth;
  effects: Tone.ToneAudioNode[];
}

const AMBIENT_PIANO_PRESET = {
  poly: { maxPolyphony: 8 },
  voice: {
    harmonicity: 1.0,
    modulationIndex: 2.5,
    oscillator: { type: "sine" as const },
    modulation: { type: "triangle" as const },
    envelope: { attack: 0.01, decay: 1.2, sustain: 0.0, release: 4.5 },   // piano-like
    modulationEnvelope: { attack: 0.0, decay: 0.6, sustain: 0.0, release: 1.5 }
  },
  fx: {
    preHPF: { type: "highpass" as const, frequency: 80, Q: 0.707 },
    chorus: { frequency: 0.25, delayTime: 3.5, depth: 0.4, feedback: 0.05, spread: 180, wet: 0.35 },
    delay: { delayTime: "3n" as const, feedback: 0.25, wet: 0.2 },
    reverb: { decay: 14, preDelay: 0.06, wet: 0.55 },
    limiter: { threshold: -2 }
  }
};

export async function createPianoInstrument(masterGain: Tone.Gain): Promise<InstrumentConfig> {
  // Synth engine (PolySynth of AMSynth)
  const synth = new Tone.PolySynth({
    voice: Tone.AMSynth,
    options: AMBIENT_PIANO_PRESET.voice
  });
  synth.maxPolyphony = AMBIENT_PIANO_PRESET.poly.maxPolyphony;

  // FX chain
  const preHPF  = new Tone.Filter(AMBIENT_PIANO_PRESET.fx.preHPF);
  const chorus  = new Tone.Chorus(AMBIENT_PIANO_PRESET.fx.chorus).start();
  const delay   = new Tone.FeedbackDelay(AMBIENT_PIANO_PRESET.fx.delay);
  const reverb  = new Tone.Reverb(AMBIENT_PIANO_PRESET.fx.reverb);
  const limiter = new Tone.Limiter(AMBIENT_PIANO_PRESET.fx.limiter);

  await reverb.ready;

  synth.chain(preHPF, chorus, delay, reverb, limiter, masterGain);

  return { synth, effects: [preHPF, chorus, delay, reverb, limiter] };
}
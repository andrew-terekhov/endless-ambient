import * as Tone from 'tone';

export interface InstrumentConfig {
  synth: Tone.PolySynth | Tone.Synth | Tone.FMSynth | Tone.AMSynth | Tone.PolySynth<Tone.DuoSynth>;
  effects: Tone.ToneAudioNode[];
}

// --- PAD PRESET (tweak here) ---
const PAD_PRESET = {
  poly: { maxPolyphony: 8, detune: 0 },
  voice: {
    harmonicity: 1.35,
    vibratoAmount: 0.15,
    vibratoRate: 0.15,
    portamento: 0.06,
    voice0: {
      oscillator: { type: "triangle" as const },
      envelope: { attack: 2.4, decay: 0.6, sustain: 0.85, release: 8.0 },
      filter: { type: "lowpass" as const, rolloff: -24 as const, Q: 0.6, frequency: 900 },
      filterEnvelope: { attack: 3.0, decay: 2.0, sustain: 0.4, release: 6.0, baseFrequency: 600, octaves: 2.5, exponent: 2 }
    },
    voice1: {
      oscillator: { type: "sine" as const },
      envelope: { attack: 3.0, decay: 0.6, sustain: 0.88, release: 9.0 },
      filter: { type: "lowpass" as const, rolloff: -24 as const, Q: 0.5, frequency: 1200 },
      filterEnvelope: { attack: 3.5, decay: 2.2, sustain: 0.45, release: 6.5, baseFrequency: 700, octaves: 2.2, exponent: 2 }
    }
  },
  fx: {
    preHPF: { type: "highpass" as const, frequency: 120, Q: 0.7 },
    chorus: { frequency: 0.25, delayTime: 3.5, depth: 0.7, feedback: 0.08, spread: 180, wet: 0.45 },
    autofilter: { frequency: 0.06, type: "sine" as const, baseFrequency: 600, octaves: 2.5, filter: { type: "lowpass" as const, rolloff: -24 as const, Q: 0.4 }, wet: 0.35 },
    delay: { delayTime: "1/2" as const, feedback: 0.45, wet: 0.25 },
    reverb: { decay: 14.0, preDelay: 0.12, wet: 0.55 },
    comp: { threshold: -26, ratio: 2, attack: 0.03, release: 0.25 },
    limiter: { threshold: -1 }
  }
};

export const createPadInstrument = async (masterGain: Tone.Gain): Promise<InstrumentConfig> => {
  // Create the DuoSynth-based pad synth
  const synth = new Tone.PolySynth(Tone.DuoSynth, PAD_PRESET.voice).set(PAD_PRESET.poly);

  synth.volume.value = -6;
  
  // Create effects chain
  const preHPF = new Tone.Filter(PAD_PRESET.fx.preHPF);
  const chorus = new Tone.Chorus(PAD_PRESET.fx.chorus).start();
  const autoFilter = new Tone.AutoFilter(PAD_PRESET.fx.autofilter).start();
  const delay = new Tone.FeedbackDelay(PAD_PRESET.fx.delay);
  const reverb = new Tone.Reverb(PAD_PRESET.fx.reverb);
  const comp = new Tone.Compressor(PAD_PRESET.fx.comp);
  const limiter = new Tone.Limiter(PAD_PRESET.fx.limiter);

  // Wait for reverb to be ready
  await reverb.ready;

  // Chain: synth → HPF → Chorus → AutoFilter → Delay → Reverb → Comp → Limiter → Master Gain
  synth.chain(preHPF, chorus, autoFilter, delay, reverb, comp, limiter, masterGain);

  const effects = [preHPF, chorus, autoFilter, delay, reverb, comp, limiter];

  return {
    synth,
    effects
  };
};
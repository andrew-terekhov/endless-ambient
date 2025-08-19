import * as Tone from "tone";

export interface InstrumentConfig {
  synth: Tone.PolySynth;                // Poly of FMSynth voices
  effects: Tone.ToneAudioNode[];
}

const SPATIAL_SYNTH_PRESET = {
  poly: { maxPolyphony: 8 },

  // Voice = FMSynth (piano-ish transient + evolving body)
  voice: {
    harmonicity: 1.0,
    modulationIndex: 5.0,
    oscillator: { type: "triangle" as const },
    modulation: { type: "sine" as const },
    envelope: { attack: 0.02, decay: 1.6, sustain: 0.15, release: 6.0 },
    modulationEnvelope: { attack: 0.0, decay: 1.2, sustain: 0.0, release: 1.8 },
    portamento: 0.02
  },

  // FX — spatial & lush
  fx: {
    preHPF:  { type: "highpass" as const, frequency: 90,  Q: 0.707 }, // clear rumble
    autoPan: { frequency: 0.06, type: "sine" as const, depth: 0.9, wet: 0.6 }, // slow stereo drift
    widener: { width: 0.8 },
    phaser:  { frequency: 0.08, octaves: 3, baseFrequency: 600, Q: 0.5, wet: 0.25 },
    autoFlt: { frequency: 0.04, type: "sine" as const, baseFrequency: 800, octaves: 3, filter: { type: "lowpass" as const, rolloff: -24 as const, Q: 0.4 }, wet: 0.35 },
    pingPong:{ delayTime: "3n" as const, feedback: 0.55, wet: 0.45 },
    delay:   { delayTime: "1/2" as const, feedback: 0.4,  wet: 0.35 },
    reverb:  { decay: 18, preDelay: 0.07, wet: 0.6 },
    shimmer: { pitch: 12, feedback: 0.25, reverbDecay: 20, wetDb: -16 }, // parallel bus
    comp:    { threshold: -34, ratio: 1.6, attack: 0.02, release: 0.25, knee: 8 },
    limiter: { threshold: -2.5 }
  },

  gain: { synthVolumeDb: -6 }
} as const;

export async function createSynthInstrument(masterGain: Tone.Gain): Promise<InstrumentConfig> {
  // --- Synth engine (Poly of FMSynth) ---
  const synth = new Tone.PolySynth({
    voice: Tone.FMSynth,
    options: SPATIAL_SYNTH_PRESET.voice
  });
  synth.maxPolyphony = SPATIAL_SYNTH_PRESET.poly.maxPolyphony;
  synth.volume.value = SPATIAL_SYNTH_PRESET.gain.synthVolumeDb;

  // --- FX nodes ---
  const preHPF   = new Tone.Filter(SPATIAL_SYNTH_PRESET.fx.preHPF);
  const autoPan  = new Tone.AutoPanner(SPATIAL_SYNTH_PRESET.fx.autoPan).start();
  const widener  = new Tone.StereoWidener(SPATIAL_SYNTH_PRESET.fx.widener);
  const phaser   = new Tone.Phaser(SPATIAL_SYNTH_PRESET.fx.phaser);
  const autoFlt  = new Tone.AutoFilter(SPATIAL_SYNTH_PRESET.fx.autoFlt).start();
  const pingPong = new Tone.PingPongDelay(SPATIAL_SYNTH_PRESET.fx.pingPong);
  const delay    = new Tone.FeedbackDelay(SPATIAL_SYNTH_PRESET.fx.delay);
  const reverb   = new Tone.Reverb(SPATIAL_SYNTH_PRESET.fx.reverb);
  const comp     = new Tone.Compressor(SPATIAL_SYNTH_PRESET.fx.comp);
  const limiter  = new Tone.Limiter(SPATIAL_SYNTH_PRESET.fx.limiter);

  // Parallel shimmer send (keeps dry path clean)
  const shimmerSend = new Tone.Gain(Tone.dbToGain(SPATIAL_SYNTH_PRESET.fx.shimmer.wetDb)).toDestination();
  const shifter     = new Tone.PitchShift({ pitch: SPATIAL_SYNTH_PRESET.fx.shimmer.pitch, feedback: SPATIAL_SYNTH_PRESET.fx.shimmer.feedback });
  const shimmerVerb = new Tone.Reverb({ decay: SPATIAL_SYNTH_PRESET.fx.shimmer.reverbDecay, preDelay: 0.05, wet: 0.9 });

  await Promise.all([reverb.ready, shimmerVerb.ready]);

  // --- Routing ---
  // Main chain: synth → HPF → AutoPan → Widener → Phaser → AutoFilter → PingPong → Delay → Reverb → Comp → Limiter → Master
  synth.chain(preHPF, autoPan, widener, phaser, autoFlt, pingPong, delay, reverb, comp, limiter, masterGain);

  // Shimmer tap: from AutoFilter output (before long delays/reverb for clarity)
  const shimmerTap = new Tone.Gain();
  autoFlt.connect(shimmerTap);
  shimmerTap.chain(shifter, shimmerVerb, shimmerSend);

  return {
    synth,
    effects: [preHPF, autoPan, widener, phaser, autoFlt, pingPong, delay, reverb, comp, limiter, shimmerTap, shifter, shimmerVerb, shimmerSend]
  };
}
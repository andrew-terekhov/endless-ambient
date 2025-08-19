import * as Tone from 'tone';

export const createGlobalEffects = async () => {
  // Create effects chain with proper await for reverb
  const reverb = new Tone.Reverb({ decay: 8 });
  await reverb.ready; // Wait for reverb to be ready
  
  const delay = new Tone.PingPongDelay({ delayTime: '8n', feedback: 0.2, wet: 0.3 });
  const filter = new Tone.Filter({ frequency: 800, type: 'lowpass' });
  const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7 });
  
  return {
    reverb,
    delay,
    filter,
    chorus
  };
};
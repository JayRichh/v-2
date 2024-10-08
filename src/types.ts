export interface AudioTrack {
  name: string;
  buffer: AudioBuffer;
}

export type EffectType = 'Waveform' | 'Bars' | 'Circle' | 'Particles' | 'Spectrum' | 'Terrain' | 'Grid' | 'Flow' | 'Ripple' | 'Fractal';
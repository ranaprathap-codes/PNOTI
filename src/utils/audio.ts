/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Premium Synthesizer and Audio Engine using Web Audio API
class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: OscillatorNode | AudioScheduledSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private customAudio: HTMLAudioElement | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {}
      this.currentSource = null;
    }
    if (this.currentGain) {
      try {
        this.currentGain.disconnect();
      } catch (e) {}
      this.currentGain = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.currentTime = 0;
    }
  }

  playStockSound(soundName: string, volume: number = 0.8) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    gain.connect(ctx.destination);
    this.currentGain = gain;

    const now = ctx.currentTime;

    switch (soundName) {
      case 'Gentle Chimes': {
        // High, pure bell tones ringing sequentially
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.4);
          
          oscGain.gain.setValueAtTime(0, now + idx * 0.4);
          oscGain.gain.linearRampToValueAtTime(volume * 0.6, now + idx * 0.4 + 0.05);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.4 + 1.2);
          
          osc.connect(oscGain);
          oscGain.connect(gain);
          
          osc.start(now + idx * 0.4);
          osc.stop(now + idx * 0.4 + 1.5);
        });
        break;
      }
      
      case 'Morning Alarm': {
        // Classical dual-tone electronic alarm pulse
        const duration = 2.0; // Play for 2 seconds loop
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440, now); // A4
        
        // Pulse gain
        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(0, now);
        
        for (let i = 0; i < duration * 2.5; i++) {
          const start = now + i * 0.4;
          pGain.gain.setValueAtTime(volume, start);
          pGain.gain.setValueAtTime(0, start + 0.2);
        }
        
        osc1.connect(pGain);
        osc2.connect(pGain);
        pGain.connect(gain);
        
        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);
        this.currentSource = osc1; // Track one to enable manual stopping
        break;
      }

      case 'Tech Pulse': {
        // Fast, high-tech electronic chirp pulses
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
        
        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(volume, now);
        pGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        // Second pulse shortly after
        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(200, now + 0.25);
        osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
        
        const pGain2 = ctx.createGain();
        pGain2.gain.setValueAtTime(0, now);
        pGain2.gain.setValueAtTime(volume, now + 0.25);
        pGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(pGain);
        pGain.connect(gain);
        
        osc2.connect(pGain2);
        pGain2.connect(gain);

        osc.start(now);
        osc.stop(now + 0.35);
        osc2.start(now + 0.25);
        osc2.stop(now + 0.55);
        this.currentSource = osc;
        break;
      }

      case 'Cosmic Bell': {
        // Deep warm bell strike with a metallic ringing decay
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(329.63, now); // E4
        
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(164.81, now); // E3 (sub-octave)
        
        const bellGain = ctx.createGain();
        bellGain.gain.setValueAtTime(volume, now);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        
        osc.connect(bellGain);
        subOsc.connect(bellGain);
        bellGain.connect(gain);
        
        osc.start(now);
        osc.stop(now + 2.0);
        subOsc.start(now);
        subOsc.stop(now + 2.0);
        this.currentSource = osc;
        break;
      }

      case 'Retro Synth': {
        // Cute upward 8-bit game chime arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          
          noteGain.gain.setValueAtTime(0, now + idx * 0.1);
          noteGain.gain.setValueAtTime(volume * 0.5, now + idx * 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.25);
          
          osc.connect(noteGain);
          noteGain.connect(gain);
          
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.3);
        });
        break;
      }

      default: {
        // Simple ding fallback
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        
        const fGain = ctx.createGain();
        fGain.gain.setValueAtTime(volume, now);
        fGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        osc.connect(fGain);
        fGain.connect(gain);
        
        osc.start(now);
        osc.stop(now + 0.8);
        this.currentSource = osc;
      }
    }
  }

  playCustomAudio(dataUrl: string, volume: number = 0.8) {
    this.stop();
    try {
      this.customAudio = new Audio(dataUrl);
      this.customAudio.volume = volume;
      this.customAudio.play().catch(e => {
        console.error("Audio playback error:", e);
      });
    } catch (e) {
      console.error("Failed to load custom audio:", e);
    }
  }

  vibrate(pattern: number | number[] = [100, 50, 100]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.log("Device vibration blocked by permissions or browser frame.");
      }
    } else {
      console.log("Vibration is not supported on this platform.");
    }
  }
}

export const audioEngine = new AudioEngine();

export const STOCK_SOUNDS = [
  'Gentle Chimes',
  'Morning Alarm',
  'Tech Pulse',
  'Cosmic Bell',
  'Retro Synth',
  'Simple Ding'
];

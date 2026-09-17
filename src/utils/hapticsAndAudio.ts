/**
 * Mobile Haptics and Web Audio Feedback Utility
 * Uses HTML5 Web Audio API and Navigator.vibrate for zero-dependency feedback on mobile/desktop
 */

class SoundAndHapticsEngine {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;

  constructor() {
    // Sound & haptics enabled by default
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }

  public vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled || typeof window === 'undefined') return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore iframe restrictions if any
      }
    }
  }

  public playTone(freq: number, durationMs: number = 100, type: OscillatorType = 'sine') {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio context might be restricted or muted
    }
  }

  public triggerUnlockSound() {
    this.playTone(523.25, 80, 'triangle'); // C5
    setTimeout(() => this.playTone(659.25, 120, 'sine'), 90); // E5
    this.vibrate([30, 50, 30]);
  }

  public triggerLockSound() {
    this.playTone(440, 100, 'sawtooth'); // A4
    setTimeout(() => this.playTone(329.63, 140, 'sine'), 100); // E4
    this.vibrate(60);
  }

  public triggerAlertSound() {
    this.playTone(880, 80, 'square');
    setTimeout(() => this.playTone(880, 80, 'square'), 100);
    this.vibrate([100, 50, 100]);
  }

  public triggerSuccessTone() {
    this.playTone(587.33, 80, 'sine'); // D5
    setTimeout(() => this.playTone(880, 120, 'sine'), 90); // A5
    this.vibrate(40);
  }
}

export const hapticAudio = new SoundAndHapticsEngine();

// Sound Effects Manager - Web Audio API based

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = localStorage.getItem('mci-sounds-enabled') !== 'false';
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  get isEnabled() { return this.enabled; }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('mci-sounds-enabled', String(this.enabled));
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  // Correct answer / match
  correct() {
    this.playTone(523, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.12), 80);
  }

  // Wrong answer
  wrong() {
    this.playTone(200, 0.2, 'square', 0.08);
  }

  // Level up
  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.15, 'sine', 0.1), i * 100);
    });
  }

  // Game complete / victory
  victory() {
    const notes = [523, 659, 784, 880, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.2, 'sine', 0.12), i * 120);
    });
  }

  // Achievement unlocked
  achievement() {
    const notes = [440, 554, 659, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.25, 'triangle', 0.15), i * 150);
    });
  }

  // Button click
  click() {
    this.playTone(800, 0.05, 'sine', 0.06);
  }

  // Countdown tick
  tick() {
    this.playTone(1000, 0.03, 'sine', 0.04);
  }

  // Game over
  gameOver() {
    [440, 415, 392, 349].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sine', 0.1), i * 200);
    });
  }
}

export const soundManager = new SoundManager();

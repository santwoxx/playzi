export type SoundEffect = 
  | 'notification' 
  | 'pop' 
  | 'levelup' 
  | 'message' 
  | 'match' 
  | 'call-ring' 
  | 'victory';

const SOUND_PATHS: Record<SoundEffect, string> = {
  notification: '/sounds/notification.wav',
  pop: '/sounds/pop.wav',
  levelup: '/sounds/levelup.wav',
  message: '/sounds/message.wav',
  match: '/sounds/match-found.wav',
  'call-ring': '/sounds/call-ring.wav',
  victory: '/sounds/victory.wav'
};

class SoundService {
  private cache = new Map<SoundEffect, HTMLAudioElement>();
  private activeLoops = new Map<SoundEffect, HTMLAudioElement>();
  private muted: boolean;
  private masterVolume: number = 0.35;

  constructor() {
    this.muted = typeof window !== 'undefined' && localStorage.getItem('playzi_sound_muted') === 'true';
    if (typeof window !== 'undefined') {
      this.preload();
    }
  }

  /**
   * Preload audio files so they decode and play instantly with 0ms network latency.
   */
  public preload() {
    if (typeof window === 'undefined') return;

    (Object.keys(SOUND_PATHS) as SoundEffect[]).forEach((key) => {
      try {
        const audio = new Audio(SOUND_PATHS[key]);
        audio.preload = 'auto';
        audio.volume = this.masterVolume;
        this.cache.set(key, audio);
      } catch (err) {
        console.warn(`[SoundService] Failed to preload sound ${key}:`, err);
      }
    });
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem('playzi_sound_muted', muted ? 'true' : 'false');
    } catch {}

    if (muted) {
      this.stopAllLoops();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Play a one-shot sound effect.
   */
  public play(name: SoundEffect, volumeMultiplier: number = 1.0) {
    if (this.muted || typeof window === 'undefined') return;

    try {
      const cached = this.cache.get(name);
      let audio: HTMLAudioElement;

      // If the cached audio is currently playing, clone it so overlapping sounds play cleanly
      if (cached && cached.paused) {
        audio = cached;
      } else {
        audio = new Audio(SOUND_PATHS[name]);
      }

      audio.volume = Math.min(1.0, Math.max(0.0, this.masterVolume * volumeMultiplier));
      audio.currentTime = 0;
      
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Ignore browser autoplay restrictions quietly
        });
      }
    } catch (err) {
      console.warn(`[SoundService] Error playing ${name}:`, err);
    }
  }

  /**
   * Start a looping sound (e.g. for incoming/outgoing calls).
   */
  public startLoop(name: SoundEffect, volumeMultiplier: number = 1.0) {
    if (this.muted || typeof window === 'undefined') return;

    this.stopLoop(name);

    try {
      const audio = new Audio(SOUND_PATHS[name]);
      audio.loop = true;
      audio.volume = Math.min(1.0, Math.max(0.0, this.masterVolume * volumeMultiplier));
      this.activeLoops.set(name, audio);

      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Autoplay blocked until user interaction
        });
      }
    } catch (err) {
      console.warn(`[SoundService] Error starting loop for ${name}:`, err);
    }
  }

  /**
   * Stop a looping sound.
   */
  public stopLoop(name: SoundEffect) {
    const loop = this.activeLoops.get(name);
    if (loop) {
      try {
        loop.pause();
        loop.currentTime = 0;
      } catch {}
      this.activeLoops.delete(name);
    }
  }

  /**
   * Stop all active looping sounds.
   */
  public stopAllLoops() {
    this.activeLoops.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    });
    this.activeLoops.clear();
  }
}

export const soundService = new SoundService();

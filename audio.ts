import { SFXType } from "./types";

class AudioEngine {
    ctx: AudioContext | null = null;
    musicNode: OscillatorNode | null = null;
    gainNode: GainNode | null = null;
    musicInterval: number | null = null;
    
    isMusicEnabled: boolean = true;
    isSfxEnabled: boolean = true;

    constructor() {
        // Lazy init on first interaction
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.gainNode = this.ctx.createGain();
            this.gainNode.connect(this.ctx.destination);
            this.gainNode.gain.value = 0.1; // Master volume
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSettings(music: boolean, sfx: boolean) {
        this.isMusicEnabled = music;
        this.isSfxEnabled = sfx;
        
        if (!music) {
            this.stopMusic();
        } else if (!this.musicInterval) {
            this.startMusic();
        }
    }

    playSFX(type: SFXType) {
        if (!this.isSfxEnabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch (type) {
            case 'SHOOT':
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'EXPLOSION':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'HIT':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'LASER':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1000, now);
                osc.frequency.linearRampToValueAtTime(2000, now + 0.5);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
             case 'BOSS_ROAR':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(50, now);
                osc.frequency.linearRampToValueAtTime(80, now + 1.0);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 1.0);
                osc.start(now);
                osc.stop(now + 1.0);
                break;
            case 'CLICK':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'GAME_OVER':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(50, now + 1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 1);
                osc.start(now);
                osc.stop(now + 1);
                break;
        }
    }

    startMusic() {
        if (!this.isMusicEnabled || this.musicInterval) return;
        this.init();

        // Simple bassline loop
        const notes = [110, 110, 130, 110, 98, 98, 146, 130]; 
        let noteIdx = 0;

        this.musicInterval = window.setInterval(() => {
            if (!this.isMusicEnabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'square';
            osc.frequency.value = notes[noteIdx];
            gain.gain.value = 0.03;
            
            osc.start(now);
            osc.stop(now + 0.2);

            noteIdx = (noteIdx + 1) % notes.length;
        }, 250);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

export const audio = new AudioEngine();
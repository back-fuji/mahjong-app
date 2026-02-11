import { useSettingsStore } from '../store/settingsStore.ts';

/**
 * Web Audio API ベースのサウンドエンジン
 * 外部音声ファイル不要 - すべて合成音で生成
 */
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    // ユーザー操作後に resume が必要
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private get settings() {
    return useSettingsStore.getState();
  }

  private get volume() {
    return this.settings.soundEnabled ? this.settings.soundVolume : 0;
  }

  /** 指定周波数のビープ音を鳴らす */
  private playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', vol = 0.3) {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  /** 周波数スウィープ */
  private playSweep(startFreq: number, endFreq: number, durationMs: number, type: OscillatorType = 'sine', vol = 0.3) {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + durationMs / 1000);
    gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  /** ノイズバースト（打牌のカチッ音） */
  private playNoiseBurst(durationMs: number, vol = 0.2) {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    const bufferSize = ctx.sampleRate * (durationMs / 1000);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // バンドパスフィルタで音色調整
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.value = vol * this.volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  // --- 公開メソッド ---

  /** 打牌音（カチッ） */
  playDiscardSound() {
    this.playNoiseBurst(60, 0.25);
    this.playTone(800, 50, 'square', 0.08);
  }

  /** ツモ音（軽いトン） */
  playDrawSound() {
    this.playTone(600, 80, 'sine', 0.12);
  }

  /** リーチ宣言音（上昇トーン） */
  playRiichiSound() {
    this.playSweep(400, 900, 250, 'sine', 0.25);
  }

  /** 和了ファンファーレ（3音和音） */
  playAgariSound() {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    const chords = [
      { freq: 523.25, delay: 0 },      // C5
      { freq: 659.25, delay: 0.08 },    // E5
      { freq: 783.99, delay: 0.16 },    // G5
      { freq: 1046.5, delay: 0.3 },     // C6
    ];
    for (const { freq, delay } of chords) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.8);
    }
  }

  /** 鳴き音声（SpeechSynthesis） */
  playCallSound(type: 'pon' | 'chi' | 'kan') {
    this.playNoiseBurst(40, 0.15);
    this.playTone(700, 80, 'triangle', 0.1);

    if (!this.settings.voiceEnabled || !this.settings.soundEnabled) return;
    if (typeof speechSynthesis === 'undefined') return;

    const text = type === 'pon' ? 'ポン' : type === 'chi' ? 'チー' : 'カン';
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = 1.2;
    utter.volume = this.volume;
    speechSynthesis.speak(utter);
  }

  /** リーチ音声 */
  playRiichiVoice() {
    this.playRiichiSound();
    if (!this.settings.voiceEnabled || !this.settings.soundEnabled) return;
    if (typeof speechSynthesis === 'undefined') return;

    const utter = new SpeechSynthesisUtterance('リーチ');
    utter.lang = 'ja-JP';
    utter.rate = 1.1;
    utter.volume = this.volume;
    speechSynthesis.speak(utter);
  }

  /** 和了音声 */
  playAgariVoice(type: 'tsumo' | 'ron') {
    this.playAgariSound();
    if (!this.settings.voiceEnabled || !this.settings.soundEnabled) return;
    if (typeof speechSynthesis === 'undefined') return;

    const text = type === 'tsumo' ? 'ツモ' : 'ロン';
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = 1.0;
    utter.volume = this.volume;
    speechSynthesis.speak(utter);
  }
}

/** シングルトンインスタンス */
export const soundEngine = new SoundEngine();

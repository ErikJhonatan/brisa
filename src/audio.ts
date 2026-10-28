export const tracks = [
  {
    id: "off",
    name: "Sin música",
    style: "Solo tu respiración",
    author: "",
    file: "",
    source: "",
  },
  {
    id: "pretty",
    name: "Pretty",
    style: "Jazz suave",
    author: "Alex McCulloch",
    file: "/audio/pretty.mp3",
    source: "https://opengameart.org/content/pretty",
  },
  {
    id: "jazz",
    name: "Jazz, una tarde de agosto",
    style: "Jazz relajante",
    author: "Alex McCulloch",
    file: "/audio/jazz-evening.mp3",
    source: "https://opengameart.org/content/jazz-aug-10-10-22-2021",
  },
  {
    id: "chills",
    name: "Chills",
    style: "Chillhop · Lo-fi · Saxofón",
    author: "Holizna",
    file: "/audio/chills.mp3",
    source: "https://opengameart.org/content/chills",
  },
  {
    id: "midnight",
    name: "City Lights",
    style: "Chillhop · Piano y beats suaves",
    author: "HoliznaCC0",
    file: "/audio/city-lights.mp3",
    source: "https://sonvela.site/library/city-lights-holiznacc0",
  },
] as const;
export type TrackId = (typeof tracks)[number]["id"];
export type AudioSettings = {
  track: TrackId;
  musicVolume: number;
  breath: boolean;
  breathVolume: number;
};
export const defaultAudio: AudioSettings = {
  track: "off",
  musicVolume: 0.35,
  breath: false,
  breathVolume: 0.4,
};

/** CC0 recordings are local assets. Only breathing cues use Web Audio synthesis. */
export class SoundEngine {
  private context?: AudioContext;
  private breathing?: GainNode;
  private noise?: AudioBuffer;
  private player?: HTMLAudioElement;
  private currentTrack = "";
  private settings = defaultAudio;
  private sources = new Set<AudioBufferSourceNode>();
  onError?: (message: string) => void;
  async unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.breathing = this.context.createGain();
      this.breathing.gain.value = 0;
      this.breathing.connect(this.context.destination);
      this.noise = this.context.createBuffer(
        1,
        this.context.sampleRate * 2,
        this.context.sampleRate,
      );
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (!this.player) {
      this.player = new Audio();
      this.player.loop = true;
      this.player.preload = "none";
      this.player.onerror = () =>
        this.onError?.(
          "No se pudo cargar esta pista. Prueba otra o continúa en silencio.",
        );
    }
    await this.context.resume();
  }
  configure(settings: AudioSettings) {
    this.settings = settings;
    if (this.player) this.player.volume = settings.musicVolume * 0.7;
    if (this.context && this.breathing)
      this.breathing.gain.setTargetAtTime(
        settings.breath ? settings.breathVolume * 0.65 : 0,
        this.context.currentTime,
        0.08,
      );
  }
  start(settings: AudioSettings) {
    this.configure(settings);
    const track = tracks.find((t) => t.id === settings.track);
    if (!this.player || !track?.file) {
      this.player?.pause();
      return;
    }
    if (this.currentTrack !== track.id) {
      this.player.src = track.file;
      this.currentTrack = track.id;
    }
    void this.player
      .play()
      .catch(() =>
        this.onError?.(
          "Toca Escuchar muestra o Continuar para activar el sonido.",
        ),
      );
  }
  breath(label: string, duration: number) {
    this.stopBreath();
    if (
      !this.context ||
      !this.settings.breath ||
      !/inhala|poquito|exhala/i.test(label)
    )
      return;
    const ctx = this.context;
    const start = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.noise!;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.65;
    const exhale = /exhala/i.test(label);
    filter.frequency.setValueAtTime(exhale ? 1100 : 500, start);
    filter.frequency.linearRampToValueAtTime(
      exhale ? 400 : 1200,
      start + duration,
    );
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(
      0.18,
      start + Math.min(0.6, duration / 3),
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + Math.max(0.2, duration - 0.1),
    );
    source.connect(filter).connect(gain).connect(this.breathing!);
    source.start();
    source.stop(start + duration);
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
  stopBreath() {
    for (const node of this.sources) {
      try {
        node.stop();
      } catch {
        /* Already stopped. */
      }
    }
    this.sources.clear();
  }
  stop() {
    this.player?.pause();
    this.stopBreath();
  }
  async dispose() {
    this.stop();
    if (this.player) {
      this.player.removeAttribute("src");
      this.player.load();
    }
    await this.context?.close();
    this.context = undefined;
  }
}

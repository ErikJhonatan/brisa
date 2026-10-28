import { defaultAudio, tracks, type AudioSettings } from "./audio";
export type Settings = {
  haptics: boolean;
  reduced: boolean;
  dark: boolean;
  audio: AudioSettings;
  goal: number;
  reminder: string;
  reminderEnabled: boolean;
  favorites: string[];
  voice: boolean;
  voiceVolume: number;
};
export const defaults: Settings = {
  haptics: false,
  reduced: false,
  dark: false,
  audio: defaultAudio,
  goal: 5,
  reminder: "20:00",
  reminderEnabled: false,
  favorites: [],
  voice: true,
  voiceVolume: 0.7,
};
export function loadSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem("brisa-settings") || "{}");
    const audio = value.audio ?? {};
    const volume = (n: unknown, fallback: number) =>
      typeof n === "number" && Number.isFinite(n)
        ? Math.min(1, Math.max(0, n))
        : fallback;
    return {
      ...defaults,
      haptics: value.haptics === true,
      reduced: value.reduced === true,
      dark: value.dark === true,
      voice: value.voice !== false,
      voiceVolume: volume(value.voiceVolume, 0.7),
      goal: [3, 5, 7].includes(value.goal) ? value.goal : 5,
      reminder: /^([01]\d|2[0-3]):[0-5]\d$/.test(value.reminder)
        ? value.reminder
        : "20:00",
      reminderEnabled: value.reminderEnabled === true,
      favorites: Array.isArray(value.favorites)
        ? value.favorites.filter((v: unknown) => typeof v === "string")
        : [],
      audio: {
        track: tracks.some((t) => t.id === audio.track) ? audio.track : "off",
        musicVolume: volume(audio.musicVolume, 0.35),
        breath: audio.breath === true,
        breathVolume: volume(audio.breathVolume, 0.4),
      },
    };
  } catch {
    return defaults;
  }
}
export function localDate(date: string | Date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function weekDates(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return localDate(date);
  });
}
export function calendarFile(time: string) {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  if (date < new Date()) date.setDate(date.getDate() + 1);
  const stamp = `${localDate(date).replaceAll("-", "")}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Brisa//Meditation//ES\r\nBEGIN:VEVENT\r\nUID:brisa-${Date.now()}@local\r\nDTSTAMP:${new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(
      /\.\d{3}/,
      "",
    )}\r\nDTSTART:${stamp}\r\nDURATION:PT5M\r\nRRULE:FREQ=DAILY\r\nSUMMARY:Un momento para respirar\r\nDESCRIPTION:Abre Brisa y regálate una pausa.\r\nBEGIN:VALARM\r\nTRIGGER:PT0M\r\nACTION:DISPLAY\r\nDESCRIPTION:Tu pausa con Brisa\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
}
export function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function clearLegacyVoiceData(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("brisa-audio");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    request.onblocked = () =>
      reject(
        new Error("Cierra otras pestañas de Brisa antes de borrar los datos."),
      );
  });
}

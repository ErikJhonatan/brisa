export type VoiceGuide = { id: string; file: string; available: boolean };
// Nine ElevenLabs recordings generated in Chrome and verified as distinct MP3 files.
export const voiceGuides: Record<string, VoiceGuide> = Object.fromEntries(
  [
    "sigh",
    "box",
    "slow",
    "body",
    "478",
    "ground",
    "muscle",
    "mindful",
    "kind",
  ].map((id) => [id, { id, file: `/voices/${id}.mp3`, available: true }]),
);
export const narrator = {
  provider: "ElevenLabs",
  description: "Voz masculina grave, cálida y calmada, en español",
  voiceName: "Alex — Deep, Resonant and Confident",
};

/**
 * Lightweight, client-side Natural Voice Audio Engine.
 * Uses Web Speech synthesis tuned specifically to warm, natural female voices
 * (e.g. Natural/Online neural voices: Jenny, Sonia, Aria, Samantha, Victoria, Karen, Google UK English Female, etc.)
 * Fallback tuned pitch and rate to ensure a pleasant, smooth acoustic profile without robotic gravel.
 */

export interface VoiceOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

const PREFERRED_FEMALE_VOICES = [
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Sonia Online (Natural) - English (United Kingdom)",
  "Google UK English Female",
  "Google US English",
  "Samantha",
  "Victoria",
  "Karen",
  "Moira",
  "Fiona",
  "Zira",
];

export function getNaturalFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // 1. Search for preferred natural female voice names
  for (const preferred of PREFERRED_FEMALE_VOICES) {
    const match = voices.find(
      (v) => v.name.toLowerCase().includes(preferred.toLowerCase())
    );
    if (match) return match;
  }

  // 2. Search for any English voice identified as female or natural
  const femaleVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (/female|natural|woman|jenny|aria|sonia|samantha|victoria/i.test(v.name))
  );
  if (femaleVoice) return femaleVoice;

  // 3. Fallback to any English voice
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

export function playNaturalGreeting(
  text: string,
  options: VoiceOptions = {}
): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return () => {};
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getNaturalFemaleVoice();
    if (voice) {
      utterance.voice = voice;
    }

    // Acoustic tuning: natural, gentle female timbre
    utterance.pitch = options.pitch ?? 1.05;
    utterance.rate = options.rate ?? 0.96;
    utterance.volume = options.volume ?? 0.85;

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onError) utterance.onerror = options.onError;

    // Small delay helps avoid audio context clipping on initial user gesture
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 120);

    return () => {
      window.speechSynthesis.cancel();
    };
  } catch (err) {
    if (options.onError) options.onError(err);
    return () => {};
  }
}

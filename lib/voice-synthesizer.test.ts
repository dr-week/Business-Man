import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getNaturalFemaleVoice, playNaturalGreeting } from "@/lib/voice-synthesizer";

describe("Natural Female Voice Synthesizer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gracefully handles environments without window.speechSynthesis", () => {
    const voice = getNaturalFemaleVoice();
    expect(voice).toBeNull();

    const cancel = playNaturalGreeting("Test greeting");
    expect(typeof cancel).toBe("function");
  });

  it("finds preferred natural female voice when available in window.speechSynthesis", () => {
    const mockVoices = [
      { name: "Microsoft David", lang: "en-US", default: true, localService: true, voiceURI: "david" },
      { name: "Microsoft Jenny Online (Natural) - English (United States)", lang: "en-US", default: false, localService: false, voiceURI: "jenny" },
    ] as SpeechSynthesisVoice[];

    // Mock speechSynthesis
    const mockSynth = {
      getVoices: vi.fn().mockReturnValue(mockVoices),
      cancel: vi.fn(),
      speak: vi.fn(),
    };

    global.window = {
      speechSynthesis: mockSynth,
    } as unknown as Window & typeof globalThis;

    // @ts-expect-error Mocking SpeechSynthesisUtterance
    global.SpeechSynthesisUtterance = class {
      text: string;
      voice: SpeechSynthesisVoice | null = null;
      pitch = 1;
      rate = 1;
      volume = 1;
      constructor(text: string) {
        this.text = text;
      }
    };

    const selectedVoice = getNaturalFemaleVoice();
    expect(selectedVoice).not.toBeNull();
    expect(selectedVoice?.name).toContain("Jenny");

    // Clean up
    // @ts-expect-error Clean up
    delete global.window;
    // @ts-expect-error Clean up
    delete global.SpeechSynthesisUtterance;
  });
});

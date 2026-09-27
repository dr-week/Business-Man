"use client";

import { useEffect, useState } from "react";
import { Sparkles, Volume2, VolumeX, X, Compass, Radio } from "lucide-react";
import { playNaturalGreeting } from "@/lib/voice-synthesizer";

interface LauncherProps {
  onDismiss?: () => void;
}

export function AppLauncherOverlay({ onDismiss }: LauncherProps) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Show launcher once per session unless re-triggered
    queueMicrotask(() => {
      const hasLaunched = sessionStorage.getItem("businessman_launched");
      if (!hasLaunched) {
        setOpen(true);
        sessionStorage.setItem("businessman_launched", "true");
      }
    });
  }, []);

  function handlePlayVoice() {
    if (muted) return;
    setSpeaking(true);
    playNaturalGreeting("Welcome to Businessman. Evidence-led market discovery.", {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  function handleClose() {
    setOpen(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (onDismiss) onDismiss();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          handlePlayVoice();
        }}
        className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-[#1a1b13] border border-[#c2a663]/40 text-[#c2a663] shadow-lg hover:scale-105 active:scale-95 transition-all"
        title="Launcher"
      >
        <Sparkles size={16} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-xl border border-[#c2a663]/30 bg-[#13140e] p-6 shadow-2xl text-[#e8dfc8] animate-in zoom-in-95 duration-200">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c2a663]/15">
          <div className="flex items-center gap-2 text-[#c2a663]">
            <Compass size={16} />
            <span className="text-xs uppercase tracking-widest font-semibold">Businessman</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const nextMuted = !muted;
                setMuted(nextMuted);
                if (nextMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  setSpeaking(false);
                } else if (!nextMuted) {
                  handlePlayVoice();
                }
              }}
              className="p-1 rounded text-[#c2a663] hover:bg-[#c2a663]/10 transition-colors"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} className={speaking ? "animate-pulse" : ""} />}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded text-[#aaa591] hover:text-[#e8dfc8] hover:bg-[#c2a663]/10 transition-colors"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content & Artistic Branding */}
        <div className="py-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full border border-[#c2a663]/40 bg-[#1a1b13] flex items-center justify-center text-[#c2a663] shadow-inner">
            <Radio size={22} className="animate-pulse" />
          </div>
          <h2 className="text-lg font-serif tracking-tight text-[#e8dfc8]">Desk Ready</h2>
          <p className="text-xs text-[#aaa591] leading-relaxed">
            Opportunity radar online. Evidence-backed decision triage active.
          </p>
        </div>

        {/* Launch Action */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 px-4 rounded-md bg-[#c2a663] text-[#0e0f0a] text-xs font-bold tracking-wide uppercase hover:bg-[#dec581] transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            <span>Launch</span>
          </button>
        </div>
      </div>
    </div>
  );
}

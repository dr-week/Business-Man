// src/components/decision/ScoreToggle.tsx
// Accessible toggle to enable/disable the LAYA decision‑engine score overlay.
// Uses shadcn UI Switch (which is built on Radix UI for full accessibility).

import React from "react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface ScoreToggleProps {
  /** Current enabled state */
  enabled: boolean;
  /** Callback when user toggles the switch */
  onChange: (enabled: boolean) => void;
  /** Optional label */
  label?: string;
}

export const ScoreToggle: React.FC<ScoreToggleProps> = ({
  enabled,
  onChange,
  label = "Show decision score",
}) => {
  const { toast } = useToast();

  const handleToggle = (checked: boolean) => {
    onChange(checked);
    toast({
      title: checked ? "Score enabled" : "Score disabled",
      description: `Decision‑engine overlay is now ${checked ? "visible" : "hidden"}.",
      variant: "default",
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="decision-score-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
        aria-label={label}
      />
      <label htmlFor="decision-score-toggle" className="text-sm font-medium">
        {label}
      </label>
    </div>
  );
};

export default ScoreToggle;

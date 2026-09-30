// src/components/decision/DecisionEngineSettingsModal.tsx
// Accessible modal to configure LAYA/System‑1 decision‑engine parameters.
// Uses shadcn/ui Dialog (Radix UI) which provides full ARIA support and focus trapping.

import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface DecisionEngineSettings {
  /** Confidence threshold (0‑1) */
  threshold: number;
  /** Optional custom prompt prefix */
  promptPrefix: string;
}

export const DecisionEngineSettingsModal: React.FC<{
  initialSettings?: DecisionEngineSettings;
  onSave: (settings: DecisionEngineSettings) => void;
}> = ({ initialSettings, onSave }) => {
  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState(initialSettings?.threshold ?? 0.5);
  const [promptPrefix, setPromptPrefix] = useState(initialSettings?.promptPrefix ?? "");
  const { toast } = useToast();

  const handleSave = () => {
    onSave({ threshold, promptPrefix });
    setOpen(false);
    toast({
      title: "Decision engine settings saved",
      description: `Threshold: ${threshold}, Prefix: ${promptPrefix || "(none)"}`,
      variant: "default",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Engine Settings
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        // Ensure ARIA roles and focus trap are handled by Radix
      >
        <DialogHeader>
          <DialogTitle>Decision Engine Settings</DialogTitle>
          <DialogDescription>
            Adjust the confidence threshold and optional prompt prefix used by the LAYA decision engine.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <label className="block text-sm font-medium" htmlFor="threshold-slider">
            Confidence Threshold ({Math.round(threshold * 100)}%)
          </label>
          <Slider
            id="threshold-slider"
            min={0}
            max={100}
            step={1}
            value={[threshold * 100]}
            onValueChange={(val) => setThreshold(val[0] / 100)}
          />
          <div>
            <label className="block text-sm font-medium" htmlFor="prompt-prefix">
              Prompt Prefix (optional)
            </label>
            <Input
              id="prompt-prefix"
              placeholder="e.g., 'Assess risk for...'"
              value={promptPrefix}
              onChange={(e) => setPromptPrefix(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionEngineSettingsModal;

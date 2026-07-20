"use client";

export interface ControlPanelProps {
  source: string;
  destination: string;
  speed: number;
  onSourceChange?: (value: string) => void;
  onDestinationChange?: (value: string) => void;
  onSpeedChange?: (value: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
}

const defaultNodes = ["A", "B", "C", "D", "E", "F", "G"];

export default function ControlPanel({
  source,
  destination,
  speed,
  onSourceChange,
  onDestinationChange,
  onSpeedChange,
  onPlay,
  onPause,
  onResume,
  onReset,
  onStepForward,
  onStepBackward,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Transport Controls">
        <div className="grid grid-cols-2 gap-2">
          <ControlButton label="Play" onClick={onPlay} />
          <ControlButton label="Pause" onClick={onPause} />
          <ControlButton label="Resume" onClick={onResume} />
          <ControlButton label="Reset" onClick={onReset} />
          <ControlButton label="Step Back" onClick={onStepBackward} />
          <ControlButton label="Step Forward" onClick={onStepForward} />
        </div>
      </Section>

      <Section title="Animation Speed">
        <label className="flex flex-col gap-1 text-sm">
          <span className="flex justify-between text-black/60 dark:text-white/60">
            <span>Speed</span>
            <span>{speed}x</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => onSpeedChange?.(Number(e.target.value))}
            className="w-full accent-foreground"
          />
        </label>
      </Section>

      <Section title="Endpoints">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/60 dark:text-white/60">Source</span>
          <Select
            value={source}
            options={defaultNodes}
            onChange={(v) => onSourceChange?.(v)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/60 dark:text-white/60">Destination</span>
          <Select
            value={destination}
            options={defaultNodes}
            onChange={(v) => onDestinationChange?.(v)}
          />
        </label>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
    >
      {label}
    </button>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange?: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="rounded-md border border-black/10 bg-background px-3 py-2 text-sm dark:border-white/10"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

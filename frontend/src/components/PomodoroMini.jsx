import React from "react";
import { usePomodoro } from "../context/PomodoroContext";
import { Timer, Pause, Play } from "@phosphor-icons/react";

function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, "0"); }

/**
 * Small always-visible pomodoro indicator shown when the timer has any non-default state
 * (i.e. running OR paused mid-cycle). Users can pause/resume without opening the panel.
 */
export default function PomodoroMini() {
    const { mode, running, remaining, DURATIONS, start, pause } = usePomodoro();
    const isDefault = !running && remaining === DURATIONS[mode];
    if (isDefault) return null;

    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    const labelByMode = { focus: "Odak", short: "Mola", long: "Uzun Mola" };
    const bg = mode === "focus" ? "#FFE37E" : mode === "short" ? "#A7E8D0" : "#D0C9FF";

    return (
        <button
            onClick={running ? pause : start}
            className="brut-btn hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold"
            style={{ background: bg, color: "#1A1A1A" }}
            data-testid="pomo-mini"
            aria-label={running ? "Pomodoro'yu duraklat" : "Pomodoro'yu devam ettir"}
            title={`${labelByMode[mode]} — tıkla ${running ? "duraklat" : "başlat"}`}
        >
            {running
                ? <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                : <Play size={12} weight="fill" />}
            <Timer size={14} weight="bold" />
            <span className="tabular-nums font-display">
                {pad(minutes)}:{pad(seconds)}
            </span>
        </button>
    );
}

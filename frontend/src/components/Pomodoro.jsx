import React from "react";
import { usePomodoro } from "../context/PomodoroContext";
import { Play, Pause, ArrowClockwise, Coffee, Brain } from "@phosphor-icons/react";

function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, "0"); }

export default function Pomodoro() {
    const { mode, running, remaining, cycles, setMode, start, pause, reset, DURATIONS } = usePomodoro();
    const target = DURATIONS[mode];
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    const pct = ((target - remaining) / target) * 100;

    return (
        <div className="space-y-4" data-testid="pomodoro-panel">
            <div className="flex gap-2 flex-wrap">
                <ModeBtn active={mode === "focus"} onClick={() => setMode("focus")} testid="pomo-mode-focus">
                    <Brain size={16} weight="bold" /> Odaklan (25dk)
                </ModeBtn>
                <ModeBtn active={mode === "short"} onClick={() => setMode("short")} testid="pomo-mode-short">
                    <Coffee size={16} weight="bold" /> Kısa Mola (5dk)
                </ModeBtn>
                <ModeBtn active={mode === "long"} onClick={() => setMode("long")} testid="pomo-mode-long">
                    <Coffee size={16} weight="fill" /> Uzun Mola (15dk)
                </ModeBtn>
            </div>

            <div className="brut-card p-6 text-center">
                <div className="font-display text-6xl font-black tabular-nums" data-testid="pomo-time">
                    {pad(minutes)}:{pad(seconds)}
                </div>
                <div className="mt-4 h-2 border-2 border-[color:var(--ink)] rounded-full overflow-hidden bg-[color:var(--surface)]">
                    <div className="h-full" style={{ width: `${pct}%`, background: mode === "focus" ? "#FFE37E" : "#A7E8D0", transition: "width 300ms linear" }} />
                </div>
                <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                        onClick={running ? pause : start}
                        className="brut-btn px-5 py-3 rounded-md font-bold flex items-center gap-2"
                        style={{background: running ? "#FFC9B5" : "#FFE37E", color: "#1A1A1A"}}
                        data-testid="pomo-start-pause"
                    >
                        {running ? <><Pause size={18} weight="fill" /> Duraklat</> : <><Play size={18} weight="fill" /> Başlat</>}
                    </button>
                    <button
                        onClick={reset}
                        className="brut-btn px-4 py-3 rounded-md font-bold flex items-center gap-2"
                        data-testid="pomo-reset"
                    >
                        <ArrowClockwise size={16} weight="bold" /> Sıfırla
                    </button>
                </div>
                <p className="text-xs text-muted mt-4">
                    Bugün tamamlanan pomodoro: <span className="font-bold text-[color:var(--text)]" data-testid="pomo-cycles">{cycles}</span>
                </p>
                <p className="text-[11px] text-muted mt-1">
                    İpucu: Başlattıktan sonra başka sekmeye geçsen bile sayaç durmaz — üst bantta küçük gösterge kalır.
                </p>
            </div>
        </div>
    );
}

function ModeBtn({ active, onClick, children, testid }) {
    return (
        <button
            onClick={onClick}
            className={`brut-btn px-3 py-2 rounded-md font-bold text-sm flex items-center gap-1 ${active ? "translate-x-[2px] translate-y-[2px]" : ""}`}
            style={{ background: active ? "#FFE37E" : undefined, color: active ? "#1A1A1A" : undefined, boxShadow: active ? "2px 2px 0 0 var(--shadow-color)" : undefined }}
            data-testid={testid}
        >
            {children}
        </button>
    );
}

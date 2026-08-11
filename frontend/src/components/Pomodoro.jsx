import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, ArrowClockwise, Coffee, Brain } from "@phosphor-icons/react";

const STORAGE = "dersim.pomodoro.v1";
const FOCUS = 25 * 60;
const SHORT = 5 * 60;
const LONG = 15 * 60;

function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, "0"); }

function loadCycles() {
    try {
        const day = new Date().toDateString();
        const obj = JSON.parse(localStorage.getItem(STORAGE) || "{}");
        return obj.day === day ? obj.cycles || 0 : 0;
    } catch { return 0; }
}
function saveCycles(cycles) {
    try {
        localStorage.setItem(STORAGE, JSON.stringify({ day: new Date().toDateString(), cycles }));
    } catch {}
}

export default function Pomodoro() {
    const [mode, setMode] = useState("focus"); // focus | short | long
    const target = mode === "focus" ? FOCUS : mode === "short" ? SHORT : LONG;
    const [remaining, setRemaining] = useState(target);
    const [running, setRunning] = useState(false);
    const [cycles, setCycles] = useState(loadCycles());
    const startAtRef = useRef(null);
    const initialRef = useRef(target);

    useEffect(() => {
        setRemaining(target);
        setRunning(false);
        initialRef.current = target;
    }, [target]);

    useEffect(() => {
        if (!running) return;
        startAtRef.current = Date.now();
        const start = initialRef.current;
        const startedAt = startAtRef.current;
        const id = setInterval(() => {
            const elapsed = (Date.now() - startedAt) / 1000;
            const left = Math.max(0, start - elapsed);
            setRemaining(left);
            if (left <= 0) {
                clearInterval(id);
                setRunning(false);
                if (mode === "focus") {
                    const next = cycles + 1;
                    setCycles(next);
                    saveCycles(next);
                    try {
                        // small chime via WebAudio
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = "sine"; o.frequency.value = 660;
                        o.connect(g); g.connect(ctx.destination);
                        g.gain.setValueAtTime(0.001, ctx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
                        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
                        o.start(); o.stop(ctx.currentTime + 1);
                    } catch {}
                    setMode(next % 4 === 0 ? "long" : "short");
                } else {
                    setMode("focus");
                }
            }
        }, 250);
        return () => clearInterval(id);
    }, [running, mode, cycles]);

    const startPause = () => {
        if (running) {
            // pause: capture remaining as new initial
            initialRef.current = remaining;
            setRunning(false);
        } else {
            initialRef.current = remaining > 0 ? remaining : target;
            setRunning(true);
        }
    };
    const reset = () => {
        setRunning(false);
        initialRef.current = target;
        setRemaining(target);
    };

    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    const pct = ((target - remaining) / target) * 100;

    return (
        <div className="space-y-4" data-testid="pomodoro-panel">
            <div className="flex gap-2">
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
                        onClick={startPause}
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
                <p className="text-xs text-muted mt-4">Bugün tamamlanan pomodoro: <span className="font-bold text-[color:var(--text)]" data-testid="pomo-cycles">{cycles}</span></p>
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

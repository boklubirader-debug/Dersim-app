import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const PomodoroContext = createContext(null);
const KEY = "dersim.pomodoro.state.v1";
const CYCLES_KEY = "dersim.pomodoro.cycles.v1";

const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

function loadState() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { mode: "focus", running: false, targetSeconds: DURATIONS.focus, endAt: null };
}
function saveState(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
function loadCycles() {
    try {
        const day = new Date().toDateString();
        const obj = JSON.parse(localStorage.getItem(CYCLES_KEY) || "{}");
        return obj.day === day ? obj.cycles || 0 : 0;
    } catch { return 0; }
}
function saveCycles(cycles) {
    try {
        localStorage.setItem(CYCLES_KEY, JSON.stringify({ day: new Date().toDateString(), cycles }));
    } catch {}
}

function chime() {
    try {
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
}

export function PomodoroProvider({ children }) {
    const [state, setState] = useState(loadState);
    const [now, setNow] = useState(Date.now());
    const [cycles, setCycles] = useState(loadCycles);
    const completedRef = useRef(false);

    // Persist state whenever it changes
    useEffect(() => { saveState(state); }, [state]);

    // Tick every 250ms only when running (kept independent of any mounted UI panel)
    useEffect(() => {
        if (!state.running) return;
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, [state.running]);

    const remaining = state.running && state.endAt
        ? Math.max(0, Math.round((state.endAt - now) / 1000))
        : state.targetSeconds;

    // Handle completion
    useEffect(() => {
        if (!state.running) { completedRef.current = false; return; }
        if (remaining <= 0 && !completedRef.current) {
            completedRef.current = true;
            chime();
            if (state.mode === "focus") {
                const next = cycles + 1;
                setCycles(next);
                saveCycles(next);
                const nextMode = next % 4 === 0 ? "long" : "short";
                setState({ mode: nextMode, running: false, targetSeconds: DURATIONS[nextMode], endAt: null });
            } else {
                setState({ mode: "focus", running: false, targetSeconds: DURATIONS.focus, endAt: null });
            }
        }
    }, [remaining, state.running, state.mode, cycles]);

    const setMode = (mode) => {
        setState({ mode, running: false, targetSeconds: DURATIONS[mode], endAt: null });
    };
    const start = () => {
        const secs = remaining > 0 ? remaining : DURATIONS[state.mode];
        setState({ mode: state.mode, running: true, targetSeconds: secs, endAt: Date.now() + secs * 1000 });
        completedRef.current = false;
    };
    const pause = () => {
        setState({ mode: state.mode, running: false, targetSeconds: remaining, endAt: null });
    };
    const reset = () => {
        setState({ mode: state.mode, running: false, targetSeconds: DURATIONS[state.mode], endAt: null });
        completedRef.current = false;
    };

    return (
        <PomodoroContext.Provider value={{ mode: state.mode, running: state.running, remaining, cycles, setMode, start, pause, reset, DURATIONS }}>
            {children}
        </PomodoroContext.Provider>
    );
}

export const usePomodoro = () => useContext(PomodoroContext);

import React, { useEffect, useMemo, useState } from "react";
import { Clock, X, PencilSimple, CaretUp, CaretDown } from "@phosphor-icons/react";

const STORAGE_KEY = "dersim.exam.v2";
const COLLAPSED_KEY = "dersim.exam.collapsed";

function pad(n) { return String(n).padStart(2, "0"); }

function useNow(interval = 1000) {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), interval);
        return () => clearInterval(t);
    }, [interval]);
    return now;
}

function loadSaved() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export default function ExamCountdown() {
    const [config, setConfig] = useState(loadSaved);
    const [editing, setEditing] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(COLLAPSED_KEY) === "1"; } catch { return false; }
    });
    const [label, setLabel] = useState(config?.label || "");
    const [date, setDate] = useState(() => {
        if (!config?.date) return "";
        const d = new Date(config.date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    });
    const now = useNow(1000);

    useEffect(() => {
        if (!config && !editing) setEditing(true);
    }, [config, editing]);

    useEffect(() => {
        try { localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0"); } catch {}
    }, [collapsed]);

    const diff = config ? new Date(config.date).getTime() - now.getTime() : null;
    const parts = useMemo(() => {
        if (diff == null) return null;
        const abs = Math.abs(diff);
        return {
            days: Math.floor(abs / 86400000),
            hours: Math.floor((abs % 86400000) / 3600000),
            minutes: Math.floor((abs % 3600000) / 60000),
            seconds: Math.floor((abs % 60000) / 1000),
            negative: diff < 0,
        };
    }, [diff]);

    const save = () => {
        if (!label.trim() || !date) return;
        const next = { label: label.trim(), date: new Date(date).toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setConfig(next);
        setEditing(false);
    };

    const clear = () => {
        localStorage.removeItem(STORAGE_KEY);
        setConfig(null); setLabel(""); setDate(""); setEditing(true);
    };

    if (config && !editing && collapsed) {
        return (
            <div className="brut-card mb-4 flex items-center justify-between px-3 py-2 gap-3" data-testid="exam-countdown-collapsed"
                 style={{ background: "linear-gradient(90deg, #FFE37E 0%, #FFC9B5 50%, #D0C9FF 100%)" }}>
                <div className="flex items-center gap-2 min-w-0 text-black">
                    <Clock size={16} weight="bold" />
                    <span className="text-xs uppercase tracking-widest font-bold truncate">{config.label}</span>
                    <span className="font-display font-black tabular-nums">
                        {parts?.negative ? "Bitti" : `${parts.days}g ${pad(parts.hours)}s ${pad(parts.minutes)}dk`}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditing(true)} className="brut-btn px-2 py-1 rounded-md bg-white text-black text-xs font-bold flex items-center gap-1" data-testid="countdown-change-btn">
                        <PencilSimple size={12} weight="bold" />
                    </button>
                    <button onClick={() => setCollapsed(false)} className="brut-btn px-2 py-1 rounded-md bg-white text-black text-xs font-bold" aria-label="Genişlet" data-testid="countdown-expand-btn">
                        <CaretDown size={12} weight="bold" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="brut-card p-4 md:p-5 mb-4" data-testid="exam-countdown"
             style={{ background: "linear-gradient(135deg, #FFE37E 0%, #FFC9B5 55%, #D0C9FF 100%)" }}>
            {config && !editing ? (
                <div>
                    {/* Header row: label/title/date on the left, action icons on the right */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                            <div className="tag-pill bg-white mb-1 text-black" data-testid="countdown-label">
                                <Clock size={12} weight="bold" /> {config.label}
                            </div>
                            <h3 className="font-display text-xl md:text-2xl font-black leading-tight text-black">
                                {parts?.negative ? "Sınav tarihi geçti" : "Sınavına kalan süre"}
                            </h3>
                            <p className="text-xs text-neutral-800 mt-0.5">
                                {new Date(config.date).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
                            </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <button onClick={() => setCollapsed(true)} className="brut-btn px-2 py-2 rounded-md font-bold text-xs bg-white text-black" data-testid="countdown-collapse-btn" aria-label="Küçült" title="Küçült"><CaretUp size={14} weight="bold" /></button>
                            <button onClick={() => setEditing(true)} className="brut-btn px-2 py-2 rounded-md font-bold text-xs bg-white text-black" data-testid="countdown-change-btn" aria-label="Düzenle"><PencilSimple size={14} weight="bold" /></button>
                            <button onClick={clear} className="brut-btn px-2 py-2 rounded-md font-bold text-xs bg-white text-black" data-testid="countdown-clear-btn" aria-label="Sıfırla"><X size={14} weight="bold" /></button>
                        </div>
                    </div>
                    {/* Time boxes row (own row, never overlaps) */}
                    <div className="grid grid-cols-4 gap-2" data-testid="countdown-values">
                        <TimeBox value={parts?.days ?? 0} label="Gün" />
                        <TimeBox value={pad(parts?.hours ?? 0)} label="Saat" />
                        <TimeBox value={pad(parts?.minutes ?? 0)} label="Dakika" />
                        <TimeBox value={pad(parts?.seconds ?? 0)} label="Saniye" />
                    </div>
                </div>
            ) : (
                <div>
                    <div className="mb-3">
                        <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-800">Geri Sayım</p>
                        <h3 className="font-display text-xl font-black text-black">Sınav adı ve tarihini gir</h3>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                        <input
                            className="brut-input"
                            placeholder="Sınav adı (örn. KPSS Ön Lisans)"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            data-testid="custom-exam-label"
                        />
                        <input
                            type="datetime-local"
                            className="brut-input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            data-testid="custom-exam-date"
                        />
                        <div className="flex gap-2">
                            <button
                                className="brut-btn px-3 py-2 rounded-md font-bold flex-1"
                                style={{ background: "#A7E8D0", color: "#1A1A1A" }}
                                onClick={save}
                                data-testid="custom-exam-save"
                                disabled={!label.trim() || !date}
                            >Başlat</button>
                            {config && (
                                <button
                                    className="brut-btn px-3 py-2 rounded-md font-bold bg-white text-black"
                                    onClick={() => setEditing(false)}
                                    data-testid="countdown-cancel-btn"
                                >İptal</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TimeBox({ value, label }) {
    return (
        <div className="flex flex-col items-center">
            <div
                className="w-full border-2 border-black bg-white text-black rounded-md py-2 text-center font-display font-black text-2xl md:text-3xl tabular-nums"
                style={{ boxShadow: "3px 3px 0 0 #1A1A1A" }}
            >{value}</div>
            <span className="text-[10px] mt-1 tracking-widest uppercase font-bold text-neutral-800">{label}</span>
        </div>
    );
}

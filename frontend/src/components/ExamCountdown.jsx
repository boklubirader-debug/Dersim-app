import React, { useEffect, useMemo, useState } from "react";
import { Clock, X, PencilSimple } from "@phosphor-icons/react";

const STORAGE_KEY = "dersim.exam.v2";

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
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export default function ExamCountdown() {
    const [config, setConfig] = useState(loadSaved);
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(config?.label || "");
    const [date, setDate] = useState(() => {
        if (!config?.date) return "";
        // convert stored ISO to local datetime-local value
        const d = new Date(config.date);
        const off = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - off).toISOString().slice(0, 16);
    });
    const now = useNow(1000);

    useEffect(() => {
        if (!config && !editing) setEditing(true);
    }, [config, editing]);

    const diff = useMemo(() => {
        if (!config) return null;
        return new Date(config.date).getTime() - now.getTime();
    }, [config, now]);

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
        const iso = new Date(date).toISOString();
        const next = { label: label.trim(), date: iso };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setConfig(next);
        setEditing(false);
    };

    const clear = () => {
        localStorage.removeItem(STORAGE_KEY);
        setConfig(null);
        setLabel("");
        setDate("");
        setEditing(true);
    };

    return (
        <div className="brut-card p-5 md:p-6 mb-8" data-testid="exam-countdown"
             style={{background:"linear-gradient(135deg, #FFE37E 0%, #FFC9B5 55%, #D0C9FF 100%)"}}>
            {config && !editing ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <div className="tag-pill bg-white mb-2 text-black" data-testid="countdown-label">
                            <Clock size={14} weight="bold" /> {config.label}
                        </div>
                        <h3 className="font-display text-2xl sm:text-3xl font-black leading-tight text-black">
                            {parts?.negative ? "Sınav tarihi geçti, tebrikler!" : "Sınavına kalan süre"}
                        </h3>
                        <p className="text-sm mt-1 text-neutral-800">
                            {new Date(config.date).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3" data-testid="countdown-values">
                        <TimeBox value={parts?.days ?? 0} label="Gün" />
                        <TimeBox value={pad(parts?.hours ?? 0)} label="Saat" />
                        <TimeBox value={pad(parts?.minutes ?? 0)} label="Dakika" />
                        <TimeBox value={pad(parts?.seconds ?? 0)} label="Saniye" />
                    </div>

                    <div className="flex md:flex-col gap-2">
                        <button
                            className="brut-btn px-3 py-2 rounded-md font-bold text-xs bg-white text-black flex items-center gap-1"
                            onClick={() => setEditing(true)}
                            data-testid="countdown-change-btn"
                        >
                            <PencilSimple size={14} weight="bold" /> Düzenle
                        </button>
                        <button
                            className="brut-btn px-3 py-2 rounded-md font-bold text-xs bg-white text-black"
                            onClick={clear}
                            data-testid="countdown-clear-btn"
                            aria-label="Sıfırla"
                        >
                            <X size={14} weight="bold" />
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="mb-4">
                        <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-800">Geri Sayım</p>
                        <h3 className="font-display text-2xl font-black text-black">Sınav adı ve tarihini gir</h3>
                        <p className="text-sm text-neutral-800 mt-1">Örn: "KPSS Ön Lisans" — 8 Kasım 2026 10:15</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                        <input
                            className="brut-input sm:col-span-1"
                            placeholder="Sınav adı"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            data-testid="custom-exam-label"
                        />
                        <input
                            type="datetime-local"
                            className="brut-input sm:col-span-1"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            data-testid="custom-exam-date"
                        />
                        <div className="flex gap-2">
                            <button
                                className="brut-btn px-3 py-2 rounded-md font-bold flex-1"
                                style={{background: "#A7E8D0", color: "#1A1A1A"}}
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
                className="border-2 border-black bg-white text-black rounded-md px-2 sm:px-3 py-1 sm:py-2 min-w-[52px] sm:min-w-[64px] text-center font-display font-black text-2xl sm:text-3xl tabular-nums"
                style={{boxShadow:"3px 3px 0 0 #1A1A1A"}}
            >
                {value}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 tracking-widest uppercase font-bold text-neutral-800">{label}</span>
        </div>
    );
}

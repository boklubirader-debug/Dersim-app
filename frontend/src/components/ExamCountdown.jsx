import React, { useEffect, useMemo, useState } from "react";
import { Clock, X, PencilSimple, CheckCircle } from "@phosphor-icons/react";

const STORAGE_KEY = "dersim.exam.v1";

// Preset study/certification exams commonly targeted in Turkey.
// Dates are approximations set from ÖSYM's typical calendar; users can override with "Özel".
const PRESETS = [
    { key: "kpss_lisans_2026",     label: "KPSS Lisans 2026",       date: "2026-09-20T09:30:00+03:00" },
    { key: "kpss_onlisans_2026",   label: "KPSS Önlisans 2026",     date: "2026-11-08T10:15:00+03:00" },
    { key: "kpss_ortaogretim_2026",label: "KPSS Ortaöğretim 2026",  date: "2026-11-22T10:15:00+03:00" },
    { key: "yks_tyt_2026",         label: "YKS - TYT 2026",         date: "2026-06-20T10:15:00+03:00" },
    { key: "yks_ayt_2026",         label: "YKS - AYT 2026",         date: "2026-06-21T10:15:00+03:00" },
    { key: "ales_1_2026",          label: "ALES/1 2026",            date: "2026-04-26T10:15:00+03:00" },
    { key: "ales_2_2026",          label: "ALES/2 2026",            date: "2026-11-15T10:15:00+03:00" },
    { key: "yds_2026",             label: "YDS 2026",               date: "2026-04-05T10:00:00+03:00" },
    { key: "yokdil_2026",          label: "YÖKDİL 2026",            date: "2026-03-08T10:00:00+03:00" },
];

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
    const [config, setConfig] = useState(loadSaved); // {key, label, date}
    const [picking, setPicking] = useState(false);
    const [customLabel, setCustomLabel] = useState("");
    const [customDate, setCustomDate] = useState("");
    const now = useNow(1000);

    useEffect(() => {
        if (!config && !picking) setPicking(true);
    }, [config, picking]);

    const diff = useMemo(() => {
        if (!config) return null;
        const target = new Date(config.date).getTime();
        return target - now.getTime();
    }, [config, now]);

    const parts = useMemo(() => {
        if (diff == null) return null;
        const abs = Math.abs(diff);
        const days = Math.floor(abs / 86400000);
        const hours = Math.floor((abs % 86400000) / 3600000);
        const minutes = Math.floor((abs % 3600000) / 60000);
        const seconds = Math.floor((abs % 60000) / 1000);
        return { days, hours, minutes, seconds, negative: diff < 0 };
    }, [diff]);

    const choose = (preset) => {
        const next = { key: preset.key, label: preset.label, date: preset.date };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setConfig(next);
        setPicking(false);
    };

    const saveCustom = () => {
        if (!customLabel.trim() || !customDate) return;
        const iso = new Date(customDate).toISOString();
        const next = { key: "custom", label: customLabel.trim(), date: iso };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setConfig(next);
        setPicking(false);
    };

    const clear = () => {
        localStorage.removeItem(STORAGE_KEY);
        setConfig(null);
        setPicking(true);
    };

    return (
        <div className="brut-card p-5 md:p-6 mb-8" data-testid="exam-countdown"
             style={{background:"linear-gradient(135deg, #FFE37E 0%, #FFC9B5 55%, #D0C9FF 100%)"}}>
            {config && !picking ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <div className="tag-pill bg-white mb-2" data-testid="countdown-label">
                            <Clock size={14} weight="bold" /> {config.label}
                        </div>
                        <h3 className="font-display text-2xl sm:text-3xl font-black leading-tight">
                            {parts?.negative
                                ? "Sınav tarihi geçti, tebrikler!"
                                : "Sınavına kalan süre"}
                        </h3>
                        <p className="text-sm mt-1 text-neutral-800">
                            {new Date(config.date).toLocaleString("tr-TR", {
                                dateStyle: "long", timeStyle: "short",
                            })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3" data-testid="countdown-values">
                        <TimeBox value={parts?.days ?? 0} label="Gün" />
                        <TimeBox value={pad(parts?.hours ?? 0)} label="Saat" />
                        <TimeBox value={pad(parts?.minutes ?? 0)} label="Dakika" />
                        <TimeBox value={pad(parts?.seconds ?? 0)} label="Saniye" pulse />
                    </div>

                    <div className="flex md:flex-col gap-2">
                        <button
                            className="brut-btn px-3 py-2 rounded-md font-bold text-xs bg-white flex items-center gap-1"
                            onClick={() => setPicking(true)}
                            data-testid="countdown-change-btn"
                        >
                            <PencilSimple size={14} weight="bold" /> Değiştir
                        </button>
                        <button
                            className="brut-btn px-3 py-2 rounded-md font-bold text-xs bg-white"
                            onClick={clear}
                            data-testid="countdown-clear-btn"
                            aria-label="Sıfırla"
                        >
                            <X size={14} weight="bold" />
                        </button>
                    </div>
                </div>
            ) : (
                <ExamPicker
                    onChoose={choose}
                    customLabel={customLabel}
                    customDate={customDate}
                    setCustomLabel={setCustomLabel}
                    setCustomDate={setCustomDate}
                    onSaveCustom={saveCustom}
                    hasConfig={!!config}
                    onCancel={() => setPicking(false)}
                />
            )}
        </div>
    );
}

function TimeBox({ value, label, pulse }) {
    return (
        <div className="flex flex-col items-center">
            <div
                className={`brut-border bg-white rounded-md px-2 sm:px-3 py-1 sm:py-2 min-w-[52px] sm:min-w-[64px] text-center font-display font-black text-2xl sm:text-3xl tabular-nums ${pulse ? "" : ""}`}
                style={{boxShadow:"3px 3px 0 0 #1A1A1A"}}
            >
                {value}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 tracking-widest uppercase font-bold text-neutral-800">{label}</span>
        </div>
    );
}

function ExamPicker({ onChoose, customLabel, customDate, setCustomLabel, setCustomDate, onSaveCustom, hasConfig, onCancel }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div>
                    <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-800">Sınav Seç</p>
                    <h3 className="font-display text-2xl font-black">Hangi sınava çalışıyorsun?</h3>
                </div>
                {hasConfig && (
                    <button
                        className="brut-btn px-3 py-2 rounded-md font-bold text-xs bg-white"
                        onClick={onCancel}
                        data-testid="countdown-cancel-btn"
                    >İptal</button>
                )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                {PRESETS.map((p) => (
                    <button
                        key={p.key}
                        onClick={() => onChoose(p)}
                        className="brut-btn text-left px-3 py-2 rounded-md font-bold bg-white text-sm flex items-center justify-between gap-2"
                        data-testid={`preset-${p.key}`}
                    >
                        <span className="truncate">{p.label}</span>
                        <CheckCircle size={16} weight="duotone" />
                    </button>
                ))}
            </div>
            <div className="brut-card bg-white/70 p-4">
                <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-800 mb-2">Ya da kendi tarihini gir</p>
                <div className="grid sm:grid-cols-3 gap-2">
                    <input
                        className="brut-input sm:col-span-1"
                        placeholder="Sınav adı"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        data-testid="custom-exam-label"
                    />
                    <input
                        type="datetime-local"
                        className="brut-input sm:col-span-1"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        data-testid="custom-exam-date"
                    />
                    <button
                        className="brut-btn px-3 py-2 rounded-md font-bold"
                        style={{background: "#A7E8D0"}}
                        onClick={onSaveCustom}
                        data-testid="custom-exam-save"
                    >Başlat</button>
                </div>
            </div>
        </div>
    );
}

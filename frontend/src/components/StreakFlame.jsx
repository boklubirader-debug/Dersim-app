import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Fire } from "@phosphor-icons/react";

/**
 * Snapchat-style streak flame that sits next to the Dersim logo.
 * Fetches the current consecutive-day streak from /api/stats/weekly.
 * Clicking it reveals which day the user is on.
 */
export default function StreakFlame() {
    const [days, setDays] = useState(null);
    const [open, setOpen] = useState(false);

    const load = async () => {
        try {
            const { data } = await api.get("/stats/weekly");
            setDays(data.streak_days || 0);
        } catch { /* silent */ }
    };
    useEffect(() => {
        load();
        const id = setInterval(load, 60 * 1000);
        return () => clearInterval(id);
    }, []);

    // Close popover on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (!(e.target.closest && e.target.closest("[data-testid='streak-flame']"))) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    if (days == null) return null;
    const active = days > 0;
    const msg = active
        ? `Harika, ${days}. günündesin! Bugün de bir şey ekleyerek seriyi kırma.`
        : "Serine bugün başla — dersine bir şeyler ekleyerek alevi tutuştur.";

    return (
        <div className="relative" data-testid="streak-flame">
            <button
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-2 h-8 rounded-full brut-border select-none"
                style={{
                    background: active ? "linear-gradient(180deg,#FF6B35 0%,#FFB347 100%)" : "var(--muted-bg)",
                    color: active ? "#1A1A1A" : "var(--muted)",
                    boxShadow: active ? "2px 2px 0 0 var(--shadow-color)" : undefined,
                }}
                aria-label={`Çalışma serisi: ${days} gün`}
                data-testid="streak-flame-btn"
                title={`${days} gün üst üste`}
            >
                <Fire size={16} weight={active ? "fill" : "duotone"} className={active ? "animate-pulse" : ""} />
                <span className="text-sm font-black tabular-nums leading-none" data-testid="streak-days">{days}</span>
            </button>
            {open && (
                <div className="absolute z-50 top-full mt-2 left-0 brut-card p-3 w-64" data-testid="streak-popover">
                    <div className="flex items-center gap-2 mb-1">
                        <Fire size={20} weight="fill" style={{color: active ? "#F97316" : "var(--muted)"}} />
                        <p className="font-display font-black text-lg leading-none">
                            {days} gün <span className="text-sm text-muted font-bold">üst üste</span>
                        </p>
                    </div>
                    <p className="text-xs text-muted">{msg}</p>
                </div>
            )}
        </div>
    );
}

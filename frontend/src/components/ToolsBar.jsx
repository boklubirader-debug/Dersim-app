import React, { useState } from "react";
import { Timer, MusicNote, CalendarCheck, ChartBar, NotePencil, X } from "@phosphor-icons/react";
import Pomodoro from "./Pomodoro";
import MusicPlayer from "./MusicPlayer";
import Review from "./Review";
import Stats from "./Stats";
import Journal from "./Journal";

const TOOLS = [
    { key: "pomodoro", label: "Pomodoro", icon: Timer, color: "#FFE37E" },
    { key: "music", label: "Müzik", icon: MusicNote, color: "#D0C9FF" },
    { key: "review", label: "Tekrar", icon: CalendarCheck, color: "#A7E8D0" },
    { key: "stats", label: "İstatistik", icon: ChartBar, color: "#FFC9B5" },
    { key: "journal", label: "Notlar", icon: NotePencil, color: "#B5E0FF" },
];

export default function ToolsBar({ onOpenCourse }) {
    const [open, setOpen] = useState(null); // key of open tool

    return (
        <div className="mb-4" data-testid="tools-bar">
            <div className="flex flex-wrap gap-2">
                {TOOLS.map((t) => {
                    const Icon = t.icon;
                    const active = open === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setOpen(active ? null : t.key)}
                            className={`brut-btn px-3 py-2 rounded-md font-bold text-sm flex items-center gap-2 ${active ? "translate-x-[2px] translate-y-[2px]" : ""}`}
                            style={{ background: active ? t.color : undefined, color: active ? "#1A1A1A" : undefined, boxShadow: active ? "2px 2px 0 0 var(--shadow-color)" : undefined }}
                            data-testid={`tool-${t.key}`}
                        >
                            <Icon size={16} weight={active ? "fill" : "bold"} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {open && (
                <div className="mt-3 brut-card p-4 md:p-5" data-testid={`tool-panel-${open}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {(() => { const T = TOOLS.find((t) => t.key === open); const Icon = T.icon; return (
                                <>
                                    <div className="w-8 h-8 brut-border rounded-md flex items-center justify-center" style={{ background: T.color, color: "#1A1A1A" }}>
                                        <Icon size={16} weight="fill" />
                                    </div>
                                    <h3 className="font-display text-xl font-black">{T.label}</h3>
                                </>
                            ); })()}
                        </div>
                        <button
                            onClick={() => setOpen(null)}
                            className="brut-btn px-2 py-2 rounded-md"
                            aria-label="Kapat"
                            data-testid="tool-close"
                        >
                            <X size={16} weight="bold" />
                        </button>
                    </div>
                    {open === "pomodoro" && <Pomodoro />}
                    {open === "music" && <MusicPlayer />}
                    {open === "review" && <Review onOpenCourse={(id) => { onOpenCourse?.(id); setOpen(null); }} />}
                    {open === "stats" && <Stats />}
                    {open === "journal" && <Journal />}
                </div>
            )}
        </div>
    );
}

import React, { useState } from "react";
import { MusicNote, Waveform } from "@phosphor-icons/react";

const TRACKS = [
    {
        id: "lofi",
        title: "Lo-fi Hip Hop",
        subtitle: "Ders çalışırken en sevilen",
        embed: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1",
        thumb: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
        color: "#FFC9B5",
    },
    {
        id: "chillhop",
        title: "Chillhop Radio",
        subtitle: "Jazzy chill beats",
        embed: "https://www.youtube.com/embed/5yx6BWlEVcY?autoplay=1",
        thumb: "https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg",
        color: "#D0C9FF",
    },
    {
        id: "rain",
        title: "Yağmur & Fırtına",
        subtitle: "Doğa sesleri",
        embed: "https://www.youtube.com/embed/mPZkdNFkNps?autoplay=1",
        thumb: "https://i.ytimg.com/vi/mPZkdNFkNps/hqdefault.jpg",
        color: "#A7E8D0",
    },
    {
        id: "forest",
        title: "Orman & Kuşlar",
        subtitle: "Doğa sesleri",
        embed: "https://www.youtube.com/embed/OdIJ2x3nxzQ?autoplay=1",
        thumb: "https://i.ytimg.com/vi/OdIJ2x3nxzQ/hqdefault.jpg",
        color: "#B5E0FF",
    },
];

export default function MusicPlayer() {
    const [playing, setPlaying] = useState(null); // track id

    return (
        <div className="space-y-4" data-testid="music-panel">
            <div className="grid sm:grid-cols-2 gap-3">
                {TRACKS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setPlaying(playing === t.id ? null : t.id)}
                        className={`brut-card p-3 text-left flex items-center gap-3 transition-transform duration-150 ${playing === t.id ? "translate-x-[2px] translate-y-[2px]" : ""}`}
                        style={{
                            boxShadow: playing === t.id ? "2px 2px 0 0 var(--shadow-color)" : "4px 4px 0 0 var(--shadow-color)",
                        }}
                        data-testid={`music-track-${t.id}`}
                    >
                        <div className="w-14 h-14 shrink-0 brut-border rounded-md overflow-hidden" style={{ background: t.color }}>
                            <img src={t.thumb} alt={t.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-display font-bold truncate flex items-center gap-1">
                                {playing === t.id && <Waveform size={16} weight="bold" className="animate-pulse" />}
                                {t.title}
                            </div>
                            <div className="text-xs text-muted truncate">{t.subtitle}</div>
                        </div>
                    </button>
                ))}
            </div>

            {playing && (
                <div className="brut-card p-2" data-testid="music-player-frame">
                    <iframe
                        title="Odaklanma müziği"
                        src={TRACKS.find((t) => t.id === playing).embed}
                        className="w-full aspect-video rounded-md"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                    <p className="text-xs text-muted p-2 flex items-center gap-1">
                        <MusicNote size={12} weight="bold" /> Sekme sesini kısarak arka planda çalabilirsin.
                    </p>
                </div>
            )}
            {!playing && (
                <p className="text-sm text-muted">Bir parça seç ve çalışmaya başla. Diğerini seçince otomatik değişir.</p>
            )}
        </div>
    );
}

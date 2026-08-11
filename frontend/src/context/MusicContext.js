import React, { createContext, useContext, useEffect, useState } from "react";

const MusicContext = createContext(null);
const CUSTOM_KEY = "dersim.music.custom.v1";
const PLAYING_KEY = "dersim.music.playing.v1";
const MIN_KEY = "dersim.music.minimized.v1";

// Curated defaults — all 24/7 embeddable live streams (verified working).
// These are non-removable but user can override the URL of any track.
export const DEFAULT_TRACKS = [
    {
        id: "lofi-girl",
        title: "Lo-fi Hip Hop",
        subtitle: "Chill beats to study",
        videoId: "MYPVQccHhAQ",
        thumb: "https://i.ytimg.com/vi/MYPVQccHhAQ/hqdefault.jpg",
        color: "#FFC9B5",
        builtin: true,
    },
    {
        id: "chillhop",
        title: "Chillhop Radio",
        subtitle: "Jazzy chill beats",
        videoId: "5yx6BWlEVcY",
        thumb: "https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg",
        color: "#D0C9FF",
        builtin: true,
    },
    {
        id: "rain",
        title: "Yağmur & Fırtına",
        subtitle: "Doğa sesleri",
        videoId: "mPZkdNFkNps",
        thumb: "https://i.ytimg.com/vi/mPZkdNFkNps/hqdefault.jpg",
        color: "#A7E8D0",
        builtin: true,
    },
    {
        id: "forest",
        title: "Orman & Kuşlar",
        subtitle: "Doğa sesleri",
        videoId: "OdIJ2x3nxzQ",
        thumb: "https://i.ytimg.com/vi/OdIJ2x3nxzQ/hqdefault.jpg",
        color: "#B5E0FF",
        builtin: true,
    },
];

function extractYouTubeId(url) {
    if (!url) return null;
    // If it looks like just an ID already
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    try {
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, "");
        if (host === "youtu.be") return u.pathname.replace(/^\//, "").split("/")[0] || null;
        if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
            const v = u.searchParams.get("v");
            if (v) return v;
            const parts = u.pathname.split("/").filter(Boolean);
            const idx = parts.findIndex((p) => p === "embed" || p === "v" || p === "shorts");
            if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
        }
    } catch {}
    return null;
}

function loadCustom() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"); } catch { return []; }
}
function saveCustom(list) {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); } catch {}
}
function loadPlayingId() {
    try { return localStorage.getItem(PLAYING_KEY) || null; } catch { return null; }
}
function savePlayingId(id) {
    try { id ? localStorage.setItem(PLAYING_KEY, id) : localStorage.removeItem(PLAYING_KEY); } catch {}
}
function loadMinimized() {
    try { return localStorage.getItem(MIN_KEY) === "1"; } catch { return false; }
}
function saveMinimized(v) {
    try { localStorage.setItem(MIN_KEY, v ? "1" : "0"); } catch {}
}

export function MusicProvider({ children }) {
    const [customTracks, setCustomTracks] = useState(loadCustom);
    const [playingId, setPlayingId] = useState(loadPlayingId);
    const [minimized, setMinimized] = useState(loadMinimized);

    useEffect(() => saveCustom(customTracks), [customTracks]);
    useEffect(() => savePlayingId(playingId), [playingId]);
    useEffect(() => saveMinimized(minimized), [minimized]);

    const tracks = null; // deprecated — use `merged` below
    // eslint-disable-next-line no-unused-vars
    const _tracks_dead = tracks;

    const play = (id) => setPlayingId(id === playingId ? null : id);
    const stop = () => setPlayingId(null);

    const addCustomTrack = ({ title, url }) => {
        const vid = extractYouTubeId(url);
        if (!vid) return { ok: false, error: "Geçerli bir YouTube linki gir" };
        const id = `custom-${Date.now()}`;
        const track = {
            id,
            title: title || "Özel parça",
            subtitle: "Özel",
            videoId: vid,
            thumb: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
            color: "#FFE37E",
            builtin: false,
        };
        setCustomTracks((c) => [...c, track]);
        return { ok: true, track };
    };

    const removeTrack = (id) => {
        setCustomTracks((c) => c.filter((t) => t.id !== id));
        if (playingId === id) setPlayingId(null);
    };

    const updateBuiltinUrl = (id, url) => {
        const vid = extractYouTubeId(url);
        if (!vid) return { ok: false, error: "Geçerli bir YouTube linki gir" };
        // Override built-in via a virtual custom entry with the same id → replaces defaults in the list
        setCustomTracks((c) => {
            const others = c.filter((t) => t.id !== id);
            const original = DEFAULT_TRACKS.find((d) => d.id === id);
            return [...others, {
                ...original,
                videoId: vid,
                thumb: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                override: true,
            }];
        });
        return { ok: true };
    };

    // If both a default and an override exist, prefer the override
    const mergedTracks = (() => {
        const map = new Map();
        for (const d of DEFAULT_TRACKS) map.set(d.id, d);
        for (const c of customTracks) map.set(c.id, { ...(map.get(c.id) || {}), ...c });
        return Array.from(map.values());
    })();

    const merged = mergedTracks;
    const mergedPlaying = merged.find((t) => t.id === playingId) || null;

    return (
        <MusicContext.Provider
            value={{
                tracks: merged,
                customTracks,
                playing: mergedPlaying,
                playingId,
                minimized,
                setMinimized,
                play,
                stop,
                addCustomTrack,
                removeTrack,
                updateBuiltinUrl,
            }}
        >
            {children}
            <GlobalPlayer track={mergedPlaying} minimized={minimized} onToggleMin={() => setMinimized((v) => !v)} onStop={stop} />
        </MusicContext.Provider>
    );
}

function GlobalPlayer({ track, minimized, onToggleMin, onStop }) {
    if (!track) return null;
    const embed = `https://www.youtube-nocookie.com/embed/${track.videoId}?autoplay=1&modestbranding=1&rel=0`;
    // Always render the iframe (so it keeps playing).
    // Minimized: shrink to a small pill in the bottom-right; expanded: bigger card.
    return (
        <div
            className="fixed z-50 bottom-4 right-4 brut-card overflow-hidden"
            style={{ width: minimized ? 260 : 340, transition: "width 200ms ease" }}
            data-testid="music-floating"
        >
            <div className="flex items-center gap-2 p-2 border-b-2 border-[color:var(--ink)]" style={{ background: track.color || "#FFE37E", color: "#1A1A1A" }}>
                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                <span className="text-xs font-bold truncate flex-1" title={track.title}>{track.title}</span>
                <button
                    onClick={onToggleMin}
                    className="text-xs font-bold px-2 py-0.5 border-2 border-black rounded-md bg-white hover:bg-neutral-100"
                    data-testid="music-min-toggle"
                    aria-label={minimized ? "Genişlet" : "Küçült"}
                >{minimized ? "▲" : "▼"}</button>
                <button
                    onClick={onStop}
                    className="text-xs font-bold px-2 py-0.5 border-2 border-black rounded-md bg-white hover:bg-neutral-100"
                    data-testid="music-stop"
                    aria-label="Durdur"
                >✕</button>
            </div>
            <div style={{ height: minimized ? 0 : 190, transition: "height 200ms ease" }}>
                <iframe
                    key={track.videoId}
                    title={track.title}
                    src={embed}
                    className="w-full h-full block"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </div>
    );
}

export const useMusic = () => useContext(MusicContext);

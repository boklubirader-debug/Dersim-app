import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const MusicContext = createContext(null);
const CUSTOM_KEY = "dersim.music.custom.v1";
const PLAYING_KEY = "dersim.music.playing.v1";
const MIN_KEY = "dersim.music.minimized.v1";
const VOLUME_KEY = "dersim.music.volume.v1";

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
function loadVolume() {
    try {
        const raw = localStorage.getItem(VOLUME_KEY);
        const n = raw == null ? 60 : parseInt(raw, 10);
        return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 60;
    } catch { return 60; }
}
function saveVolume(v) {
    try { localStorage.setItem(VOLUME_KEY, String(v)); } catch {}
}

// Lazy-load the YouTube IFrame Player API once
let ytApiReady = null;
function loadYouTubeApi() {
    if (ytApiReady) return ytApiReady;
    ytApiReady = new Promise((resolve) => {
        if (typeof window === "undefined") return resolve(null);
        if (window.YT && window.YT.Player) return resolve(window.YT);
        const existing = document.getElementById("yt-iframe-api");
        if (!existing) {
            const s = document.createElement("script");
            s.id = "yt-iframe-api";
            s.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(s);
        }
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            try { prev && prev(); } catch {}
            resolve(window.YT);
        };
        // Fallback poll
        const poll = setInterval(() => {
            if (window.YT && window.YT.Player) {
                clearInterval(poll);
                resolve(window.YT);
            }
        }, 200);
        setTimeout(() => clearInterval(poll), 8000);
    });
    return ytApiReady;
}

export function MusicProvider({ children }) {
    const [customTracks, setCustomTracks] = useState(loadCustom);
    const [playingId, setPlayingId] = useState(loadPlayingId);
    const [minimized, setMinimized] = useState(loadMinimized);
    const [volume, setVolume] = useState(loadVolume);

    useEffect(() => saveCustom(customTracks), [customTracks]);
    useEffect(() => savePlayingId(playingId), [playingId]);
    useEffect(() => saveMinimized(minimized), [minimized]);
    useEffect(() => saveVolume(volume), [volume]);

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
                volume,
                setVolume,
                play,
                stop,
                addCustomTrack,
                removeTrack,
                updateBuiltinUrl,
            }}
        >
            {children}
            <GlobalPlayer track={mergedPlaying} minimized={minimized} volume={volume} setVolume={setVolume} onToggleMin={() => setMinimized((v) => !v)} onStop={stop} />
        </MusicContext.Provider>
    );
}

function GlobalPlayer({ track, minimized, volume, setVolume, onToggleMin, onStop }) {
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const [muted, setMuted] = useState(false);
    const lastVolRef = useRef(volume);

    // Init / recreate player when track changes
    useEffect(() => {
        if (!track || !containerRef.current) return;
        let cancelled = false;
        (async () => {
            const YT = await loadYouTubeApi();
            if (cancelled || !YT || !containerRef.current) return;
            if (playerRef.current) {
                try { playerRef.current.loadVideoById(track.videoId); return; } catch {}
            }
            playerRef.current = new YT.Player(containerRef.current, {
                videoId: track.videoId,
                host: "https://www.youtube-nocookie.com",
                playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                },
                events: {
                    onReady: (e) => {
                        try {
                            e.target.setVolume(volume);
                            e.target.playVideo();
                        } catch {}
                    },
                },
            });
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [track?.videoId]);

    // Apply volume changes
    useEffect(() => {
        try { playerRef.current?.setVolume?.(muted ? 0 : volume); } catch {}
    }, [volume, muted]);

    // Cleanup player on stop
    useEffect(() => {
        if (!track && playerRef.current) {
            try { playerRef.current.destroy(); } catch {}
            playerRef.current = null;
        }
    }, [track]);

    if (!track) return null;

    const toggleMute = () => {
        if (muted) {
            setMuted(false);
            if (volume === 0) setVolume(lastVolRef.current || 60);
        } else {
            lastVolRef.current = volume;
            setMuted(true);
        }
    };

    const effectiveVol = muted ? 0 : volume;
    const VolIcon = effectiveVol === 0 ? "🔇" : effectiveVol < 33 ? "🔈" : effectiveVol < 66 ? "🔉" : "🔊";

    return (
        <div
            className="fixed z-50 bottom-4 right-4 brut-card overflow-hidden"
            style={{ width: minimized ? 280 : 340, transition: "width 200ms ease" }}
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

            {/* Volume slider (always visible) */}
            <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-[color:var(--ink)]" style={{ background: "var(--surface)" }}>
                <button
                    onClick={toggleMute}
                    className="text-lg leading-none w-7 h-7 flex items-center justify-center rounded-md border-2 border-[color:var(--ink)] hover:bg-[color:var(--muted-bg)]"
                    data-testid="music-mute"
                    aria-label={muted ? "Sesi aç" : "Sesi kapat"}
                    title={muted ? "Sesi aç" : "Sesi kapat"}
                >{VolIcon}</button>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={effectiveVol}
                    onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (muted && v > 0) setMuted(false);
                        setVolume(v);
                    }}
                    className="flex-1 accent-[#1A1A1A] cursor-pointer"
                    data-testid="music-volume-slider"
                    aria-label="Ses seviyesi"
                />
                <span className="text-xs font-bold tabular-nums w-8 text-right" data-testid="music-volume-value">{effectiveVol}</span>
            </div>

            <div style={{ height: minimized ? 0 : 190, transition: "height 200ms ease" }}>
                <div ref={containerRef} className="w-full h-full block" data-testid="music-player-container" />
            </div>
        </div>
    );
}

export const useMusic = () => useContext(MusicContext);

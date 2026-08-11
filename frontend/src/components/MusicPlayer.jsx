import React, { useState } from "react";
import { useMusic } from "../context/MusicContext";
import { MusicNote, Play, Pause, Trash, Plus, PencilSimple, Waveform, StopCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function MusicPlayer() {
    const { tracks, playing, playingId, play, stop, addCustomTrack, removeTrack, updateBuiltinUrl } = useMusic();
    const [newTitle, setNewTitle] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingUrl, setEditingUrl] = useState("");

    const submitCustom = (e) => {
        e.preventDefault();
        const r = addCustomTrack({ title: newTitle.trim(), url: newUrl.trim() });
        if (!r.ok) { toast.error(r.error); return; }
        setNewTitle(""); setNewUrl("");
        toast.success("Parça eklendi");
    };

    const saveEdit = (id) => {
        const r = updateBuiltinUrl(id, editingUrl.trim());
        if (!r.ok) { toast.error(r.error); return; }
        setEditingId(null); setEditingUrl("");
        toast.success("Bağlantı güncellendi");
    };

    return (
        <div className="space-y-4" data-testid="music-panel">
            <div className="grid sm:grid-cols-2 gap-3">
                {tracks.map((t) => {
                    const active = playingId === t.id;
                    const isBuiltin = t.builtin || ["lofi-girl", "chillhop", "rain", "forest"].includes(t.id);
                    return (
                        <div key={t.id} className={`brut-card p-3 flex flex-col gap-2 ${active ? "translate-x-[2px] translate-y-[2px]" : ""}`}
                             style={{ boxShadow: active ? "2px 2px 0 0 var(--shadow-color)" : undefined }}
                             data-testid={`music-track-${t.id}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 shrink-0 brut-border rounded-md overflow-hidden" style={{ background: t.color }}>
                                    <img src={t.thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-display font-bold truncate flex items-center gap-1">
                                        {active && <Waveform size={16} weight="bold" className="animate-pulse" />}
                                        {t.title}
                                    </div>
                                    <div className="text-xs text-muted truncate">{t.subtitle}</div>
                                </div>
                            </div>
                            {editingId === t.id ? (
                                <div className="flex gap-2">
                                    <input
                                        autoFocus
                                        value={editingUrl}
                                        onChange={(e) => setEditingUrl(e.target.value)}
                                        placeholder="Yeni YouTube linki"
                                        className="brut-input text-xs"
                                        data-testid={`music-edit-input-${t.id}`}
                                    />
                                    <button onClick={() => saveEdit(t.id)} className="brut-btn px-2 py-1 rounded-md text-xs font-bold" style={{background:"#A7E8D0", color:"#1A1A1A"}} data-testid={`music-edit-save-${t.id}`}>Kaydet</button>
                                    <button onClick={() => setEditingId(null)} className="brut-btn px-2 py-1 rounded-md text-xs font-bold">İptal</button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => play(t.id)}
                                        className="brut-btn flex-1 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-1"
                                        style={{ background: active ? "#FFC9B5" : "#FFE37E", color: "#1A1A1A" }}
                                        data-testid={`music-play-${t.id}`}
                                    >
                                        {active ? <><Pause size={14} weight="fill" /> Durdur</> : <><Play size={14} weight="fill" /> Çal</>}
                                    </button>
                                    <button
                                        onClick={() => { setEditingId(t.id); setEditingUrl(""); }}
                                        className="brut-btn px-2 py-2 rounded-md font-bold text-xs"
                                        data-testid={`music-edit-${t.id}`}
                                        aria-label="Bağlantıyı düzenle"
                                        title="Linki değiştir"
                                    >
                                        <PencilSimple size={14} weight="bold" />
                                    </button>
                                    {!isBuiltin && (
                                        <button
                                            onClick={() => removeTrack(t.id)}
                                            className="brut-btn px-2 py-2 rounded-md font-bold text-xs text-red-600"
                                            data-testid={`music-remove-${t.id}`}
                                            aria-label="Sil"
                                        >
                                            <Trash size={14} weight="bold" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <form onSubmit={submitCustom} className="brut-card p-3 space-y-2" data-testid="music-add-form">
                <p className="text-xs tracking-widest uppercase font-bold text-muted flex items-center gap-1">
                    <Plus size={14} weight="bold" /> Kendi parçanı ekle
                </p>
                <div className="grid sm:grid-cols-3 gap-2">
                    <input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Parça adı"
                        className="brut-input"
                        data-testid="music-new-title"
                        required
                    />
                    <input
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="YouTube linki veya video ID"
                        className="brut-input sm:col-span-1"
                        data-testid="music-new-url"
                        required
                    />
                    <button
                        type="submit"
                        className="brut-btn px-3 py-2 rounded-md font-bold flex items-center justify-center gap-1"
                        style={{ background: "#D0C9FF", color: "#1A1A1A" }}
                        data-testid="music-add-btn"
                    >
                        <Plus size={16} weight="bold" /> Ekle
                    </button>
                </div>
            </form>

            {playing ? (
                <div className="brut-card p-3 flex items-center justify-between gap-2" style={{ background: "var(--muted-bg)" }}>
                    <div className="text-sm">
                        <b>{playing.title}</b> çalıyor — sekmeyi kapatsan bile sağ altta küçük oynatıcıda çalmaya devam eder.
                    </div>
                    <button
                        onClick={stop}
                        className="brut-btn px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1"
                        data-testid="music-stop-panel"
                    >
                        <StopCircle size={14} weight="bold" /> Durdur
                    </button>
                </div>
            ) : (
                <p className="text-sm text-muted flex items-center gap-1">
                    <MusicNote size={14} weight="bold" /> Bir parça seç ve çalıştır. Panel kapansa da çalmaya devam eder.
                </p>
            )}
        </div>
    );
}

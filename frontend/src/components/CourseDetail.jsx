import React, { useEffect, useState, useRef, useCallback } from "react";
import { api, API } from "../lib/api";
import { toast } from "sonner";
import {
    FilePdf, LinkSimple, NotePencil, UploadSimple, Trash,
    ArrowSquareOut, CheckCircle, CircleNotch, Plus, Play, Eye
} from "@phosphor-icons/react";
import PdfViewer from "./PdfViewer";
import { detectVideo } from "../lib/video";
import RichTextEditor from "./RichTextEditor";

const TABS = [
    { key: "pdfs", label: "PDF'ler", icon: FilePdf, color: "#FFE37E" },
    { key: "links", label: "Linkler", icon: LinkSimple, color: "#A7E8D0" },
    { key: "notes", label: "Notlar", icon: NotePencil, color: "#D0C9FF" },
];

function useDebouncedSave(callback, delay = 700) {
    const timer = useRef(null);
    return useCallback((...args) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
}

const LAST_TAB_KEY = "dersim.lastTab.v1";
function loadLastTab(courseId) {
    try {
        const obj = JSON.parse(localStorage.getItem(LAST_TAB_KEY) || "{}");
        const t = obj[courseId];
        return t === "pdfs" || t === "links" || t === "notes" ? t : "pdfs";
    } catch { return "pdfs"; }
}
function saveLastTab(courseId, tab) {
    try {
        const obj = JSON.parse(localStorage.getItem(LAST_TAB_KEY) || "{}");
        obj[courseId] = tab;
        localStorage.setItem(LAST_TAB_KEY, JSON.stringify(obj));
    } catch {}
}

export default function CourseDetail({ course, onCourseUpdate }) {
    const [tab, setTab] = useState(() => loadLastTab(course.id));
    const [pdfs, setPdfs] = useState([]);
    const [links, setLinks] = useState([]);
    const [notes, setNotes] = useState(course.notes || "");
    const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [viewingPdf, setViewingPdf] = useState(null);
    const fileInputRef = useRef(null);

    const changeTab = (t) => {
        setTab(t);
        saveLastTab(course.id, t);
    };

    useEffect(() => {
        setTab(loadLastTab(course.id));
        setNotes(course.notes || "");
        (async () => {
            try {
                const [p, l] = await Promise.all([
                    api.get(`/courses/${course.id}/pdfs`),
                    api.get(`/courses/${course.id}/links`),
                ]);
                setPdfs(p.data);
                setLinks(l.data);
            } catch {
                toast.error("Veriler alınamadı");
            }
        })();
    }, [course.id]);

    const saveNotes = useCallback(async (text) => {
        setSaveState("saving");
        try {
            const { data } = await api.patch(`/courses/${course.id}`, { notes: text });
            setSaveState("saved");
            onCourseUpdate?.(data);
            setTimeout(() => setSaveState("idle"), 1500);
        } catch {
            setSaveState("idle");
            toast.error("Notlar kaydedilemedi");
        }
    }, [course.id, onCourseUpdate]);

    const debouncedSave = useDebouncedSave(saveNotes, 700);

    const onNotesChange = (v) => {
        setNotes(v);
        setSaveState("saving");
        debouncedSave(v);
    };

    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        for (const file of Array.from(files)) {
            const fd = new FormData();
            fd.append("file", file);
            try {
                const { data } = await api.post(`/courses/${course.id}/pdfs`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setPdfs((p) => [data, ...p]);
                toast.success(`${file.name} yüklendi`);
            } catch (e) {
                toast.error(e.response?.data?.detail || `${file.name} yüklenemedi`);
            }
        }
        setUploading(false);
    };

    const deletePdf = async (id) => {
        try {
            await api.delete(`/pdfs/${id}`);
            setPdfs((p) => p.filter((x) => x.id !== id));
            toast.success("PDF silindi");
        } catch {
            toast.error("Silinemedi");
        }
    };

    return (
        <section className="flex-1 min-w-0" data-testid="course-detail">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-14 h-14 brut-border brut-shadow rounded-md flex items-center justify-center font-display font-black text-2xl"
                        style={{ background: course.color || "#FFE37E" }}
                    >
                        {course.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                        <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-500">Aktif Ders</p>
                        <h2 className="font-display text-3xl font-black" data-testid="course-title">{course.name}</h2>
                    </div>
                </div>
                <SaveIndicator state={saveState} />
            </div>

            <div className="flex gap-2 mb-6 flex-wrap" role="tablist">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            role="tab"
                            data-testid={`tab-${t.key}`}
                            onClick={() => changeTab(t.key)}
                            className={`brut-btn px-4 py-2 rounded-md font-bold flex items-center gap-2 ${active ? "translate-x-[2px] translate-y-[2px]" : ""}`}
                            style={{
                                background: active ? t.color : "var(--surface)",
                                color: active ? "#1A1A1A" : "var(--text)",
                                boxShadow: active ? "2px 2px 0 0 var(--shadow-color)" : undefined,
                            }}
                        >
                            <Icon size={18} weight={active ? "fill" : "duotone"} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === "pdfs" && (
                <div className="space-y-4" data-testid="pdfs-panel">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            handleFiles(e.dataTransfer.files);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`brut-card cursor-pointer p-8 text-center transition-colors`}
                        style={{ borderStyle: "dashed", background: dragOver ? "#FFF5D0" : "var(--surface)", color: "var(--text)" }}
                        data-testid="pdf-dropzone"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFiles(e.target.files)}
                            data-testid="pdf-file-input"
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 brut-border rounded-md flex items-center justify-center" style={{background: "#FFE37E"}}>
                                <UploadSimple size={24} weight="bold" />
                            </div>
                            <p className="font-display text-xl font-bold">
                                {uploading ? "Yükleniyor..." : "PDF sürükle bırak veya tıkla"}
                            </p>
                            <p className="text-sm text-neutral-600">En fazla 25MB — birden fazla dosya seçebilirsin</p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {pdfs.map((p) => {
                            return (
                                <div key={p.id} className="brut-card p-4 flex flex-col gap-3" data-testid={`pdf-item-${p.id}`}>
                                    <button
                                        type="button"
                                        onClick={() => setViewingPdf(p)}
                                        className="flex items-start gap-3 text-left"
                                        data-testid={`pdf-open-${p.id}`}
                                    >
                                        <div className="w-10 h-12 brut-border rounded-sm flex items-center justify-center shrink-0" style={{background:"#FFC9B5"}}>
                                            <FilePdf size={20} weight="fill" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold truncate hover:underline" title={p.filename}>{p.filename}</p>
                                            <p className="text-xs text-neutral-600">{(p.size / 1024).toFixed(0)} KB · Aç ve oku</p>
                                        </div>
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setViewingPdf(p)}
                                            className="brut-btn flex-1 py-2 rounded-md text-center font-bold text-sm flex items-center justify-center gap-1"
                                            style={{background: "#A7E8D0"}}
                                            data-testid={`pdf-view-${p.id}`}
                                        >
                                            <Eye size={16} weight="bold" /> Aç
                                        </button>
                                        <button
                                            onClick={() => deletePdf(p.id)}
                                            className="brut-btn px-3 py-2 rounded-md font-bold text-red-600 bg-white"
                                            data-testid={`pdf-delete-${p.id}`}
                                            aria-label="Sil"
                                        >
                                            <Trash size={16} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {pdfs.length === 0 && (
                        <p className="text-sm text-neutral-600 pl-1">Henüz PDF yok. Yukarıdan yükleyerek başla.</p>
                    )}
                </div>
            )}

            {tab === "links" && (
                <LinksPanel courseId={course.id} links={links} setLinks={setLinks} />
            )}

            {tab === "notes" && (
                <div className="space-y-2" data-testid="notes-panel">
                    <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-500">Ders Notları</p>
                    <RichTextEditor
                        value={notes}
                        onChange={onNotesChange}
                        placeholder="Notlarını yaz — Kalın, italik, renk ve vurgu kullanabilirsin. Her şey otomatik kaydedilir."
                    />
                </div>
            )}

            {viewingPdf && (
                <PdfViewer pdf={viewingPdf} onClose={() => setViewingPdf(null)} />
            )}
        </section>
    );
}

function SaveIndicator({ state }) {
    if (state === "saving") return (
        <div className="tag-pill" style={{background:"#FFE37E"}} data-testid="save-indicator-saving">
            <CircleNotch size={14} weight="bold" className="animate-spin" /> Kaydediliyor
        </div>
    );
    if (state === "saved") return (
        <div className="tag-pill" style={{background:"#A7E8D0"}} data-testid="save-indicator-saved">
            <CheckCircle size={14} weight="fill" /> Otomatik Kaydedildi
        </div>
    );
    return (
        <div className="tag-pill bg-white" data-testid="save-indicator-idle">
            <CheckCircle size={14} weight="duotone" /> Tüm değişiklikler kayıtlı
        </div>
    );
}

function LinksPanel({ courseId, links, setLinks }) {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [adding, setAdding] = useState(false);

    const add = async (e) => {
        e.preventDefault();
        if (!title.trim() || !url.trim()) return;
        setAdding(true);
        try {
            const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
            const { data } = await api.post(`/courses/${courseId}/links`, {
                title: title.trim(), url: finalUrl, description: description.trim()
            });
            setLinks([data, ...links]);
            setTitle(""); setUrl(""); setDescription("");
            toast.success("Link kaydedildi");
        } catch {
            toast.error("Link eklenemedi");
        } finally {
            setAdding(false);
        }
    };
    const del = async (id) => {
        try {
            await api.delete(`/links/${id}`);
            setLinks(links.filter((l) => l.id !== id));
            toast.success("Link silindi");
        } catch {
            toast.error("Silinemedi");
        }
    };

    return (
        <div className="space-y-4" data-testid="links-panel">
            <form onSubmit={add} className="brut-card p-4 space-y-3" data-testid="link-form">
                <div className="grid md:grid-cols-2 gap-3">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Link başlığı"
                        className="brut-input"
                        data-testid="link-title-input"
                        required
                    />
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="brut-input"
                        data-testid="link-url-input"
                        required
                    />
                </div>
                <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kısa açıklama (opsiyonel)"
                    className="brut-input"
                    data-testid="link-description-input"
                />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-neutral-600">
                        İpucu: YouTube veya Vimeo linki eklersen video ön izlemesi otomatik gösterilir.
                    </p>
                    <button
                        type="submit"
                        disabled={adding}
                        className="brut-btn py-2 px-4 rounded-md font-bold flex items-center gap-2"
                        style={{background: "#D0C9FF"}}
                        data-testid="link-add-btn"
                    >
                        <Plus size={18} weight="bold" /> Link Ekle
                    </button>
                </div>
            </form>

            <div className="grid md:grid-cols-2 gap-4">
                {links.map((l) => (
                    <LinkCard key={l.id} link={l} onDelete={del} />
                ))}
            </div>
            {links.length === 0 && (
                <p className="text-sm text-neutral-600 pl-1">Henüz link yok. Yukarıdaki formdan ekleyebilirsin. YouTube veya Vimeo linkleri otomatik olarak video kartı olarak gösterilir.</p>
            )}
        </div>
    );
}

function LinkCard({ link, onDelete }) {
    const video = detectVideo(link.url);
    const [playing, setPlaying] = useState(false);

    return (
        <div className="brut-card p-4 flex flex-col gap-3" data-testid={`link-item-${link.id}`}>
            {video && (
                <div className="relative w-full brut-border rounded-md overflow-hidden bg-black" style={{aspectRatio: "16/9"}}>
                    {playing ? (
                        <iframe
                            title={link.title}
                            src={video.embed}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                            data-testid={`link-video-iframe-${link.id}`}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setPlaying(true)}
                            className="w-full h-full relative group"
                            data-testid={`link-video-play-${link.id}`}
                            aria-label="Videoyu oynat"
                        >
                            {video.thumb ? (
                                <img
                                    src={video.thumb}
                                    alt={link.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-white font-display font-black text-2xl px-4 text-center">
                                    {link.title}
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                                <div className="brut-border bg-white rounded-full w-14 h-14 flex items-center justify-center" style={{boxShadow:"3px 3px 0 0 #1A1A1A"}}>
                                    <Play size={22} weight="fill" />
                                </div>
                            </div>
                            <span className="absolute top-2 left-2 tag-pill bg-white text-[10px]" style={{padding:"0.15rem 0.5rem"}}>
                                {video.provider === "youtube" ? "YouTube" : "Vimeo"}
                            </span>
                        </button>
                    )}
                </div>
            )}
            <div className="flex items-start justify-between gap-2">
                <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-display font-bold text-lg underline underline-offset-4 hover:no-underline break-all"
                    data-testid={`link-open-${link.id}`}
                >{link.title}</a>
                <button
                    onClick={() => onDelete(link.id)}
                    className="text-red-600 shrink-0"
                    data-testid={`link-delete-${link.id}`}
                    aria-label="Sil"
                >
                    <Trash size={16} weight="bold" />
                </button>
            </div>
            <p className="text-xs text-neutral-500 break-all">{link.url}</p>
            {link.description && <p className="text-sm">{link.description}</p>}
        </div>
    );
}

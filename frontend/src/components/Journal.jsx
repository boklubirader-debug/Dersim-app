import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import RichTextEditor from "./RichTextEditor";
import { toast } from "sonner";
import { NotePencil, CalendarBlank, CaretDown, CaretUp, CheckCircle, CircleNotch } from "@phosphor-icons/react";

function todayIsoDate() {
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
function fmtDate(iso) {
    try {
        const d = new Date(iso + "T00:00:00");
        return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return iso; }
}
function stripHtmlPreview(html) {
    if (!html) return "";
    try {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const txt = tmp.textContent || tmp.innerText || "";
        return txt.trim().slice(0, 160);
    } catch { return ""; }
}

export default function Journal() {
    const [today] = useState(todayIsoDate());
    const [todayContent, setTodayContent] = useState("");
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
    const [expandedDate, setExpandedDate] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [t, list] = await Promise.all([
                    api.get(`/journal/${today}`),
                    api.get(`/journal?days=45`),
                ]);
                if (cancelled) return;
                setTodayContent(t.data.content || "");
                setEntries(list.data.filter((e) => e.date !== today));
            } catch {
                toast.error("Notlar alınamadı");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [today]);

    const doSave = useCallback(async (content) => {
        setSaveState("saving");
        try {
            await api.put(`/journal/${today}`, { content });
            setSaveState("saved");
            setTimeout(() => setSaveState("idle"), 1500);
        } catch {
            setSaveState("idle");
            toast.error("Kaydedilemedi");
        }
    }, [today]);

    const onChange = (v) => {
        setTodayContent(v);
        setSaveState("saving");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => doSave(v), 700);
    };

    return (
        <div className="space-y-4" data-testid="journal-panel">
            <div className="flex items-center gap-2 flex-wrap">
                <div className="tag-pill" style={{background:"#FFE37E", color:"#1A1A1A"}}>
                    <CalendarBlank size={14} weight="bold" /> Bugün — {fmtDate(today)}
                </div>
                <SaveIndicator state={saveState} />
            </div>

            {loading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : (
                <RichTextEditor
                    value={todayContent}
                    onChange={onChange}
                    placeholder="Bugün ne yapacaksın? Neleri tamamladın? Rengarenk yaz, her şey otomatik kaydolur."
                />
            )}

            <div className="space-y-2">
                <p className="text-xs tracking-[0.2em] uppercase font-bold text-muted mt-2 flex items-center gap-1">
                    <NotePencil size={12} weight="bold" /> Geçmiş Notlar
                </p>
                {entries.length === 0 && (
                    <p className="text-sm text-muted pl-1">Henüz geçmiş kayıt yok. Bugün yazdıkların yarın burada listelenecek.</p>
                )}
                {entries.map((e) => {
                    const open = expandedDate === e.date;
                    return (
                        <div key={e.date} className="brut-card" data-testid={`journal-entry-${e.date}`}>
                            <button
                                onClick={() => setExpandedDate(open ? null : e.date)}
                                className="w-full flex items-center justify-between gap-3 p-3 text-left"
                                data-testid={`journal-toggle-${e.date}`}
                            >
                                <div className="min-w-0">
                                    <div className="font-bold text-sm">{fmtDate(e.date)}</div>
                                    {!open && (
                                        <div className="text-xs text-muted truncate">{stripHtmlPreview(e.content) || "(boş)"}</div>
                                    )}
                                </div>
                                {open ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                            </button>
                            {open && (
                                <div className="px-4 pb-4 -mt-1">
                                    {e.content ? (
                                        <div
                                            className="rt-view prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: e.content }}
                                            data-testid={`journal-content-${e.date}`}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted italic">Boş bırakılmış.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <style>{`
                .rt-view h3 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 1.15rem; margin: 0.5rem 0; }
                .rt-view ul { list-style: disc; padding-left: 1.4rem; }
                .rt-view ol { list-style: decimal; padding-left: 1.4rem; }
                .rt-view p { margin: 0.35rem 0; }
            `}</style>
        </div>
    );
}

function SaveIndicator({ state }) {
    if (state === "saving") return (
        <div className="tag-pill" style={{background:"#FFE37E", color:"#1A1A1A"}} data-testid="journal-save-saving">
            <CircleNotch size={12} weight="bold" className="animate-spin" /> Kaydediliyor
        </div>
    );
    if (state === "saved") return (
        <div className="tag-pill" style={{background:"#A7E8D0", color:"#1A1A1A"}} data-testid="journal-save-saved">
            <CheckCircle size={12} weight="fill" /> Otomatik Kaydedildi
        </div>
    );
    return (
        <div className="tag-pill" data-testid="journal-save-idle">
            <CheckCircle size={12} weight="duotone" /> Tüm değişiklikler kayıtlı
        </div>
    );
}

import React, { useEffect, useState } from "react";
import { api, API } from "../lib/api";
import { CircleNotch, ArrowSquareOut, DownloadSimple } from "@phosphor-icons/react";

/**
 * Inline PDF viewer — embeds the currently-selected PDF directly in the tab.
 * No need to click "Open" separately.
 */
export default function InlinePdfViewer({ pdf, onOpenFullscreen }) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!pdf) return;
        let cancelled = false;
        let currentUrl = null;
        setLoading(true);
        setError(null);
        setBlobUrl(null);
        (async () => {
            try {
                const resp = await api.get(`/pdfs/${pdf.id}/download`, { responseType: "blob" });
                if (cancelled) return;
                currentUrl = URL.createObjectURL(resp.data);
                setBlobUrl(currentUrl);
            } catch {
                if (!cancelled) setError("PDF açılamadı");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            if (currentUrl) URL.revokeObjectURL(currentUrl);
        };
    }, [pdf?.id]);

    if (!pdf) return null;
    const rawUrl = `${API}/pdfs/${pdf.id}/download`;

    return (
        <div className="brut-card overflow-hidden" data-testid="pdf-inline-viewer">
            <div className="flex items-center justify-between gap-2 p-2 border-b-2 border-[color:var(--ink)]" style={{background:"var(--muted-bg)"}}>
                <div className="min-w-0 flex items-center gap-2">
                    <span className="tag-pill" style={{background:"#FFE37E", color:"#1A1A1A"}}>PDF</span>
                    <p className="font-bold text-sm truncate" title={pdf.filename}>{pdf.filename}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => onOpenFullscreen?.(pdf)}
                        className="brut-btn px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"
                        data-testid="pdf-inline-fullscreen"
                        aria-label="Tam ekran"
                    >
                        <ArrowSquareOut size={14} weight="bold" /> Tam ekran
                    </button>
                    <a
                        href={blobUrl || rawUrl}
                        download={pdf.filename}
                        className="brut-btn px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"
                        data-testid="pdf-inline-download"
                    >
                        <DownloadSimple size={14} weight="bold" />
                    </a>
                </div>
            </div>
            <div className="bg-neutral-200" style={{height: "min(72vh, 780px)"}}>
                {loading && (
                    <div className="h-full flex items-center justify-center text-muted gap-2">
                        <CircleNotch size={18} weight="bold" className="animate-spin" /> Yükleniyor...
                    </div>
                )}
                {error && <div className="h-full flex items-center justify-center text-red-600 font-bold">{error}</div>}
                {!loading && !error && blobUrl && (
                    <iframe
                        title={pdf.filename}
                        src={blobUrl}
                        className="w-full h-full block"
                        data-testid="pdf-inline-iframe"
                    />
                )}
            </div>
        </div>
    );
}

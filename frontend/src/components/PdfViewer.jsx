import React, { useEffect, useState } from "react";
import { api, API } from "../lib/api";
import { X, DownloadSimple, ArrowSquareOut, CircleNotch } from "@phosphor-icons/react";

/**
 * Fullscreen in-app PDF viewer using blob URL (works with httpOnly cookies).
 */
export default function PdfViewer({ pdf, onClose }) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!pdf) return;
        let cancelled = false;
        let currentUrl = null;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const resp = await api.get(`/pdfs/${pdf.id}/download`, { responseType: "blob" });
                if (cancelled) return;
                currentUrl = URL.createObjectURL(resp.data);
                setBlobUrl(currentUrl);
            } catch (e) {
                if (!cancelled) setError("PDF açılamadı");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            if (currentUrl) URL.revokeObjectURL(currentUrl);
        };
    }, [pdf]);

    // ESC to close
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!pdf) return null;

    const rawUrl = `${API}/pdfs/${pdf.id}/download`;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-stretch justify-center p-2 sm:p-4"
            role="dialog"
            aria-modal="true"
            data-testid="pdf-viewer"
        >
            <div className="brut-card bg-[#FDFBF7] w-full max-w-6xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-3 border-b-2 border-black bg-white">
                    <div className="min-w-0 flex items-center gap-2">
                        <div className="tag-pill" style={{background:"#FFE37E"}}>PDF</div>
                        <p className="font-bold truncate" data-testid="pdf-viewer-title">{pdf.filename}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={blobUrl || rawUrl}
                            download={pdf.filename}
                            className="brut-btn px-3 py-2 rounded-md font-bold text-sm bg-white flex items-center gap-1"
                            data-testid="pdf-viewer-download"
                        >
                            <DownloadSimple size={16} weight="bold" /> İndir
                        </a>
                        <a
                            href={blobUrl || rawUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="brut-btn px-3 py-2 rounded-md font-bold text-sm bg-white flex items-center gap-1"
                            data-testid="pdf-viewer-newtab"
                        >
                            <ArrowSquareOut size={16} weight="bold" /> Yeni Sekme
                        </a>
                        <button
                            onClick={onClose}
                            className="brut-btn px-3 py-2 rounded-md font-bold bg-white"
                            aria-label="Kapat"
                            data-testid="pdf-viewer-close"
                        >
                            <X size={16} weight="bold" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-neutral-200 min-h-0">
                    {loading && (
                        <div className="h-full flex items-center justify-center text-neutral-700 gap-2">
                            <CircleNotch size={20} weight="bold" className="animate-spin" /> Yükleniyor...
                        </div>
                    )}
                    {error && (
                        <div className="h-full flex items-center justify-center text-red-600 font-bold">{error}</div>
                    )}
                    {!loading && !error && blobUrl && (
                        <iframe
                            title={pdf.filename}
                            src={blobUrl}
                            className="w-full h-full block"
                            data-testid="pdf-viewer-iframe"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

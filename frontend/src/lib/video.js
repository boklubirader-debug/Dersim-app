// Video URL detection helpers

export function detectVideo(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, "");

        // YouTube
        if (host === "youtu.be") {
            const id = u.pathname.replace(/^\//, "").split("/")[0];
            if (id) return { provider: "youtube", id, embed: `https://www.youtube.com/embed/${id}?autoplay=1`, thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
        }
        if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
            let id = u.searchParams.get("v");
            if (!id) {
                const parts = u.pathname.split("/").filter(Boolean);
                const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
                if (idx >= 0 && parts[idx + 1]) id = parts[idx + 1];
            }
            if (id) return { provider: "youtube", id, embed: `https://www.youtube.com/embed/${id}?autoplay=1`, thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
        }

        // Vimeo
        if (host.endsWith("vimeo.com")) {
            const id = u.pathname.split("/").filter(Boolean).pop();
            if (id && /^\d+$/.test(id)) {
                return {
                    provider: "vimeo",
                    id,
                    embed: `https://player.vimeo.com/video/${id}?autoplay=1`,
                    thumb: null,
                };
            }
        }
    } catch {
        return null;
    }
    return null;
}

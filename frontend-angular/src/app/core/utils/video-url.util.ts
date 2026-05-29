export function normalizeVideoUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    return trimmedUrl;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const host = parsedUrl.hostname.toLowerCase();
    const videoId = extractYoutubeVideoId(host, parsedUrl);

    if (!videoId) {
      return trimmedUrl;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return trimmedUrl;
  }
}

function extractYoutubeVideoId(host: string, parsedUrl: URL): string | null {
  if (host === 'youtu.be') {
    return extractLastSegment(parsedUrl.pathname);
  }

  if (!host.includes('youtube.com')) {
    return null;
  }

  if (parsedUrl.pathname.startsWith('/watch')) {
    return parsedUrl.searchParams.get('v');
  }

  if (parsedUrl.pathname.startsWith('/embed/')) {
    return extractLastSegment(parsedUrl.pathname);
  }

  if (parsedUrl.pathname.startsWith('/shorts/') || parsedUrl.pathname.startsWith('/live/')) {
    return extractLastSegment(parsedUrl.pathname);
  }

  return parsedUrl.searchParams.get('v');
}

function extractLastSegment(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  return segments.at(-1) ?? null;
}

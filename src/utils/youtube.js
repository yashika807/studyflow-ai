// Extracts the 11-character video id from the common YouTube link formats.
// Returns null when the text is not a YouTube video link.
export function parseYouTubeId(input) {
  const text = (input || '').trim();
  if (!text) return null;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id = null;

  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/);
      id = match ? match[1] : null;
    }
  }

  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export function youTubeThumbnail(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function youTubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

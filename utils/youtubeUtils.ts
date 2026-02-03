/**
 * Extrae el ID de video de una URL de YouTube y devuelve la URL de embed.
 * Soporta: watch?v=, youtu.be/, embed/, shorts/
 */
export function getYoutubeEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})(?:\?|&|\/|$)/);
  const videoId = match?.[1];
  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Indica si la URL parece ser de YouTube y tiene un ID de video válido.
 */
export function isValidYoutubeUrl(url: string): boolean {
  return getYoutubeEmbedUrl(url).length > 0;
}

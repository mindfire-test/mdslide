/*
 * Encodes dangerous characters into safe HTML entities to prevent
 * layout breakage and text rendering bugs on slides.
 */

export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizeUrl(url: string, isImage = false): string {
  const trimmed = url.trim();

  // Find protocol (http:, javascript:)
  const protocolMatch = trimmed.match(/^[a-z0-9+.-]+:/i);
  if (protocolMatch) {
    const protocol = protocolMatch[0].toLowerCase();

    // Allowed protocols
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(protocol)) {
      return sanitizeHtml(trimmed);
    }

    // Allow data-URIs only for images and only if they start with image/ MIME types
    if (isImage && protocol === 'data:') {
      const dataUriMatch = trimmed.match(/^data:image\/(png|gif|jpeg|webp|svg\+xml);base64,/i);
      if (dataUriMatch) {
        return sanitizeHtml(trimmed);
      }
    }

    // Block all other protocols
    return 'about:blank';
  }

  // Relative paths, anchors (#), query parameters, etc. are safe
  return sanitizeHtml(trimmed);
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(\?.*)?$/i.test(url.trim());
}

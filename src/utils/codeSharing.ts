export function encodeCode(code: string): string {
  try {
    return btoa(encodeURIComponent(code));
  } catch {
    return '';
  }
}

export function decodeCode(encoded: string): string | null {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return null;
  }
}

export function getShareUrl(code: string): string {
  const encoded = encodeCode(code);
  return `${window.location.origin}${window.location.pathname}?code=${encoded}`;
}

export function getCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('code');
  if (!encoded) return null;
  return decodeCode(encoded);
}

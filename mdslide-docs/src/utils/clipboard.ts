export function copyToClipboard(text: string, onSuccess: () => void): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(onSuccess)
      .catch(() => {});
  }
}

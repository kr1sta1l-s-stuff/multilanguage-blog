export async function copyShareLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    window.prompt('Скопируйте ссылку:', url);
    return false;
  }
}

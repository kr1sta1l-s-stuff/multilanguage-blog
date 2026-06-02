export async function copyShareLink(url: string, promptLabel: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    window.prompt(promptLabel, url);
    return false;
  }
}

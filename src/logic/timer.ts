export function getRemainingSeconds(endTime: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((endTime - now) / 1000));
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function hasIngredientsRemaining(stock: Record<string, number>): boolean {
  return Object.values(stock).some((amount) => amount > 0);
}

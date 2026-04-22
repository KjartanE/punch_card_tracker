export function formatDuration(ms: number, withSeconds: boolean = false): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (withSeconds) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${hours}h ${pad(minutes)}m`;
}

export function formatHours(ms: number): string {
  const hours = ms / 3_600_000;
  return `${hours.toFixed(2)}h`;
}

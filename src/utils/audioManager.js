/** Single active beat — stops previous when another plays */

let active = null;

export function claimPlayback(player) {
  if (active && active !== player) active.stop();
  active = player;
}

export function releasePlayback(player) {
  if (active === player) active = null;
}

export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

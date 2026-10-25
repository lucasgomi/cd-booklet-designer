// Comparación de versiones «1.10.0» > «1.9.3» (con o sin «v» delante).
export function isNewer(remote, local) {
  const a = String(remote).replace(/^v/, '').split('.').map(Number);
  const b = String(local).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

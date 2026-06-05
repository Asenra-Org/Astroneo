// Simple class name utility — merge class strings
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatDistance(ly: number): string {
  if (ly < 0.01) return '< 0.01 ly';
  if (ly < 1) return `${ly.toFixed(3)} ly`;
  if (ly < 100) return `${ly.toFixed(2)} ly`;
  if (ly < 10000) return `${Math.round(ly).toLocaleString()} ly`;
  return `${(ly / 1000).toFixed(1)}k ly`;
}

export function formatMagnitude(mag: number): string {
  return mag > 0 ? `+${mag.toFixed(2)}` : mag.toFixed(2);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function spectralToColor(spectralClass?: string): string {
  if (!spectralClass) return '#FFFFFF';
  const cls = spectralClass[0]?.toUpperCase() ?? 'G';
  const colorMap: Record<string, string> = {
    O: '#9BB0FF',
    B: '#AABFFF',
    A: '#CAD7FF',
    F: '#F8F7FF',
    G: '#FFF4E8',
    K: '#FFD2A1',
    M: '#FFCC6F',
  };
  return colorMap[cls] ?? '#FFF4E8';
}

export function spectralToClass(spectralClass?: string): string {
  return spectralClass?.[0]?.toUpperCase() ?? 'None';
}

export function getSpectralBadgeClass(spectralClass?: string): string {
  const cls = spectralToClass(spectralClass);
  return `badge-spectral badge-spectral-${cls}`;
}

export function distanceParsecToLy(parsec: number): number {
  return parsec * 3.26156;
}

export function formatTemp(tempK: number): string {
  return `${tempK.toLocaleString()} K`;
}

export function formatSolarMass(mass: number): string {
  if (mass < 0.01) return '< 0.01 M☉';
  return `${mass.toFixed(2)} M☉`;
}

export function formatSolarRadius(radius: number): string {
  if (radius < 0.01) return '< 0.01 R☉';
  if (radius > 100) return `${Math.round(radius)} R☉`;
  return `${radius.toFixed(2)} R☉`;
}

export function formatLuminosity(lum: number): string {
  if (lum < 0.001) return `${(lum * 1000).toFixed(3)} mL☉`;
  if (lum < 0.01) return `${lum.toFixed(4)} L☉`;
  if (lum > 100000) return `${(lum / 1000).toFixed(0)}k L☉`;
  return `${lum.toFixed(2)} L☉`;
}

export function raToHMS(ra: number): string {
  const hours = Math.floor(ra);
  const minFrac = (ra - hours) * 60;
  const minutes = Math.floor(minFrac);
  const seconds = ((minFrac - minutes) * 60).toFixed(1);
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function decToDMS(dec: number): string {
  const sign = dec < 0 ? '-' : '+';
  const abs = Math.abs(dec);
  const degrees = Math.floor(abs);
  const minFrac = (abs - degrees) * 60;
  const minutes = Math.floor(minFrac);
  const seconds = ((minFrac - minutes) * 60).toFixed(0);
  return `${sign}${degrees}° ${minutes}' ${seconds}"`;
}

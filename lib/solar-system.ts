/**
 * Approximate dynamic coordinates (RA/Dec) for Solar System bodies
 * Formulas based on Keplerian orbital elements relative to J2000.0 (Jan 1, 2000 12:00 UT)
 */

interface EquatorialCoords {
  ra: number;  // in hours [0, 24)
  dec: number; // in degrees [-90, 90]
}

// Convert degrees to radians
const toRad = (deg: number) => (deg * Math.PI) / 180;
// Convert radians to degrees
const toDeg = (rad: number) => (rad * 180) / Math.PI;

// Solve Kepler's equation: E - e * sin(E) = M
function solveKepler(M_rad: number, eccentricity: number): number {
  let E = M_rad;
  for (let i = 0; i < 5; i++) {
    E = E - (E - eccentricity * Math.sin(E) - M_rad) / (1 - eccentricity * Math.cos(E));
  }
  return E;
}

// Keplerian elements for planets at J2000.0
interface OrbitElements {
  a: number;
  e: number;
  i: number;
  L: number;
  varpi: number;
  Omega: number;
  period: number;
}

const ORBITS: Record<string, OrbitElements> = {
  mercury: { a: 0.387098, e: 0.205630, i: 7.0049, L: 252.2508, varpi: 77.4561, Omega: 48.3308, period: 0.240846 },
  venus:   { a: 0.723332, e: 0.006773, i: 3.3947, L: 181.9797, varpi: 131.5637, Omega: 76.6799, period: 0.615197 },
  earth:   { a: 1.000000, e: 0.016708, i: 0.0000, L: 100.4643, varpi: 102.9471, Omega: 0.0000,   period: 1.000017 },
  mars:    { a: 1.523662, e: 0.093412, i: 1.8506, L: 355.4533, varpi: 336.0602, Omega: 49.5581, period: 1.880816 },
  jupiter: { a: 5.203363, e: 0.048393, i: 1.3053, L: 34.4044,  varpi: 14.7539,  Omega: 100.5561, period: 11.862615 },
  saturn:  { a: 9.537070, e: 0.054150, i: 2.4845, L: 50.0774,  varpi: 92.5113,  Omega: 113.7150, period: 29.447498 }
};

// Calculate heliocentric coordinates (X, Y, Z) in AU
function getHeliocentricCoords(elem: OrbitElements, d: number): { x: number; y: number; z: number } {
  const n = 360 / (365.25 * elem.period); // mean motion in degrees per day
  const M = (elem.L - elem.varpi + n * d) % 360;
  const M_rad = toRad(M);

  const E_rad = solveKepler(M_rad, elem.e);

  // Position in orbital plane
  const x_plane = elem.a * (Math.cos(E_rad) - elem.e);
  const y_plane = elem.a * Math.sqrt(1 - elem.e * elem.e) * Math.sin(E_rad);

  // Rotate to ecliptic coordinates
  const omega_rad = toRad(elem.varpi - elem.Omega); // arg of perihelion
  const Omega_rad = toRad(elem.Omega); // longitude of ascending node
  const i_rad = toRad(elem.i); // inclination

  const cosO = Math.cos(Omega_rad);
  const sinO = Math.sin(Omega_rad);
  const cosw = Math.cos(omega_rad);
  const sinw = Math.sin(omega_rad);
  const cosi = Math.cos(i_rad);
  const sini = Math.sin(i_rad);

  const x = x_plane * (cosw * cosO - sinw * sinO * cosi) - y_plane * (sinw * cosO + cosw * sinO * cosi);
  const y = x_plane * (cosw * sinO + sinw * cosO * cosi) - y_plane * (sinw * sinO - cosw * cosO * cosi);
  const z = x_plane * (sinw * sini) + y_plane * (cosw * sini);

  return { x, y, z };
}

// Convert geocentric ecliptic coordinates to equatorial RA/Dec
function eclipticToEquatorial(x: number, y: number, z: number, obliquity_rad: number): EquatorialCoords {
  const cosE = Math.cos(obliquity_rad);
  const sinE = Math.sin(obliquity_rad);

  const x_eq = x;
  const y_eq = y * cosE - z * sinE;
  const z_eq = y * sinE + z * cosE;

  let ra_rad = Math.atan2(y_eq, x_eq);
  if (ra_rad < 0) ra_rad += 2 * Math.PI;

  const dec_rad = Math.atan2(z_eq, Math.sqrt(x_eq * x_eq + y_eq * y_eq));

  return {
    ra: toDeg(ra_rad) / 15, // convert to hours
    dec: toDeg(dec_rad)    // convert to degrees
  };
}

/**
 * Get dynamic equatorial coordinates (RA, Dec) for the Sun
 */
export function getSunCoords(date: Date): EquatorialCoords {
  const d = (date.getTime() - new Date('2000-01-01T12:00:00Z').getTime()) / (1000 * 60 * 60 * 24);

  const L = (280.460 + 0.9856474 * d) % 360;
  const g = (357.528 + 0.9856003 * d) % 360;
  const g_rad = toRad(g);

  const lambda = L + 1.915 * Math.sin(g_rad) + 0.020 * Math.sin(2 * g_rad);
  const lambda_rad = toRad(lambda);

  const obliquity = 23.439 - 0.0000004 * d;
  const obliquity_rad = toRad(obliquity);

  const x = Math.cos(lambda_rad);
  const y = Math.sin(lambda_rad);
  const z = 0;

  return eclipticToEquatorial(x, y, z, obliquity_rad);
}

/**
 * Get dynamic equatorial coordinates (RA, Dec) for the Moon
 */
export function getMoonCoords(date: Date): EquatorialCoords {
  const d = (date.getTime() - new Date('2000-01-01T12:00:00Z').getTime()) / (1000 * 60 * 60 * 24);

  const L_moon = (218.316 + 13.176396 * d) % 360;
  const M_moon = (134.963 + 13.064993 * d) % 360;
  const omega = (125.044 - 0.0529537 * d) % 360;

  const lambda_moon = L_moon + 6.289 * Math.sin(toRad(M_moon));
  const F = L_moon - omega;
  const beta_moon = 5.145 * Math.sin(toRad(F));

  const lambda_rad = toRad(lambda_moon);
  const beta_rad = toRad(beta_moon);

  const obliquity = 23.439 - 0.0000004 * d;
  const obliquity_rad = toRad(obliquity);

  const x = Math.cos(beta_rad) * Math.cos(lambda_rad);
  const y = Math.cos(beta_rad) * Math.sin(lambda_rad);
  const z = Math.sin(beta_rad);

  return eclipticToEquatorial(x, y, z, obliquity_rad);
}

/**
 * Get dynamic equatorial coordinates (RA, Dec) for a planet
 */
export function getPlanetCoords(planetName: string, date: Date): EquatorialCoords {
  const name = planetName.toLowerCase();
  if (name === 'sun') return getSunCoords(date);
  if (name === 'moon') return getMoonCoords(date);

  const planetElem = ORBITS[name];
  const earthElem = ORBITS.earth;

  if (!planetElem) {
    return { ra: 0, dec: 0 };
  }

  const d = (date.getTime() - new Date('2000-01-01T12:00:00Z').getTime()) / (1000 * 60 * 60 * 24);

  const p = getHeliocentricCoords(planetElem, d);
  const e = getHeliocentricCoords(earthElem, d);

  const x = p.x - e.x;
  const y = p.y - e.y;
  const z = p.z - e.z;

  const obliquity = 23.439 - 0.0000004 * d;
  const obliquity_rad = toRad(obliquity);

  return eclipticToEquatorial(x, y, z, obliquity_rad);
}

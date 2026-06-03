/**
 * Astronomical visibility calculations
 * Standard formulas: LST, Hour Angle, altitude/azimuth
 */

export interface VisibilityResult {
  isVisible: boolean;
  altitude: number;
  azimuth: number;
  direction: string;
  bestTime: string;
  riseTime?: string;
  setTime?: string;
  message: string;
}

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Calculate Julian Date from a Date object
 */
export function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) in hours
 */
export function gmst(date: Date): number {
  const jd = julianDate(date);
  const T = (jd - 2451545.0) / 36525;
  let gmstDeg = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T;
  gmstDeg = ((gmstDeg % 360) + 360) % 360;
  return gmstDeg / 15; // convert to hours
}

/**
 * Calculate Local Sidereal Time (LST) in hours
 */
export function lst(date: Date, lonDeg: number): number {
  const g = gmst(date);
  const lstHours = g + lonDeg / 15;
  return ((lstHours % 24) + 24) % 24;
}

/**
 * Calculate altitude and azimuth for a star
 * @param ra - Right Ascension in hours
 * @param dec - Declination in degrees
 * @param lat - Observer latitude in degrees
 * @param lon - Observer longitude in degrees
 * @param date - Observation date/time
 */
export function calcAltAz(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  date: Date
): { altitude: number; azimuth: number } {
  const localST = lst(date, lon);
  const hourAngle = localST - ra; // in hours
  const haRad = toRad(hourAngle * 15); // convert to degrees then radians
  const decRad = toRad(dec);
  const latRad = toRad(lat);

  // Altitude formula
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altitude = toDeg(Math.asin(sinAlt));

  // Azimuth formula
  const cosAz = (Math.sin(decRad) - Math.sin(toRad(altitude)) * Math.sin(latRad)) / (Math.cos(toRad(altitude)) * Math.cos(latRad));
  let azimuth = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));

  // Determine N/S hemisphere correction
  if (Math.sin(haRad) > 0) {
    azimuth = 360 - azimuth;
  }

  return { altitude, azimuth };
}

/**
 * Get cardinal direction from azimuth
 */
export function azimuthToDirection(az: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(az / 22.5) % 16;
  return dirs[idx];
}

/**
 * Calculate visibility for tonight at midnight
 */
export function calculateVisibility(
  ra: number,
  dec: number,
  lat: number,
  lon: number
): VisibilityResult {
  // Tonight at local midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  midnight.setDate(midnight.getDate() + 1);

  const { altitude, azimuth } = calcAltAz(ra, dec, lat, lon, midnight);
  const direction = azimuthToDirection(azimuth);

  // Find best viewing time (highest altitude)
  let maxAlt = -90;
  let bestHour = 0;
  let bestAzimuth = 0;
  let bestDirection = '';

  for (let h = 18; h <= 30; h++) {
    const testDate = new Date(now);
    testDate.setHours(h % 24, 0, 0, 0);
    if (h >= 24) testDate.setDate(testDate.getDate() + 1);
    const { altitude: testAlt, azimuth: testAz } = calcAltAz(ra, dec, lat, lon, testDate);
    if (testAlt > maxAlt) {
      maxAlt = testAlt;
      bestAzimuth = testAz;
      bestHour = h % 24;
      bestDirection = azimuthToDirection(testAz);
    }
  }

  const bestTime = `${String(bestHour).padStart(2, '0')}:00 local time`;
  const isVisible = maxAlt > 10; // above 10° horizon at best time

  let message: string;
  if (maxAlt > 60) {
    message = 'Excellent visibility tonight — nearly overhead at best time!';
  } else if (maxAlt > 30) {
    message = 'Good visibility tonight — well above the horizon.';
  } else if (maxAlt > 10) {
    message = 'Fair visibility — look low on the horizon.';
  } else if (maxAlt > 0) {
    message = 'Barely visible — very low on the horizon.';
  } else {
    message = 'Below the horizon tonight. Best viewed at a different time of year.';
  }

  return {
    isVisible,
    altitude: Math.round(maxAlt * 10) / 10,
    azimuth: Math.round(bestAzimuth * 10) / 10,
    direction: bestDirection,
    bestTime,
    message,
  };
}

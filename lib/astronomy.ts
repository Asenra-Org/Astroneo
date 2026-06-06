/**
 * Astronomical visibility calculations
 * Standard formulas: LST, Hour Angle, altitude/azimuth
 */

export interface VisibilityResult {
  isVisibleNow: boolean;
  isVisibleTonight: boolean;
  currentAltitude: number;
  currentDirection: string;
  bestTimeTonight: string;
  maxAltitudeTonight: number;
  reason: string;
  weather: {
    description: string;
    isDay: boolean;
    temperature: number;
  };
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
 */
export function calcAltAz(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  date: Date
): { altitude: number; azimuth: number } {
  const localST = lst(date, lon);
  const hourAngle = localST - ra;
  const haRad = toRad(hourAngle * 15);
  const decRad = toRad(dec);
  const latRad = toRad(lat);

  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  // Clamp sinAlt to [-1, 1] to prevent NaN from Math.asin due to floating point inaccuracies
  const altitude = toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));

  const cosAz = (Math.sin(decRad) - Math.sin(toRad(altitude)) * Math.sin(latRad)) / (Math.cos(toRad(altitude)) * Math.cos(latRad));
  let azimuth = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));

  if (Math.sin(haRad) > 0) {
    azimuth = 360 - azimuth;
  }

  return { altitude, azimuth };
}

export function azimuthToDirection(az: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(az / 22.5) % 16;
  return dirs[idx];
}

function getWeatherDescription(code: number): { desc: string; isBad: boolean; isWarning: boolean } {
  if (code === 0) return { desc: 'Clear sky', isBad: false, isWarning: false };
  if (code === 1 || code === 2) return { desc: 'Partly cloudy', isBad: false, isWarning: false };
  if (code === 3) return { desc: 'Overcast', isBad: false, isWarning: true };
  if (code === 45 || code === 48) return { desc: 'Foggy', isBad: true, isWarning: false };
  if (code >= 51 && code <= 67) return { desc: 'Raining', isBad: true, isWarning: false };
  if (code >= 71 && code <= 77) return { desc: 'Snowing', isBad: true, isWarning: false };
  if (code >= 80 && code <= 82) return { desc: 'Rain showers', isBad: true, isWarning: false };
  if (code >= 95) return { desc: 'Thunderstorm', isBad: true, isWarning: false };
  return { desc: 'Unknown conditions', isBad: false, isWarning: true };
}

/**
 * Async visibility check with weather data
 */
export async function calculateVisibility(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  starName: string = ''
): Promise<VisibilityResult> {
  const isSun = starName.toLowerCase() === 'sun';
  const isEarth = starName.toLowerCase() === 'earth';

  if (isEarth) {
    return {
      isVisibleNow: false,
      isVisibleTonight: false,
      currentAltitude: -90,
      currentDirection: 'Down',
      bestTimeTonight: 'N/A',
      maxAltitudeTonight: NaN,
      reason: 'You are currently standing on it.',
      weather: { description: 'Local', isDay: false, temperature: 0 }
    };
  }

  if (isNaN(ra) || isNaN(dec) || ra == null || dec == null) {
    return {
      isVisibleNow: false,
      isVisibleTonight: false,
      currentAltitude: NaN,
      currentDirection: 'N/A',
      bestTimeTonight: 'Unknown',
      maxAltitudeTonight: NaN,
      reason: 'Positional data is missing for this object.',
      weather: { description: 'Unknown', isDay: false, temperature: 0 }
    };
  }
  // Fetch real-time weather from Open-Meteo
  let weatherData = null;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, {
      cache: 'no-store'
    });
    if (res.ok) {
      weatherData = await res.json();
    }
  } catch (e) {
    console.error("Weather fetch failed", e);
  }

  const isDay = weatherData?.current_weather?.is_day === 1;
  const wCode = weatherData?.current_weather?.weathercode ?? 0;
  const temp = weatherData?.current_weather?.temperature ?? 0;
  const weatherStatus = getWeatherDescription(wCode);

  const now = new Date();
  const currentPos = calcAltAz(ra, dec, lat, lon, now);
  const currentDirection = azimuthToDirection(currentPos.azimuth);

  // Find best viewing time for the current/upcoming window
  let maxAlt = -90;
  let bestDate = new Date(now);
  
  let searchDates: Date[] = [];
  let foundWindow = false;

  for (let i = 0; i <= 24; i++) {
    // We check exact hours from now. To ensure we check on the hour, we can round the testDate
    const testDate = new Date(now.getTime() + i * 60 * 60 * 1000);
    if (i > 0) testDate.setMinutes(0, 0, 0); // Check exactly on the hour for future hours

    const h = testDate.getHours();
    
    // For sun: daytime (6 to 18). For stars: nighttime (18 to 6)
    const isValidWindow = isSun ? (h >= 6 && h <= 18) : (h >= 18 || h < 6);
    
    if (isValidWindow) {
      searchDates.push(testDate);
      foundWindow = true;
    } else if (foundWindow) {
      // Once we exit the valid window, stop searching so we don't bleed into tomorrow evening
      break;
    }
  }

  for (const testDate of searchDates) {
    const { altitude: testAlt } = calcAltAz(ra, dec, lat, lon, testDate);
    if (testAlt > maxAlt) {
      maxAlt = testAlt;
      bestDate = testDate;
    }
  }

  const isVisibleTonight = maxAlt > 10;
  
  // Format best time in AM/PM
  const hr = bestDate.getHours();
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const displayHour = hr % 12 || 12;
  const bestHourStr = String(displayHour);
  const bestMinStr = String(bestDate.getMinutes()).padStart(2, '0');
  
  let bestTimeTonight = `${bestHourStr}:${bestMinStr} ${ampm} local time`;
  if (bestDate.getDate() !== now.getDate()) {
    bestTimeTonight = `Tomorrow at ${bestHourStr}:${bestMinStr} ${ampm}`;
  }

  // Determine if it is visible RIGHT NOW
  let isVisibleNow = false;
  let reason = '';

  if (currentPos.altitude < 0) {
    reason = `Currently ${Math.abs(Math.round(currentPos.altitude))}° below the horizon in the ${currentDirection}.`;
  } else if (isDay && !isSun) {
    reason = `It is daytime. The object is ${Math.round(currentPos.altitude)}° above the horizon, but obscured by sunlight.`;
  } else if (!isDay && isSun) {
    reason = `The Sun has set. It is currently ${Math.abs(Math.round(currentPos.altitude))}° below the horizon.`;
  } else if (weatherStatus.isBad) {
    reason = `Above the horizon (${Math.round(currentPos.altitude)}° ${currentDirection}), but heavy ${weatherStatus.desc.toLowerCase()} makes it impossible to see.`;
  } else if (weatherStatus.isWarning) {
    isVisibleNow = true;
    reason = `It is ${Math.round(currentPos.altitude)}° above the horizon in the ${currentDirection}. Weather reports ${weatherStatus.desc.toLowerCase()} which may partially obscure your view.`;
  } else {
    isVisibleNow = true;
    reason = `Perfect viewing! It is ${Math.round(currentPos.altitude)}° above the horizon in the ${currentDirection} under ${weatherStatus.desc.toLowerCase()}.`;
  }

  return {
    isVisibleNow,
    isVisibleTonight,
    currentAltitude: Math.round(currentPos.altitude * 10) / 10,
    currentDirection,
    bestTimeTonight,
    maxAltitudeTonight: Math.round(maxAlt * 10) / 10,
    reason,
    weather: {
      description: weatherStatus.desc,
      isDay,
      temperature: temp,
    }
  };
}

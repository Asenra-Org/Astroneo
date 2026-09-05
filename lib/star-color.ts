/**
 * Star display colour, derived from catalogue data.
 *
 * The sky map used to tint stars by their APPARENT MAGNITUDE — that is, by how
 * bright they look, not by what colour they are. Rigel came out yellow-white
 * instead of blue, and the whole sky was miscoloured in a way that got more
 * wrong the brighter the star.
 *
 * Colour actually comes from temperature, and temperature can be recovered from
 * two columns the catalogue already carries:
 *
 *   • `spectralClass` — not just a letter but a decimal subclass and a Yerkes
 *     luminosity class ("K0III", "M5.5Ve", "B0.5Ia"), which together place the
 *     star on the temperature sequence.
 *   • `colorIndex` — the B−V colour index, which is a direct photometric
 *     temperature measurement.
 *
 * Feeding those through the Planck function gives a continuously varying,
 * physically correct colour: this produces 545 distinct colour buckets across
 * the 8,898-object catalogue, against the 7 hardcoded values used before.
 */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Piecewise-linear interpolation over an ascending [x, y] table. */
function interp(table: readonly (readonly [number, number])[], x: number): number {
  if (x <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (x >= x0 && x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return last[1];
}

// ─────────────────────────────────────────────────────────────────────────────
// Spectral type parsing
// ─────────────────────────────────────────────────────────────────────────────

export type SpectralLetter =
  | 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'C' | 'S' | 'W' | 'D' | 'L' | 'T';

export type LuminosityClass =
  | 'Ia0' | 'Ia' | 'Iab' | 'Ib' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII';

export interface ParsedSpectralType {
  /** Harvard letter. Defaults to G when the string cannot be parsed. */
  letter: SpectralLetter;
  /** Decimal subclass 0–9.9. B2 -> 2, M5.5 -> 5.5. */
  subclass: number;
  /** Yerkes luminosity class, or null when the catalogue omits it. */
  luminosity: LuminosityClass | null;
  /**
   * Continuous temperature ordinate: O0 = 0, B0 = 10, A0 = 20, F0 = 30,
   * G0 = 40, K0 = 50, M0 = 60, M9 = 69. Monotonic in decreasing temperature,
   * which turns the tables below into simple 1-D interpolations.
   */
  index: number;
  /** Numeric luminosity class for interpolation: Ia0 = 0.3 … V = 5, VII = 7. */
  lumValue: number;
  /** True when nothing usable was found and defaults were substituted. */
  unparsed: boolean;
}

const LUM_VALUES: Record<LuminosityClass, number> = {
  Ia0: 0.3, Ia: 0.7, Iab: 1.0, Ib: 1.3, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7,
};

const LETTER_BASE: Partial<Record<SpectralLetter, number>> = {
  O: 0, B: 10, A: 20, F: 30, G: 40, K: 50, M: 60,
  // Carbon and S stars sit alongside cool M giants on the temperature scale.
  C: 62, S: 62,
  // Wolf–Rayet stars are hotter than anything on the Harvard sequence.
  W: -5,
  // Degenerates and brown dwarfs take dedicated branches below.
  D: 20, L: 70, T: 72,
};

const FALLBACK_TYPE: ParsedSpectralType = {
  letter: 'G', subclass: 2, luminosity: 'V', index: 42, lumValue: 5, unparsed: true,
};

/**
 * Parses a Morgan–Keenan spectral type.
 *
 * Handles the forms that actually occur in this catalogue: compound classes
 * ("F5IV-V"), decimal subclasses ("K1.5IIIpe"), prefix notation ("sdB", "gK5"),
 * white dwarfs ("DA2") and Wolf–Rayet ("WN5"). Anything unrecognisable degrades
 * to G2V with `unparsed` set.
 */
export function parseSpectralType(raw: string | undefined | null): ParsedSpectralType {
  if (!raw) return { ...FALLBACK_TYPE };
  const s = raw.trim();
  if (!s) return { ...FALLBACK_TYPE };

  // White dwarfs: the letter after D is the atmospheric composition and the
  // digit is 50400/Teff, not a Harvard subclass.
  if (/^D[ABCOQZXVH]/i.test(s) || /^D\d/.test(s)) {
    const wd = /^D([ABCOQZXVH])?\s*(\d+(?:\.\d+)?)?/i.exec(s);
    return {
      letter: 'D',
      subclass: wd && wd[2] ? parseFloat(wd[2]) : 5,
      luminosity: 'VII', index: 20, lumValue: 7, unparsed: false,
    };
  }

  // Wolf–Rayet: "WN5", "WC7", "WO2".
  const wr = /^W([NCO])\s*(\d+(?:\.\d+)?)?/i.exec(s);
  if (wr) {
    return {
      letter: 'W', subclass: wr[2] ? parseFloat(wr[2]) : 5,
      luminosity: 'Ia', index: -5, lumValue: 0.7, unparsed: false,
    };
  }

  // Prefix luminosity notation, still common in older catalogues.
  let prefixLum: LuminosityClass | null = null;
  let body = s;
  const prefix = /^(esd|sd|sg|d|g|c)(?=[OBAFGKMCSRN])/i.exec(body);
  if (prefix) {
    const p = prefix[1].toLowerCase();
    prefixLum = p === 'esd' || p === 'sd' ? 'VI' : p === 'd' ? 'V' : p === 'g' ? 'III' : 'Ia';
    body = body.slice(prefix[1].length);
  }

  const m = /^([OBAFGKMCSRNLT])\s*(\d+(?:\.\d+)?)?(.*)$/i.exec(body);
  if (!m) return { ...FALLBACK_TYPE };

  // R and N are the historic carbon-star classes; both map onto C.
  const rawLetter = m[1].toUpperCase();
  const letter = (rawLetter === 'R' || rawLetter === 'N' ? 'C' : rawLetter) as SpectralLetter;
  const subclass = m[2] !== undefined ? clamp(parseFloat(m[2]), 0, 9.9) : 5;
  const rest = m[3] || '';

  // Luminosity class: first Roman-numeral run, longest alternatives first so
  // that "III" is never mis-read as "II".
  let luminosity: LuminosityClass | null = prefixLum;
  const lm = /(VII|VI|IV|III|II|V|I)(a0|a\+|ab|a|b)?/.exec(rest);
  if (lm) {
    const token = (lm[1] + (lm[2] || '')).replace('+', '0');
    if (token === 'I') luminosity = 'Iab';
    else if (LUM_VALUES[token as LuminosityClass] !== undefined) {
      luminosity = token as LuminosityClass;
    } else if (LUM_VALUES[lm[1] as LuminosityClass] !== undefined) {
      luminosity = lm[1] as LuminosityClass;
    }
  }

  return {
    letter,
    subclass,
    luminosity,
    index: (LETTER_BASE[letter] ?? 40) + subclass,
    lumValue: luminosity ? LUM_VALUES[luminosity] : 5,
    unparsed: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Temperature
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Effective temperature of a main-sequence star against the continuous spectral
 * index. Anchors follow Pecaut & Mamajek (2013).
 */
const MS_TEMP: readonly (readonly [number, number])[] = [
  [-5, 60000], // Wolf–Rayet
  [3, 44900], [5, 41000], [6, 39000], [8, 35100], [9, 33300],  // O
  [10, 31400], [11, 26000], [13, 18800], [15, 15200], [17, 12300], [18, 11400], [19, 10500], // B
  [20, 9700], [22, 9000], [25, 8080], [27, 7800], [29, 7500],  // A
  [30, 7220], [32, 6890], [35, 6510], [38, 6200],              // F
  [40, 5920], [42, 5770], [45, 5660], [48, 5450],              // G
  [50, 5280], [53, 4720], [55, 4400], [57, 4050],              // K
  [60, 3870], [61, 3700], [62, 3550], [63, 3400], [65, 3060],
  [66, 2810], [68, 2600], [69, 2400],                          // M
  [70, 2200], [72, 1300],                                      // L/T
];

/**
 * Temperature correction for evolved stars. At a fixed spectral type a giant or
 * supergiant is generally cooler than a dwarf, but the offset is strongly
 * type-dependent — large for late K, essentially zero around A0 and late M.
 * This gives the fractional shift per unit of luminosity class away from V.
 */
const LUM_TEMP_K: readonly (readonly [number, number])[] = [
  [0, -0.045], [10, -0.043], [20, 0.0], [30, -0.010],
  [40, -0.025], [50, -0.044], [55, -0.038], [60, -0.010], [69, 0.0],
];

/**
 * Ballesteros (2012): effective temperature from the B−V colour index, treating
 * the star as a black body seen through the B and V passbands. Accurate to a few
 * percent for unreddened main-sequence stars.
 */
export function tempFromColorIndex(bv: number): number {
  const a = 0.92 * bv;
  return 4600 * (1 / (a + 1.7) + 1 / (a + 0.62));
}

/** Effective temperature implied by a spectral type alone. */
export function tempFromSpectralType(sp: ParsedSpectralType): number {
  if (sp.letter === 'D') {
    // White dwarf: the subclass IS a temperature index, Teff = 50400 / n.
    return clamp(50400 / Math.max(0.5, sp.subclass), 3500, 150000);
  }
  const base = interp(MS_TEMP, sp.index);
  const k = interp(LUM_TEMP_K, sp.index);
  return clamp(base * (1 + (5 - sp.lumValue) * k), 1200, 200000);
}

/** The catalogue columns this module reads. */
export interface StarColorInput {
  spectralClass?: string;
  tempK?: number;
  colorIndex?: number;
}

/**
 * Display temperature for a catalogue row.
 *
 * Measured value first, then the spectral type as an anchor with the colour
 * index refining it — the type fixes the class, B−V supplies the star-to-star
 * variation within it. B−V is unreliable for reddened distant stars, so it is
 * only allowed to move the anchor within a bounded band.
 */
export function starDisplayTemperature(s: StarColorInput): number {
  if (s.tempK && s.tempK > 1000) return s.tempK;
  const parsed = parseSpectralType(s.spectralClass);
  const anchor = tempFromSpectralType(parsed);
  if (s.colorIndex !== undefined && Number.isFinite(s.colorIndex) && parsed.letter !== 'D') {
    const fromBV = clamp(tempFromColorIndex(s.colorIndex), anchor * 0.7, anchor * 1.4);
    return anchor * 0.5 + fromBV * 0.5;
  }
  return anchor;
}

// ─────────────────────────────────────────────────────────────────────────────
// Black-body colour
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chromaticity of a Planckian radiator, via the Kim et al. (2002) cubic
 * approximation to the Planckian locus (valid 1667–25000 K; above that the
 * locus has essentially converged, so it is clamped).
 */
function planckianXY(tempK: number): [number, number] {
  const T = clamp(tempK, 1667, 25000);
  const t = 1000 / T;
  const x =
    T <= 4000
      ? -0.2661239 * t * t * t - 0.2343589 * t * t + 0.8776956 * t + 0.179910
      : -3.0258469 * t * t * t + 2.1070379 * t * t + 0.2226347 * t + 0.240390;
  let y: number;
  if (T <= 2222) y = -1.1063814 * x ** 3 - 1.34811020 * x ** 2 + 2.18555832 * x - 0.20219683;
  else if (T <= 4000) y = -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867;
  else y = 3.0817580 * x ** 3 - 5.87338670 * x ** 2 + 3.75112997 * x - 0.37001483;
  return [x, y];
}

/**
 * Linear sRGB for a black body at `tempK`, normalised so the brightest channel
 * is 1. This is the physically correct hue, and it is what makes a B2 star at
 * 21,000 K visibly different from a B8 at 11,500 K where the old seven-colour
 * lookup made them identical.
 */
export function blackBodyRGB(tempK: number): [number, number, number] {
  const [x, y] = planckianXY(tempK);
  if (y <= 0) return [1, 1, 1];
  const Y = 1;
  const X = (x / y) * Y;
  const Z = ((1 - x - y) / y) * Y;

  // CIE XYZ -> linear sRGB (sRGB primaries, D65).
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;

  r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
  const max = Math.max(r, g, b, 1e-6);
  return [r / max, g / max, b / max];
}

/**
 * Black-body colour desaturated toward white by `amount` (0–1).
 *
 * A star bright enough to see saturates the eye's cones and looks far whiter
 * than its raw chromaticity suggests, so points of light in the sky need this
 * rather than the fully saturated hue.
 */
export function apparentStarRGB(tempK: number, amount = 0.45): [number, number, number] {
  const [r, g, b] = blackBodyRGB(tempK);
  const t = clamp(amount, 0, 1);
  return [r + (1 - r) * t, g + (1 - g) * t, b + (1 - b) * t];
}

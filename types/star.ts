// Star data types
export interface Star {
  id: number;
  hip?: number;
  proper?: string;
  bf?: string;
  ra: number;
  dec: number;
  dist: number;
  mag: number;
  absmag: number;
  spect: string;
  ci?: number;
  con?: string;
  // Extended fields (curated stars only)
  commonName?: string;
  bayerDesignation?: string;
  constellation?: string;
  distanceLy?: number;
  apparentMag?: number;
  absoluteMag?: number;
  spectralClass?: string;
  tempK?: number;
  massSOL?: number;
  radiusSOL?: number;
  luminositySOL?: number;
  colorIndex?: number;
  isVariable?: boolean;
  description?: string;
  slug?: string;
}

export interface SearchStar {
  id: number;
  proper: string;
  bf?: string;
  hip?: number;
  con?: string;
  spect?: string;
  mag?: number;
  dist?: number;
  slug: string;
}

export interface FeaturedStar {
  slug: string;
  type?: string;
  commonName: string;
  bayerDesignation?: string;
  hipId?: number;
  constellation?: string;
  ra: number;
  dec: number;
  distanceLy?: number;
  apparentMag: number;
  absoluteMag?: number;
  spectralClass?: string;
  tempK?: number;
  massSOL?: number;
  radiusSOL?: number;
  luminositySOL?: number;
  colorIndex?: number;
  isVariable?: boolean;
  description?: string;
}

export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

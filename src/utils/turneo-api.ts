/**
 * Turneo Experiences API service module.
 * Wraps fetch calls to the Turneo API with proper headers.
 */

import { getTurneoConfig } from '@/configs/turneo';

export interface TurneoImage {
  url: string;
  caption?: string;
}

export interface TurneoInclusion {
  name: string;
  inclusionId: string;
}

export interface TurneoExclusion {
  name: string;
  exclusionId: string;
}

export interface TurneoOrganizer {
  name?: string;
  description?: string;
  partnerRating?: number;
  partnerReviews?: number;
}

export interface TurneoLocation {
  city?: string;
  country?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface TurneoDuration {
  hours?: number;
  minutes?: number;
}

export interface TurneoCategories {
  theme?: string[];
  type?: string;
}

export interface TurneoMoney {
  amount: number;
  currency: string;
}

export interface TurneoExperience {
  id: string;
  name: string;
  status?: string;
  highlight: string;
  description: string;
  images: TurneoImage[];
  videos?: string[];
  organizer?: TurneoOrganizer;
  categories?: TurneoCategories;
  location?: TurneoLocation;
  duration?: TurneoDuration;
  included?: TurneoInclusion[];
  excluded?: TurneoExclusion[];
  languages?: string;
  minPrice?: TurneoMoney;
  discount?: number;
}

export interface TurneoExperiencesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TurneoExperience[];
}

export interface FetchExperiencesParams {
  storeId?: string;
  country?: string;
  city?: string;
  from?: string;
  until?: string;
}

export async function fetchExperiences(params?: FetchExperiencesParams): Promise<TurneoExperience[]> {
  const config = getTurneoConfig();
  const url = new URL(`${config.baseUrl}/experiences`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'x-api-key': config.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Turneo API error: ${response.status} ${response.statusText}`);
  }

  const data: TurneoExperiencesResponse = await response.json();
  return data.results;
}

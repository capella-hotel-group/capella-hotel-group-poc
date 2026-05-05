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

export interface TurneoAvailableDate {
  date?: string;
  startDate?: string;
  startTime?: string;
  availableQuantity?: number;
  discount?: number;
}

export interface TurneoRateDetail {
  id: string;
  experienceId: string;
  rateName: string;
  rateStatus: string;
  availabilityType: string;
  maxParticipants: number;
  duration?: string;
  availableDates: TurneoAvailableDate[];
  rateTypesPrices?: { rateType: string; price: number; currency: string }[];
}

export interface TurneoRatesListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: string[][][];
}

export interface FetchRatesParams {
  experienceId: string;
  from: string;
  until: string;
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
      Prefer: `code=200, dynamic=${config.dynamicMock}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Turneo API error: ${response.status} ${response.statusText}`);
  }

  const data: TurneoExperiencesResponse = await response.json();
  return data.results;
}

export async function fetchRates(params: FetchRatesParams): Promise<TurneoRateDetail[]> {
  const config = getTurneoConfig();

  // Step 1: List all rate IDs
  const listUrl = new URL(`${config.baseUrl}/experiences/${params.experienceId}/rates`);
  listUrl.searchParams.set('from', params.from);
  listUrl.searchParams.set('until', params.until);

  const listResponse = await fetch(listUrl.toString(), {
    headers: {
      Accept: 'application/json',
      'x-api-key': config.apiKey,
      Prefer: `code=200, dynamic=${config.dynamicMock}`,
    },
  });

  if (!listResponse.ok) {
    throw new Error(`Turneo API error: ${listResponse.status} ${listResponse.statusText}`);
  }

  const listData: TurneoRatesListResponse = await listResponse.json();

  // Extract rate IDs from nested array structure [[["id1"]], [["id2"]]]
  const rateIds: string[] = [];
  if (listData.results) {
    listData.results.forEach((group) => {
      group.forEach((inner) => {
        inner.forEach((id) => {
          if (id) rateIds.push(id);
        });
      });
    });
  }

  if (rateIds.length === 0) return [];

  // Step 2: Retrieve each rate detail with dynamic=true for availability dates
  const rateDetails = await Promise.all(
    rateIds.map((rateId) => fetchRateDetail(params.experienceId, rateId, params.from, params.until)),
  );

  return rateDetails.filter((r): r is TurneoRateDetail => r !== null);
}

async function fetchRateDetail(
  experienceId: string,
  rateId: string,
  from: string,
  until: string,
): Promise<TurneoRateDetail | null> {
  const config = getTurneoConfig();
  const url = new URL(`${config.baseUrl}/experiences/${experienceId}/rates/${rateId}`);
  url.searchParams.set('from', from);
  url.searchParams.set('until', until);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'x-api-key': config.apiKey,
      Prefer: 'code=200, dynamic=true',
    },
  });

  if (!response.ok) {
    console.error(`[turneo-api] Failed to fetch rate ${rateId}: ${response.status}`);
    return null;
  }

  return response.json();
}

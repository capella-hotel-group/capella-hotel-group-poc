/**
 * Turneo App Builder API service module.
 * Calls the Adobe App Builder runtime which proxies the Turneo API server-side.
 * No API key required on the frontend — authentication is handled internally.
 *
 * Base URL: https://3599957-turneoapp-stage.adobeioruntime.net/api/v1/web/turneo-app/get-experience-data.json
 */

const APP_BUILDER_URL =
  'https://3599957-turneoapp-stage.adobeioruntime.net/api/v1/web/turneo-app/get-experience-data.json';

// --- Response types ---

export interface AppBuilderPrice {
  amount: number;
  currency: string;
  unit: string;
}

export interface AppBuilderDateRange {
  /** May be null when no explicit availability start is set. */
  availableFrom: string | null;
  from: string;
  until: string;
}

export interface AppBuilderFullLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface AppBuilderExperience {
  id: string;
  title: string;
  description: string;
  highlight: string;
  /** Single image URL (first image from Turneo response). */
  image: string;
  /** Duration string in "HH:MM" format. */
  duration: string;
  dateRange: AppBuilderDateRange;
  /** Flat address string, e.g. "Malé, Maldives". */
  address: string;
  fullLocation: AppBuilderFullLocation;
  /** List of included items as plain strings. */
  included: string[];
  minPrice: AppBuilderPrice;
  maxPrice: AppBuilderPrice;
}

export interface AppBuilderExperiencesResponse {
  statusCode: number;
  body: {
    count: number;
    results: AppBuilderExperience[];
  };
}

// --- Query params ---

export interface FetchAppBuilderParams {
  storeId?: string;
  country?: string;
  from?: string;
  until?: string;
}

// --- API function ---

/**
 * Fetch experiences from the App Builder runtime.
 * All params are optional and can be combined freely.
 */
export async function fetchExperiencesViaAppBuilder(params?: FetchAppBuilderParams): Promise<AppBuilderExperience[]> {
  const url = new URL(APP_BUILDER_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`App Builder API error: ${response.status} ${response.statusText}`);
  }

  const data: AppBuilderExperiencesResponse = await response.json();
  return data.body?.results ?? [];
}

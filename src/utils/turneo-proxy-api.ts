/**
 * Turneo Proxy API service module.
 * Calls the Turneo proxy server (NOT the Turneo API directly).
 * API key is handled server-side — no credentials are sent from the browser.
 *
 * Re-exports shared TypeScript interfaces from the existing turneo-api module.
 */

import { getTurneoProxyConfig } from '@/configs/turneo-proxy';

// Re-export types so consumers can import from a single module
export type {
  TurneoExperience,
  TurneoExperiencesResponse,
  TurneoRateDetail,
  TurneoAvailableDate,
  TurneoImage,
  TurneoLocation,
  TurneoOrganizer,
  TurneoCategories,
  TurneoDuration,
  TurneoMoney,
  TurneoInclusion,
  TurneoExclusion,
  FetchExperiencesParams,
  FetchRatesParams,
} from '@/utils/turneo-api';

import type {
  TurneoExperience,
  TurneoExperiencesResponse,
  TurneoRateDetail,
  FetchExperiencesParams,
  FetchRatesParams,
} from '@/utils/turneo-api';

// --- Orders types (new — for booking flow via proxy) ---

export interface TravelerInformation {
  firstName: string;
  lastName: string;
  email: string;
}

export interface BookingUnit {
  unitId: string;
  quantity: number;
}

export interface BookingItem {
  availabilityId: string;
  rateId: string;
  units: BookingUnit[];
  bookingFields?: Record<string, unknown>;
}

export interface CreateOrderParams {
  travelerInformation: TravelerInformation;
  bookings: BookingItem[];
}

export interface TurneoOrder {
  id: string;
  status: string;
  bookings?: BookingItem[];
}

// --- API functions ---

/**
 * Search experiences via proxy.
 */
export async function fetchExperiencesViaProxy(params?: FetchExperiencesParams): Promise<TurneoExperience[]> {
  const { baseUrl } = getTurneoProxyConfig();
  const url = new URL(`${baseUrl}/experiences`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Turneo Proxy error: ${response.status} ${response.statusText}`);
  }

  const data: TurneoExperiencesResponse = await response.json();
  return data.results;
}

/**
 * Get rates for an experience via proxy.
 */
export async function fetchRatesViaProxy(params: FetchRatesParams): Promise<TurneoRateDetail[]> {
  const { baseUrl } = getTurneoProxyConfig();
  const url = new URL(`${baseUrl}/experiences/${params.experienceId}/rates`);
  url.searchParams.set('from', params.from);
  url.searchParams.set('until', params.until);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Turneo Proxy error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get availabilities for an experience via proxy.
 */
export async function fetchAvailabilitiesViaProxy(experienceId: string, from: string, until: string): Promise<unknown> {
  const { baseUrl } = getTurneoProxyConfig();
  const url = new URL(`${baseUrl}/experiences/${experienceId}/availabilities`);
  url.searchParams.set('from', from);
  url.searchParams.set('until', until);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Turneo Proxy error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new order via proxy.
 */
export async function createOrderViaProxy(params: CreateOrderParams): Promise<TurneoOrder> {
  const { baseUrl } = getTurneoProxyConfig();

  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Turneo Proxy error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Confirm an order via proxy.
 */
export async function confirmOrderViaProxy(orderId: string): Promise<TurneoOrder> {
  const { baseUrl } = getTurneoProxyConfig();

  const response = await fetch(`${baseUrl}/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Turneo Proxy error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Add a booking to an existing order via proxy.
 */
export async function addBookingViaProxy(orderId: string, booking: BookingItem): Promise<TurneoOrder> {
  const { baseUrl } = getTurneoProxyConfig();

  const response = await fetch(`${baseUrl}/orders/${orderId}/add`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  });

  if (!response.ok) {
    throw new Error(`Turneo Proxy error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Remove a booking from an order via proxy.
 */
export async function removeBookingViaProxy(orderId: string, bookingId: string): Promise<TurneoOrder> {
  const { baseUrl } = getTurneoProxyConfig();

  const response = await fetch(`${baseUrl}/orders/${orderId}/remove`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bookingId }),
  });

  if (!response.ok) {
    throw new Error(`Turneo Proxy error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

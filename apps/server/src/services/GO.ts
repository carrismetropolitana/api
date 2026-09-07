/* * */

import { HubV1ApiStop } from '@tmlmobilidade/go-types-hub';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { fetchData } from '@tmlmobilidade/utils';

/* * */

export const GO_BASE_URL = 'https://go.tmlmobilidade.pt/hub/api/v1';

const STOPS_CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const STOPS_CACHE = { data: [], timestamp: 0 } as { data: HubV1ApiStop[], timestamp: number };

/**
 * Returns the cached list of stops, refreshing from the GO API if the cache is stale.
 * Returns null if the fetch fails.
 */
export async function getStops(): Promise<HubV1ApiStop[] | null> {
	if (STOPS_CACHE.timestamp < Dates.now('utc').unix_milliseconds - STOPS_CACHE_TTL) {
		const response = await fetchData<HubV1ApiStop[]>(GO_BASE_URL + '/network/stops');
		if (response.error || !Array.isArray(response.data)) {
			return null;
		}
		STOPS_CACHE.data = response.data;
		STOPS_CACHE.timestamp = Dates.now('utc').unix_milliseconds;
	}
	return STOPS_CACHE.data;
}

/**
 * Finds a Hub stop by a legacy / operator flag stop_id (e.g. CM "020973").
 */
export function findStopByFlagStopId(stops: HubV1ApiStop[], stopId: string): HubV1ApiStop | undefined {
	return stops.find(stop => stop.flags.some(flag => flag.stop_id === stopId));
}

export interface HubEtaData {
	eta_at: null | number
	eta_seconds: null | number
	position_created_at: null | string
	stop_id: string
	trip_id: string
	vehicle_id: null | string
}

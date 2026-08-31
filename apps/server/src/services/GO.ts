/* * */

import { Dates } from '@tmlmobilidade/dates';
import { HubStop } from '@tmlmobilidade/go-types-public-info';
import { UnixTimestamp } from '@tmlmobilidade/types';
import { fetchData } from '@tmlmobilidade/utils';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* * */

export const GO_BASE_URL = 'https://go.tmlmobilidade.pt/hub/api/v1';

const STOPS_CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const STOPS_CACHE = { data: [], timestamp: 0 } as { data: HubStop[]; timestamp: UnixTimestamp };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STOPS_ID_MAP_FILE = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../assets/cm_stop_id_match.json'), 'utf8'));
export const STOPS_ID_MAP = new Map<string, number>(STOPS_ID_MAP_FILE.map(item => [item.stop_id, item._id]));

/**
 * Returns the cached list of stops, refreshing from the GO API if the cache is stale.
 * Returns null if the fetch fails.
 */
export async function getStops(): Promise<HubStop[] | null> {
	if (STOPS_CACHE.timestamp < Dates.now('utc').unix_timestamp - STOPS_CACHE_TTL) {
		const response = await fetchData<HubStop[]>(GO_BASE_URL + '/network/stops');
		if (response.error || !Array.isArray(response.data)) {
			return null;
		}
		STOPS_CACHE.data = response.data;
		STOPS_CACHE.timestamp = Dates.now('utc').unix_timestamp;
	}
	return STOPS_CACHE.data;
}

export interface HubEtaData {
	eta_at: null | UnixTimestamp;
	eta_seconds: null | number;
	position_created_at: null | string;
	stop_id: string;
	trip_id: string;
	vehicle_id: null | string;
}

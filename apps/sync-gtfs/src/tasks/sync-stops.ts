/* * */

import collator from '@/modules/sortCollator.js';
import { NETWORKDB, SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { Locality, Location, Municipality, OperationalStatus, Stop } from '@carrismetropolitana/api-types/src/api/index.js';
import { StopsExtended } from '@carrismetropolitana/api-types/src/gtfs/gtfs.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

interface QueryResult extends StopsExtended {
	line_ids: string[]
	pattern_ids: string[]
	route_ids: string[]
}

/* * */

export const syncStops = async () => {
	//

	LOGGER.title(`Sync Stops`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Locations from SERVERDB

	const allLocalitiesTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.LOCALIITIES);
	const allLocalitiesData = JSON.parse(allLocalitiesTxt);

	const allMunicipalitiesTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.MUNICIPALITIES);
	const allMunicipalitiesData = JSON.parse(allMunicipalitiesTxt);

	//
	// Fetch all Stops from NETWORKDB

	const allStops = await NETWORKDB.client.query<QueryResult>(`
		SELECT
			s.*,
			r.route_ids,
			r.line_ids,
			r.pattern_ids
		FROM
			stops s
		LEFT JOIN (
			SELECT
				stop_id,
				json_agg(DISTINCT r.route_short_name) AS line_ids,
				json_agg(DISTINCT r.route_id) AS route_ids,
				json_agg(DISTINCT t.pattern_id) AS pattern_ids
			FROM
				stop_times st
			JOIN
				trips t ON st.trip_id = t.trip_id
			JOIN
				routes r ON t.route_id = r.route_id
			GROUP BY
				stop_id
		) r ON s.stop_id = r.stop_id;
	`);

	//
	// For each item, update its entry in the database

	const allStopsData: Stop[] = [];
	let updatedStopsCounter = 0;

	for (const stop of allStops.rows) {
		//

		//
		// Discover which Location this stop is in.
		// Try to match the stop's locality first, then fallback to municipality.

		let matchingLocation: Location = allLocalitiesData.find((item: Locality) => item.locality_name === stop.locality && item.municipality_id === stop.municipality_id);

		if (!matchingLocation) {
			matchingLocation = allMunicipalitiesData.find((item: Municipality) => item.municipality_id === stop.municipality_id);
		}

		//
		// Discover which facilities this stop is near to

		const facilities = [];

		if (stop.near_health_clinic) facilities.push('health_clinic');
		if (stop.near_hospital) facilities.push('hospital');
		if (stop.near_university) facilities.push('university');
		if (stop.near_school) facilities.push('school');
		if (stop.near_police_station) facilities.push('police_station');
		if (stop.near_fire_station) facilities.push('fire_station');
		if (stop.near_shopping) facilities.push('shopping');
		if (stop.near_historic_building) facilities.push('historic_building');
		if (stop.near_transit_office) facilities.push('transit_office');
		if (stop.subway) facilities.push('subway');
		if (stop.light_rail) facilities.push('light_rail');
		if (stop.train) facilities.push('train');
		if (stop.boat) facilities.push('boat');
		if (stop.airport) facilities.push('airport');
		if (stop.bike_sharing) facilities.push('bike_sharing');
		if (stop.bike_parking) facilities.push('bike_parking');
		if (stop.car_parking) facilities.push('car_parking');

		//
		// Build the final stop object

		const parsedStop = {
			facilities: facilities || [],
			lat: stop.stop_lat,
			line_ids: stop.line_ids || [],
			location: matchingLocation,
			lon: stop.stop_lon,
			operational_status: OperationalStatus[stop.operational_status],
			pattern_ids: stop.pattern_ids || [],
			route_ids: stop.route_ids || [],
			short_name: stop.stop_short_name,
			stop_id: stop.stop_id,
			stop_name: stop.stop_name,
			tts_name: stop.tts_stop_name,
			wheelchair_boarding: stop.wheelchair_boarding,
		};

		allStopsData.push(parsedStop);

		updatedStopsCounter++;

		//
	}

	//
	// Save to the database

	allStopsData.sort((a, b) => collator.compare(a.stop_id, b.stop_id));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.STOPS, JSON.stringify(allStopsData));

	LOGGER.success(`Done updating ${updatedStopsCounter} Stops (${globalTimer.get()})`);

	//
};

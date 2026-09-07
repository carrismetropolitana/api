/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import { type ServiceMetrics } from '@carrismetropolitana/api-types/metrics';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type Ride } from '@tmlmobilidade/types';

/* * */

const CM_AGENCY_IDS = ['LA77N', 'BNA17', 'YA15B', 'A2L1N'];

export const serviceMetrics = async () => {
	//

	LOGGER.title(`Sync Service Metrics`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch rides from 15 days ago

	const yesterdayDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 1 });

	const fifteenDaysAgoDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 15 });

	const ridesCollection = await goDb.operation.rides.getCollection();
	const ridesStream = ridesCollection.find({
		agency_id: { $in: CM_AGENCY_IDS },
		operational_date: { $gte: fifteenDaysAgoDate.operational_date, $lte: yesterdayDate.operational_date },
	}).stream();

	//
	// Group rides by operational_date and line_id

	const resultMap = new Map<string, ServiceMetrics>();

	for await (const currentRide of ridesStream) {
		//

		const rideData = currentRide as Ride;

		const resultMapKey = `${rideData.operational_date}-${rideData.line_id}`;

		if (!resultMap.has(resultMapKey)) {
			resultMap.set(resultMapKey, {
				agency_id: rideData.agency_id,
				line_id: rideData.line_id,
				operational_date: rideData.operational_date,
				pass_trip_count: 0,
				pass_trip_percentage: 0,
				total_trip_count: 0,
			});
		}

		resultMap.get(resultMapKey).total_trip_count += 1;

		if (!rideData.analysis) continue;

		const simpleOneValidationTransactionTest = rideData.analysis.SIMPLE_ONE_APEX_VALIDATION;
		const simpleThreeVehicleEventsTest = rideData.analysis.SIMPLE_THREE_VEHICLE_EVENTS;

		if (simpleOneValidationTransactionTest?.grade === 'pass' || simpleThreeVehicleEventsTest?.grade === 'pass') {
			resultMap.get(resultMapKey).pass_trip_count += 1;
		}

		resultMap.get(resultMapKey).pass_trip_percentage = resultMap.get(resultMapKey).pass_trip_count / resultMap.get(resultMapKey).total_trip_count;

		//
	}

	//
	// Save items to the database

	const chacheableResource: CachedResource<ServiceMetrics[]> = {
		data: Array.from(resultMap.values()),
		timestamp_resource: Dates.now('Europe/Lisbon').unix_timestamp,
	};

	chacheableResource.data.sort((a, b) => sortCollator.compare(a.operational_date, b.operational_date));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.SERVICE, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating ${chacheableResource.data.length} items to ${SERVERDB_KEYS.METRICS.SERVICE} (${globalTimer.get()}).`);

	//
};

/* * */

import type { CachedResource } from '@carrismetropolitana/api-types/common';
import type { ServiceMetrics } from '@carrismetropolitana/api-types/metrics';

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/services/interfaces';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

export const serviceMetrics = async () => {
	//

	LOGGER.title(`Sync Service Metrics`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch rides from 15 days ago

	const yesterdayDateObj = DateTime.now().minus({ days: 1 });
	const yesterdayOperationalDate = getOperationalDate(yesterdayDateObj);

	const fifteenDaysAgoDateObj = yesterdayDateObj.minus({ days: 15 });
	const fifteenDaysAgoOperationalDate = getOperationalDate(fifteenDaysAgoDateObj);

	const ridesCollection = await rides.getCollection();
	const ridesStream = ridesCollection.find({ operational_date: { $gte: fifteenDaysAgoOperationalDate, $lte: yesterdayOperationalDate } }).stream();

	//
	// Group rides by operational_date and line_id

	const resultMap = new Map<string, ServiceMetrics>();

	for await (const rideData of ridesStream) {
		//

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

		const simpleOneValidationTransactionTest = rideData.analysis.find(item => item._id === 'SIMPLE_ONE_VALIDATION_TRANSACTION');
		const simpleThreeVehicleEventsTest = rideData.analysis.find(item => item._id === 'SIMPLE_THREE_VEHICLE_EVENTS');

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
		timestamp_resource: DateTime.now().toMillis(),
	};

	chacheableResource.data.sort((a, b) => sortCollator.compare(a.operational_date, b.operational_date));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.SERVICE, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating ${chacheableResource.data.length} items to ${SERVERDB_KEYS.METRICS.SERVICE} (${globalTimer.get()}).`);

	//
};

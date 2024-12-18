/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/services/interfaces';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

export const videowallSla = async () => {
	//

	LOGGER.title(`Videowall - SLA`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = getOperationalDate();

	//
	// Setup the response JSON object

	const responseResult = {

		// For Area 1
		_41_scheduled_rides_until_now: 0,
		_41_simple_three_events_fail_until_now: 0,

		// For Area 2
		_42_scheduled_rides_until_now: 0,
		_42_simple_three_events_fail_until_now: 0,

		// For Area 3
		_43_scheduled_rides_until_now: 0,
		_43_simple_three_events_fail_until_now: 0,

		// For Area 4
		_44_scheduled_rides_until_now: 0,
		_44_simple_three_events_fail_until_now: 0,

		// For the whole CM
		_cm_scheduled_rides_until_now: 0,
		_cm_simple_three_events_fail_until_now: 0,

		//
	};

	//
	// Get all rides for today

	const ridesCollection = await rides.getCollection();
	const allRidesForTodayStream = ridesCollection.find({ operational_date: operationalDate, status: 'complete' }).stream();

	//
	// Iterate on all rides for today

	for await (const rideData of allRidesForTodayStream) {
		//

		//
		// If a ride should have already started, but we still
		// do not have any data about it, we should count it as FAIL.

		const rideShouldHaveStarted = DateTime.fromJSDate(rideData.start_time_scheduled).diffNow('minutes').minutes > 5;
		const rideHasAlreadyStarted = !!rideData.seen_first_at;

		if (rideShouldHaveStarted && !rideHasAlreadyStarted) {
			responseResult._cm_scheduled_rides_until_now++;
			if (rideData.agency_id === '41') responseResult._41_scheduled_rides_until_now++;
			if (rideData.agency_id === '42') responseResult._42_scheduled_rides_until_now++;
			if (rideData.agency_id === '43') responseResult._43_scheduled_rides_until_now++;
			if (rideData.agency_id === '44') responseResult._44_scheduled_rides_until_now++;
			continue;
		}

		//
		// If a ride should have already started and has already ended,
		// and failed the SIMPLE_THREE_VEHICLE_EVENTS test, then we should count it as FAIL.

		const rideHasAlreadyEnded = rideData.seen_last_at && DateTime.fromJSDate(rideData.seen_last_at).diffNow('minutes').minutes > 2;
		const simpleThreeVehicleEvents = rideData.analysis.find(item => item._id === 'SIMPLE_THREE_VEHICLE_EVENTS');

		if (rideShouldHaveStarted && rideHasAlreadyEnded && (!simpleThreeVehicleEvents || simpleThreeVehicleEvents.grade !== 'pass')) {
			responseResult._cm_scheduled_rides_until_now++;
			if (rideData.agency_id === '41') responseResult._41_scheduled_rides_until_now++;
			if (rideData.agency_id === '42') responseResult._42_scheduled_rides_until_now++;
			if (rideData.agency_id === '43') responseResult._43_scheduled_rides_until_now++;
			if (rideData.agency_id === '44') responseResult._44_scheduled_rides_until_now++;
			continue;
		}

		//
	}

	//
	// Save items to the database

	const chacheableResource: CachedResource<typeof responseResult> = {
		data: responseResult,
		timestamp_resource: DateTime.now().toMillis(),
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.SLA, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.SLA} (${globalTimer.get()}).`);

	//
};

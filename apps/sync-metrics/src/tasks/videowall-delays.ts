/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/interfaces';
import { Dates } from '@tmlmobilidade/utils';
import { DateTime } from 'luxon';

/* * */

export const videowallDelays = async () => {
	//

	LOGGER.title(`Videowall - Delays`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = Dates
		.now()
		.setZone('Europe/Lisbon')
		.operational_date;

	//
	// Setup the response JSON object

	const responseResult = {

		// For Area 1
		_41_average_delay_minutes: 0,
		_41_delayed_for_more_than_five_minutes_count: 0,
		_41_total_until_now_count: 0,

		// For Area 2
		_42_average_delay_minutes: 0,
		_42_delayed_for_more_than_five_minutes_count: 0,
		_42_total_until_now_count: 0,

		// For Area 3
		_43_average_delay_minutes: 0,
		_43_delayed_for_more_than_five_minutes_count: 0,
		_43_total_until_now_count: 0,

		// For Area 4
		_44_average_delay_minutes: 0,
		_44_delayed_for_more_than_five_minutes_count: 0,
		_44_total_until_now_count: 0,

		// For the whole CM
		_cm_average_delay_minutes: 0,
		_cm_delayed_for_more_than_five_minutes_count: 0,
		_cm_total_until_now_count: 0,

		//
	};

	//
	// Get all rides for today. Only consider rides that have already started
	// (start_time_observed !== null) and that have already been processed.

	const ridesCollection = await rides.getCollection();
	const allRidesForTodayStream = ridesCollection.find({ operational_date: operationalDate, system_status: 'complete' }).stream();

	//
	// Iterate on all rides for today

	for await (const rideData of allRidesForTodayStream) {
		//

		//
		// Skip this ride if it has no start_time_observed

		if (!rideData.start_time_observed) continue;

		//
		// Check if the ride is delayed for more than five minutes
		// and store the total delay for each area and for the whole CM

		const relevantTest = rideData.analysis.find(item => item._id === 'ONTIME_START');
		if (!relevantTest) continue;

		if (relevantTest.reason === 'RIDE_STARTED_MORE_THAN_FIVE_MINUTES_LATE') {
			responseResult._cm_delayed_for_more_than_five_minutes_count++;
			if (rideData.agency_id === '41') responseResult._41_delayed_for_more_than_five_minutes_count++;
			if (rideData.agency_id === '42') responseResult._42_delayed_for_more_than_five_minutes_count++;
			if (rideData.agency_id === '43') responseResult._43_delayed_for_more_than_five_minutes_count++;
			if (rideData.agency_id === '44') responseResult._44_delayed_for_more_than_five_minutes_count++;
		}

		if (relevantTest.value >= 0) {
			responseResult._cm_average_delay_minutes += relevantTest.value;
			responseResult._cm_total_until_now_count++;
			if (rideData.agency_id === '41') {
				responseResult._41_average_delay_minutes += relevantTest.value;
				responseResult._41_total_until_now_count++;
			}
			if (rideData.agency_id === '42') {
				responseResult._42_average_delay_minutes += relevantTest.value;
				responseResult._42_total_until_now_count++;
			}
			if (rideData.agency_id === '43') {
				responseResult._43_average_delay_minutes += relevantTest.value;
				responseResult._43_total_until_now_count++;
			}
			if (rideData.agency_id === '44') {
				responseResult._44_average_delay_minutes += relevantTest.value;
				responseResult._44_total_until_now_count++;
			}
		}

		//
	}

	//
	// Calculate the average delay for each area and for the whole CM
	// by dividing the total delay by the number of delayed rides

	if (responseResult._cm_total_until_now_count > 0) responseResult._cm_average_delay_minutes = responseResult._cm_average_delay_minutes / responseResult._cm_total_until_now_count;
	if (responseResult._41_total_until_now_count > 0) responseResult._41_average_delay_minutes = responseResult._41_average_delay_minutes / responseResult._41_total_until_now_count;
	if (responseResult._42_total_until_now_count > 0) responseResult._42_average_delay_minutes = responseResult._42_average_delay_minutes / responseResult._42_total_until_now_count;
	if (responseResult._43_total_until_now_count > 0) responseResult._43_average_delay_minutes = responseResult._43_average_delay_minutes / responseResult._43_total_until_now_count;
	if (responseResult._44_total_until_now_count > 0) responseResult._44_average_delay_minutes = responseResult._44_average_delay_minutes / responseResult._44_total_until_now_count;

	//
	// Save items to the database

	const chacheableResource: CachedResource<typeof responseResult> = {
		data: responseResult,
		timestamp_resource: DateTime.now().toMillis(),
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.DELAYS, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.DELAYS} (${globalTimer.get()}).`);

	//
};

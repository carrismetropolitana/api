/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/services/interfaces';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

export const videowallDelays = async () => {
	//

	LOGGER.title(`Videowall - Validations`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = getOperationalDate();

	//
	// Setup the response JSON object

	const responseResult = {

		// For Area 1
		_41_average_delay_minutes: 0,
		_41_delayed_for_more_than_five_minutes_count: 0,

		// For Area 2
		_42_average_delay_minutes: 0,
		_42_delayed_for_more_than_five_minutes_count: 0,

		// For Area 3
		_43_average_delay_minutes: 0,
		_43_delayed_for_more_than_five_minutes_count: 0,

		// For Area 4
		_44_average_delay_minutes: 0,
		_44_delayed_for_more_than_five_minutes_count: 0,

		// For the whole CM
		_cm_average_delay_minutes: 0,
		_cm_delayed_for_more_than_five_minutes_count: 0,

		//
	};

	//
	// Get all rides for today

	const ridesCollection = await rides.getCollection();
	const allRidesForTodayStream = ridesCollection.find({ operational_date: operationalDate }).stream();

	//
	// Iterate on all rides for today

	for await (const rideData of allRidesForTodayStream) {
		//

		//
		// Only consider rides that have already started (schedule start before now)
		// or have already been processed.

		const rideStartedBeforeNow = DateTime.fromJSDate(rideData.start_time_scheduled).toMillis() < DateTime.now().minus({ minutes: 60 }).toMillis();

		const rideHasBeenProcessed = rideData.status === 'complete' && rideData.analysis.length > 0;

		if (!rideStartedBeforeNow || !rideHasBeenProcessed) continue;

		//
		// Check if the ride is delayed for more than five minutes
		// and store the total delay for each area and for the whole CM

		const relevantTest = rideData.analysis.find(item => item._id === 'GEO_DELAYED_START_LAST_IN');

		if (!relevantTest) continue;

		if (relevantTest.grade === 'fail') {
			responseResult._cm_delayed_for_more_than_five_minutes_count++;
			if (rideData.agency_id === '41') responseResult._41_delayed_for_more_than_five_minutes_count++;
			if (rideData.agency_id === '42') responseResult._42_delayed_for_more_than_five_minutes_count++;
			if (rideData.agency_id === '43') responseResult._43_delayed_for_more_than_five_minutes_count++;
			if (rideData.agency_id === '44') responseResult._44_delayed_for_more_than_five_minutes_count++;
		}

		if (relevantTest.value) {
			responseResult._cm_average_delay_minutes += relevantTest.value;
			if (rideData.agency_id === '41') responseResult._41_average_delay_minutes += relevantTest.value;
			if (rideData.agency_id === '42') responseResult._42_average_delay_minutes += relevantTest.value;
			if (rideData.agency_id === '43') responseResult._43_average_delay_minutes += relevantTest.value;
			if (rideData.agency_id === '44') responseResult._44_average_delay_minutes += relevantTest.value;
		}

		//
	}

	//
	// Calculate the average delay for each area and for the whole CM
	// by dividing the total delay by the number of delayed rides

	if (responseResult._cm_delayed_for_more_than_five_minutes_count > 0) responseResult._cm_average_delay_minutes = responseResult._cm_average_delay_minutes / responseResult._cm_delayed_for_more_than_five_minutes_count;
	if (responseResult._41_delayed_for_more_than_five_minutes_count > 0) responseResult._41_average_delay_minutes = responseResult._41_average_delay_minutes / responseResult._41_delayed_for_more_than_five_minutes_count;
	if (responseResult._42_delayed_for_more_than_five_minutes_count > 0) responseResult._42_average_delay_minutes = responseResult._42_average_delay_minutes / responseResult._42_delayed_for_more_than_five_minutes_count;
	if (responseResult._43_delayed_for_more_than_five_minutes_count > 0) responseResult._43_average_delay_minutes = responseResult._43_average_delay_minutes / responseResult._43_delayed_for_more_than_five_minutes_count;
	if (responseResult._44_delayed_for_more_than_five_minutes_count > 0) responseResult._44_average_delay_minutes = responseResult._44_average_delay_minutes / responseResult._44_delayed_for_more_than_five_minutes_count;

	//
	// Save items to the database

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.EMPTY_RIDES, JSON.stringify({ data: responseResult, timestamp: DateTime.now().toMillis() }));

	LOGGER.success(`Done updating videwall:validations items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.VALIDATIONS} (${globalTimer.get()}).`);

	//
};

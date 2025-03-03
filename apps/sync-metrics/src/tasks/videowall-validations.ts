/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/core/interfaces';
import { OPERATIONAL_DATE_FORMAT, type OperationalDate, type UnixTimestamp } from '@tmlmobilidade/core/types';
import { getOperationalDate } from '@tmlmobilidade/core/utils';
import { DateTime } from 'luxon';

/* * */

export const videowallValidations = async () => {
	//

	LOGGER.title(`Videowall - Validations`);
	const globalTimer = new TIMETRACKER();

	const ridesCollection = await rides.getCollection();

	//
	// To calculate how many validations were made today and last week, we need to first
	// get the corresponding Rides for each operational date. Then, we can sum the number
	// of validations for each Ride, for each agency, and for each operational date.

	const todayOperationalDate = getOperationalDate();

	const lastWeekOperationalDate = DateTime
		.fromFormat(todayOperationalDate, OPERATIONAL_DATE_FORMAT)
		.minus({ days: 7 })
		.toFormat(OPERATIONAL_DATE_FORMAT) as OperationalDate;

	const lastWeekUntilNow = DateTime
		.now()
		.minus({ days: 7 })
		.plus({ hour: 1 })
		.toMillis() as UnixTimestamp;

	//
	// Setup the response JSON object

	const responseResult = {

		// For Area 1
		_41_last_week_valid_count: -1,
		_41_today_valid_count: -1,

		// For Area 2
		_42_last_week_valid_count: -1,
		_42_today_valid_count: -1,

		// For Area 3
		_43_last_week_valid_count: -1,
		_43_today_valid_count: -1,

		// For Area 4
		_44_last_week_valid_count: -1,
		_44_today_valid_count: -1,

		// For the whole CM
		_cm_last_week_valid_count: -1,
		_cm_today_valid_count: -1,

	};

	//
	// Fetch and process Rides for today

	const allRidesForTodayStream = ridesCollection.find({ operational_date: todayOperationalDate }).stream();

	for await (const rideData of allRidesForTodayStream) {
		responseResult._cm_today_valid_count += rideData.validations_count;
		if (rideData.agency_id === '41') responseResult._41_today_valid_count += rideData.validations_count;
		if (rideData.agency_id === '42') responseResult._42_today_valid_count += rideData.validations_count;
		if (rideData.agency_id === '43') responseResult._43_today_valid_count += rideData.validations_count;
		if (rideData.agency_id === '44') responseResult._44_today_valid_count += rideData.validations_count;
	}

	//
	// Fetch and process Rides for last week

	const allRidesForLastWeekStream = ridesCollection.find({ operational_date: lastWeekOperationalDate, start_time_scheduled: { $gte: lastWeekUntilNow } }).stream();

	for await (const rideData of allRidesForLastWeekStream) {
		responseResult._cm_last_week_valid_count += rideData.validations_count;
		if (rideData.agency_id === '41') responseResult._41_last_week_valid_count += rideData.validations_count;
		if (rideData.agency_id === '42') responseResult._42_last_week_valid_count += rideData.validations_count;
		if (rideData.agency_id === '43') responseResult._43_last_week_valid_count += rideData.validations_count;
		if (rideData.agency_id === '44') responseResult._44_last_week_valid_count += rideData.validations_count;
	}

	//
	// Save items to the database

	const chacheableResource: CachedResource<typeof responseResult> = {
		data: responseResult,
		timestamp_resource: DateTime.now().toMillis(),
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.VALIDATIONS, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.VALIDATIONS} (${globalTimer.get()}).`);

	//
};

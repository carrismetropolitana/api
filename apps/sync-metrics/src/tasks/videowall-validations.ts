/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

const VALID_APEX_VALIDATION_STATUSES = [0, 4, 5, 6];

const VALID_APEX_VALIDATION_STATUSES_SQL = VALID_APEX_VALIDATION_STATUSES
	.map(String)
	.map(status => `'${status}'`)
	.join(', ');

/* * */

interface VideowallValidations {

	// For Area 1
	_41_last_week_valid_count: number
	_41_today_valid_count: number

	// For Area 2
	_42_last_week_valid_count: number
	_42_today_valid_count: number

	// For Area 3
	_43_last_week_valid_count: number
	_43_today_valid_count: number

	// For Area 4
	_44_last_week_valid_count: number
	_44_today_valid_count: number

	// For the whole CM
	_cm_last_week_valid_count: number
	_cm_today_valid_count: number

	//
}

/* * */

export const videowallValidations = async () => {
	//

	LOGGER.title(`Videowall - Validations`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup the timestamp boundary
	// This takes in consideration the current time, as we want to compare today so far with the previous day so far, also.
	// For example, today is monday 10h49. We want to compare the number of validations until 10h49 of today with the number of validations until 10h49 of last monday.

	const currentOperationalDate = Dates
		.now('Europe/Lisbon')
		// .minus({ days: 7 })
		.operational_date_int;

	const currentOperationalDateAsUnixTimestamp = Dates
		.fromOperationalDateInt(currentOperationalDate, 'Europe/Lisbon')
		.startOf('day')
		.set({ hour: 4 })
		.unix_milliseconds;

	const currentOperationalDateAsUnixTimestampEnd = Dates
		.now('Europe/Lisbon')
		// .minus({ days: 7, minutes: 20 })
		.unix_milliseconds;

	const previousOperationalDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 7 })
		// .minus({ days: 7 })
		.operational_date_int;

	const previousOperationalDateAsUnixTimestamp = Dates
		.fromOperationalDateInt(previousOperationalDate, 'Europe/Lisbon')
		.startOf('day')
		.set({ hour: 4 })
		.unix_milliseconds;

	const previousUntilNowAsUnixTimestamp = Dates
		.now('Europe/Lisbon')
		.minus({ days: 7 })
		// .minus({ days: 7 })
		.unix_milliseconds;

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
	// Perform database searches

	try {
		const query = `
			SELECT
				countIf(
					agency_id = 'LA77N'
					AND created_at >= ${currentOperationalDateAsUnixTimestamp}
					AND created_at <= ${currentOperationalDateAsUnixTimestampEnd}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _41_today_valid_count,

				countIf(
					agency_id = 'LA77N'
					AND created_at >= ${previousOperationalDateAsUnixTimestamp}
					AND created_at <= ${previousUntilNowAsUnixTimestamp}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _41_last_week_valid_count,

				countIf(
					agency_id = 'BNA17'
					AND created_at >= ${currentOperationalDateAsUnixTimestamp}
					AND created_at <= ${currentOperationalDateAsUnixTimestampEnd}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _42_today_valid_count,

				countIf(
					agency_id = 'BNA17'
					AND created_at >= ${previousOperationalDateAsUnixTimestamp}
					AND created_at <= ${previousUntilNowAsUnixTimestamp}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _42_last_week_valid_count,

				countIf(
					agency_id = 'YA15B'
					AND created_at >= ${currentOperationalDateAsUnixTimestamp}
					AND created_at <= ${currentOperationalDateAsUnixTimestampEnd}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _43_today_valid_count,

				countIf(
					agency_id = 'YA15B'
					AND created_at >= ${previousOperationalDateAsUnixTimestamp}
					AND created_at <= ${previousUntilNowAsUnixTimestamp}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _43_last_week_valid_count,

				countIf(
					agency_id = 'A2L1N'
					AND created_at >= ${currentOperationalDateAsUnixTimestamp}
					AND created_at <= ${currentOperationalDateAsUnixTimestampEnd}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _44_today_valid_count,

				countIf(
					agency_id = 'A2L1N'
					AND created_at >= ${previousOperationalDateAsUnixTimestamp}
					AND created_at <= ${previousUntilNowAsUnixTimestamp}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _44_last_week_valid_count,

				countIf(
					agency_id IN ('LA77N', 'BNA17', 'YA15B', 'A2L1N')
					AND created_at >= ${currentOperationalDateAsUnixTimestamp}
					AND created_at <= ${currentOperationalDateAsUnixTimestampEnd}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _cm_today_valid_count,

				countIf(
					agency_id IN ('LA77N', 'BNA17', 'YA15B', 'A2L1N')
					AND created_at >= ${previousOperationalDateAsUnixTimestamp}
					AND created_at <= ${previousUntilNowAsUnixTimestamp}
					AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				) AS _cm_last_week_valid_count

			FROM simplified_apex.validations FINAL

			WHERE
				agency_id IN ('LA77N', 'BNA17', 'YA15B', 'A2L1N')
				AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				AND (
					(
						created_at >= ${currentOperationalDateAsUnixTimestamp}
						AND created_at <= ${currentOperationalDateAsUnixTimestampEnd}
					)
					OR (
						created_at >= ${previousOperationalDateAsUnixTimestamp}
						AND created_at <= ${previousUntilNowAsUnixTimestamp}
					)
				);
		`;

		const queryResult = await labDb.queryFromString<VideowallValidations>(query);

		Object.assign(responseResult, queryResult[0]);
	}
	catch (err) {
		console.log(err);
	}

	//
	// Save items to the database

	const chacheableResource: CachedResource<typeof responseResult> = {
		data: responseResult,
		timestamp_resource: Dates.now('Europe/Lisbon').unix_milliseconds,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.VALIDATIONS, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.VALIDATIONS} (${globalTimer.get()}).`);

	//
};

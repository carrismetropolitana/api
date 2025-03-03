/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { apexT11 } from '@tmlmobilidade/core/interfaces';
import { ALLOWED_VALIDATION_STATUSES } from '@tmlmobilidade/core/types';
import { createUnixTimestampFromOperationalDate, getOperationalDate, validateUnixTimestamp } from '@tmlmobilidade/core/utils';
import { DateTime } from 'luxon';

/* * */

export const videowallValidations = async () => {
	//

	LOGGER.title(`Videowall - Validations`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup the timestamp boundary
	// This takes in consideration the current time, as we want to compare today so far with the previous day so far, also.
	// For example, today is monday 10h49. We want to compare the number of validations until 10h49 of today with the number of validations until 10h49 of last monday.

	const todayUnixTimestamp = createUnixTimestampFromOperationalDate(getOperationalDate());

	const lastWeekUnixTimestamp = validateUnixTimestamp(
		DateTime
			.fromMillis(todayUnixTimestamp)
			.minus({ days: 7 })
			.toMillis(),
	);

	const lastWeekUntilNowUnixTimestamp = validateUnixTimestamp(
		DateTime
			.now()
			.minus({ days: 7 })
			.toMillis(),
	);

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
		// For Area 1
		responseResult._41_today_valid_count = await apexT11.count({
			agency_id: '41',
			created_at: { $gte: todayUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		responseResult._41_last_week_valid_count = await apexT11.count({
			agency_id: '41',
			created_at: { $gte: lastWeekUnixTimestamp, $lte: lastWeekUntilNowUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		// For Area 2
		responseResult._42_today_valid_count = await apexT11.count({
			agency_id: '42',
			created_at: { $gte: todayUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		responseResult._42_last_week_valid_count = await apexT11.count({
			agency_id: '42',
			created_at: { $gte: lastWeekUnixTimestamp, $lte: lastWeekUntilNowUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		// For Area 3
		responseResult._43_today_valid_count = await apexT11.count({
			agency_id: '43',
			created_at: { $gte: todayUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		responseResult._43_last_week_valid_count = await apexT11.count({
			agency_id: '43',
			created_at: { $gte: lastWeekUnixTimestamp, $lte: lastWeekUntilNowUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		// For Area 4
		responseResult._44_today_valid_count = await apexT11.count({
			agency_id: '44',
			created_at: { $gte: todayUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		responseResult._44_last_week_valid_count = await apexT11.count({
			agency_id: '44',
			created_at: { $gte: lastWeekUnixTimestamp, $lte: lastWeekUntilNowUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		// For the whole CM
		responseResult._cm_today_valid_count = await apexT11.count({
			agency_id: { $in: ['41', '42', '43', '44'] },
			created_at: { $gte: todayUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
		responseResult._cm_last_week_valid_count = await apexT11.count({
			agency_id: { $in: ['41', '42', '43', '44'] },
			created_at: { $gte: lastWeekUnixTimestamp, $lte: lastWeekUntilNowUnixTimestamp },
			validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
		});
	}
	catch (err) {
		console.log(err);
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

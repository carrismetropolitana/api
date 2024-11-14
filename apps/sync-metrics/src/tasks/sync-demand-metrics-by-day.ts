/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { DemandMetricsByDay } from '@carrismetropolitana/api-types/metrics';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

/* * */

const DAYS_TO_RETRIEVE = 15;

const OPERATOR_IDS = ['41', '42', '43', '44'];

const APEX_VALIDATION_STATUSES = [0];

/* * */

export const syncDemandMetricsByDay = async () => {
	//

	LOGGER.title(`Sync Demand Metrics by Day`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup up TRINODB query

	const startDateObject = DateTime.now().setZone('Europe/Lisbon').minus({ days: DAYS_TO_RETRIEVE }).set({ hour: 4, minute: 0, second: 0 });
	const startDateString = startDateObject.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
	const startDateRawIso = startDateObject.minus({ day: 1 }).toFormat('yyyyLLdd'); // Margin of minus 1 day

	const queryOptions = {
		where: {
			operator: {
				$in: OPERATOR_IDS,
			},
			rawloaddateiso: {
				$gte: startDateRawIso,
			},
			transactiondate: {
				$gte: startDateString,
			},
			validationstatus: {
				$in: APEX_VALIDATION_STATUSES,
			},
		},
	};

	//
	// Count validations by day

	LOGGER.info(`Counting validations by Day since ${startDateRawIso}...`);
	const countTimer = new TIMETRACKER();

	const validationsByDayCount = await TRINODB.countValidations({ options: queryOptions, timeUnit: 'day' });
	const validationsByDayArray: DemandMetricsByDay[] = validationsByDayCount
		.map((item) => {
			return {
				operational_day: item.transaction_time,
				total_qty: item.count_result,
			};
		})
		.sort((a, b) => {
			return sortCollator.compare(a.operational_day, b.operational_day);
		});

	LOGGER.info(`Counted ${validationsByDayArray.length} days (${countTimer.get()})`);

	//
	// Save to SERVERDB

	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_DAY, JSON.stringify(validationsByDayArray));

	LOGGER.terminate(`Sync Demand Metrics by Day complete (${globalTimer.get()})`);

	//
};

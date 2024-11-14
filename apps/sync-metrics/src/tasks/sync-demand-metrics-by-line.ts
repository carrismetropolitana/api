/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { DemandMetricsByLine } from '@carrismetropolitana/api-types/metrics';
import { Line } from '@carrismetropolitana/api-types/network';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

/* * */

const DAYS_TO_RETRIEVE = 15;

const OPERATOR_IDS = ['41', '42', '43', '44'];

const APEX_VALIDATION_STATUSES = [0];

/* * */

export const syncDemandMetricsByLine = async () => {
	//

	LOGGER.title(`Sync Demand Metrics by Line`);
	const globalTimer = new TIMETRACKER();

	//
	// Retrieve all Lines from SERVERDB

	const allLinesTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.LINES);
	if (!allLinesTxt) {
		throw new Error('No Lines found in SERVERDB');
	}

	const allLinesData: Line[] = JSON.parse(allLinesTxt);
	const allLineIdsSet = new Set<string>(allLinesData.map(item => item.id));

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
	// Setup the template structure for the demand metrics by line

	const validationsByLinesMap = new Map<string, DemandMetricsByLine>();

	for (const lineId of allLineIdsSet) {
		validationsByLinesMap.set(lineId, {
			by_day: [],
			end_date: DateTime.now().setZone('Europe/Lisbon').toFormat('yyyyLLdd'),
			line_id: lineId,
			start_date: startDateObject.toFormat('yyyyLLdd'),
			total_qty: 0,
		});
	}

	//
	// Count validations by Hour

	LOGGER.info(`Counting validations by Line per Hour since ${startDateRawIso}...`);
	const countPerHourTimer = new TIMETRACKER();

	const validationsCountByHourMap = new Map();

	const validationsCountByHourResult = await TRINODB.countValidations({ options: queryOptions, timeUnit: 'hour', type: 'line' });

	validationsCountByHourResult.forEach((item) => {
		// Set the object key to be the line ID and the day component
		const objectKey = `${item.item_id}:${item.transaction_time.split(' ')[0]}`;
		// Create the array if it doesn't exist in the map
		if (!validationsCountByHourMap.has(objectKey)) {
			validationsCountByHourMap.set(objectKey, []);
		}
		// Push the current item to the array
		validationsCountByHourMap.get(objectKey).push({
			hour: DateTime.fromFormat(item.transaction_time, 'yyyy-LL-dd HH:mm:ss.SSS').hour,
			qty: item.count_result,
		});
	});

	LOGGER.info(`Found ${validationsCountByHourResult.length} hour groups (${countPerHourTimer.get()})`);

	//
	// Count validations by Day

	LOGGER.info(`Counting validations by Line per Day since ${startDateRawIso}...`);
	const countPerDayTimer = new TIMETRACKER();

	const validationsCountByDayResult = await TRINODB.countValidations({ options: queryOptions, timeUnit: 'day', type: 'line' });

	validationsCountByDayResult.forEach((item) => {
		// Skip if the line ID is not in the map
		if (!validationsByLinesMap.has(item.item_id)) return;
		// Add the current item to the map
		const mapItem = validationsByLinesMap.get(item.item_id);
		// Add the current item to the map
		mapItem.by_day.push({
			by_hour: validationsCountByHourMap.get(`${item.item_id}:${item.transaction_time.split(' ')[0]}`) || [],
			day: item.transaction_time,
			qty: item.count_result,
		});
		// Increment the total_qty
		mapItem.total_qty += item.count_result;
		//
	});

	LOGGER.info(`Found ${validationsCountByDayResult.length} day groups (${countPerDayTimer.get()})`);

	//
	// Save all documents

	const validationsByLinesArray = Array.from(validationsByLinesMap.values());
	validationsByLinesArray.sort((a, b) => sortCollator.compare(a.line_id, b.line_id));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_LINE, JSON.stringify(validationsByLinesArray));

	//

	LOGGER.terminate(`Parsed ${validationsByLinesArray.length} validations, ${validationsByLinesArray.length} Lines (${globalTimer.get()})`);

	//
};

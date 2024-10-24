/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { DemandMetrics } from '@carrismetropolitana/api-types/metrics';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

/* * */

export default async () => {
	//

	LOGGER.init();

	const globalTimer = new TIMETRACKER();

	//
	// Retrieve all Lines and Stops from database

	// Lines
	const allLinesTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.LINES);

	if (!allLinesTxt) {
		throw new Error('No lines found in SERVERDB');
	}

	const allLinesData: any[] = JSON.parse(allLinesTxt);
	const allLinesSet = new Set(allLinesData.map(item => item.id));

	// Stops
	const allStopsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.STOPS);
	if (!allStopsTxt) {
		throw new Error('No stops found in SERVERDB');
	}
	const allStopsData: any[] = JSON.parse(allStopsTxt);
	const allStopsSet = new Set(allStopsData.map(item => item.id));

	//
	// Filters

	const daysToRetrieve = 15;
	const operatorIds = ['41', '42', '43', '44'];
	const startDateString = DateTime.now().setZone('Europe/Lisbon').minus({ days: daysToRetrieve }).set({ hour: 4, minute: 0, second: 0 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
	const endDateString = DateTime.now().setZone('Europe/Lisbon').toFormat('yyyy-LL-dd');
	const startDateStringISO = DateTime.now().setZone('Europe/Lisbon').minus({ days: daysToRetrieve }).set({ hour: 4, minute: 0, second: 0 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
	const apexValidationStatuses = [0];

	//
	// Parse data
	const options = {
		where: {
			transactiondate: {
				$gte: startDateString,
				$lte: endDateString,
			},
			rawloaddateiso: {
				$gte: startDateStringISO,
			},
			operator: {
				$in: operatorIds,
			},
			validationstatus: {
				$in: apexValidationStatuses,
			},
		},
	};

	const parseTimer = new TIMETRACKER();


	const validationsByLinesMap = new Map<string, DemandMetrics>();
	const validationsByStopsMap = new Map<string, DemandMetrics>();

	//
	// Parsing validations by day

	LOGGER.info("Parsing validations by day");
	const validationsByDayArray = (await TRINODB.countValidations({ timeUnit: 'day', options })).map((item) => ({
		operational_day: item.transaction_time,
		total_qty: item.count_result,
	}));

	LOGGER.info(`Parsed ${validationsByDayArray.length} days (${parseTimer.get()})`);

	//
	// Parsing validations by line
	LOGGER.info("Parsing validations by line");
	for (const lineId of allLinesSet) {
		validationsByLinesMap.set(lineId, {
			item_id: lineId,
			start_date: startDateString,
			end_date: endDateString,
			total_qty: 0,
			by_day: []
		});
	}

	const linesHourlyMap = new Map();
	(await TRINODB.countValidations({ timeUnit: 'hour', type: 'line', options })).map((item) => {
		const key = `${item.item_id}:${item.transaction_time.split(' ')[0]}`;
		linesHourlyMap.set(key, linesHourlyMap.get(key) || []);
		linesHourlyMap.get(key).push({
			hour: DateTime.fromFormat(item.transaction_time, 'yyyy-LL-dd HH:mm:ss.SSS').hour,
			qty: item.count_result
		});
	});

	(await TRINODB.countValidations({ timeUnit: 'day', type: 'line', options })).map(async (item) => {
		if (!validationsByLinesMap.has(item.item_id)) return;

		validationsByLinesMap.set(item.item_id, {
			...validationsByLinesMap.get(item.item_id),
			total_qty: validationsByLinesMap.get(item.item_id).total_qty + item.count_result,
			by_day: [...validationsByLinesMap.get(item.item_id).by_day, {
				day: item.transaction_time,
				qty: item.count_result,
				by_hour: linesHourlyMap.get(`${item.item_id}:${item.transaction_time.split(' ')[0]}`) || []
			}]
		});
	});

	LOGGER.info(`Parsed ${validationsByLinesMap.size} lines (${parseTimer.get()})`);


	//
	// Parsing validations by stop

	LOGGER.info("Parsing validations by stop");
	for (const stopId of allStopsSet) {
		validationsByStopsMap.set(stopId, {
			item_id: stopId,
			start_date: startDateString,
			end_date: endDateString,
			total_qty: 0,
			by_day: []
		});
	}

	const stopsHourlyMap = new Map();
	(await TRINODB.countValidations({ timeUnit: 'hour', type: 'stop', options })).map((item) => {
		const key = `${item.item_id}:${item.transaction_time.split(' ')[0]}`;
		stopsHourlyMap.set(key, stopsHourlyMap.get(key) || []);
		stopsHourlyMap.get(key).push({
			hour: DateTime.fromFormat(item.transaction_time, 'yyyy-LL-dd HH:mm:ss.SSS').hour,
			qty: item.count_result
		});
	});

	(await TRINODB.countValidations({ timeUnit: 'day', type: 'stop', options })).map(async (item) => {
		if (!validationsByStopsMap.has(item.item_id)) return;

		validationsByStopsMap.set(item.item_id, {
			...validationsByStopsMap.get(item.item_id),
			total_qty: validationsByStopsMap.get(item.item_id).total_qty + item.count_result,
			by_day: [...validationsByStopsMap.get(item.item_id).by_day, {
				day: item.transaction_time,
				qty: item.count_result,
				by_hour: stopsHourlyMap.get(`${item.item_id}:${item.transaction_time.split(' ')[0]}`) || []
			}]
		});
	});

	LOGGER.info(`Parsed ${validationsByStopsMap.size} stops (${parseTimer.get()})`);

	//
	// Save all documents

	const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

	validationsByDayArray.sort((a, b) => collator.compare(a.operational_day, b.operational_day));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_DAY, JSON.stringify(validationsByDayArray));

	const validationsByLinesArray = Array.from(validationsByLinesMap.values());
	validationsByLinesArray.sort((a, b) => collator.compare(a.item_id, b.item_id));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_LINE, JSON.stringify(validationsByLinesArray));

	const validationsByStopsArray = Array.from(validationsByStopsMap.values());
	validationsByStopsArray.sort((a, b) => collator.compare(a.item_id, b.item_id));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_STOP, JSON.stringify(validationsByStopsArray));

	//

	LOGGER.terminate(`Parsed ${validationsByLinesArray.length + validationsByStopsArray.length} validations, updated ${validationsByDayArray.length} Days, ${validationsByLinesArray.length} Lines and ${validationsByStopsArray.length} Stops (${globalTimer.get()})`);
	LOGGER.divider();

	//
};

/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';
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

	const allLinesTxt = await SERVERDB.client.get('v2/network/lines/all');
	const allLinesData = JSON.parse(allLinesTxt);
	const allLinesSet = new Set(allLinesData.map(item => item.line_id));

	const allStopsTxt = await SERVERDB.client.get('v2/network/stops/all');
	const allStopsData = JSON.parse(allStopsTxt);
	const allStopsSet = new Set(allStopsData.map(item => item.stop_id));

	//
	// Setup PCGIDB validations stream

	const operatorIds = ['41', '42', '43', '44'];

	const startDateString = DateTime.now().setZone('Europe/Lisbon').minus({ days: 15 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
	const endDateString = DateTime.now().setZone('Europe/Lisbon').toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');

	const apexValidationStatuses = [0];

	const validationsQuery = {
		'transaction.operatorLongID': { $in: operatorIds },
		'transaction.transactionDate': { $gte: startDateString, $lte: endDateString },
		'transaction.validationStatus': { $in: apexValidationStatuses },
	};

	LOGGER.info('Streaming validations from PCGIDB...');
	LOGGER.info(`Operator IDs: ${operatorIds.join(', ')} | Start Date: ${startDateString} | End Date: ${endDateString} | Validation Statuses: ${apexValidationStatuses.join(', ')}`);

	const validationsStream = await PCGIDB.ValidationEntity
		.find(validationsQuery, { allowDiskUse: true, maxTimeMS: 999000 })
		.project({ '_id': 1, 'transaction.lineLongID': 1, 'transaction.stopLongID': 1, 'transaction.transactionDate': 1 })
		.stream();

	//
	// Parse data

	const validationsByLineMap = new Map();
	const validationsByStopMap = new Map();
	const validationsByLineAndHourMap = new Map();
	const validationsByStopAndHourMap = new Map();

	let totalCounter = 0;
	let validCounter = 0;

	for await (const doc of validationsStream) {
		//

		totalCounter++;

		if (!allLinesSet.has(doc.transaction.lineLongID)) continue;
		if (!allStopsSet.has(doc.transaction.stopLongID)) continue;

		// Check if the line is in the list of available lines
		validCounter++;
		if (validCounter % 10000 === 0) {
			LOGGER.info(`Parsed ${validCounter} transactions | ${totalCounter} total | ${totalCounter - validCounter} skipped`);
		}

		// Increment the line count

		if (validationsByLineMap.has(doc.transaction.lineLongID)) {
			validationsByLineMap.set(doc.transaction.lineLongID, validationsByLineMap.get(doc.transaction.lineLongID) + 1);
		}
		else {
			validationsByLineMap.set(doc.transaction.lineLongID, 1);
		}

		// Increment the stop count

		if (validationsByStopMap.has(doc.transaction.stopLongID)) {
			validationsByStopMap.set(doc.transaction.stopLongID, validationsByStopMap.get(doc.transaction.stopLongID) + 1);
		}
		else {
			validationsByStopMap.set(doc.transaction.stopLongID, 1);
		}

		// Extract hour from transaction date
		const transactionDate = DateTime.fromFormat(doc.transaction.transactionDate, 'yyyy-LL-dd\'T\'HH\':\'00\':\'00').setZone('Europe/Lisbon');
		const hour = transactionDate.get('hour');

		// Increment the line-hour count
		if (!validationsByLineAndHourMap.has(doc.transaction.lineLongID)) {
			validationsByLineAndHourMap.set(doc.transaction.lineLongID, new Map());
		}
		const lineHourMap = validationsByLineAndHourMap.get(doc.transaction.lineLongID);
		if (lineHourMap.has(hour)) {
			lineHourMap.set(hour, lineHourMap.get(hour) + 1);
		}
		else {
			lineHourMap.set(hour, 1);
		}

		// Increment the stop-hour count
		if (!validationsByStopAndHourMap.has(doc.transaction.stopLongID)) {
			validationsByStopAndHourMap.set(doc.transaction.stopLongID, new Map());
		}
		const stopHourMap = validationsByStopAndHourMap.get(doc.transaction.stopLongID);
		if (stopHourMap.has(hour)) {
			stopHourMap.set(hour, stopHourMap.get(hour) + 1);
		}
		else {
			stopHourMap.set(hour, 1);
		}

		//
	}

	//
	// Parse maps into arrays

	const validationsByLineArray = Array.from(validationsByLineMap).map(([lineId, totalQty]) => {
		const hourlyDistribution = validationsByLineAndHourMap.get(lineId);
		return {
			by_hour: hourlyDistribution ? Array.from(hourlyDistribution).map(([hour, hourlyQty]) => ({ hour: hour, qty: hourlyQty })) : [],
			end_date: endDateString,
			line_id: lineId,
			start_date: startDateString,
			total_qty: totalQty,
		};
	});

	const validationsByStopArray = Array.from(validationsByStopMap).map(([stopId, totalQty]) => {
		const hourlyDistribution = validationsByStopAndHourMap.get(stopId);
		return {
			by_hour: hourlyDistribution ? Array.from(hourlyDistribution).map(([hour, hourlyQty]) => ({ hour: hour, qty: hourlyQty })) : [],
			end_date: endDateString,
			start_date: startDateString,
			stop_id: stopId,
			total_qty: totalQty,
		};
	});

	//
	// Save all documents

	const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

	validationsByLineArray.sort((a, b) => collator.compare(a.line_id, b.line_id));
	await SERVERDB.client.set('v2/metrics/demand/by_line', JSON.stringify(validationsByLineArray));

	validationsByStopArray.sort((a, b) => collator.compare(a.stop_id, b.stop_id));
	await SERVERDB.client.set('v2/metrics/demand/by_stop', JSON.stringify(validationsByStopArray));

	//

	LOGGER.terminate(`Parsed ${validCounter} validations, skipped ${totalCounter - validCounter} validations and updated ${validationsByLineArray.length} Lines and ${validationsByStopArray.length} Stops (${globalTimer.get()})`);

	LOGGER.divider();

	//
};

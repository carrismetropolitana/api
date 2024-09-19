/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import getOperationalDay from '@/services/getOperationalDay.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

/* * */

export default async () => {
	//

	LOGGER.init();

	const globalTimer = new TIMETRACKER();

	//
	// Setup PCGIDB validations stream

	const operatorIds = ['41', '42', '43', '44'];

	const dateObject = DateTime.fromFormat(getOperationalDay(), 'yyyyLLdd').setZone('Europe/Lisbon');
	const startDateString = dateObject.set({ hour: 4, minute: 0, second: 0 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
	const endDateString = dateObject.plus({ day: 1 }).set({ hour: 3, minute: 59, second: 59 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');

	const apexValidationStatuses = [0, 8];

	const validationsByDayArray = [];

	// For each operator, get the validations
	await Promise.all(operatorIds.map(async (operatorId) => {
		const validationsQuery = {
			'transaction.operatorLongID': { $in: [operatorId] },
			'transaction.transactionDate': { $gte: startDateString, $lte: endDateString },
			'transaction.validationStatus': { $in: apexValidationStatuses },
		};

		const result = await PCGIDB.ValidationEntity.aggregate(
			[
				{ $match: validationsQuery },
				{ $group: { _id: '$_id', count: { $sum: 1 } } },
				{ $count: 'totalUnique' },
			],
			{ allowDiskUse: true, maxTimeMS: 180000 },
		).toArray();

		const count = result[0].totalUnique;
		validationsByDayArray.push({ count, date: getOperationalDay() });
		await SERVERDB.client.set(`v2/metrics/demand/operator/${operatorId}/${getOperationalDay()}`, JSON.stringify({
			end_date: endDateString,
			start_date: startDateString,
			timestamp: new Date().toISOString(),
			value: count,
		}));
	}));

	LOGGER.info(`Finished processing validations | ${globalTimer.get()}`);
	LOGGER.divider();

	//
};

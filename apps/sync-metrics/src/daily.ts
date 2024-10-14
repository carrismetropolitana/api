/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime, Info } from 'luxon';

/* * */

export default async () => {
	//

	LOGGER.init();

	const globalTimer = new TIMETRACKER();

	//
	// Get Data from redis

	const ByMonthTxt = await SERVERDB.client.get('v2:metrics:demand:by_month');
	const ByMonthData = JSON.parse(ByMonthTxt);

	//
	// Setup PCGIDB validations stream
	const operatorIds = ['41', '42', '43', '44'];

	const apexValidationStatuses = [0];
	const currentDate = DateTime.now().setZone('Europe/Lisbon').set({ hour: 4, minute: 0, second: 0 });

	const by_month = [];
	const promises = [];

	// Loop through all months of the current year until the current month not included
	for (let i = 1; i < currentDate.month; i++) {
		if (ByMonthData && ByMonthData.find(item => item.month === i && item.year === currentDate.year)) {
			LOGGER.info(`Data for month ${Info.months('long')[i - 1]}/${currentDate.year} already exists in database.`);

			by_month.push(ByMonthData.find(item => item.month === i));
			continue;
		}

		const startDateString = DateTime.now().setZone('Europe/Lisbon').set({ day: 1, hour: 4, minute: 0, month: i, second: 0 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
		const endDateString = DateTime.now().setZone('Europe/Lisbon').set({ day: 1, hour: 4, minute: 0, month: i + 1, second: 0 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');

		const validationsQuery = {
			'transaction.operatorLongID': { $in: operatorIds },
			'transaction.transactionDate': { $gte: startDateString, $lte: endDateString },
			'transaction.validationStatus': { $in: apexValidationStatuses },
		};

		LOGGER.info('Streaming validations from PCGIDB...');
		LOGGER.info(`Operator IDs: [${operatorIds.join(', ')}] | Start Date: ${startDateString} | End Date: ${endDateString} | Validation Statuses: [${apexValidationStatuses.join(', ')}]`);

		const promise = PCGIDB.ValidationEntity.countDocuments(validationsQuery, { allowDiskUse: true, maxTimeMS: 999000 })
			.then((count) => {
				by_month.push({ count, month: i, year: currentDate.year });
			});

		promises.push(promise);
	}

	await Promise.all(promises);

	//
	// Save all documents
	await SERVERDB.client.set('v2:metrics:demand:by_month', JSON.stringify(by_month));

	//
	LOGGER.info('Metrics saved to database. | Time elapsed: ' + globalTimer.get());
	LOGGER.divider();

	//
};

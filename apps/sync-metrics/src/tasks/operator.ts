/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { CountValidationsResult, TRINODB } from '@carrismetropolitana/api-services/TRINODB';

import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { getOperationalDay } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

/* * */

export default async () => {
	//

	LOGGER.init();

	const globalTimer = new TIMETRACKER();

	//
	// Setup TRINODB validations

	LOGGER.title('Processing validations by operator...');

	const operatorIds = ['41', '42', '43', '44'];

	const dateObject = DateTime.fromFormat(getOperationalDay(), 'yyyyLLdd').setZone('Europe/Lisbon');
	const startDateString = dateObject.set({ hour: 4, minute: 0, second: 0 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
	const endDateString = dateObject.plus({ day: 1 }).set({ hour: 3, minute: 59, second: 59 }).toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');

	const apexValidationStatuses = [0, 8];

	const validationFetchPromises = [];
	const validationsByDayArray = [];

	// For each operator, get the validations
	await Promise.all(operatorIds.map(async (operatorId) => {
		const result = TRINODB.countValidations({ 
			timeUnit: 'day',
			options: { 
				where: { 
					operator: { $in: [ operatorId ] },
					transactionDate: { $gte: startDateString, $lte: endDateString }, 
					validationStatus: { $in: apexValidationStatuses } 
				},
			},
		})

		LOGGER.info(`Adding operator ${operatorId} to the promises array...`);
		validationFetchPromises.push(result);
	}));

	const validations : CountValidationsResult[] = await Promise.all(validationFetchPromises);
	
	validations.forEach((validation, index) => {
		validationsByDayArray.push({ count: validation[0].count_result, date: DateTime.fromFormat(validation[0].transaction_time, 'yyyy-LL-dd').toFormat('yyyyLLdd'), operator: operatorIds[index] });
		LOGGER.info(`Operator ${operatorIds[index]} | Validations: ${validation[0].count_result}`);
	});

	console.log(validationsByDayArray);

	await Promise.all(validationsByDayArray.map(async (item) => {
		SERVERDB.set(`${SERVERDB_KEYS.METRICS.DEMAND.BY_OPERATOR}:${item.operator}:${item.date}`, JSON.stringify({
			end_date: endDateString,
			start_date: startDateString,
			timestamp: new Date().toISOString(),
			value: item.count,
		}));
	}));

	LOGGER.info(`Finished processing validations | ${globalTimer.get()}`);
	LOGGER.divider();

	//
};

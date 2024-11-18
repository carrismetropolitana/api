/* * */

import type { DemandMetricsByAgency, DemandMetricsByAgencyYear } from '@carrismetropolitana/api-types/metrics';

import { SERVERDB } from '@carrismetropolitana/api-services';
import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { getOperationalDay, sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

/* * */

const AGENCY_IDS = ['41', '42', '43', '44'];

const APEX_VALIDATION_STATUSES = [0, 4, 5, 6];

/* * */

export const syncDemandMetricsByAgencyYear = async () => {
	//

	LOGGER.title(`Sync Demand Metrics by Agency (Year)`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup up query date range

	const currentOperationalDay = getOperationalDay(DateTime.now().setZone('Europe/Lisbon').toFormat('yyyyLLdd'), 'yyyyLLdd');

	const startDateObject = DateTime.fromFormat(currentOperationalDay, 'yyyyLLdd').startOf('year').set({ hour: 4, minute: 0, second: 0 });
	const startDateString = startDateObject.toFormat('yyyy-LL-dd\'T\'HH\':\'mm\':\'ss');
	const startDateRawIso = startDateObject.toFormat('yyyyLLdd');

	//
	// For each agency, count validations by day

	const result: DemandMetricsByAgency[] = [];

	for (const agencyId of AGENCY_IDS) {
		//

		LOGGER.info(`Querying TRINODB for Agency ID ${agencyId} starting at ${startDateRawIso}...`);
		const countTimer = new TIMETRACKER();

		//
		// Setup up TRINODB query

		const queryOptions = {
			where: {
				operator: {
					$eq: agencyId,
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

		const validationsByDayCount = await TRINODB.countValidations({ options: queryOptions, timeUnit: 'month' });
		const validationsByDayArray: DemandMetricsByAgencyYear[] = validationsByDayCount
			.map((item) => {
				return {
					month_group: DateTime.fromFormat(item.transaction_time, 'yyyy-LL-dd HH:mm:ss.SSS').toFormat('yyyy-LL'),
					qty: item.count_result,
				};
			})
			.sort((a, b) => {
				return sortCollator.compare(a.month_group, b.month_group);
			});

		result.push({
			agency_id: agencyId,
			data: validationsByDayArray,
		});

		LOGGER.info(`Done querying for Agency ID ${agencyId} (${countTimer.get()})`);
	}

	//
	// Save to SERVERDB

	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.YEAR, JSON.stringify(result));

	LOGGER.terminate(`Sync Demand Metrics by Agency (Year) complete (${globalTimer.get()})`);

	//
};

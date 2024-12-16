/* * */

import type { DemandMetricsByAgency, DemandMetricsByAgencyDay, DemandMetricsByLine, DemandMetricsByStop } from '@carrismetropolitana/api-types/metrics';

import { SERVERDB } from '@carrismetropolitana/api-services';
import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { apexT11 } from '@tmlmobilidade/services/interfaces';
import { ALLOWED_VALIDATION_STATUSES, OPERATIONAL_DATE_FORMAT } from '@tmlmobilidade/services/types';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

export const demandMetricsStream = async () => {
	//

	LOGGER.title(`Demand Metrics (Stream)`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup up query date range

	const currentOperationalDate = getOperationalDate();

	const startDateObject = DateTime
		.now()
		.minus({ days: 15 })
		.set({ hour: 4, minute: 0, second: 0 })
		.toJSDate();

	//
	// Setup up query options

	const apexT11Collection = await apexT11.getCollection();

	const apexT11Stream = apexT11Collection.find({
		agency_id: { $in: ['41', '42', '43', '44'] },
		created_at: { $gte: startDateObject },
		validation_status: { $in: ALLOWED_VALIDATION_STATUSES },
	});

	//
	// Count validations

	const byAgencyDay = new Map<string, DemandMetricsByAgencyDay>();

	const byLine = new Map<string, DemandMetricsByLine>();
	const byStop = new Map<string, DemandMetricsByStop>();

	for await (const itemData of apexT11Stream) {
		//

		//
		// Extract main variables

		const dateObj = DateTime.fromJSDate(itemData.created_at);
		const dateObjHour = dateObj.hour;
		const dateObjDay = dateObj.day;
		const dateObjMonth = dateObj.month;
		const dateObjYear = dateObj.year;

		//
		// By Line

		const byLineKey = `${itemData.agency_id}_${dateObjHour}_${dateObjDay}_${dateObjMonth}_${dateObjYear}`;

		if (!byLine.has(byLineKey)) {
			byLine.set(byLineKey, {
				by_day: [],
				end_date: dateObj.toISO(),
				line_id: itemData.line_id,
				qty: 0,
				start_date: dateObj.toISO(),
			});
		}

		byAgencyDay.get(byAgencyDayKey).qty++;

		// //
		// // By Agency Day

		// const byAgencyDayKey = `${itemData.agency_id}_${dateObjHour}_${dateObjDay}_${dateObjMonth}_${dateObjYear}`;

		// if (!byAgencyDay.has(byAgencyDayKey)) {
		// 	byAgencyDay.set(byAgencyDayKey, {
		// 		hour_group: dateObj.toISO(),
		// 		qty: 0,
		// 	});
		// }

		// byAgencyDay.get(byAgencyDayKey).qty++;

		//
	}

	//
	// Setup up TRINODB query

	const validationsByDayCount = await TRINODB.countValidations({ options: queryOptions, timeUnit: 'hour' });
	const validationsByDayArray: DemandMetricsByAgencyDay[] = validationsByDayCount
		.map((item) => {
			return {
				hour_group: DateTime.fromFormat(item.transaction_time, 'yyyy-LL-dd HH:mm:ss.SSS').toISO(),
				qty: item.count_result,
			};
		})
		.sort((a, b) => {
			return sortCollator.compare(a.hour_group, b.hour_group);
		});

	result.push({
		agency_id: agencyId,
		data: validationsByDayArray,
	});

	LOGGER.info(`Done querying for Agency ID ${agencyId} (${countTimer.get()})`);

	//
	// Save to SERVERDB

	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.DAY, JSON.stringify(result));

	LOGGER.terminate(`Sync Demand Metrics by Agency (Day) complete (${globalTimer.get()})`);

	//
};

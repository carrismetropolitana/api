/* * */

import type { ServiceMetrics, ServiceMetricsSource } from '@carrismetropolitana/api-types/metrics';

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
// import { getOperationalDate } from '@tmlmobilidade/services/utils';
// import { DateTime } from 'luxon';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/refs/heads/latest/sla/sla.csv';

/* * */

export const serviceMetrics = async () => {
	//

	LOGGER.title(`Sync Service Metrics`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const downloadedSourceFile = await fetch(DATASET_FILE_URL);
	const downloadedSourceText = await downloadedSourceFile.text();
	const allSourceItems = Papa.parse<ServiceMetricsSource>(downloadedSourceText, { header: true });

	//
	// Fetch rides from 15 days ago

	// const fifteenDaysAgoDateObj = DateTime.now().minus({ days: 15 });
	// const fifteenDaysAgoOperationalDate = getOperationalDate(fifteenDaysAgoDateObj);

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	const allUpdatedItemsData: ServiceMetrics[] = [];

	for (const sourceItem of allSourceItems.data) {
		//

		const updatedItemData: ServiceMetrics = {
			agency_id: sourceItem.agency_id,
			line_id: sourceItem.line_id,
			operational_date: sourceItem.operational_date,
			pass_trip_count: Number(sourceItem.pass_trip_count),
			pass_trip_percentage: Number(sourceItem.pass_trip_percentage),
			total_trip_count: Number(sourceItem.total_trip_count),
		};

		allUpdatedItemsData.push(updatedItemData);

		//
	}

	//
	// Save items to the database

	allUpdatedItemsData.sort((a, b) => sortCollator.compare(a.operational_date, b.operational_date));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.SERVICE, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${allUpdatedItemsData.length} items to ${SERVERDB_KEYS.METRICS.SERVICE} (${globalTimer.get()}).`);

	//
};

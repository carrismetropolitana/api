/* * */

import { type ComplaintsMetadataSource } from '@/types/sources.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type ComplaintMetrics } from '@carrismetropolitana/api-types/metrics';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/refs/heads/latest/complaints/complaints.csv';

/* * */

export const complaintsMetrics = async () => {
	//

	LOGGER.title(`SYNC METADATA`);
	const globalTimer = new TIMETRACKER();
	LOGGER.title(`Starting sync of ${SERVERDB_KEYS.METRICS.COMPLAINTS}...`);

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const downloadedCsvFile = await fetch(DATASET_FILE_URL);
	const downloadedCsvText = await downloadedCsvFile.text();
	const allItemsCsv = Papa.parse<ComplaintsMetadataSource>(downloadedCsvText, { header: true });

	LOGGER.info(`Downloading existing complaints...`);

	const existingComplaintsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.COMPLAINTS) as string;
	const existingComplaintsData: ComplaintMetrics[] = JSON.parse(existingComplaintsTxt);

	const allComplaintsMap = new Map<string, ComplaintMetrics>();
	existingComplaintsData?.forEach(item => allComplaintsMap.set(`${item.type + '-' + item.filter_value}`, item));

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	let updatedItemsCounter = 0;
	const allItemsData: ComplaintMetrics[] = [];

	for (const itemCsv of allItemsCsv.data) {
		//
		const existingItemData = allComplaintsMap.get(`${itemCsv.type + '-' + itemCsv.filter_value}`);
		//
		const parsedItemMetadata: ComplaintMetrics = {
			_id: itemCsv.type + '-' + itemCsv.filter_value,
			complaints: Number(itemCsv.complaints),
			email: Number(itemCsv.email),
			filter_value: itemCsv.filter_value,
			info_requests: Number(itemCsv.info_requests),
			last_update: itemCsv.last_update,
			other: Number(itemCsv.other),
			phone: Number(itemCsv.phone),
			total: Number(itemCsv.total),
			type: itemCsv.type,
		};
		//
		const parsedItemData = existingItemData?.type ?? 0 > DateTime.now().minus({ seconds: 90 }).toUnixInteger() ? { ...existingItemData, ...parsedItemMetadata } : parsedItemMetadata;
		//
		allItemsData.push(parsedItemData);
		//
		updatedItemsCounter++;
		//
	}

	//
	// Save items to the database

	allItemsData.sort((a, b) => sortCollator.compare(`${a.type + '-' + a.filter_value}`, `${b.type + '-' + b.filter_value}`));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.COMPLAINTS, JSON.stringify(allItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.METRICS.COMPLAINTS} (${globalTimer.get()}).`);

	//
};

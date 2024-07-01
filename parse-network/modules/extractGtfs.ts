/* * */

import AdmZip from 'adm-zip';
import { BASE_DIR, GTFS_BASE_DIR, GTFS_RAW_DIR } from '../config/settings';

/* * */

export default async () => {
	//

	const filePath = `${BASE_DIR}/${GTFS_BASE_DIR}/gtfs.zip`;
	const extractedPath = `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}/`;

	// Extract archive to directory
	const zipArchive = new AdmZip(filePath);
	zipArchive.extractAllTo(extractedPath, true, false);
	console.log(`⤷ Extracted archive to "${extractedPath}" successfully.`);

	//
};
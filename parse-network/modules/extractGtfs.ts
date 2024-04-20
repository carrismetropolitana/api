/* * */

import AdmZip from 'adm-zip';
import { BASE_DIR, GTFS_BASE_DIR, GTFS_RAW_DIR } from '@/config/settings';

/* * */

export default async () => {
	//

	const filePath = `${BASE_DIR}/${GTFS_BASE_DIR}/gtfs.zip`;
	const extractedPath = `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}/`;

	// Extract archive to directory
	const zip = new AdmZip(filePath);
	zip.extractAllTo(extractedPath, true, false);
	console.log(`⤷ Extracted file to "${extractedPath}" successfully.`);

	//
};
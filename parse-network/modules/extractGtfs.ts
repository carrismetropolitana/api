/* * */

import { BASE_DIR, GTFS_BASE_DIR, GTFS_RAW_DIR } from '@/config/settings.js';
import extract from 'extract-zip';
import fs from 'node:fs';

/* * */

export default async () => {
	//

	const sourcePath = `${BASE_DIR}/${GTFS_BASE_DIR}/gtfs.zip`;
	const outputPath = `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}/`;

	//

	await extract(sourcePath, { dir: outputPath });

	setDirectoryPermissions(outputPath);

	//

	console.log(`⤷ Extracted archive to "${outputPath}" successfully.`);

	//
};

/* * */

const setDirectoryPermissions = (dirPath, mode = 0o666) => {
	const files = fs.readdirSync(dirPath, { withFileTypes: true });
	for (const file of files) {
		const filePath = `${dirPath}/${file.name}`;
		if (file.isDirectory()) {
			setDirectoryPermissions(filePath, mode);
		}
		else {
			fs.chmodSync(filePath, mode);
		}
	}
};

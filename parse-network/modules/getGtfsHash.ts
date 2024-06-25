/* * */

import { BASE_DIR, GTFS_BASE_DIR } from '@/config/settings.js';
import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';

/* * */

export default async () => {
	//
	const filePath = `${BASE_DIR}/${GTFS_BASE_DIR}/gtfs.zip`;

	// hash gtfs file
	const hash = crypto.createHash('sha1');
	const input = createReadStream(filePath);
	for await (const chunk of input) {
		hash.update(chunk);
	}

	return hash.digest('hex');
	//
};

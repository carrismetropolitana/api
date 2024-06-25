/* * */

import { BASE_DIR } from '@/config/settings.js';
import { mkdirSync, rmSync } from 'node:fs';

/* * */

export default async () => {
	//

	// Remove directory, if exists
	rmSync(BASE_DIR, { force: true, recursive: true });
	console.log(`⤷ Removed directory "${BASE_DIR}" successfully.`);

	// Create directory
	mkdirSync(BASE_DIR, { recursive: true });
	console.log(`⤷ Created directory "${BASE_DIR}" successfully.`);

	//
};

/* * */

import { rmSync, mkdirSync } from 'fs';
import { BASE_DIR } from '@/config/settings';

/* * */

export default async () => {
	//

	// Remove directory, if exists
	rmSync(BASE_DIR, { recursive: true, force: true });
	console.log(`⤷ Removed directory "${BASE_DIR}" successfully.`);

	// Create directory
	mkdirSync(BASE_DIR, { recursive: true });
	console.log(`⤷ Created directory "${BASE_DIR}" successfully.`);

	//
};
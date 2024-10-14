/* * */

import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';

/* * */

export default async (filePath) => {
	//

	const hash = crypto.createHash('sha1');
	const input = createReadStream(filePath);
	for await (const chunk of input) {
		hash.update(chunk);
	}

	return hash.digest('hex');

	//
};

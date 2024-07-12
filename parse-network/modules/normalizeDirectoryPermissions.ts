/* * */

import fs from 'node:fs';

/* * */

const normalizeDirectoryPermissions = (dirPath, mode = 0o666) => {
	const files = fs.readdirSync(dirPath, { withFileTypes: true });
	for (const file of files) {
		const filePath = `${dirPath}/${file.name}`;
		if (file.isDirectory()) {
			normalizeDirectoryPermissions(filePath, mode);
		}
		else {
			fs.chmodSync(filePath, mode);
		}
	}
};

/* * */

export default normalizeDirectoryPermissions;

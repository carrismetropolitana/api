/* * */

import fs from 'node:fs';
import Papa from 'papaparse';

/* * */

export default class CSVWRITER {
	//

	CURRENT_BATCH_DATA = [];

	CURRENT_BATCH_PATH = null;

	INSTANCE_NAME = 'Unnamed Instance';

	MAX_BATCH_SIZE = 100000;

	NEW_LINE_CHARACTER = '\n';

	/* * */

	constructor(instanceName, options = {}) {
		if (instanceName) {
			this.INSTANCE_NAME = instanceName;
		}
		if (options.new_line_character) {
			this.NEW_LINE_CHARACTER = options.new_line_character;
		}
		if (options.batch_size) {
			this.MAX_BATCH_SIZE = options.batch_size;
		}
	}

	/* * */

	async flush() {
		return new Promise((resolve, reject) => {
			try {
				if (!this.CURRENT_BATCH_PATH) {
					return resolve();
				}

				console.log(`> CSVWRITER [${this.INSTANCE_NAME}]: Flush Request | Length: ${this.CURRENT_BATCH_DATA.length} | File: ${this.CURRENT_BATCH_PATH}`);

				// Setup a variable to keep track if the file exists or not
				let fileAlreadyExists = true;
				// Try to access the file and append data to it
				fs.access(this.CURRENT_BATCH_PATH, fs.constants.F_OK, async (error) => {
					// If an error is thrown, then the file does not exist
					if (error) {
						fileAlreadyExists = false;
					}
					// Use papaparse to produce the CSV string
					let csvData = Papa.unparse(this.CURRENT_BATCH_DATA, { header: !fileAlreadyExists, newline: this.NEW_LINE_CHARACTER, skipEmptyLines: 'greedy' });
					// Prepend a new line character to csvData string if it is not the first line on the file
					if (fileAlreadyExists) {
						csvData = this.NEW_LINE_CHARACTER + csvData;
					}
					// Append the csv string to the file
					fs.appendFile(this.CURRENT_BATCH_PATH, csvData, (appendErr) => {
						if (appendErr) {
							reject(new Error(`Error appending data to file: ${appendErr.message}`));
						}
						else {
							this.CURRENT_BATCH_DATA = [];
							resolve();
						}
					});
				});
			}
			catch (error) {
				reject(new Error(`Error at flush(): ${error.message}`));
			}
		});
	}

	/* * */

	async write(workdir, filename, data) {
		// Check if the batch workdir is the same of the current operation
		if (this.CURRENT_BATCH_PATH !== `${workdir}/${filename}`) {
			await this.flush();
		}

		// Check if the batch is full
		if (this.CURRENT_BATCH_DATA.length >= this.MAX_BATCH_SIZE) {
			await this.flush();
		}

		// Set the working dir
		this.CURRENT_BATCH_PATH = `${workdir}/${filename}`;
		// Add the data to the batch
		if (Array.isArray(data)) {
			this.CURRENT_BATCH_DATA = [
				...this.CURRENT_BATCH_DATA, ...data,
			];
		}
		else { this.CURRENT_BATCH_DATA.push(data); }

		//
	}

	//
}

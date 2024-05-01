/* * */

import fs from 'fs';
import Papa from 'papaparse';

/* * */

export default class CSVWRITER {
	//

	INSTANCE_NAME = 'Unnamed Instance';

	NEW_LINE_CHARACTER = '\n';

	MAX_BATCH_SIZE = 100000;

	CURRENT_BATCH_PATH = null;

	CURRENT_BATCH_DATA = [];

	/* * */

	constructor(instanceName, options = {}) {
		if (instanceName) this.INSTANCE_NAME = instanceName;
		if (options.new_line_character) this.NEW_LINE_CHARACTER = options.new_line_character;
		if (options.batch_size) this.MAX_BATCH_SIZE = options.batch_size;
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
			this.CURRENT_BATCH_DATA = [...this.CURRENT_BATCH_DATA, ...data];
		} else {
			this.CURRENT_BATCH_DATA.push(data);
		}
		//
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
					if (error) fileAlreadyExists = false;
					// Use papaparse to produce the CSV string
					let csvData = Papa.unparse(this.CURRENT_BATCH_DATA, { skipEmptyLines: 'greedy', newline: this.NEW_LINE_CHARACTER, header: !fileAlreadyExists });
					// Prepend a new line character to csvData string if it is not the first line on the file
					if (fileAlreadyExists) csvData = this.NEW_LINE_CHARACTER + csvData;
					// Append the csv string to the file
					fs.appendFile(this.CURRENT_BATCH_PATH, csvData, (appendErr) => {
						if (appendErr) {
							reject(`Error appending data to file: ${appendErr.message}`);
						} else {
							this.CURRENT_BATCH_DATA = [];
							resolve();
						}
					});
				});
			} catch (error) {
				reject(`Error at flush(): ${error.message}`);
			}
		});
	}

	//
}
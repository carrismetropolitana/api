/* * */

import pg from 'pg';
const { Client } = pg;

const { NETWORKDB_HOST, NETWORKDB_PASSWORD, NETWORKDB_USER } = process.env;

/* * */

class NETWORKDB {
	//

	client = null;

	async connect() {
		this.client = new Client({
			connectionTimeoutMillis: 10000,
			database: NETWORKDB_USER,
			host: NETWORKDB_HOST,
			password: NETWORKDB_PASSWORD,
			user: NETWORKDB_USER,
		});
		await this.client.connect();
		console.log(`⤷ Connected to NETWORKDB.`);
	}

	async disconnect() {
		await this.client.end();
		this.client = null;
		console.log(`⤷ Disconnected from NETWORKDB.`);
	}

	//
}

/* * */

const networkdb = new NETWORKDB();

/* * */

export default networkdb;

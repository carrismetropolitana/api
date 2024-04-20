/* * */

import { Client } from 'pg';
const { NETWORKDB_HOST, NETWORKDB_USER, NETWORKDB_PASSWORD } = process.env;

/* * */

class NETWORKDB {
	//

	client: Client;

	async connect() {
		this.client = new Client({
			host: NETWORKDB_HOST,
			user: NETWORKDB_USER,
			database: NETWORKDB_USER,
			password: NETWORKDB_PASSWORD,
			connectionTimeoutMillis: 10000,
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

const networkdb = new NETWORKDB;

/* * */

export default networkdb;
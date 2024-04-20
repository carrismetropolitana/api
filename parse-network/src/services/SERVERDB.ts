/* * */

import { RedisClientType, createClient } from '@redis/client';
const { SERVERDB_HOST } = process.env;

/* * */

class SERVERDB {
	//

	client: RedisClientType;

	async connect() {
		this.client = createClient({ socket: { host: SERVERDB_HOST } });
		await this.client.connect();
		console.log(`⤷ Connected to SERVERDB.`);
	}

	async disconnect() {
		await this.client.disconnect();
		this.client = null;
		console.log(`⤷ Disconnected from SERVERDB.`);
	}

	//
}

/* * */

const serverdb = new SERVERDB;

/* * */

export default serverdb;
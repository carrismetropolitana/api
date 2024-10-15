/* * */

import * as redis from 'redis';

/* * */

class SERVERDBClass {
	//
	public readonly client: redis.RedisClientType;

	constructor() {
		this.client = redis.createClient({ socket: { host: process.env.SERVERDB_HOST, port: Number(process.env.SERVERDB_PORT) } });
		this.client.on('error', err => console.log('Redis Client Error', err));
	}

	async connect() {
		try {
			await this.client.connect();
			console.log(`⤷ Connected to SERVERDB.`);
		}
		catch (err) {
			console.log(`⤷ ERROR: Failed to connect to SERVERDB.`, err);
		}
	}

	async disconnect() {
		try {
			await this.client.disconnect();
			console.log(`⤷ Disconnected from SERVERDB.`);
		}
		catch (err) {
			console.log(`⤷ ERROR: Failed to disconnect from SERVERDB.`, err);
		}
	}

	//
}

export const SERVERDB = new SERVERDBClass();

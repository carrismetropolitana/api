/* * */

import { createClient } from 'redis';
const { SERVERDB_HOST } = process.env;

/* * */

export const client = createClient({ socket: { host: SERVERDB_HOST } });

export async function connect() {
	try {
		await client.connect();
		console.log(`⤷ Connected to SERVERDB.`);
	} catch (err) {
		console.log(`⤷ ERROR: Failed to connect to SERVERDB.`, err);
	}
}

export async function disconnect() {
	try {
		await client.disconnect();
		console.log(`⤷ Disconnected from SERVERDB.`);
	} catch (err) {
		console.log(`⤷ ERROR: Failed to disconnect from SERVERDB.`, err);
	}
}

export default {
	connect,
	disconnect,
	client,
};
/* * */

import { Client } from 'pg';
const { NETWORKDB_HOST, NETWORKDB_USER, NETWORKDB_PASSWORD } = process.env;

/* * */

export const connection = new Client({
	host: NETWORKDB_HOST,
	user: NETWORKDB_USER,
	database: NETWORKDB_USER,
	password: NETWORKDB_PASSWORD,
	connectionTimeoutMillis: 10000,
});

export async function connect() {
	connection.connect();
	console.log(`⤷ Connected to NETWORKDB.`);
}

export async function disconnect() {
	await connection.end();
	console.log(`⤷ Disconnected from NETWORKDB.`);
}

/* * */

export default {
	connect,
	disconnect,
	connection,
};
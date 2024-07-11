/* * */

import pg from 'pg';
const { Client } = pg;

const { NETWORKDB_HOST, NETWORKDB_PASSWORD, NETWORKDB_USER } = process.env;

/* * */

const client = new Client({
	connectionTimeoutMillis: 10000,
	database: NETWORKDB_USER,
	host: NETWORKDB_HOST,
	password: NETWORKDB_PASSWORD,
	user: NETWORKDB_USER,
});

async function connect() {
	await client.connect();
	console.log(`⤷ Connected to NETWORKDB.`);
}

async function disconnect() {
	await client.end();
	console.log(`⤷ Disconnected from NETWORKDB.`);
}

/* * */

const networkdb = {
	client,
	connect,
	disconnect,
};

/* * */

export default networkdb;

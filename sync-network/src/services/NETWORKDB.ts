/* * */

import LOGGER from '@helperkits/logger';
import pg from 'pg';

/* * */

const client = new pg.Client({
	connectionTimeoutMillis: 10000,
	database: process.env.NETWORKDB_USER,
	host: process.env.NETWORKDB_HOST,
	password: process.env.NETWORKDB_PASSWORD,
	user: process.env.NETWORKDB_USER,
});

async function connect() {
	await client.connect();
	LOGGER.success('Connected to NETWORKDB');
}

async function disconnect() {
	await client.end();
	LOGGER.success('Disconnected from NETWORKDB');
}

/* * */

const networkdb = {
	client,
	connect,
	disconnect,
};

/* * */

export default networkdb;

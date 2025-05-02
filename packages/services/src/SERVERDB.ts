/* * */

import redis from 'redis';

/* * */

export const SERVERDB = await redis
	.createClient({ socket: { host: process.env.SERVERDB_HOST, port: Number(process.env.SERVERDB_PORT) } })
	.on('error', err => console.log('Redis Client Error', err))
	.connect();

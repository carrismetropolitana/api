/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const byDay = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2/metrics/demand/by_day');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byLine = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2/metrics/demand/by_line');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byStop = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2/metrics/demand/by_stop');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

/* * */

FASTIFY.server.get('/metrics/demand/by_day', byDay);
FASTIFY.server.get('/metrics/demand/by_line', byLine);
FASTIFY.server.get('/metrics/demand/by_stop', byStop);

FASTIFY.server.get('/v2/metrics/demand/by_day', byDay);
FASTIFY.server.get('/v2/metrics/demand/by_line', byLine);
FASTIFY.server.get('/v2/metrics/demand/by_stop', byStop);

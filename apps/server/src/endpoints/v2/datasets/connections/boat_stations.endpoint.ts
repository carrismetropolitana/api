/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.get(`${SERVERDB_KEYS.DATASETS.CONNECTIONS_BOAT_STATIONS}:all`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.get(`${SERVERDB_KEYS.DATASETS.CONNECTIONS_BOAT_STATIONS}:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/datasets/connections/boat_stations', all);
FASTIFY.server.get('/datasets/connections/boat_stations/:id', single);

FASTIFY.server.get('/v1/datasets/connections/boat_stations', all);
FASTIFY.server.get('/v1/datasets/connections/boat_stations/:id', single);

FASTIFY.server.get('/v2/datasets/connections/boat_stations', all);
FASTIFY.server.get('/v2/datasets/connections/boat_stations/:id', single);

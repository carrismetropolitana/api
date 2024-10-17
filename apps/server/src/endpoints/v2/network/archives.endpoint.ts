/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.get(`${SERVERDB_KEYS.NETWORK.ARCHIVES}:all`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.get(`${SERVERDB_KEYS.NETWORK.ARCHIVES}:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/archives', all);
FASTIFY.server.get('/archives/:id', single);

FASTIFY.server.get('/v1/archives', all);
FASTIFY.server.get('/v1/archives/:id', single);

FASTIFY.server.get('/v2/archives', all);
FASTIFY.server.get('/v2/archives/:id', single);

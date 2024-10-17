/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.get(`${SERVERDB_KEYS.NETWORK.LOCALITIES}:all`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.get(`${SERVERDB_KEYS.NETWORK.LOCALITIES}:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/localities', all);
FASTIFY.server.get('/localities/:id', single);

FASTIFY.server.get('/v1/localities', all);
FASTIFY.server.get('/v1/localities/:id', single);

FASTIFY.server.get('/v2/localities', all);
FASTIFY.server.get('/v2/localities/:id', single);

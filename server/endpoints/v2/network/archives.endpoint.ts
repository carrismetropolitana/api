/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:network:archives:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

/* * */

FASTIFY.server.get('/archives', all);

FASTIFY.server.get('/v1/archives', all);

FASTIFY.server.get('/v2/archives', all);

/* * */

import FASTIFY from '@/services/FASTIFY.js';
import { SERVERDB } from '@api/services';


/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:pip:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:pip:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/v2/pip', all);
FASTIFY.server.get('/v2/pip/:id', single);

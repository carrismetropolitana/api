/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';


/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.get('v2:network:periods:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

/* * */

FASTIFY.server.get('/periods', all);

FASTIFY.server.get('/v1/periods', all);

FASTIFY.server.get('/v2/periods', all);

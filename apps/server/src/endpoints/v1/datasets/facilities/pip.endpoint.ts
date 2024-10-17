/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { FASTIFY } from '@/services/FASTIFY.js';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.get('datasets/facilities/pip/all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.get(`datasets/facilities/pip/${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/datasets/facilities/pip', all);
FASTIFY.server.get('/datasets/facilities/pip/:id', single);

FASTIFY.server.get('/v1/datasets/facilities/pip', all);
FASTIFY.server.get('/v1/datasets/facilities/pip/:id', single);

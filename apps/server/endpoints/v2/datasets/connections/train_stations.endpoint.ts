/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@api/services';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:datasets:connections:train_stations:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:datasets:connections:train_stations:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/datasets/connections/train_stations', all);
FASTIFY.server.get('/datasets/connections/train_stations/:id', single);

FASTIFY.server.get('/v1/datasets/connections/train_stations', all);
FASTIFY.server.get('/v1/datasets/connections/train_stations/:id', single);

FASTIFY.server.get('/v2/datasets/connections/train_stations', all);
FASTIFY.server.get('/v2/datasets/connections/train_stations/:id', single);

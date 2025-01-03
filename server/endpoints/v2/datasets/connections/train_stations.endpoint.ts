/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

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

FASTIFY.registerRoutePlugin('GET', '/datasets/connections/train_stations', all);
FASTIFY.registerRoutePlugin('GET', '/datasets/connections/train_stations/:id', single);

FASTIFY.registerRoutePlugin('GET', '/v1/datasets/connections/train_stations', all);
FASTIFY.registerRoutePlugin('GET', '/v1/datasets/connections/train_stations/:id', single);

FASTIFY.registerRoutePlugin('GET', '/v2/datasets/connections/train_stations', all, {
	schema: {
		tags: ['datasets'],
		summary: 'Get all train stations',
		description: 'Get all train stations',
	},
});
FASTIFY.registerRoutePlugin('GET', '/v2/datasets/connections/train_stations/:id', single, {
	schema: {
		tags: ['datasets'],
		summary: 'Get a single train station',
		description: 'Get a single train station by ID',
		params: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'The train station ID',
				},
			},
		},
	},
});

/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:datasets:connections:subway_stations:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:datasets:connections:subway_stations:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.registerRoutePlugin('GET', '/datasets/connections/subway_stations', all);
FASTIFY.registerRoutePlugin('GET', '/datasets/connections/subway_stations/:id', single);

FASTIFY.registerRoutePlugin('GET', '/v1/datasets/connections/subway_stations', all);
FASTIFY.registerRoutePlugin('GET', '/v1/datasets/connections/subway_stations/:id', single);

FASTIFY.registerRoutePlugin('GET', '/v2/datasets/connections/subway_stations', all, {
	schema: {
		tags: ['datasets'],
		summary: 'Get all subway stations',
		description: 'Get all subway stations',
	},
});
FASTIFY.registerRoutePlugin('GET', '/v2/datasets/connections/subway_stations/:id', single, {
	schema: {
		tags: ['datasets'],
		summary: 'Get a single subway station',
		description: 'Get a single subway station by ID',
		params: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'The subway station ID',
				},
			},
		},
	},
});
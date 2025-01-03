/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:datasets:facilities:schools:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:datasets:facilities:schools:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.registerRoutePlugin('GET', '/datasets/facilities/schools', all);
FASTIFY.registerRoutePlugin('GET', '/datasets/facilities/schools/:id', single);

FASTIFY.registerRoutePlugin('GET', '/v1/datasets/facilities/schools', all);
FASTIFY.registerRoutePlugin('GET', '/v1/datasets/facilities/schools/:id', single);

FASTIFY.registerRoutePlugin('GET', '/v2/datasets/facilities/schools', all, {
	schema: {
		tags: ['datasets'],
		summary: 'Get all schools',
		description: 'Get all schools',
	},
});
FASTIFY.registerRoutePlugin('GET', '/v2/datasets/facilities/schools/:id', single, {
	schema: {
		tags: ['datasets'],
		summary: 'Get a single school',
		description: 'Get a single school by ID',
		params: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'The school ID',
				},
			},
		},
	},
});
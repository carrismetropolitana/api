/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:datasets:facilities:encm:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:datasets:facilities:encm:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.registerRoutePlugin('GET', '/datasets/facilities/encm', all);
FASTIFY.registerRoutePlugin('GET', '/datasets/facilities/encm/:id', single);

FASTIFY.registerRoutePlugin('GET', '/v1/datasets/facilities/encm', all);
FASTIFY.registerRoutePlugin('GET', '/v1/datasets/facilities/encm/:id', single);

FASTIFY.registerRoutePlugin('GET', '/v2/datasets/facilities/encm', all, {
	schema: {
		tags: ['datasets'],
		summary: 'Get all ENCM facilities',
		description: 'Get all ENCM facilities',
	},
});
FASTIFY.registerRoutePlugin('GET', '/v2/datasets/facilities/encm/:id', single, {
	schema: {
		tags: ['datasets'],
		summary: 'Get a single ENCM facility',
		description: 'Get a single ENCM facility by ID',
		params: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					description: 'The ENCM facility ID',
				},
			},
		},
	},
});
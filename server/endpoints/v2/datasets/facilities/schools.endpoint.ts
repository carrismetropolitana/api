/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	reply.code(307).redirect('https://api.carrismetropolitana.pt/v2/facilities/schools');
};

const single = async (request, reply) => {
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send({ deprecated: true, new_endpoint: "https://api.carrismetropolitana.pt/v2/facilities/schools"});
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
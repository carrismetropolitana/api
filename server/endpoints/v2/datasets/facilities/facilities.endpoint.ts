/* * */

import FASTIFY from '@/services/FASTIFY.js';

const AVAILABLE_FACILITIES = ['schools', 'encm'];

/* * */

const all = async (_, reply) => {
	return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(AVAILABLE_FACILITIES));
};

/* * */

FASTIFY.registerRoutePlugin('GET', '/datasets/facilities', all);

FASTIFY.registerRoutePlugin('GET', '/v1/datasets/facilities', all);

FASTIFY.registerRoutePlugin('GET', '/v2/datasets/facilities', all, {
	schema: {
		tags: ['datasets'],
		summary: 'Get all facilitiy types',
		description: 'Get all facility types',
	},
});
/* * */

import { FASTIFY } from '@/services/FASTIFY.js';

const AVAILABLE_FACILITIES = ['schools', 'encm'];

/* * */

const all = async (_, reply) => {
	return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(AVAILABLE_FACILITIES));
};

/* * */

FASTIFY.server.get('/datasets/facilities', all);

FASTIFY.server.get('/v1/datasets/facilities', all);

FASTIFY.server.get('/v2/datasets/facilities', all);

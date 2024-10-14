/* * */

import FASTIFY from '@/services/FASTIFY.js';

/* * */

const main = async (_, reply) => {
	reply.code(302).redirect(new URL(process.env.GTFS_URL).href);
};

/* * */

FASTIFY.server.get('/gtfs', main);

FASTIFY.server.get('/v1/gtfs', main);

FASTIFY.server.get('/v2/gtfs', main);

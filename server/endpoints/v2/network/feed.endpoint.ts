/* * */

import FASTIFY from '@/services/FASTIFY.js';

/* * */

const main = async (_, reply) => {
	reply.code(307).redirect(`https://api.carrismetropolitana.pt/v2/gtfs`);
};

/* * */

FASTIFY.server.get('/gtfs', main);

FASTIFY.server.get('/v1/gtfs', main);

FASTIFY.server.get('/v2/gtfs', main);

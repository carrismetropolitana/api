/* * */

import FASTIFY from '@/services/FASTIFY.js';

/* * */

const main = async (_, reply) => {
	reply.code(302).redirect(new URL(process.env.GTFS_URL).href);
	// const gtfsFeedResponse = await fetch(process.env.GTFS_URL);
	// return reply
	// 	.code(200)
	// 	.header('Content-Type', 'application/zip')
	// 	.header('Content-Disposition', 'attachment; filename="CarrisMetropolitana.zip"')
	// 	.send(gtfsFeedResponse || null);
};

/* * */

FASTIFY.server.get('/gtfs', main);

FASTIFY.server.get('/v1/gtfs', main);

FASTIFY.server.get('/v2/gtfs', main);

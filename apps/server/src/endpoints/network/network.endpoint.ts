/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

FASTIFY.GET('/gtfs', async (_, reply) => {
	return reply.code(302).redirect(new URL(process.env.GTFS_URL).href);
});

FASTIFY.GET('/archives', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.ARCHIVES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/dates', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.DATES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/periods', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.PERIODS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/stops', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.STOPS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/lines', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.LINES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/routes', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.ROUTES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

FASTIFY.server.get('/gtfs', async (_, reply) => {
	return reply.code(302).redirect(new URL(process.env.GTFS_URL).href);
});

FASTIFY.server.get('/archives', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.ARCHIVES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/dates', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.DATES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/periods', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.PERIODS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/stops', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.STOPS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/lines', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.LINES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/routes', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.ROUTES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

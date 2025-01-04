/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

FASTIFY.GET('/locations/localities', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.LOCALIITIES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/locations/parishes', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.PARISHES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/locations/municipalities', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.MUNICIPALITIES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/locations/districts', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.DISTRICTS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/locations/regions', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.REGIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

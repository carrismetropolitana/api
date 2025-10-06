/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

FASTIFY.GET('/metrics/alerts', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.ALERTS.ALL);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=300')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/alerts/summary', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.ALERTS.SUMMARY);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=300')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/alerts/cause-effect', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.ALERTS.CAUSE_EFFECT);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=300')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/alerts/evolution', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.ALERTS.EVOLUTION);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=300')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/alerts/by-municipality', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.ALERTS.BY_MUNICIPALITY);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=300')
		.send(allItemsTxt);
});

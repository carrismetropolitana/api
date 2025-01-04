/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

FASTIFY.GET('/metrics/demand/by_agency/day', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.DAY);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=300')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/demand/by_agency/month', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.MONTH);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/demand/by_agency/year', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.YEAR);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

/* * */

FASTIFY.GET('/metrics/demand/by_line', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_LINE);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=300')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/demand/by_stop', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_STOP);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=300')
		.send(allItemsTxt);
});

/* * */

FASTIFY.GET('/metrics/service/all', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.SERVICE);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

/* * */

FASTIFY.GET('/metrics/videowall/delays', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.VIDEOWALL.DELAYS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=60')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/videowall/empty-rides', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.VIDEOWALL.EMPTY_RIDES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=60')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/videowall/sla', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.VIDEOWALL.SLA);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=60')
		.send(allItemsTxt);
});

FASTIFY.GET('/metrics/videowall/validations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.VIDEOWALL.VALIDATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=60')
		.send(allItemsTxt);
});

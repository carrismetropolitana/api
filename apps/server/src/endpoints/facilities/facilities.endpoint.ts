/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { SchoolSchema } from '@carrismetropolitana/api-types/facilities';

/* * */

FASTIFY.route({
	handler: async (_, reply) => {
		return reply.code(200).send({
			available_facilities: [
				'stores',
				'helpdesks',
				'schools',
				'boat_stations',
				'light_rail_stations',
				'subway_stations',
				'train_stations',
			],
		});
	},
	method: 'GET',
	schema: {
		description: 'Get all ENCM facilities',
		response: {
			200: SchoolSchema.array(),
		},
		summary: 'Get all ENCM facilities',
		tags: ['datasets'],
	},
	url: '/facilities',
});

/* * */

FASTIFY.GET('/facilities/stores', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.STORES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=30')
		.send(allItemsTxt);
}, {
	schema: {
		description: 'Test Type cast',
		summary: 'Test Type cast',
		tags: ['datasets'],
	},
});

FASTIFY.GET('/facilities/helpdesks', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.HELPDESKS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/facilities/schools', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.SCHOOLS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/facilities/boat_stations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.BOAT_STATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/facilities/light_rail_stations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.LIGHT_RAIL_STATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/facilities/subway_stations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.SUBWAY_STATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/facilities/train_stations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.TRAIN_STATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

FASTIFY.GET('/facilities/pips', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.PIPS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
});

/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

FASTIFY.server.get('/facilities', async (_, reply) => {
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
});

/* * */

FASTIFY.server.get('/facilities/stores', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.STORES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/facilities/helpdesks', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.HELPDESKS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/facilities/schools', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.SCHOOLS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/facilities/boat_stations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.BOAT_STATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/facilities/light_rail_stations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.LIGHT_RAIL_STATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/facilities/subway_stations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.SUBWAY_STATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/facilities/train_stations', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.TRAIN_STATIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/facilities/pips', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.PIPS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

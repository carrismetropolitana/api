/* * */

import FASTIFY from '@/services/FASTIFY.js';
import { SERVERDB } from '@api/services';

import protobufjs from 'protobufjs';

/* * */

const gtfsRealtime = protobufjs.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

/* * */

const json = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:network:alerts:json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

/* * */

const protobuf = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:network:alerts:protobuf');
	const allAlerts = JSON.parse(allItems);
	const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
	const message = FeedMessage.fromObject(allAlerts);
	const buffer = FeedMessage.encode(message).finish();
	return reply.send(buffer);
};

/* * */

FASTIFY.server.get('/v2/alerts', json);
FASTIFY.server.get('/v2/alerts.pb', protobuf);

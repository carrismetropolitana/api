/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@api/services';
import protobufjs from 'protobufjs';

/* * */

const gtfsRealtime = protobufjs.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

/* * */

const json = async (_, reply) => {
	const allRtEvents = await SERVERDB.client.get('v2:network:vehicles:json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allRtEvents || []);
};

/* * */

const protobuf = async (_, reply) => {
	// Get the saved events from RTEVENTS
	const allRtEventsTxt = await SERVERDB.client.get('v2:network:vehicles:protobuf');
	const allRtEvents = await JSON.parse(allRtEventsTxt);
	// Do the conversion to Protobuf
	const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
	const message = FeedMessage.fromObject(allRtEvents);
	const buffer = FeedMessage.encode(message).finish();
	return reply.send(buffer);
};

/* * */

FASTIFY.server.get('/vehicles', json);
FASTIFY.server.get('/vehicles.pb', protobuf);

FASTIFY.server.get('/v1/vehicles', json);
FASTIFY.server.get('/v1/vehicles.pb', protobuf);

FASTIFY.server.get('/v2/vehicles', json);
FASTIFY.server.get('/v2/vehicles.pb', protobuf);

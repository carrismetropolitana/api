/* * */

import RTEVENTS from '@/services/RTEVENTS.js';
import SERVERDB from '@/services/SERVERDB.js';
import protobufjs from 'protobufjs';

/* * */

const gtfsRealtime = protobufjs.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

/* * */

const json = async (_, reply) => {
	// Get the saved events from RTEVENTS
	// const rtFeed = await RTEVENTS.json();
	const rtFeed = await SERVERDB.client.get('rtevents:json');
	// Return response
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(rtFeed || []);
};

/* * */

const protobuf = async (_, reply) => {
	// Get the saved events from RTEVENTS
	// const rtFeed = await RTEVENTS.protobuf();
	const rtFeedTxt = await SERVERDB.client.get('rtevents:protobuf');
	const rtFeedJson = await JSON.parse(rtFeedTxt);
	// Do the conversion to PB
	const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
	const message = FeedMessage.fromObject(rtFeedJson);
	const buffer = FeedMessage.encode(message).finish();
	return reply.send(buffer);
};

/* * */

export default {
	json,
	protobuf,
};

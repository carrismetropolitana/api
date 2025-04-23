/* * */

import FASTIFY from '@/services/FASTIFY.js';
// import protobufjs from 'protobufjs';

/* * */

// const gtfsRealtime = protobufjs.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

/* * */

// const json = async (_, reply) => {
// 	const allAlertsResponse = await fetch('https://backoffice.carrismetropolitana.pt/?api=alerts-v2');
// 	const allAlerts = await allAlertsResponse.json();
// 	return reply
// 		.code(200)
// 		.header('Content-Type', 'application/json; charset=utf-8')
// 		.send(allAlerts || []);
// };

/* * */

// const protobuf = async (_, reply) => {
// 	const allAlertsResponse = await fetch('https://backoffice.carrismetropolitana.pt/?api=alerts-v2');
// 	const allAlerts = await allAlertsResponse.json();
// 	const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
// 	const message = FeedMessage.fromObject(allAlerts);
// 	const buffer = FeedMessage.encode(message).finish();
// 	return reply.send(buffer);
// };

/* * */

const redirectToNewAlertsEndpoint = async (_, reply) => {
	reply.code(307).redirect(`https://api.carrismetropolitana.pt/v2/alerts`);
};

const redirectToNewAlertsPbEndpoint = async (_, reply) => {
	reply.code(307).redirect(`https://api.carrismetropolitana.pt/v2/alerts.pb`);
};

/* * */

FASTIFY.server.get('/alerts', redirectToNewAlertsEndpoint);
FASTIFY.server.get('/alerts.pb', redirectToNewAlertsPbEndpoint);

FASTIFY.server.get('/v1/alerts', redirectToNewAlertsEndpoint);
FASTIFY.server.get('/v1/alerts.pb', redirectToNewAlertsPbEndpoint);

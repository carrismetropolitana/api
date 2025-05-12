/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const json = async (_, reply) => {
	const allRtEvents = await SERVERDB.client.get('v2:network:vehicles:json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allRtEvents || []);
};

/* * */

const redirectToNewVehiclesPbEndpoint = async (_, reply) => {
	reply.code(307).redirect(`https://api.carrismetropolitana.pt/v2/vehicles.pb`);
};

/* * */

FASTIFY.server.get('/vehicles', json);
FASTIFY.server.get('/vehicles.pb', redirectToNewVehiclesPbEndpoint);

FASTIFY.server.get('/v1/vehicles', json);
FASTIFY.server.get('/v1/vehicles.pb', redirectToNewVehiclesPbEndpoint);

FASTIFY.server.get('/v2/vehicles', json);
FASTIFY.server.get('/v2/vehicles.pb', redirectToNewVehiclesPbEndpoint);
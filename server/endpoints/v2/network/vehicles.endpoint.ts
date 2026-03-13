/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const redirectToNewVehiclesEndpoint = async (_, reply) => {
	reply.code(307).redirect(`https://api.carrismetropolitana.pt/v2/vehicles`);
};

const redirectToNewVehiclesPbEndpoint = async (_, reply) => {
	reply.code(307).redirect(`https://api.carrismetropolitana.pt/v2/vehicles.pb`);
};

/* * */

FASTIFY.server.get('/vehicles', redirectToNewVehiclesEndpoint);
FASTIFY.server.get('/vehicles.pb', redirectToNewVehiclesPbEndpoint);

FASTIFY.server.get('/v1/vehicles', redirectToNewVehiclesEndpoint);
FASTIFY.server.get('/v1/vehicles.pb', redirectToNewVehiclesPbEndpoint);

FASTIFY.server.get('/v2/vehicles', redirectToNewVehiclesEndpoint);
FASTIFY.server.get('/v2/vehicles.pb', redirectToNewVehiclesPbEndpoint);
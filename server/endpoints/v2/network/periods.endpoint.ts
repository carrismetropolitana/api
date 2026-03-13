/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const redirectToNewPeriodsEndpoint = async (_, reply) => {
	reply.code(307).redirect(`https://api.carrismetropolitana.pt/v2/periods`);
};

/* * */

FASTIFY.server.get('/periods', redirectToNewPeriodsEndpoint);

FASTIFY.server.get('/v1/periods', redirectToNewPeriodsEndpoint);

FASTIFY.server.get('/v2/periods', redirectToNewPeriodsEndpoint);

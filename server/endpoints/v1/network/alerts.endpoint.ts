/* * */

import FASTIFY from '@/services/FASTIFY.js';

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

FASTIFY.server.get('/v2/alerts', redirectToNewAlertsEndpoint);
FASTIFY.server.get('/v2/alerts.pb', redirectToNewAlertsPbEndpoint);
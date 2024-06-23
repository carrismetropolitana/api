/* * */

import Fastify from 'fastify';

/* * */

import horariosHandler from '@/handlers/horarios.handler.js';
import pipHandler from '@/handlers/pip.handler.js';

/* * */

const fastify = Fastify({ logger: true, requestTimeout: 10000 });

/* * */

fastify.get('/pip/:id', pipHandler);
fastify.get('/horarios/:line_id/:direction_id/:stop_id', horariosHandler);

/* * */

fastify.listen({ host: '0.0.0.0', port: 5050 }, async (err, address) => {
	if (err) throw err;
	console.log(`Server listening on ${address}`);
});

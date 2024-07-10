/* * */

import fastify from 'fastify';

/* * */

import horariosHandler from '@/handlers/horarios.handler.js';
import pipHandler from '@/handlers/pip.handler.js';

/* * */

const server = fastify({ logger: true, requestTimeout: 10000 });

/* * */

server.get('/pip/:id', pipHandler);
server.get('/horarios/:line_id/:direction_id/:stop_id', horariosHandler);

/* * */

server.listen({ host: '0.0.0.0', port: 5050 }, async (err, address) => {
	if (err) throw err;
	console.log(`Server listening on ${address}`);
});

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

server.get('/accao-app-2024', async (_, reply) => reply.redirect(`https://www.carrismetropolitana.pt/viagemvirtual`));

server.get('/app-install-cmm', async (_, reply) => reply.redirect(`https://alpha.carrismetropolitana.pt/app`));

/* * */

server.listen({ host: '0.0.0.0', port: 5050 }, async (err, address) => {
	if (err) throw err;
	console.log(`Server listening on ${address}`);
});

/* * */

import { FASTIFY } from '@/services/FASTIFY.js';

/* * */

FASTIFY.server.get('/status/message', async (_, reply) => {
	return reply.code(200).send(
		JSON.stringify({
			body: 'Estamos a desenvolver todos os esforços para resolver a situação. Obrigado pela sua compreensão.',
			more_info: 'https://developer.carrismetropolitana.pt/blog/...',
			style: 'warning', // 'info', 'warning', 'error', 'ok'
			title: 'Instabilidade temporária no tempo real',
		}),
	);
});

/* eslint-disable perfectionist/sort-objects */

/* * */

import FASTIFY from '@/services/FASTIFY.js';

/* * */

const main = async (_, reply) => {
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(
			JSON.stringify({
				style: 'warning', // 'info', 'warning', 'error', 'success'
				title: 'Instabilidade temporária no tempo real',
				body: 'Estamos a desenvolver todos os esforços para resolver a situação. Obrigado pela sua compreensão.',
				more_info: {
					label: 'Saber Mais',
					href: 'https://developer.carrismetropolitana.pt/blog/...',
				},
			}),
		);
};

/* * */

FASTIFY.server.get('/status/message', main);

FASTIFY.server.get('/v2/status/message', main);

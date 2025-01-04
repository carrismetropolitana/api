/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { DateTime } from 'luxon';

/* * */

interface RequestSchema {
	Params: {
		pip_id: string
	}
}

/* * */

FASTIFY.GET<RequestSchema>('/pips/:pip_id/message', async (request, reply) => {
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=20')
		.send({ message: `Painel em Testes | PIP ID ${request.params.pip_id} | ${DateTime.local({ zone: 'Europe/Lisbon' }).toFormat('HH:mm:ss')}` });
});

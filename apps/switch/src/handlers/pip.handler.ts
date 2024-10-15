/* * */

import { FastifyReply, FastifyRequest } from 'fastify';

/* * */

interface Params {
	id: string
}

export default async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
	return reply.redirect(`https://on.carrismetropolitana.pt/pip/${request.params.id}`);
};

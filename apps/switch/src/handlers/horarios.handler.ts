/* * */

import { FastifyReply, FastifyRequest } from 'fastify';

/* * */

interface Params {
	line_id: string
}

export default async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
	return reply.redirect(`https://on.carrismetropolitana.pt/lines/${request.params.line_id}`);
};

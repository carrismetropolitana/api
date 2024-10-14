/* * */

export default async (request, reply) => {
	return reply.redirect(`https://on.carrismetropolitana.pt/lines/${request.params.line_id}`);
};

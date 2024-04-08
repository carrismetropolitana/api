/* * */

module.exports.handler = async (request, reply) => {
  return reply.redirect(`https://on.carrismetropolitana.pt/pip/${request.params.id}`);
};

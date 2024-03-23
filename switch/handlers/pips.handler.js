/* * */

module.exports.handler = async (request, reply) => {
  return reply.redirect(`https://on.carrismetropolitana.pt/surveys/pips/${request.params.id}`);
};

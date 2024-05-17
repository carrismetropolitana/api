/* * */

const AVAILABLE_FACILITIES = ['schools', 'encm'];

/* * */

const all = async (_, reply) => {
	return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(AVAILABLE_FACILITIES));
};

/* * */

export default {
	all,
};
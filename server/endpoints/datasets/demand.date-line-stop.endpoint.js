/* * */

import SERVERDB from '@/services/SERVERDB';

/* * */

const viewByDateForEachStop = async (_, reply) => {
	const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/viewByDateForEachStop');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(viewData || []);
};

const viewByDateForEachLine = async (_, reply) => {
	const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/viewByDateForEachLine');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(viewData || []);
};

const viewByDateForEachStopForEachLine = async (_, reply) => {
	const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/viewByDateForEachStopForEachLine');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(viewData || []);
};

/* * */

export default {
	viewByDateForEachLine,
	viewByDateForEachStop,
	viewByDateForEachStopForEachLine,
};

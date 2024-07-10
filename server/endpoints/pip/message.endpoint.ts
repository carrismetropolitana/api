/* * */

import { DateTime } from 'luxon';

/* * */

const regexPatternForStopId = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

const main = async (request, reply) => {
	// Validate request body
	if (!request.body?.stops || request.body.stops.length === 0) return reply.code(400).send({});
	// Validate each requested Stop ID
	for (const stopId of request.body.stops) {
		if (!regexPatternForStopId.test(stopId)) return reply.status(400).send({});
		if (stopId === '000000') {
			return reply
				.code(200)
				.header('Content-Type', 'application/json; charset=utf-8')
				.send({ message: `>> Alterado. PIP ID ${request.params.pip_id} | ${DateTime.local({ zone: 'Europe/Lisbon' }).toFormat('HH:mm:ss')}` });
		}
		return reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ message: `Painel em Testes | PIP ID ${request.params.pip_id} | ${DateTime.local({ zone: 'Europe/Lisbon' }).toFormat('HH:mm:ss')}` });
	}
};

/* * */

export default {
	main,
};

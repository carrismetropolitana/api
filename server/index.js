/* eslint-disable @typescript-eslint/no-var-requires */

/* * */

import 'dotenv/config';
const SERVERDB = require('./services/SERVERDB');
const fastify = require('fastify')({ logger: true, requestTimeout: 10000 });

/* * */

// DEBUG ENDPOINTS

fastify.get('/time', require('./endpoints/debug/time.endpoint').time);

/* * */

// NETWORK ENDPOINTS

fastify.get('/gtfs', require('./endpoints/network/feed.endpoint').gtfs);
// fastify.get('/netex', require('./endpoints/network/feed.endpoint').netex);

fastify.get('/alerts', require('./endpoints/network/alerts.endpoint').json);
fastify.get('/alerts.pb', require('./endpoints/network/alerts.endpoint').protobuf);
// fastify.get('/alerts.rss', require('./endpoints/network/alerts.endpoint').rss);

fastify.get('/municipalities', require('./endpoints/network/municipalities.endpoint').all);
fastify.get('/municipalities/:id', require('./endpoints/network/municipalities.endpoint').single);

fastify.get('/localities', require('./endpoints/network/localities.endpoint').all);
fastify.get('/localities/:id', require('./endpoints/network/localities.endpoint').single);

fastify.get('/periods', require('./endpoints/network/periods.endpoint').all);

fastify.get('/dates', require('./endpoints/network/dates.endpoint').all);
fastify.get('/dates/:date', require('./endpoints/network/dates.endpoint').single);

fastify.get('/archives', require('./endpoints/network/archives.endpoint').all);
fastify.get('/archives/:id', require('./endpoints/network/archives.endpoint').single);

fastify.get('/timetables', require('./endpoints/network/timetables.endpoint').index);
fastify.get('/timetables/:line_id/:direction_id/:stop_id', require('./endpoints/network/timetables.endpoint').single);

fastify.get('/lines', require('./endpoints/network/lines.endpoint').all);
fastify.get('/lines/:id', require('./endpoints/network/lines.endpoint').single);

fastify.get('/routes', require('./endpoints/network/routes.endpoint').all);
fastify.get('/routes/:id', require('./endpoints/network/routes.endpoint').single);

fastify.get('/patterns', require('./endpoints/network/patterns.endpoint').all);
fastify.get('/patterns/:id', require('./endpoints/network/patterns.endpoint').single);
fastify.get('/patterns/:id/realtime', require('./endpoints/network/patterns.endpoint').realtime);
fastify.get('/network/v2/patterns/:id', require('./endpoints/network/patterns.endpoint').new);

fastify.get('/shapes', require('./endpoints/network/shapes.endpoint').all);
fastify.get('/shapes/:id', require('./endpoints/network/shapes.endpoint').single);

fastify.get('/stops', require('./endpoints/network/stops.endpoint').all);
// fastify.get('/stops.pb', require('./endpoints/network/stops.endpoint').protobuf);
fastify.get('/stops/:id', require('./endpoints/network/stops.endpoint').single);
fastify.get('/stops/:id/realtime', require('./endpoints/network/stops.endpoint').singleWithRealtime);
fastify.post('/stops/pip', require('./endpoints/network/stops.endpoint').realtimeForPips);

fastify.get('/vehicles', require('./endpoints/network/vehicles.endpoint').json);
fastify.get('/vehicles.pb', require('./endpoints/network/vehicles.endpoint').protobuf);

/* * */

// DATASETS ENDPOINTS

fastify.get('/datasets/facilities', require('./endpoints/datasets/facilities.endpoint').all);

//
// DATASETS > FACILITIES

fastify.get('/datasets/facilities/schools', require('./endpoints/datasets/facilities.schools.endpoint').all);
fastify.get('/datasets/facilities/schools/:id', require('./endpoints/datasets/facilities.schools.endpoint').single);

fastify.get('/datasets/facilities/encm', require('./endpoints/datasets/facilities.encm.endpoint').all);
fastify.get('/datasets/facilities/encm/:id', require('./endpoints/datasets/facilities.encm.endpoint').single);

fastify.get('/datasets/facilities/pip', require('./endpoints/datasets/facilities.pip.endpoint').all);
fastify.get('/datasets/facilities/pip/:id', require('./endpoints/datasets/facilities.pip.endpoint').single);

//
// DATASETS > MODAL CONNECTIONS

fastify.get('/datasets/connections/boat_stations', require('./endpoints/datasets/connections.boat_stations.endpoint').all);
fastify.get('/datasets/connections/boat_stations/:id', require('./endpoints/datasets/connections.boat_stations.endpoint').single);

fastify.get('/datasets/connections/light_rail_stations', require('./endpoints/datasets/connections.light_rail_stations.endpoint').all);
fastify.get('/datasets/connections/light_rail_stations/:id', require('./endpoints/datasets/connections.light_rail_stations.endpoint').single);

fastify.get('/datasets/connections/subway_stations', require('./endpoints/datasets/connections.subway_stations.endpoint').all);
fastify.get('/datasets/connections/subway_stations/:id', require('./endpoints/datasets/connections.subway_stations.endpoint').single);

fastify.get('/datasets/connections/train_stations', require('./endpoints/datasets/connections.train_stations.endpoint').all);
fastify.get('/datasets/connections/train_stations/:id', require('./endpoints/datasets/connections.train_stations.endpoint').single);

//
// DATASESTS > DEMAND

fastify.get('/datasets/demand/date-line-stop/viewByDateForEachStop', require('./endpoints/datasets/demand.date-line-stop.endpoint').viewByDateForEachStop);
fastify.get('/datasets/demand/date-line-stop/viewByDateForEachLine', require('./endpoints/datasets/demand.date-line-stop.endpoint').viewByDateForEachLine);
fastify.get('/datasets/demand/date-line-stop/viewByDateForEachStopForEachLine', require('./endpoints/datasets/demand.date-line-stop.endpoint').viewByDateForEachStopForEachLine);

/* * */

// START FASTIFY SERVER

fastify.listen({ port: 5050, host: '0.0.0.0' }, async (err, address) => {
	if (err) throw err;
	console.log(`Server listening on ${address}`);
	await SERVERDB.connect();
});
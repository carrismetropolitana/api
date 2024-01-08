/* * */

const fastify = require('fastify')({ logger: true, requestTimeout: 20000 });
const SERVERDB = require('./services/SERVERDB');

/* * */

// DEBUG ENDPOINTS

fastify.get('/time', require('./endpoints/debug/time.endpoint').test);

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
fastify.get('/timetables/:pattern_id/:stop_id/:stop_sequence', require('./endpoints/network/timetables.endpoint').single);

fastify.get('/lines', require('./endpoints/network/lines.endpoint').all);
fastify.get('/lines/:id', require('./endpoints/network/lines.endpoint').single);

fastify.get('/routes', require('./endpoints/network/routes.endpoint').all);
fastify.get('/routes/:id', require('./endpoints/network/routes.endpoint').single);

fastify.get('/patterns', require('./endpoints/network/patterns.endpoint').all);
fastify.get('/patterns/:id', require('./endpoints/network/patterns.endpoint').single);

fastify.get('/shapes', require('./endpoints/network/shapes.endpoint').all);
fastify.get('/shapes/:id', require('./endpoints/network/shapes.endpoint').single);

fastify.get('/stops', require('./endpoints/network/stops.endpoint').all);
// fastify.get('/stops.pb', require('./endpoints/network/stops.endpoint').protobuf);
fastify.get('/stops/:id', require('./endpoints/network/stops.endpoint').single);
fastify.get('/stops/:id/realtime', require('./endpoints/network/stops.endpoint').singleWithRealtime);

fastify.get('/vehicles', require('./endpoints/network/vehicles.endpoint').json);
fastify.get('/vehicles.pb', require('./endpoints/network/vehicles.endpoint').protobuf);

/* * */

// DATASETS ENDPOINTS

fastify.get('/facilities', require('./endpoints/datasets/facilities.endpoint').all);

fastify.get('/facilities/schools', require('./endpoints/datasets/facilities.schools.endpoint').all);
fastify.get('/facilities/schools/:id', require('./endpoints/datasets/facilities.schools.endpoint').single);

fastify.get('/facilities/encm', require('./endpoints/datasets/facilities.encm.endpoint').all);
fastify.get('/facilities/encm/:id', require('./endpoints/datasets/facilities.encm.endpoint').single);

/* * */

// START FASTIFY SERVER

fastify.listen({ port: 5050, host: '0.0.0.0' }, async (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
  await SERVERDB.connect();
});

/* * */

const fastify = require('fastify')({ logger: true, requestTimeout: 20000 });
const SERVERDB = require('./services/SERVERDB');

/* * */

const timeEndpoint = require('./endpoints/gtfs/time.endpoint');

// IMPORT GTFS ENDPOINTS

const gtfsEndpoint = require('./endpoints/gtfs/gtfs.endpoint');
const alertsEndpoint = require('./endpoints/gtfs/alerts.endpoint');
const municipalitiesEndpoint = require('./endpoints/gtfs/municipalities.endpoint');
const localitiesEndpoint = require('./endpoints/gtfs/localities.endpoint');
const periodsEndpoint = require('./endpoints/gtfs/periods.endpoint');
const datesEndpoint = require('./endpoints/gtfs/dates.endpoint');
const timetablesEndpoint = require('./endpoints/gtfs/timetables.endpoint');
const linesEndpoint = require('./endpoints/gtfs/lines.endpoint');
const routesEndpoint = require('./endpoints/gtfs/routes.endpoint');
const patternsEndpoint = require('./endpoints/gtfs/patterns.endpoint');
const shapesEndpoint = require('./endpoints/gtfs/shapes.endpoint');
const stopsEndpoint = require('./endpoints/gtfs/stops.endpoint');
const vehiclesEndpoint = require('./endpoints/gtfs/vehicles.endpoint');

/* * */

// IMPORT DATASETS ENDPOINTS

const schoolsEndpoint = require('./endpoints/datasets/facilities.schools.endpoint');
const encmEndpoint = require('./endpoints/datasets/facilities.encm.endpoint');

/* * */

// GTFS ENDPOINTS

fastify.get('/time', timeEndpoint.test);

fastify.get('/gtfs', gtfsEndpoint.feed);
// fastify.get('/netex', gtfsEndpoint.feed);

fastify.get('/alerts', alertsEndpoint.json);
fastify.get('/alerts.pb', alertsEndpoint.protobuf);
// fastify.get('/alerts.rss', alertsEndpoint.rss);

fastify.get('/municipalities', municipalitiesEndpoint.all);
fastify.get('/municipalities/:id', municipalitiesEndpoint.single);

fastify.get('/localities', localitiesEndpoint.all);
fastify.get('/localities/:id', localitiesEndpoint.single);

fastify.get('/periods', periodsEndpoint.all);

fastify.get('/dates', datesEndpoint.all);
fastify.get('/dates/:date', datesEndpoint.single);
fastify.get('/timetables/:pattern_id/:stop_id/:stop_sequence', timetablesEndpoint.single);

fastify.get('/lines', linesEndpoint.all);
fastify.get('/lines/:id', linesEndpoint.single);

fastify.get('/routes', routesEndpoint.all);
fastify.get('/routes/:id', routesEndpoint.single);

fastify.get('/patterns', patternsEndpoint.all);
fastify.get('/patterns/:id', patternsEndpoint.single);

fastify.get('/shapes', shapesEndpoint.all);
fastify.get('/shapes/:id', shapesEndpoint.single);

fastify.get('/stops', stopsEndpoint.all);
// fastify.get('/stops.pb', stopsEndpoint.protobuf);
fastify.get('/stops/:id', stopsEndpoint.single);
fastify.get('/stops/:id/realtime', stopsEndpoint.singleWithRealtime);

fastify.get('/vehicles', vehiclesEndpoint.json);
fastify.get('/vehicles.pb', vehiclesEndpoint.protobuf);

/* * */

// DATASETS ENDPOINTS

fastify.get('/facilities', require('./endpoints/datasets/facilities.endpoint').all);

fastify.get('/facilities/schools', schoolsEndpoint.all);
fastify.get('/facilities/schools/:id', schoolsEndpoint.single);

fastify.get('/facilities/encm', encmEndpoint.all);
fastify.get('/facilities/encm/:id', encmEndpoint.single);

/* * */

// START FASTIFY SERVER

fastify.listen({ port: 5050, host: '0.0.0.0' }, async (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
  await SERVERDB.connect();
});

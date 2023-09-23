//
// IMPORTS

const fastify = require('fastify')({ logger: true, requestTimeout: 20000 });
const SERVERDB = require('./services/SERVERDB');

//
// IMPORT GTFS ENDPOINTS

const gtfsEndpoint = require('./endpoints/gtfs.endpoint');
const alertsEndpoint = require('./endpoints/alerts.endpoint');
const municipalitiesEndpoint = require('./endpoints/municipalities.endpoint');
const linesEndpoint = require('./endpoints/lines.endpoint');
const routesEndpoint = require('./endpoints/routes.endpoint');
const patternsEndpoint = require('./endpoints/patterns.endpoint');
const shapesEndpoint = require('./endpoints/shapes.endpoint');
const stopsEndpoint = require('./endpoints/stops.endpoint');
const vehiclesEndpoint = require('./endpoints/vehicles.endpoint');

//
// IMPORT DATASETS ENDPOINTS

const schoolsEndpoint = require('./endpoints/schools.endpoint');
const encmEndpoint = require('./endpoints/encm.endpoint');

//
// GTFS ENDPOINTS

fastify.get('/gtfs', gtfsEndpoint.feed);

fastify.get('/alerts', alertsEndpoint.json);
fastify.get('/alerts.pb', alertsEndpoint.protobuf);
// fastify.get('/alerts.rss', alertsEndpoint.rss);

fastify.get('/municipalities', municipalitiesEndpoint.all);
fastify.get('/municipalities/:id', municipalitiesEndpoint.single);

fastify.get('/lines', linesEndpoint.all);
fastify.get('/lines/:id', linesEndpoint.single);

fastify.get('/routes', routesEndpoint.all);
fastify.get('/routes/:id', routesEndpoint.single);

fastify.get('/patterns', patternsEndpoint.all);
fastify.get('/patterns/:id', patternsEndpoint.single);

fastify.get('/shapes', shapesEndpoint.all);
fastify.get('/shapes/:id', shapesEndpoint.single);

fastify.get('/stops', stopsEndpoint.all);
fastify.get('/stops/:id', stopsEndpoint.single);
fastify.get('/stops/:id/realtime', stopsEndpoint.singleWithRealtime);

fastify.get('/vehicles', vehiclesEndpoint.all);

//
// DATASETS ENDPOINTS

fastify.get('/facilities/schools', schoolsEndpoint.all);
fastify.get('/facilities/schools/:id', schoolsEndpoint.single);

fastify.get('/facilities/encm', encmEndpoint.all);
fastify.get('/facilities/encm/:id', encmEndpoint.single);

//
// START FASTIFY SERVER

fastify.listen({ port: 5050, host: '0.0.0.0' }, async (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
  await SERVERDB.connect();
});

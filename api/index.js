/* * */
/* IMPORTS */
const fastify = require('fastify')({ logger: true, requestTimeout: 20000 });
const fastifyMongoDbPlugin = require('@fastify/mongodb');
const { GTFSAPIDB_USER, GTFSAPIDB_PASSWORD, GTFSAPIDB_HOST, GTFSAPIDB_NAME } = process.env;
const GTFSAPIDB = require('./services/GTFSAPIDB');

const alertsRoute = require('./routes/alerts.route');
const municipalitiesRoute = require('./routes/municipalities.route');
const facilitiesRoute = require('./routes/facilities.route');
const linesRoute = require('./routes/lines.route');
const patternsRoute = require('./routes/patterns.route');
const shapesRoute = require('./routes/shapes.route');
const stopsRoute = require('./routes/stops.route');
const vehiclesRoute = require('./routes/vehicles.route');

fastify.register(fastifyMongoDbPlugin, {
  forceClose: true,
  url: `mongodb://${GTFSAPIDB_USER}:${GTFSAPIDB_PASSWORD}@${GTFSAPIDB_HOST}/${GTFSAPIDB_NAME}?authSource=admin`,
});

//
// ROUTES
fastify.get('/alerts', alertsRoute.json);
fastify.get('/alerts.pb', alertsRoute.protobuf);
// fastify.get('/alerts.rss', alertsRoute.alertsRss);

fastify.get('/municipalities', municipalitiesRoute.all);
fastify.get('/municipalities/:code', municipalitiesRoute.single);

fastify.get('/facilities', facilitiesRoute.all);
fastify.get('/facilities/:code', facilitiesRoute.single);

fastify.get('/lines', linesRoute.all);
fastify.get('/lines/:code', linesRoute.single);

fastify.get('/patterns', patternsRoute.all);
fastify.get('/patterns/:code', patternsRoute.single);

fastify.get('/shapes', shapesRoute.all);
fastify.get('/shapes/:code', shapesRoute.single);

fastify.get('/stops', stopsRoute.all);
fastify.get('/stops/:code', stopsRoute.single);
fastify.get('/stops/:code/realtime', stopsRoute.singleWithRealtime);

fastify.get('/vehicles', vehiclesRoute.all);

//
// Start Fastify server
fastify.listen({ port: 5050, host: '0.0.0.0' }, async (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
  await GTFSAPIDB.connect();
});

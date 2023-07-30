/* * */
/* IMPORTS */
const fastify = require('fastify')({ logger: true, requestTimeout: 20000 });
const GTFSAPIDB = require('./databases/gtfsapidb');

//
fastify.get('/routes/summary', async (request, reply) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.RouteSummary.find({});
    if (foundManyDocuments.length > 0) {
      foundManyDocuments.sort((a, b) => (a.route_id > b.route_id ? 1 : -1));
      await reply.code(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/routes/summary": %s Found', foundManyDocuments.length);
      console.log('---------------------------------------------------------------------------');
    } else {
      await reply.code(404).send([]);
      console.log('🟡 → Request for "/routes/summary": Not Found');
      console.log('---------------------------------------------------------------------------');
    }
  } catch (err) {
    await reply.code(500).send([]);
    console.log('🔴 → Request for "/routes/summary": Server Error', err);
    console.log('---------------------------------------------------------------------------');
  }
});

//
fastify.get('/routes/route_id/:route_id', async (request, reply) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Route.findOne({ route_id: request.params.route_id });
    if (foundOneDocument) {
      await reply.code(200).send(foundOneDocument);
      console.log('🟢 → Request for "/routes/route_id/%s": 1 Found', request.params.route_id);
      console.log('---------------------------------------------------------------------------');
    } else {
      await reply.code(404).send({});
      console.log('🟡 → Request for "/routes/route_id/%s": Not Found', request.params.route_id);
      console.log('---------------------------------------------------------------------------');
    }
  } catch (err) {
    await reply.code(500).send({});
    console.log('🔴 → Request for "/routes/route_id/%s": Server Error', request.params.route_id, err);
    console.log('---------------------------------------------------------------------------');
  }
});

//
fastify.get('/routes/route_short_name/:route_short_name', async (request, reply) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Route.find({ route_id: { $regex: `^${request.params.route_short_name}` } });
    if (foundManyDocuments.length > 0) {
      await reply.code(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/routes/route_short_name/%s": %s Found', request.params.route_short_name, foundManyDocuments.length);
      console.log('---------------------------------------------------------------------------');
    } else {
      await reply.code(404).send([]);
      console.log('🟡 → Request for "/routes/route_short_name/%s": Not Found', request.params.route_short_name);
      console.log('---------------------------------------------------------------------------');
    }
  } catch (err) {
    await reply.code(500).send([]);
    console.log('🔴 → Request for "/routes/route_short_name/%s": Server Error', request.params.route_short_name, err);
    console.log('---------------------------------------------------------------------------');
  }
});

//
fastify.get('/stops', async (request, reply) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Stop.find({});
    if (foundManyDocuments.length > 0) {
      foundManyDocuments.sort((a, b) => (a.stop_id > b.stop_id ? 1 : -1));
      await reply.code(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/stops/[all]": %s Found', foundManyDocuments.length);
      console.log('---------------------------------------------------------------------------');
    } else {
      await reply.code(404).send([]);
      console.log('🟡 → Request for "/stops/[all]": Not Found');
      console.log('---------------------------------------------------------------------------');
    }
  } catch (err) {
    await reply.code(500).send([]);
    console.log('🔴 → Request for "/stops/[all]": Server Error', err);
    console.log('---------------------------------------------------------------------------');
  }
});

//
fastify.get('/stops/:stop_id', async (request, reply) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Stop.findOne({ stop_id: request.params.stop_id });
    if (foundOneDocument) {
      await reply.code(200).send(foundOneDocument);
      console.log('🟢 → Request for "/stops/%s": 1 Found', request.params.stop_id);
      console.log('---------------------------------------------------------------------------');
    } else {
      await reply.code(404).send({});
      console.log('🟡 → Request for "/stops/%s": Not Found', request.params.stop_id);
      console.log('---------------------------------------------------------------------------');
    }
  } catch (err) {
    await reply.code(500).send({});
    console.log('🔴 → Request for "/stops/%s": Server Error', request.params.stop_id, err);
    console.log('---------------------------------------------------------------------------');
  }
});

// set port, listen for requests

const PORT = 5050;
fastify.listen({ port: PORT, host: '0.0.0.0' }, async (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  await GTFSAPIDB.connect();
});

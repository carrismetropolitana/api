/* * */
/* IMPORTS */
const fastify = require('fastify')({ logger: true, requestTimeout: 20000 });
const GTFSAPIDB = require('./databases/gtfsapidb');

//
fastify.get('/routes', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Route.find({});
    if (foundManyDocuments.length > 0) {
      foundManyDocuments.sort((a, b) => (a.route_id > b.route_id ? 1 : -1));
      await res.code(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/routes/[all]": %s Found', foundManyDocuments.length);
    } else {
      await res.code(404).send([]);
      console.log('🟡 → Request for "/routes/[all]": Not Found');
    }
  } catch (err) {
    await res.code(500).send([]);
    console.log('🔴 → Request for "/routes/[all]": Server Error', err);
  }
});

//
fastify.get('/routes/summary', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.RouteSummary.find({});
    if (foundManyDocuments.length > 0) {
      foundManyDocuments.sort((a, b) => (a.route_id > b.route_id ? 1 : -1));
      await res.code(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/routes/summary": %s Found', foundManyDocuments.length);
    } else {
      await res.code(404).send([]);
      console.log('🟡 → Request for "/routes/summary": Not Found');
    }
  } catch (err) {
    await res.code(500).send([]);
    console.log('🔴 → Request for "/routes/summary": Server Error', err);
  }
});

//
fastify.get('/routes/route_id/:route_id', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Route.findOne({ route_id: req.params.route_id });
    if (foundOneDocument) {
      await res.code(200).send(foundOneDocument);
      console.log('🟢 → Request for "/routes/route_id/%s": 1 Found', req.params.route_id);
    } else {
      await res.code(404).send({});
      console.log('🟡 → Request for "/routes/route_id/%s": Not Found', req.params.route_id);
    }
  } catch (err) {
    await res.code(500).send({});
    console.log('🔴 → Request for "/routes/route_id/%s": Server Error', req.params.route_id, err);
  }
});

//
fastify.get('/routes/route_short_name/:route_short_name', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Route.find({ route_id: { $regex: `^${req.params.route_short_name}` } });
    if (foundManyDocuments.length > 0) {
      await res.code(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/routes/route_short_name/%s": %s Found', req.params.route_short_name, foundManyDocuments.length);
    } else {
      await res.code(404).send([]);
      console.log('🟡 → Request for "/routes/route_short_name/%s": Not Found', req.params.route_short_name);
    }
  } catch (err) {
    await res.code(500).send([]);
    console.log('🔴 → Request for "/routes/route_short_name/%s": Server Error', req.params.route_short_name, err);
  }
});

//
fastify.get('/stops', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Stop.find({});
    if (foundManyDocuments.length > 0) {
      foundManyDocuments.sort((a, b) => (a.stop_id > b.stop_id ? 1 : -1));
      await res.code(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/stops/[all]": %s Found', foundManyDocuments.length);
    } else {
      await res.code(404).send([]);
      console.log('🟡 → Request for "/stops/[all]": Not Found');
    }
  } catch (err) {
    await res.code(500).send([]);
    console.log('🔴 → Request for "/stops/[all]": Server Error', err);
  }
});

//
fastify.get('/stops/:stop_id', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Stop.findOne({ stop_id: req.params.stop_id });
    if (foundOneDocument) {
      await res.code(200).send(foundOneDocument);
      console.log('🟢 → Request for "/stops/%s": 1 Found', req.params.stop_id);
    } else {
      await res.code(404).send({});
      console.log('🟡 → Request for "/stops/%s": Not Found', req.params.stop_id);
    }
  } catch (err) {
    await res.code(500).send({});
    console.log('🔴 → Request for "/stops/%s": Server Error', req.params.stop_id, err);
  }
});

// set port, listen for requests
const PORT = 5050;
fastify.listen({ port: PORT }, async (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('GTFS API listening on port %s...', PORT);
  await GTFSAPIDB.connect();
  console.log();
});

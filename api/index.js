/* * */
/* IMPORTS */
const express = require('express');
const app = express();
const GTFSAPIDB = require('./databases/gtfsapidb');
const { Readable } = require('stream');
const rateLimit = require('express-rate-limit');

// Apply up rate limiter to all requests: maximum of 50 requests per minute
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // Limit each IP to 50 requests per `window` (here, per 1 minute)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  })
);

// Set CORS Header globally
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

//
app.get('/api/routes/', async (req, res) => {
  try {
    const foundDocuments = await GTFSAPIDB.Route.find({});
    if (foundDocuments.length > 0) {
      foundDocuments.sort((a, b) => (a.route_id > b.route_id ? 1 : -1));
      console.log('🟢 → Request for "/api/routes/[all]": %s Resources Found', foundDocuments.length);
      res.send(foundDocuments);
    } else {
      console.log('🟡 → Request for "/api/routes/[all]": Resources Not Found');
      res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/api/routes/[all]": Server Error', err);
    res.status(500).send([]);
  }
});

//
app.get('/api/routes/summary', async (req, res) => {
  try {
    const foundDocuments = await GTFSAPIDB.RouteSummary.find({});
    if (foundDocuments.length > 0) {
      foundDocuments.sort((a, b) => (a.route_id > b.route_id ? 1 : -1));
      console.log('🟢 → Request for "/api/routes/summary": %s Resources Found', foundDocuments.length);
      res.send(foundDocuments);
    } else {
      console.log('🟡 → Request for "/api/routes/summary": Resources Not Found');
      res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/api/routes/summary": Server Error', err);
    res.status(500).send([]);
  }
});

//
app.get('/api/routes/route_id/:route_id', async (req, res) => {
  try {
    const foundDocument = await GTFSAPIDB.Route.findOne({ route_id: req.params.route_id });
    if (foundDocument) {
      console.log('🟢 → Request for "/api/routes/route_id/%s": Resource Found', req.params.route_id);
      res.send(foundDocument);
    } else {
      console.log('🟡 → Request for "/api/routes/route_id/%s": Resource Not Found', req.params.route_id);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/api/routes/route_id/%s": Server Error', req.params.route_id, err);
    res.status(500).send({});
  }
});

//
app.get('/api/routes/route_short_name/:route_short_name', async (req, res) => {
  try {
    const foundDocuments = await GTFSAPIDB.Route.find({ route_id: { $regex: `^${req.params.route_short_name}` } });
    if (foundDocuments.length > 0) {
      console.log('🟢 → Request for "/api/routes/route_short_name/%s": %s Resources Found', req.params.route_short_name, foundDocuments.length);
      res.send(foundDocuments);
    } else {
      console.log('🟡 → Request for "/api/routes/route_short_name/%s": Resources Not Found', req.params.route_short_name);
      res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/api/routes/route_short_name/%s": Server Error', req.params.route_short_name, err);
    res.status(500).send([]);
  }
});

//
app.get('/api/stops', async (req, res) => {
  try {
    const foundDocuments = await GTFSAPIDB.Stop.find({});
    if (foundDocuments.length > 0) {
      foundDocuments.sort((a, b) => (a.stop_id > b.stop_id ? 1 : -1));
      console.log('🟢 → Request for "/api/stops/[all]": %s Resources Found', foundDocuments.length);
      res.send(foundDocuments);
    } else {
      console.log('🟡 → Request for "/api/stops/[all]": Resources Not Found');
      res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/api/stops/[all]": Server Error', err);
    res.status(500).send([]);
  }
});

//
app.get('/api/stops/:stop_id', async (req, res) => {
  try {
    const foundDocument = await GTFSAPIDB.Stop.findOne({ stop_id: req.params.stop_id });
    if (foundDocument) {
      console.log('🟢 → Request for "/api/stops/%s": $s Resources Found', req.params.stop_id, foundDocument.length);
      res.send(foundDocument);
    } else {
      console.log('🟡 → Request for "/api/stops/%s": Resources Not Found', req.params.stop_id);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/api/stops/%s": Server Error', req.params.stop_id, err);
    res.status(500).send({});
  }
});

// set port, listen for requests
const PORT = 5050;
app.listen(5050, async () => {
  console.log(`GTFS API listening on port ${PORT}...`);
  await GTFSAPIDB.connect();
  console.log();
});

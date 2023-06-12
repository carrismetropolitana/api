/* * */
/* IMPORTS */
const express = require('express');
const app = express();
const GTFSAPIDB = require('./databases/gtfsapidb');
const rateLimit = require('express-rate-limit');

// Apply rate limiter to all requests: maximum of 50 requests per minute
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // Limit each IP to 50 requests per `windowMs` (here, per 1 minute)
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
app.get('/lines', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Line.find({}, '-_id');
    if (foundManyDocuments.length > 0) {
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
      console.log('🟢 → Request for "/lines/[all]": %s Found', foundManyDocuments.length);
      res.send(foundManyDocuments);
    } else {
      console.log('🟡 → Request for "/lines/[all]": Not Found');
      res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/lines/[all]": Server Error', err);
    res.status(500).send([]);
  }
});

//
app.get('/lines/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Line.findOne({ code: req.params.code }, '-_id -__v').populate({ path: 'patterns', populate: { path: 'trips.schedule.stop' } });
    if (foundOneDocument) {
      console.log('🟢 → Request for "/lines/%s": 1 Found', req.params.code);
      res.send(foundOneDocument);
    } else {
      console.log('🟡 → Request for "/lines/%s": Not Found', req.params.code);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/lines/%s": Server Error', req.params.code, err);
    res.status(500).send({});
  }
});

//
app.get('/shapes/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Shape.findOne({ code: req.params.code }, '-_id -__v');
    if (foundOneDocument) {
      console.log('🟢 → Request for "/shapes/%s": 1 Found', req.params.code);
      res.send(foundOneDocument);
    } else {
      console.log('🟡 → Request for "/shapes/%s": Not Found', req.params.code);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/shapes/%s": Server Error', req.params.code, err);
    res.status(500).send({});
  }
});

//
app.get('/stops', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Stop.find({}, '-_id code name latitude longitude tts_name');
    if (foundManyDocuments.length > 0) {
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
      console.log('🟢 → Request for "/stops/[all]": %s Found', foundManyDocuments.length);
      res.send(foundManyDocuments);
    } else {
      console.log('🟡 → Request for "/stops/[all]": Not Found');
      res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/stops/[all]": Server Error', err);
    res.status(500).send([]);
  }
});

//
app.get('/stops/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Stop.findOne({ code: req.params.code }, '-_id -__v').populate('municipality', '-_id -__v').populate('patterns', '-_id -__v');
    if (foundOneDocument) {
      console.log('🟢 → Request for "/stops/%s": 1 Found', req.params.code);
      res.send(foundOneDocument);
    } else {
      console.log('🟡 → Request for "/stops/%s": Not Found', req.params.code);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/stops/%s": Server Error', req.params.code, err);
    res.status(500).send({});
  }
});

// Set port, listen for requests
const PORT = 5050;
app.listen(5050, async () => {
  console.log('GTFS API listening on port %s...', PORT);
  await GTFSAPIDB.connect();
  console.log();
});

/* * */
/* IMPORTS */
const express = require('express');
const app = express();
const GTFSAPIDB = require('./databases/gtfsapidb');
const rateLimit = require('express-rate-limit');

// Apply rate limiter to all requests: maximum of 50 requests per minute
app.use(
  rateLimit({
    windowMs: 60000, // 60 seconds (1 minute)
    max: 1000, // Limit each IP to 1000 requests per 'windowMs'
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
app.get('/municipalities', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Municipality.find();
    if (foundManyDocuments.length > 0) {
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      foundManyDocuments.sort((a, b) => collator.compare(a.name, b.name));
      console.log('🟢 → Request for "/municipalities/[all]": %s Found', foundManyDocuments.length);
      res.send(foundManyDocuments);
    } else {
      console.log('🟡 → Request for "/municipalities/[all]": Not Found');
      res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/municipalities/[all]": Server Error', err);
    res.status(500).send([]);
  }
});

//
app.get('/municipalities/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Municipality.findOne({ code: { $eq: req.params.code } });
    if (foundOneDocument) {
      console.log('🟢 → Request for "/municipalities/%s": 1 Found', req.params.code);
      res.send(foundOneDocument);
    } else {
      console.log('🟡 → Request for "/municipalities/%s": Not Found', req.params.code);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/municipalities/%s": Server Error', req.params.code, err);
    res.status(500).send({});
  }
});

//
app.get('/lines', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Line.find();
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
    const foundOneDocument = await GTFSAPIDB.Line.findOne({ code: { $eq: req.params.code } });
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
app.get('/patterns/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Pattern.findOne({ code: { $eq: req.params.code } });
    if (foundOneDocument) {
      console.log('🟢 → Request for "/patterns/%s": 1 Found', req.params.code);
      res.send(foundOneDocument);
    } else {
      console.log('🟡 → Request for "/patterns/%s": Not Found', req.params.code);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/patterns/%s": Server Error', req.params.code, err);
    res.status(500).send({});
  }
});

//
app.get('/stops', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Stop.find();
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
    const foundOneDocument = await GTFSAPIDB.Stop.findOne({ code: { $eq: req.params.code } });
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

//
app.get('/stops/:code/patterns', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Stop.findOne({ code: { $eq: req.params.code } }).populate({ path: 'patterns' });
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

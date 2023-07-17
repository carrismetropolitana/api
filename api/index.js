/* * */
/* IMPORTS */
const express = require('express');
const app = express();
const GTFSAPIDB = require('./databases/gtfsapidb');
const { Readable } = require('stream');

// Set CORS Header globally
app.use(function (req, res, next) {
  req.setTimeout(30000, () => console.log('Timeout on ', req.originalUrl));
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

//
app.get('/routes', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Route.find({});
    if (foundManyDocuments.length > 0) {
      foundManyDocuments.sort((a, b) => (a.route_id > b.route_id ? 1 : -1));
      res.status(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/routes/[all]": %s Found', foundManyDocuments.length);
    } else {
      res.status(404).send([]);
      console.log('🟡 → Request for "/routes/[all]": Not Found');
    }
  } catch (err) {
    res.status(500).send([]);
    console.log('🔴 → Request for "/routes/[all]": Server Error', err);
  }
});

//
app.get('/routes/summary', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.RouteSummary.find({});
    if (foundManyDocuments.length > 0) {
      foundManyDocuments.sort((a, b) => (a.route_id > b.route_id ? 1 : -1));
      res.status(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/routes/summary": %s Found', foundManyDocuments.length);
    } else {
      res.status(404).send([]);
      console.log('🟡 → Request for "/routes/summary": Not Found');
    }
  } catch (err) {
    res.status(500).send([]);
    console.log('🔴 → Request for "/routes/summary": Server Error', err);
  }
});

//
app.get('/routes/route_id/:route_id', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Route.findOne({ route_id: req.params.route_id });
    if (foundOneDocument) {
      res.status(200).send(foundOneDocument);
      console.log('🟢 → Request for "/routes/route_id/%s": 1 Found', req.params.route_id);
    } else {
      res.status(404).send({});
      console.log('🟡 → Request for "/routes/route_id/%s": Not Found', req.params.route_id);
    }
  } catch (err) {
    res.status(500).send({});
    console.log('🔴 → Request for "/routes/route_id/%s": Server Error', req.params.route_id, err);
  }
});

//
app.get('/routes/route_short_name/:route_short_name', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Route.find({ route_id: { $regex: `^${req.params.route_short_name}` } });
    if (foundManyDocuments.length > 0) {
      res.status(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/routes/route_short_name/%s": %s Found', req.params.route_short_name, foundManyDocuments.length);
    } else {
      res.status(404).send([]);
      console.log('🟡 → Request for "/routes/route_short_name/%s": Not Found', req.params.route_short_name);
    }
  } catch (err) {
    res.status(500).send([]);
    console.log('🔴 → Request for "/routes/route_short_name/%s": Server Error', req.params.route_short_name, err);
  }
});

//
app.get('/stops', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Stop.find({});
    if (foundManyDocuments.length > 0) {
      foundManyDocuments.sort((a, b) => (a.stop_id > b.stop_id ? 1 : -1));
      res.status(200).send(foundManyDocuments);
      console.log('🟢 → Request for "/stops/[all]": %s Found', foundManyDocuments.length);
    } else {
      res.status(404).send([]);
      console.log('🟡 → Request for "/stops/[all]": Not Found');
    }
  } catch (err) {
    res.status(500).send([]);
    console.log('🔴 → Request for "/stops/[all]": Server Error', err);
  }
});

//
app.get('/stops/:stop_id', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Stop.findOne({ stop_id: req.params.stop_id });
    if (foundOneDocument) {
      res.status(200).send(foundOneDocument);
      console.log('🟢 → Request for "/stops/%s": 1 Found', req.params.stop_id);
    } else {
      res.status(404).send({});
      console.log('🟡 → Request for "/stops/%s": Not Found', req.params.stop_id);
    }
  } catch (err) {
    res.status(500).send({});
    console.log('🔴 → Request for "/stops/%s": Server Error', req.params.stop_id, err);
  }
});

//
app.get('/pdf/:stop_id/:route_short_name/:direction_id', async (req, res) => {
  res.status(200).send();
  return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const pdf_base_url = 'https://raw.githubusercontent.com/carrismetropolitana/pdfs/latest/horarios/';
    const pdf_filename = `horario-singular-${req.params.stop_id}-${req.params.route_short_name}-${req.params.direction_id}.pdf`;
    const response = await fetch(pdf_base_url + pdf_filename, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdf_filename}"`);
      const pdfStream = Readable.from(response.body);
      pdfStream.pipe(res);
      console.log(`🟢 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": File Exists`);
    } else {
      res.status(200).send();
      console.log(`🟡 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": File Not Found`);
    }
  } catch (err) {
    res.status(200).send();
    console.log(`🔴 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": Server Error`, err);
  }
});

// set port, listen for requests
const PORT = 5050;
app.listen(5050, async () => {
  console.log('GTFS API listening on port %s...', PORT);
  await GTFSAPIDB.connect();
  console.log();
});

/* * */
/* IMPORTS */
const express = require('express');
const app = express();
const GTFSAPIDB = require('./databases/gtfsapidb');
const { Readable } = require('stream');

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
      console.log(`🟢 → Request for "/api/routes/[all]": ${foundDocuments.length} Resources Found`);
      res.send(foundDocuments);
    } else {
      console.log(`🟡 → Request for "/api/routes/[all]": Resources Not Found`);
      res.status(404).send([]);
    }
  } catch (err) {
    console.log(`🔴 → Request for "/api/routes/[all]": Server Error`, err);
    res.status(500).send([]);
  }
});

//
app.get('/api/routes/summary', async (req, res) => {
  try {
    const foundDocuments = await GTFSAPIDB.RouteSummary.find({});
    if (foundDocuments.length > 0) {
      foundDocuments.sort((a, b) => (a.route_id > b.route_id ? 1 : -1));
      console.log(`🟢 → Request for "/api/routes/summary": ${foundDocuments.length} Resources Found`);
      res.send(foundDocuments);
    } else {
      console.log(`🟡 → Request for "/api/routes/summary": Resources Not Found`);
      res.status(404).send([]);
    }
  } catch (err) {
    console.log(`🔴 → Request for "/api/routes/summary": Server Error`, err);
    res.status(500).send([]);
  }
});

//
app.get('/api/routes/route_id/:route_id', async (req, res) => {
  try {
    const foundDocument = await GTFSAPIDB.Route.findOne({ route_id: req.params.route_id });
    if (foundDocument) {
      console.log(`🟢 → Request for "/api/routes/route_id/${req.params.route_id}": Resource Found`);
      res.send(foundDocument);
    } else {
      console.log(`🟡 → Request for "/api/routes/route_id/${req.params.route_id}": Resource Not Found`);
      res.status(404).send({});
    }
  } catch (err) {
    console.log(`🔴 → Request for "/api/routes/route_id/${req.params.route_id}": Server Error`, err);
    res.status(500).send({});
  }
});

//
app.get('/api/routes/route_short_name/:route_short_name', async (req, res) => {
  try {
    const foundDocuments = await GTFSAPIDB.Route.find({ route_id: { $regex: `^${req.params.route_short_name}` } });
    if (foundDocuments.length > 0) {
      console.log(`🟢 → Request for "/api/routes/route_short_name/${req.params.route_short_name}": ${foundDocuments.length} Resources Found`);
      res.send(foundDocuments);
    } else {
      console.log(`🟡 → Request for "/api/routes/route_short_name/${req.params.route_short_name}": Resources Not Found`);
      res.status(404).send([]);
    }
  } catch (err) {
    console.log(`🔴 → Request for "/api/routes/route_short_name/${req.params.route_short_name}": Server Error`, err);
    res.status(500).send([]);
  }
});

//
app.get('/api/pdf/:stop_id/:route_short_name/:direction_id', async (req, res) => {
  try {
    const pdf_base_url = 'https://raw.githubusercontent.com/carrismetropolitana/pdfs/novos-horarios/horarios/';
    const pdf_filename = `horario-singular-${req.params.stop_id}-${req.params.route_short_name}-${req.params.direction_id}.pdf`;
    const response = await fetch(pdf_base_url + pdf_filename);
    if (response.ok) {
      console.log(`🟢 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": File Exists`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdf_filename}"`);
      const pdfStream = Readable.from(response.body);
      pdfStream.pipe(res);
    } else {
      console.log(`🟡 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": File Not Found`);
      res.status(404).send();
    }
  } catch (err) {
    console.log(`🔴 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": Server Error`, err);
    res.status(500).send({});
  }
});

//
app.get('/api/stops', async (req, res) => {
  try {
    const foundDocuments = await GTFSAPIDB.Stop.find({});
    if (foundDocuments.length > 0) {
      foundDocuments.sort((a, b) => (a.stop_id > b.stop_id ? 1 : -1));
      console.log(`🟢 → Request for "/api/stops/[all]": ${foundDocuments.length} Resources Found`);
      res.send(foundDocuments);
    } else {
      console.log(`🟡 → Request for "/api/stops/[all]": Resources Not Found`);
      res.status(404).send([]);
    }
  } catch (err) {
    console.log(`🔴 → Request for "/api/stops/[all]": Server Error`, err);
    res.status(500).send([]);
  }
});

//
app.get('/api/stops/:stop_id', async (req, res) => {
  try {
    const foundDocument = await GTFSAPIDB.Stop.findOne({ stop_id: req.params.stop_id });
    if (foundDocument) {
      console.log(`🟢 → Request for "/api/stops/${req.params.stop_id}": ${foundDocument.length} Resources Found`);
      res.send(foundDocument);
    } else {
      console.log(`🟡 → Request for "/api/stops/${req.params.stop_id}": Resources Not Found`);
      res.status(404).send({});
    }
  } catch (err) {
    console.log(`🔴 → Request for "/api/stops/${req.params.stop_id}": Server Error`, err);
    res.status(500).send({});
  }
});

// set port, listen for requests
const PORT = process.env.API_PORT;
app.listen(PORT, async () => {
  console.log(`GTFS API listening on port ${PORT}...`);
  await GTFSAPIDB.connect();
  console.log();
});

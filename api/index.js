/* * */
/* IMPORTS */
const express = require('express');
const app = express();
const GTFSAPIDB = require('./services/GTFSAPIDB');

const alertsRoute = require('./routes/alerts.route');
const alertsPbRoute = require('./routes/alertsPb.route');
const municipalitiesRoute = require('./routes/municipalities.route');
const facilitiesRoute = require('./routes/facilities.route');
const linesRoute = require('./routes/lines.route');
const patternsRoute = require('./routes/patterns.route');
const shapesRoute = require('./routes/shapes.route');
const stopsRoute = require('./routes/stops.route');
const vehiclesRoute = require('./routes/vehicles.route');
const pdfsRoute = require('./routes/pdfs.route');

// Set CORS Header globally
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// ROUTES

app.use('/alerts', alertsRoute);
app.use('/alerts.pb', alertsPbRoute);

app.use('/municipalities', municipalitiesRoute);

app.use('/facilities', facilitiesRoute);

app.use('/lines', linesRoute);

app.use('/patterns', patternsRoute);

app.use('/shapes', shapesRoute);

app.use('/stops', stopsRoute);

app.use('/vehicles', vehiclesRoute);

app.use('/pdfs', pdfsRoute);

// Set port, listen for requests
const PORT = 5050;
app.listen(5050, async () => {
  console.log('GTFS API listening on port %s...', PORT);
  await GTFSAPIDB.connect();
  console.log();
});

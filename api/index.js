/* * */
/* IMPORTS */
const express = require('express');
const app = express();
const GTFSAPIDB = require('./databases/gtfsapidb');
const rateLimit = require('express-rate-limit');

const municipalitiesRoute = require('./routes/municipalities.route');
const linesRoute = require('./routes/lines.route');
const patternsRoute = require('./routes/patterns.route');
const stopsRoute = require('./routes/stops.route');
const pdfsRoute = require('./routes/pdfs.route');

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

// ROUTES

app.use('/municipalities', municipalitiesRoute);

app.use('/lines', linesRoute);

app.use('/patterns', patternsRoute);

app.use('/stops', stopsRoute);

app.use('/pdfs', pdfsRoute);

// Set port, listen for requests
const PORT = 5050;
app.listen(5050, async () => {
  console.log('GTFS API listening on port %s...', PORT);
  await GTFSAPIDB.connect();
  console.log();
});

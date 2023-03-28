/* * */
/* * */
/* * * * * */
/* DBCONTROL */
/* * */
/* * */

/* * */
/* IMPORTS */
const express = require('express');
const app = express();
const database = require('./database');
const KV = require('./KV');

app.get('/api/get', async (req, res) => {
  //

  // Filter bad characters
  for (let key in req.query) {
    req.query[key] = req.query[key].replace(/[^a-zA-Z0-9_%: -]/g, '');
  }

  res.set({
    'Content-Type': 'application/json',
    'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:",
    'Access-Control-Allow-Origin': '*',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
  });

  const cacheKey = new URLSearchParams(req.query).toString();

  // Get cache object from query
  const cachedObject = await KV.findOne({ key: cacheKey });

  if (cachedObject) {
    // If object is in cache
    console.log('Cache HIT:', cacheKey);
    res.append('X-Ricky-Cache', 'HIT');
    res.send(cachedObject.value);
  } else {
    try {
      // fetch the API
      const response = await fetch('https://horarios.carrismetropolitana.pt/?' + cacheKey, {
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      });

      let body = await response.json();
      delete body.sql;
      body = JSON.stringify(body);

      // Save to cache
      await KV.findOneAndUpdate({ key: cacheKey }, { value: body }, { upsert: true });

      // return the response
      console.log('Cache MISS:', cacheKey);
      res.append('X-Ricky-Cache', 'MISS');
      res.send(body);
    } catch (err) {
      console.log('- - - Error - - -');
      console.log('At key:', cacheKey);
      console.log(err);
      console.log('- - - Error - - -');
      res.status(500).send();
    }
  }
});

//// PURGE CACHE
app.get('/api/purge', async (req, res) => {
  //
  // Filter bad characters
  for (let key in req.query) {
    req.query[key] = req.query[key].replace(/[^a-zA-Z0-9_%: -]/g, '');
  }

  const cacheKey = new URLSearchParams(req.query).toString();

  // Get cache object from query
  const cachedObject = await KV.findOneAndDelete({ key: cacheKey });

  if (cachedObject) {
    // If object is in cache
    console.log('Cache PURGE:', cacheKey);
    res.append('X-Ricky-Cache', 'PURGE');
    res.send(cachedObject);
  } else {
    // return the response
    console.log('Cache PURGE:', cacheKey);
    res.append('X-Ricky-Cache', 'PURGE');
    res.send({ key: cacheKey, value: null });
  }
});

//// PURGE ALL CACHE
app.get('/api/purgeAllCache', async (req, res) => {
  //
  // Get cache object from query
  const cachedObject = await KV.deleteMany({});

  if (cachedObject) {
    // If object is in cache
    console.log('Cache PURGE:', 'ALL');
    res.append('X-Ricky-Cache', 'PURGE ALL');
    res.send(cachedObject);
  } else {
    // return the response
    console.log('Cache PURGE:', cacheKey);
    res.append('X-Ricky-Cache', 'PURGE');
    res.send({ key: cacheKey, value: null });
  }
});

//// INSPECT CACHE
app.get('/api/inspect', async (req, res) => {
  //
  // Filter bad characters
  for (let key in req.query) {
    req.query[key] = req.query[key].replace(/[^a-zA-Z0-9_%: -]/g, '');
  }

  const cacheKey = new URLSearchParams(req.query).toString();

  // Get cache object from query
  const cachedObject = await KV.findOne({ key: cacheKey });

  if (cachedObject) {
    // If object is in cache
    console.log('Cache INSPECT:', cacheKey);
    res.append('X-Ricky-Cache', 'INSPECT');
    res.send(cachedObject);
  } else {
    // return the response
    console.log('Cache INSPECT:', cacheKey);
    res.append('X-Ricky-Cache', 'INSPECT');
    res.send({ key: cacheKey, value: null });
  }
});

// set port, listen for requests
const PORT = process.env.API_PORT;
app.listen(PORT, async () => {
  console.log(`Cache listening on port ${PORT}`);
  await database.connect();
});

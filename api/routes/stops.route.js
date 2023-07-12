/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('../services/GTFSAPIDB');
const PCGIAPI = require('../services/PCGIAPI');
const router = express.Router();

//
router.get('/', async (req, res) => {
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
router.get('/:code', async (req, res) => {
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
router.get('/:code/patterns', async (req, res) => {
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

//
router.get('/:code/realtime', async (req, res) => {
  try {
    const result = await PCGIAPI.request('estimatedStopSchedules', {
      operators: ['41', '42', '43', '44'],
      stops: [req.params.code],
      numResults: 15,
    });
    if (result) {
      console.log('before', result);
      delete result.observedDriverId; // Remove useless property
      console.log('after', result);
      console.log('🟢 → Request for "/stops/%s/realtime": %s Found', req.params.code, result.length);
      res.send(result);
    } else {
      console.log('🟡 → Request for "/stops/%s/realtime": Not Found', req.params.code);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/stops/%s/realtime": Server Error', req.params.code, err);
    res.status(500).send({});
  }
});

module.exports = router;

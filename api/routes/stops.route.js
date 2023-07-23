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
      await res.send(foundManyDocuments);
      console.log('🟢 → Request for "/stops/[all]": %s Found', foundManyDocuments.length);
    } else {
      await res.status(404).send([]);
      console.log('🟡 → Request for "/stops/[all]": Not Found');
    }
  } catch (err) {
    await res.status(500).send([]);
    console.log('🔴 → Request for "/stops/[all]": Server Error', err);
  }
});

//
router.get('/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Stop.findOne({ code: { $eq: req.params.code } });
    if (foundOneDocument) {
      await res.send(foundOneDocument);
      console.log('🟢 → Request for "/stops/%s": 1 Found', req.params.code);
    } else {
      await res.status(404).send({});
      console.log('🟡 → Request for "/stops/%s": Not Found', req.params.code);
    }
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/stops/%s": Server Error', req.params.code, err);
  }
});

//
router.get('/:code/patterns', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Stop.findOne({ code: { $eq: req.params.code } }).populate({ path: 'patterns' });
    if (foundOneDocument) {
      await res.send(foundOneDocument);
      console.log('🟢 → Request for "/stops/%s": 1 Found', req.params.code);
    } else {
      await res.status(404).send({});
      console.log('🟡 → Request for "/stops/%s": Not Found', req.params.code);
    }
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/stops/%s": Server Error', req.params.code, err);
  }
});

//
router.get('/:code/realtime', async (req, res) => {
  try {
    const result = await PCGIAPI.request('openservices/estimatedStopSchedules', {
      method: 'POST',
      body: {
        operators: ['41', '42', '43', '44'],
        stops: [req.params.code],
        numResults: 15,
      },
    });
    if (result) {
      result.forEach((element) => delete element.observedDriverId); // Remove useless property
      await res.send(result);
      console.log('🟢 → Request for "/stops/%s/realtime": %s Found', req.params.code, result.length);
    } else {
      await res.status(404).send({});
      console.log('🟡 → Request for "/stops/%s/realtime": Not Found', req.params.code);
    }
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/stops/%s/realtime": Server Error', req.params.code, err);
  }
});

module.exports = router;

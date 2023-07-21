/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('../services/GTFSAPIDB');
const router = express.Router();

//
router.get('/', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Municipality.find();
    if (foundManyDocuments.length > 0) {
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      foundManyDocuments.sort((a, b) => collator.compare(a.name, b.name));
      console.log('🟢 → Request for "/municipalities/[all]": %s Found', foundManyDocuments.length);
      await res.send(foundManyDocuments);
    } else {
      console.log('🟡 → Request for "/municipalities/[all]": Not Found');
      await res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/municipalities/[all]": Server Error', err);
    await res.status(500).send([]);
  }
});

//
router.get('/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Municipality.findOne({ code: { $eq: req.params.code } });
    if (foundOneDocument) {
      console.log('🟢 → Request for "/municipalities/%s": 1 Found', req.params.code);
      await res.send(foundOneDocument);
    } else {
      console.log('🟡 → Request for "/municipalities/%s": Not Found', req.params.code);
      await res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/municipalities/%s": Server Error', req.params.code, err);
    await res.status(500).send({});
  }
});

module.exports = router;

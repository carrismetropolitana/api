/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('../services/GTFSAPIDB');
const router = express.Router();

//
router.get('/', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Facility.find();
    if (foundManyDocuments.length > 0) {
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
      console.log('🟢 → Request for "/facilities/[all]": %s Found', foundManyDocuments.length);
      await res.send(foundManyDocuments);
    } else {
      console.log('🟡 → Request for "/facilities/[all]": Not Found');
      await res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/facilities/[all]": Server Error', err);
    await res.status(500).send([]);
  }
});

//
router.get('/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Facility.findOne({ code: { $eq: req.params.code } });
    if (foundOneDocument) {
      console.log('🟢 → Request for "/facilities/%s": 1 Found', req.params.code);
      await res.send(foundOneDocument);
    } else {
      console.log('🟡 → Request for "/facilities/%s": Not Found', req.params.code);
      await res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/facilities/%s": Server Error', req.params.code, err);
    await res.status(500).send({});
  }
});

module.exports = router;

/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('../services/GTFSAPIDB');
const router = express.Router();

//
router.get('/', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Line.find();
    if (foundManyDocuments.length > 0) {
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
      await res.send(foundManyDocuments);
      console.log('🟢 → Request for "/lines/[all]": %s Found', foundManyDocuments.length);
    } else {
      await res.status(404).send([]);
      console.log('🟡 → Request for "/lines/[all]": Not Found');
    }
  } catch (err) {
    await res.status(500).send([]);
    console.log('🔴 → Request for "/lines/[all]": Server Error', err);
  }
});

//
router.get('/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Line.findOne({ code: { $eq: req.params.code } });
    if (foundOneDocument) {
      await res.send(foundOneDocument);
      console.log('🟢 → Request for "/lines/%s": 1 Found', req.params.code);
    } else {
      await res.status(404).send({});
      console.log('🟡 → Request for "/lines/%s": Not Found', req.params.code);
    }
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/lines/%s": Server Error', req.params.code, err);
  }
});

module.exports = router;

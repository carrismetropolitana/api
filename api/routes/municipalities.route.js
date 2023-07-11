/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('./databases/gtfsapidb');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const foundManyDocuments = await GTFSAPIDB.Municipality.find();
    if (foundManyDocuments.length > 0) {
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      foundManyDocuments.sort((a, b) => collator.compare(a.name, b.name));
      console.log('🟢 → Request for "/municipalities/[all]": %s Found', foundManyDocuments.length);
      res.send(foundManyDocuments);
    } else {
      console.log('🟡 → Request for "/municipalities/[all]": Not Found');
      res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/municipalities/[all]": Server Error', err);
    res.status(500).send([]);
  }
});

module.exports = router;

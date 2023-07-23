/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('../services/GTFSAPIDB');
const router = express.Router();

//
router.get('/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Pattern.findOne({ code: { $eq: req.params.code } });
    if (foundOneDocument) {
      await res.send(foundOneDocument);
      console.log('🟢 → Request for "/patterns/%s": 1 Found', req.params.code);
    } else {
      await res.status(404).send({});
      console.log('🟡 → Request for "/patterns/%s": Not Found', req.params.code);
    }
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/patterns/%s": Server Error', req.params.code, err);
  }
});

module.exports = router;

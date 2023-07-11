/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('../databases/gtfsapidb');
const router = express.Router();

//
router.get('/:code', async (req, res) => {
  try {
    const foundOneDocument = await GTFSAPIDB.Pattern.findOne({ code: { $eq: req.params.code } });
    if (foundOneDocument) {
      console.log('🟢 → Request for "/patterns/%s": 1 Found', req.params.code);
      res.send(foundOneDocument);
    } else {
      console.log('🟡 → Request for "/patterns/%s": Not Found', req.params.code);
      res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/patterns/%s": Server Error', req.params.code, err);
    res.status(500).send({});
  }
});

module.exports = router;

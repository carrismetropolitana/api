/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('../services/GTFSAPIDB');
const PCGIAPI = require('../services/PCGIAPI');
const router = express.Router();

//
router.get('/', async (req, res) => {
  try {
    const result = await PCGIAPI.request('vehiclelocation/vehiclePosition/mapVehicles');
    console.log(result);
    // if (result) {
    //   result.forEach((element) => delete element.observedDriverId); // Remove useless property
    //   console.log('🟢 → Request for "/stops/%s/realtime": %s Found', req.params.code, result.length);
    //   await res.send(result);
    // } else {
    //   console.log('🟡 → Request for "/stops/%s/realtime": Not Found', req.params.code);
    //   await res.status(404).send({});
    // }
  } catch (err) {
    console.log('🔴 → Request for "/stops/%s/realtime": Server Error', req.params.code, err);
    await res.status(500).send({});
  }
});

module.exports = router;

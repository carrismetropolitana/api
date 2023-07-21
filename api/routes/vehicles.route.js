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
    if (result) {
      const responseToClient = result.map((element) => {
        return {
          vehicle_id: element.Vid,
          trip_id: element.Lna,
          latitude: element.Lat,
          longitude: element.Lng,
          heading: element.Coa,
          speed: element.Spd,
        };
      });
      console.log('🟢 → Request for "/vehicles/[all]": %s Found', responseToClient.length);
      await res.send(responseToClient);
    } else {
      console.log('🟡 → Request for "/vehicles/[all]": Not Found');
      await res.status(404).send({});
    }
  } catch (err) {
    console.log('🔴 → Request for "/vehicles/[all]": Server Error', err);
    await res.status(500).send({});
  }
});

module.exports = router;

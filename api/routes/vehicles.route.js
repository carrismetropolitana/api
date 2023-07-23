/* * */
/* IMPORTS */
const express = require('express');
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
      await res.send(responseToClient);
      console.log('🟢 → Request for "/vehicles/[all]": %s Found', responseToClient.length);
    } else {
      await res.status(404).send({});
      console.log('🟡 → Request for "/vehicles/[all]": Not Found');
    }
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/vehicles/[all]": Server Error', err);
  }
});

module.exports = router;

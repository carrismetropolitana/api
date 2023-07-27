/* * */
/* IMPORTS */
const express = require('express');
const router = express.Router();
const protobuf = require('protobufjs');
const gtfsRealtime = protobuf.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

//
router.get('/', async (req, res) => {
  try {
    const allAlertsResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts-v2');
    const allAlerts = await allAlertsResponse.json();
    const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
    const message = FeedMessage.fromObject(allAlerts);
    const buffer = FeedMessage.encode(message).finish();
    await res.send(buffer);
    console.log('🟢 → Request for "/alerts.pb": Found');
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/alerts.pb": Server Error', err);
  }
});

module.exports = router;

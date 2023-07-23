/* * */
/* IMPORTS */
const express = require('express');
const router = express.Router();
const alertsRt = require('../services/alerts-rt');

//
router.get('/', async (req, res) => {
  try {
    const allAlertsResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts');
    const allAlerts = await allAlertsResponse.json();
    const feedBuffer = alertsRt.createAlertFeed(allAlerts);
    await res.send(feedBuffer);
    console.log('🟢 → Request for "/alerts.pb": Found');
  } catch (err) {
    await res.status(500).send({});
    console.log('🔴 → Request for "/alerts.pb": Server Error', err);
  }
});

module.exports = router;

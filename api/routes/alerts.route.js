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
  } catch (err) {
    console.log('🔴 → Request for "/lines/[all]": Server Error', err);
    await res.status(500).send([]);
  }
});

module.exports = router;

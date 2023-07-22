/* * */
/* IMPORTS */
const express = require('express');
const GTFSAPIDB = require('../services/GTFSAPIDB');
const router = express.Router();
const protobuf = require('protobufjs');
//
router.get('/', async (req, res) => {
  try {
    const allAlertsResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts');
    const allAlerts = await allAlertsResponse.json();
    console.log(allAlerts);

    protobuf.load('./protos/gtfs-realtime.proto', async function (err, root) {
      if (err) throw err;
      // Obtain a message type
      var FeedMessage = root.lookupType('transit_realtime.FeedMessage');
      var FeedHeader = root.lookupType('transit_realtime.FeedHeader');

      const header = FeedHeader.create({ ...allAlerts.header, gtfs_realtime_version: '2.0', incrementality: 0 });

      const finalMessage = FeedMessage.create({ header: header });

      var buffer = FeedMessage.encode(finalMessage).finish();

      await res.send(buffer);
    });

    return;

    protobuf.load('../protos/gtfs-realtime.proto', function (err, root) {
      if (err) throw err;
      // Obtain a message type
      var FeedMessage = root.lookupType('transit_realtime.FeedMessage');
      var FeedHeader = root.lookupType('transit_realtime.FeedHeader');
      var FeedEntity = root.lookupType('transit_realtime.FeedEntity');
      var Alert = root.lookupType('transit_realtime.Alert');
      var TimeRange = root.lookupType('transit_realtime.TimeRange');
      var TranslatedString = root.lookupType('transit_realtime.TranslatedString');
      var TranslatedImage = root.lookupType('transit_realtime.TranslatedImage');
      var EntitySelector = root.lookupType('transit_realtime.EntitySelector');
      for (const entity of allAlerts.entity) {
        for (const alert of entity.alert) {
          Alert.create({
            active_period: TimeRange.create({
              start: alert.active_period.start,
              end: alert.active_period.end,
            }),
            informed_entity: EntitySelector.create(),
          });
        }
      }
    });

    const foundManyDocuments = await GTFSAPIDB.Line.find();
    if (foundManyDocuments.length > 0) {
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
      console.log('🟢 → Request for "/lines/[all]": %s Found', foundManyDocuments.length);
      await res.send(foundManyDocuments);
    } else {
      console.log('🟡 → Request for "/lines/[all]": Not Found');
      await res.status(404).send([]);
    }
  } catch (err) {
    console.log('🔴 → Request for "/lines/[all]": Server Error', err);
    await res.status(500).send([]);
  }
});

module.exports = router;

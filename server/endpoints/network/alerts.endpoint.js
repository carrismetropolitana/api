/* * */

const protobuf = require('protobufjs');
const gtfsRealtime = protobuf.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

/* * */

module.exports.json = async (request, reply) => {
  const allAlertsResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts-v2');
  const allAlerts = await allAlertsResponse.json();
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(allAlerts || []);
};

/* * */

module.exports.protobuf = async (request, reply) => {
  const allAlertsResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts-v2');
  const allAlerts = await allAlertsResponse.json();
  const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
  const message = FeedMessage.fromObject(allAlerts);
  const buffer = FeedMessage.encode(message).finish();
  return reply.send(buffer);
};

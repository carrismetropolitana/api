/* * */

const protobuf = require('protobufjs');
const RTEVENTS = require('../../services/RTEVENTS');
const gtfsRealtime = protobuf.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

/* * */

module.exports.json = async (request, reply) => {
  // Get the saved events from RTEVENTS
  const rtFeed = await RTEVENTS.json();
  // Return response
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(rtFeed || []);
};

/* * */

module.exports.protobuf = async (request, reply) => {
  // Get the saved events from RTEVENTS
  const rtFeed = await RTEVENTS.protobuf();
  // Do the conversion to PB
  const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
  const message = FeedMessage.fromObject(rtFeed);
  const buffer = FeedMessage.encode(message).finish();
  return reply.send(buffer);
};

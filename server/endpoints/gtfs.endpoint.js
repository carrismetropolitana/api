//
const Buffer = require('buffer').Buffer;

//
module.exports.feed = async (request, reply) => {
  const gtfsFeedResponse = await fetch('https://github.com/carrismetropolitana/gtfs/raw/live/CarrisMetropolitana.zip');
  const gtfsFeed = await gtfsFeedResponse.arrayBuffer();
  const gtfsFeedBbuffer = Buffer.from(gtfsFeed, 'utf-8');
  reply.header('Content-Type', 'application/zip');
  reply.header('Content-Disposition', 'attachment; filename="CarrisMetropolitana.zip"');
  reply.send(gtfsFeedBbuffer);
};

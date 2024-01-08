/* * */

const Buffer = require('buffer').Buffer;

/* * */

module.exports.feed = async (request, reply) => {
  const gtfsFeedResponse = await fetch(process.env.GTFS_URL);
  const gtfsFeed = await gtfsFeedResponse.arrayBuffer();
  const gtfsFeedBbuffer = Buffer.from(gtfsFeed, 'utf-8');
  return reply
    .code(200)
    .header('Content-Type', 'application/zip')
    .header('Content-Disposition', 'attachment; filename="CarrisMetropolitana.zip"')
    .send(gtfsFeedBbuffer || null);
};

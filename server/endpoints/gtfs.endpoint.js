//
module.exports.feed = async (request, reply) => {
  const gtfsFeedResponse = await fetch('https://github.com/carrismetropolitana/gtfs/raw/live/CarrisMetropolitana.zip');
  const gtfsFeed = await gtfsFeedResponse.arrayBuffer();
  reply.header('Content-Type', 'application/zip');
  reply.header('Content-Disposition', 'attachment; filename="CarrisMetropolitana.zip"');
  return reply.send(gtfsFeed);
};

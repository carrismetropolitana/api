//
module.exports.feed = async (request, reply) => {
  const gtfsFeedResponse = await fetch('https://github.com/carrismetropolitana/gtfs/raw/live/CarrisMetropolitana.zip');
  const gtfsFeed = await gtfsFeedResponse.arrayBuffer();
  return reply.send(gtfsFeedResponse);
};

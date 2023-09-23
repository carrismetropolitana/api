//
module.exports.feed = async (request, reply) => {
  const gtfsFeedResponse = await fetch('https://github.com/carrismetropolitana/gtfs/raw/live/CarrisMetropolitana.zip');
  reply.header('Content-Type', 'application/zip');
  reply.header('Content-Disposition', 'attachment; filename="CarrisMetropolitana.zip"');
  //   const gtfsFeed = await gtfsFeedResponse.();
  gtfsFeedResponse.body.pipe(reply.raw);
};

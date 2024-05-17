/* * */

const Buffer = require('buffer').Buffer;

/* * */

module.exports.gtfs = async (request, reply) => {
	const gtfsFeedResponse = await fetch(process.env.GTFS_URL);
	// const gtfsFeedResponse = await fetch('https://github.com/carrismetropolitana/gtfs/raw/live/CarrisMetropolitana.zip');
	const gtfsFeed = await gtfsFeedResponse.arrayBuffer();
	const gtfsFeedBbuffer = Buffer.from(gtfsFeed, 'utf-8');
	return reply
		.code(200)
		.header('Content-Type', 'application/zip')
		.header('Content-Disposition', 'attachment; filename="CarrisMetropolitana.zip"')
		.send(gtfsFeedBbuffer || null);
};

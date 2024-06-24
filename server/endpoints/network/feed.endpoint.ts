/* * */

// import { Buffer } from 'buffer';

/* * */

const gtfs = async (_, reply) => {
	const gtfsFeedResponse = await fetch(process.env.GTFS_URL);

	// const gtfsFeedResponse = await fetch(process.env.GTFS_URL);
	// const gtfsFeed = await gtfsFeedResponse.arrayBuffer();

	// const gtfsFeed = await gtfsFeedResponse.arrayBuffer();
	// const gtfsFeedBbuffer = Buffer.from(new Uint8Array(gtfsFeed).toString(), 'utf-8');
	return reply
		.code(200)
		.header('Content-Type', 'application/zip')
		.header('Content-Disposition', 'attachment; filename="CarrisMetropolitana.zip"')
		.send(gtfsFeedResponse || null);
};

/* * */

export default {
	gtfs,
};

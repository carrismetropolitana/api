/* * */

const gtfs = async (_, reply) => {
	const gtfsFeedResponse = await fetch(process.env.GTFS_URL);
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

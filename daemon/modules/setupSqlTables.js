/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');

module.exports = {
  createAllTables: async () => {
    //

    let dropExistingTables = 'DROP TABLE IF EXISTS calendar_dates, routes, shapes, stop_times, stops, trips;';
    await GTFSParseDB.connection.query(dropExistingTables);
    console.log('⤷ Dropped existing SQL tables.');

    // Create tables

    await GTFSParseDB.connection.query(`CREATE TABLE calendar_dates (
        service_id VARCHAR(255),
        date VARCHAR(8)
    );`);
    await GTFSParseDB.connection.query('CREATE INDEX calendar_dates_service_id_idx ON calendar_dates ("service_id");');
    console.log('⤷ Created SQL table "calendar_dates".');

    await GTFSParseDB.connection.query(`CREATE TABLE routes (
        route_id VARCHAR(10),
        route_short_name VARCHAR(10),
        route_long_name VARCHAR(255),
        route_type VARCHAR(255),
        route_color VARCHAR(6),
        route_text_color VARCHAR(6)
    );`);
    await GTFSParseDB.connection.query('CREATE INDEX routes_route_id_idx ON routes ("route_id");');
    console.log('⤷ Created SQL table "routes".');

    await GTFSParseDB.connection.query(`CREATE TABLE shapes (
        shape_id VARCHAR(255),
        shape_pt_lat FLOAT(6),
        shape_pt_lon FLOAT(6),
        shape_pt_sequence SMALLINT,
        shape_dist_traveled FLOAT(6)
    );`);
    await GTFSParseDB.connection.query('CREATE INDEX shapes_shape_id_idx ON shapes ("shape_id");');
    console.log('⤷ Created SQL table "shapes".');

    await GTFSParseDB.connection.query(`CREATE TABLE stop_times (
        trip_id VARCHAR(255),
        arrival_time VARCHAR(8),
        stop_id VARCHAR(6),
        stop_sequence SMALLINT,
        shape_dist_traveled VARCHAR(255)
    );`);
    await GTFSParseDB.connection.query('CREATE INDEX stop_times_trip_id_idx ON stop_times ("trip_id");');
    await GTFSParseDB.connection.query('CREATE INDEX stop_times_stop_id_idx ON stop_times ("stop_id");');
    console.log('⤷ Created SQL table "stop_times".');

    await GTFSParseDB.connection.query(`CREATE TABLE stops (
        stop_id VARCHAR(6),
        stop_name VARCHAR(255),
        stop_lat VARCHAR(10),
        stop_lon VARCHAR(10)
    );`);
    await GTFSParseDB.connection.query('CREATE INDEX stops_stop_id_idx ON stops ("stop_id");');
    console.log('⤷ Created SQL table "stops".');

    await GTFSParseDB.connection.query(`CREATE TABLE trips (
        route_id VARCHAR(255),
        service_id VARCHAR(255),
        trip_id VARCHAR(255),
        trip_headsign VARCHAR(255),
        direction_id SMALLINT,
        shape_id VARCHAR(255)
    );`);
    await GTFSParseDB.connection.query('CREATE INDEX trips_route_id_idx ON trips ("route_id");');
    await GTFSParseDB.connection.query('CREATE INDEX trips_route_id_service_id_idx ON trips ("route_id", "service_id");');
    console.log('⤷ Created SQL table "trips".');

    console.log('⤷ All SQL tables created.');

    //
  },
};

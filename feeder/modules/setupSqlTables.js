/* * */
/* IMPORTS */
const FEEDERDB = require('../databases/feederdb');

module.exports = async () => {
  //

  // Drop existing tables
  await FEEDERDB.connection.query('DROP TABLE IF EXISTS municipalities, facilities, helpdesks, calendar_dates, routes, shapes, stop_times, stops, trips;');
  console.log('⤷ Dropped existing SQL tables.');

  // Create tables

  await FEEDERDB.connection.query(`CREATE TABLE municipalities (
        municipality_prefix VARCHAR(2),
        municipality_id VARCHAR(4),
        municipality_name VARCHAR(255),
        district_id VARCHAR(255),
        district_name VARCHAR(255),
        region_id VARCHAR(255),
        region_name VARCHAR(255)
    );`);
  await FEEDERDB.connection.query('CREATE INDEX municipalities_municipality_id_idx ON municipalities ("municipality_id");');
  console.log('⤷ Created SQL table "municipalities".');

  await FEEDERDB.connection.query(`CREATE TABLE facilities (
        facility_id VARCHAR(255),
        facility_type VARCHAR(255),
        facility_name VARCHAR(255),
        facility_lat VARCHAR(255),
        facility_lon VARCHAR(255),
        facility_phone VARCHAR(255),
        facility_email VARCHAR(255),
        facility_url VARCHAR(255),
        address VARCHAR(255),
        postal_code VARCHAR(255),
        locality VARCHAR(255),
        parish_id VARCHAR(255),
        parish_name VARCHAR(255), 
        municipality_id VARCHAR(255),
        municipality_name VARCHAR(255),
        district_id VARCHAR(255),
        district_name VARCHAR(255),
        region_id VARCHAR(255),
        region_name VARCHAR(255),
        facility_stops VARCHAR(255)
    );`);
  await FEEDERDB.connection.query('CREATE INDEX facilities_facility_id_idx ON facilities ("facility_id");');
  console.log('⤷ Created SQL table "facilities".');

  await FEEDERDB.connection.query(`CREATE TABLE helpdesks (
        helpdesk_id VARCHAR(255),
        helpdesk_type VARCHAR(255),
        helpdesk_name VARCHAR(255),
        helpdesk_lat VARCHAR(255),
        helpdesk_lon VARCHAR(255),
        helpdesk_phone VARCHAR(255),
        helpdesk_email VARCHAR(255),
        helpdesk_url VARCHAR(255),
        address VARCHAR(255),
        postal_code VARCHAR(255),
        locality VARCHAR(255),
        parish_id VARCHAR(255),
        parish_name VARCHAR(255),
        municipality_id VARCHAR(255),
        municipality_name VARCHAR(255),
        district_id VARCHAR(255),
        district_name VARCHAR(255),
        region_id VARCHAR(255),
        region_name VARCHAR(255),
        hours_monday VARCHAR(255),
        hours_tuesday VARCHAR(255),
        hours_wednesday VARCHAR(255),
        hours_thursday VARCHAR(255),
        hours_friday VARCHAR(255),
        hours_saturday VARCHAR(255),
        hours_sunday VARCHAR(255),
        hours_special VARCHAR(255),
        helpdesk_stops VARCHAR(255)
    );`);
  await FEEDERDB.connection.query('CREATE INDEX helpdesks_helpdesk_id_idx ON helpdesks ("helpdesk_id");');
  console.log('⤷ Created SQL table "helpdesks".');

  await FEEDERDB.connection.query(`CREATE TABLE calendar_dates (
        service_id VARCHAR(255),
        date VARCHAR(8)
    );`);
  await FEEDERDB.connection.query('CREATE INDEX calendar_dates_service_id_idx ON calendar_dates ("service_id");');
  console.log('⤷ Created SQL table "calendar_dates".');

  await FEEDERDB.connection.query(`CREATE TABLE routes (
        route_id VARCHAR(10),
        route_short_name VARCHAR(10),
        route_long_name VARCHAR(255),
        route_type VARCHAR(255),
        route_color VARCHAR(6),
        route_text_color VARCHAR(6)
    );`);
  await FEEDERDB.connection.query('CREATE INDEX routes_route_id_idx ON routes ("route_id");');
  console.log('⤷ Created SQL table "routes".');

  await FEEDERDB.connection.query(`CREATE TABLE shapes (
        shape_id VARCHAR(255),
        shape_pt_lat FLOAT(6),
        shape_pt_lon FLOAT(6),
        shape_pt_sequence SMALLINT,
        shape_dist_traveled FLOAT(6)
    );`);
  await FEEDERDB.connection.query('CREATE INDEX shapes_shape_id_idx ON shapes ("shape_id");');
  console.log('⤷ Created SQL table "shapes".');

  await FEEDERDB.connection.query(`CREATE TABLE stop_times (
        trip_id VARCHAR(255),
        arrival_time VARCHAR(8),
        stop_id VARCHAR(6),
        stop_sequence SMALLINT,
        shape_dist_traveled VARCHAR(255)
    );`);
  await FEEDERDB.connection.query('CREATE INDEX stop_times_trip_id_idx ON stop_times ("trip_id");');
  await FEEDERDB.connection.query('CREATE INDEX stop_times_stop_id_idx ON stop_times ("stop_id");');
  console.log('⤷ Created SQL table "stop_times".');

  await FEEDERDB.connection.query(`CREATE TABLE stops (
        stop_id VARCHAR(6),
        stop_name VARCHAR(255),
        stop_short_name VARCHAR(255),
        tts_stop_name VARCHAR(255),
        stop_lat VARCHAR(10),
        stop_lon VARCHAR(10),
        locality VARCHAR(255),
        parish_id VARCHAR(255),
        parish_name VARCHAR(255),
        municipality_id VARCHAR(255),
        municipality_name VARCHAR(255),
        district_id VARCHAR(255),
        district_name VARCHAR(255),
        region_id VARCHAR(255),
        region_name VARCHAR(255),
        wheelchair_boarding VARCHAR(1),
        near_health_clinic BOOLEAN,
        near_hospital BOOLEAN,
        near_university BOOLEAN,
        near_school BOOLEAN,
        near_police_station BOOLEAN,
        near_fire_station BOOLEAN,
        near_shopping BOOLEAN,
        near_historic_building BOOLEAN,
        near_transit_office BOOLEAN,
        light_rail BOOLEAN,
        subway BOOLEAN,
        train BOOLEAN,
        boat BOOLEAN,
        airport BOOLEAN,
        bike_sharing BOOLEAN,
        bike_parking BOOLEAN,
        car_parking BOOLEAN
    );`);
  await FEEDERDB.connection.query('CREATE INDEX stops_stop_id_idx ON stops ("stop_id");');
  console.log('⤷ Created SQL table "stops".');

  await FEEDERDB.connection.query(`CREATE TABLE trips (
        route_id VARCHAR(255),
        pattern_id VARCHAR(255),
        service_id VARCHAR(255),
        trip_id VARCHAR(255),
        trip_headsign VARCHAR(255),
        direction_id SMALLINT,
        shape_id VARCHAR(255)
    );`);
  await FEEDERDB.connection.query('CREATE INDEX trips_route_id_idx ON trips ("route_id");');
  await FEEDERDB.connection.query('CREATE INDEX trips_route_id_service_id_idx ON trips ("route_id", "service_id");');
  console.log('⤷ Created SQL table "trips".');

  console.log('⤷ All SQL tables created.');

  //
};

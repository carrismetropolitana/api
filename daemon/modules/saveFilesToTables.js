/* * */
/* IMPORTS */
const fs = require('fs');
const copyFrom = require('pg-copy-streams').from;
const GTFSParseDB = require('../databases/gtfsparsedb');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify/sync');
const timeCalc = require('./timeCalc');

module.exports = {
  saveAllFiles: async () => {
    //

    console.log(`⤷ Creating directory "/data-temp/gtfs/prepared/"...`);
    fs.mkdirSync('/data-temp/gtfs/prepared/');

    await prepareFileImport('calendar_dates', ['service_id', 'date']);
    await prepareFileImport('routes', ['route_id', 'route_short_name', 'route_long_name', 'route_type', 'route_color', 'route_text_color']);
    await prepareFileImport('shapes', ['shape_id', 'shape_pt_lat', 'shape_pt_lon', 'shape_pt_sequence', 'shape_dist_traveled']);
    await prepareFileImport('stop_times', ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence']);
    await prepareFileImport('stops', ['stop_id', 'stop_name', 'stop_lat', 'stop_lon']);
    await prepareFileImport('trips', ['route_id', 'service_id', 'trip_id', 'trip_headsign', 'direction_id', 'shape_id']);

    await importFileToTable('calendar_dates');
    await importFileToTable('routes');
    await importFileToTable('shapes');
    await importFileToTable('stop_times');
    await importFileToTable('stops');
    await importFileToTable('trips');

    //
  },
};

// Parse the files first
async function prepareFileImport(filename, headers) {
  console.log(`⤷ Creating file "/data-temp/gtfs/prepared/${filename}.txt"...`);
  const headersString = headers.join(',');
  fs.writeFileSync(`/data-temp/gtfs/prepared/${filename}.txt`, headersString + '\n');
  console.log(`⤷ Preparing "/data-temp/gtfs/extracted/${filename}.txt" to "/data-temp/gtfs/prepared/${filename}.txt"...`);
  const parserStream = fs.createReadStream(`/data-temp/gtfs/extracted/${filename}.txt`).pipe(parse({ columns: true, trim: true, skip_empty_lines: true, ignore_last_delimiters: true, bom: true }));
  let counter = 0;
  for await (const rowObject of parserStream) {
    let rowArray = [];
    for (const key of headers) {
      const colString = rowObject[key];
      rowArray.push(colString);
    }
    const rowString = stringify([rowArray], { trim: true });
    fs.appendFileSync(`/data-temp/gtfs/prepared/${filename}.txt`, rowString);
    counter++;
  }
  console.log(`⤷ Prepared ${counter} rows in "/data-temp/gtfs/prepared/${filename}.txt".`);
}

// LOAD files into the database
async function importFileToTable(filename) {
  const startTime = process.hrtime();
  console.log(`⤷ Importing "/data-temp/gtfs/prepared/${filename}.txt" to "${filename}" table...`);
  // Setup the query and a filesystem connection using 'pg-copy-streams' and 'fs'
  const stream = GTFSParseDB.connection.query(copyFrom(`COPY ${filename} FROM STDIN CSV HEADER DELIMITER ',' QUOTE '"'`));
  const fileStream = fs.createReadStream(`/data-temp/gtfs/prepared/${filename}.txt`);
  // Pipe the contents of the file into the pg-copy-stream function
  const { rowCount } = await new Promise((resolve, reject) => {
    fileStream
      .pipe(stream)
      .on('finish', () => resolve(stream))
      .on('error', reject);
  });
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Saved "/data-temp/gtfs/prepared/${filename}.txt" to "${filename}" table. ${rowCount} rows in ${elapsedTime}.`);
}

const fs = require('fs');
const FEEDERDB = require('../databases/FEEDERDB');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify/sync');
const copyFrom = require('pg-copy-streams').from;
const timeCalc = require('../modules/timeCalc');

//

module.exports = async (FILE_OPTIONS) => {
  //

  console.log(`⤷ Importing "${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);

  // Drop existing table
  await FEEDERDB.connection.query(`DROP TABLE IF EXISTS ${FILE_OPTIONS.file_name};`);
  console.log(`⤷ Dropped existing SQL table "${FILE_OPTIONS.file_name}".`);

  // Create table
  await FEEDERDB.connection.query(FILE_OPTIONS.table_query);
  console.log(`⤷ Created SQL table "${FILE_OPTIONS.file_name}".`);

  // Create indexes
  for (const indexQuery of FILE_OPTIONS.index_queries) {
    await FEEDERDB.connection.query(indexQuery);
    console.log(`⤷ Created index on SQL table "${FILE_OPTIONS.file_name}".`);
  }

  // Prepare file
  await prepareFile(FILE_OPTIONS);

  // Import to table
  await importFileToTable(FILE_OPTIONS);

  //
};

// Parse the files first
async function prepareFile(FILE_OPTIONS) {
  const startTime = process.hrtime();
  console.log(`⤷ Creating file "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);
  const headersString = FILE_OPTIONS.file_headers.join(',');
  fs.writeFileSync(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`, headersString + '\n');
  console.log(`⤷ Preparing "${FILE_OPTIONS.raw_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" to "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);
  const parserStream = fs.createReadStream(`${FILE_OPTIONS.raw_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`).pipe(parse({ columns: true, trim: true, skip_empty_lines: true, ignore_last_delimiters: true, bom: true }));
  let rowCount = 0;
  for await (const rowObject of parserStream) {
    let rowArray = [];
    for (const key of FILE_OPTIONS.file_headers) {
      const colString = rowObject[key];
      rowArray.push(colString);
    }
    const rowString = stringify([rowArray], { trim: true });
    fs.appendFileSync(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`, rowString);
    rowCount++;
  }
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Prepared "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" (${rowCount} rows in ${elapsedTime})`);
  //
}

// LOAD files into the database
async function importFileToTable(FILE_OPTIONS) {
  const startTime = process.hrtime();
  console.log(`⤷ Importing "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" to "${FILE_OPTIONS.file_name}" table...`);
  // Setup the query and a filesystem connection using 'pg-copy-streams' and 'fs'
  const stream = FEEDERDB.connection.query(copyFrom(`COPY ${FILE_OPTIONS.file_name} FROM STDIN CSV HEADER DELIMITER ',' QUOTE '"'`));
  const fileStream = fs.createReadStream(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`);
  // Pipe the contents of the file into the pg-copy-stream function
  const { rowCount } = await new Promise((resolve, reject) => {
    fileStream
      .pipe(stream)
      .on('finish', () => resolve(stream))
      .on('error', reject);
  });
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Saved "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" to "${FILE_OPTIONS.file_name}" table. ${rowCount} rows in ${elapsedTime}.`);
}

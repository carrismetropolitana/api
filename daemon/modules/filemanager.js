/* * * * * */
/* DATABASE */
/* * */

/* * */
/* IMPORTS */
const fs = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const AdmZip = require('adm-zip');

//
// Download file from URL
const downloadFromUrl = async (url) => {
  removeTempDirectory();
  createTempDirectory();
  const destination = '/data-temp/gtfs/gtfs.zip';
  const stream = fs.createWriteStream(destination);
  const { body } = await fetch(url);
  await finished(Readable.fromWeb(body).pipe(stream));
  console.log(`⤷ Downloaded file from "${url}" to "${destination}" successfully.`);
};

//
// Extract downloaded archive to directory
const extractArchive = async () => {
  const zip = new AdmZip('/data-temp/gtfs/gtfs.zip');
  zip.extractAllTo('/data-temp/gtfs/extracted/', true, false);
  console.log('⤷ Extracted file to "/data-temp/gtfs/extracted/" successfully.');
};

//
// Create temporary directory
const createTempDirectory = async () => {
  fs.mkdirSync('/data-temp/gtfs/');
  console.log('⤷ Created directory "/data-temp/gtfs" successfully.');
};

//
// Remove temporary directory
const removeTempDirectory = async () => {
  fs.rmSync('/data-temp/gtfs/', { recursive: true, force: true });
  console.log('⤷ Removed directory "/data-temp/gtfs" successfully.');
};

//
// Export functions from this module
module.exports = {
  downloadFromUrl,
  extractArchive,
  createTempDirectory,
  removeTempDirectory,
};

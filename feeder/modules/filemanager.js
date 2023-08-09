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
  const destination = '/tmp/gtfs/gtfs.zip';
  const stream = fs.createWriteStream(destination);
  const { body } = await fetch(url);
  await finished(Readable.fromWeb(body).pipe(stream));
  console.log(`⤷ Downloaded file from "${url}" to "${destination}" successfully.`);
};

//
// Extract downloaded archive to directory
const extractArchive = async () => {
  const zip = new AdmZip('/tmp/gtfs/gtfs.zip');
  zip.extractAllTo('/tmp/gtfs/extracted/', true, false);
  console.log('⤷ Extracted file to "/tmp/gtfs/extracted/" successfully.');
};

//
// Create temporary directory
const createTempDirectory = async () => {
  fs.mkdirSync('/tmp/gtfs/');
  console.log('⤷ Created directory "/tmp/gtfs" successfully.');
};

//
// Remove temporary directory
const removeTempDirectory = async () => {
  fs.rmSync('/tmp/gtfs/', { recursive: true, force: true });
  console.log('⤷ Removed directory "/tmp/gtfs" successfully.');
};

//
// Export functions from this module
module.exports = {
  downloadFromUrl,
  extractArchive,
  createTempDirectory,
  removeTempDirectory,
};

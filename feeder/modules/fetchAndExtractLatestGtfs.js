const fs = require('fs');
const AdmZip = require('adm-zip');
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const settings = require('../config/settings');

module.exports = async () => {
  //

  const filePath = `${settings.BASE_DIR}/gtfs.zip`;
  const extractedPath = `${settings.BASE_DIR}/${settings.GTFS_BASE_DIR}/${settings.GTFS_RAW_DIR}/`;

  // Download GTFS file to given destination
  const stream = fs.createWriteStream(filePath);
  const { body } = await fetch(settings.GTFS_URL);
  await finished(Readable.fromWeb(body).pipe(stream));
  console.log(`⤷ Downloaded file from "${settings.GTFS_URL}" to "${filePath}" successfully.`);

  // Extract archive to directory
  const zip = new AdmZip(filePath);
  zip.extractAllTo(extractedPath, true, false);
  console.log(`⤷ Extracted file to "${extractedPath}" successfully.`);

  //
};

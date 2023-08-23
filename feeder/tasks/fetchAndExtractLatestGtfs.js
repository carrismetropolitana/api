const fs = require('fs');
const AdmZip = require('adm-zip');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

module.exports = async (BASE_DIR, GTFS_BASE_DIR, GTFS_EXTRACTED_DIR, GTFS_URL) => {
  //

  const filePath = `${BASE_DIR}/gtfs.zip`;
  const extractedPath = `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}/`;

  // Download GTFS file to given destination
  const stream = fs.createWriteStream(filePath);
  const { body } = await fetch(GTFS_URL);
  await finished(Readable.fromWeb(body).pipe(stream));
  console.log(`⤷ Downloaded file from "${GTFS_URL}" to "${filePath}" successfully.`);

  // Extract archive to directory
  const zip = new AdmZip(filePath);
  zip.extractAllTo(extractedPath, true, false);
  console.log(`⤷ Extracted file to "${extractedPath}" successfully.`);

  //
};

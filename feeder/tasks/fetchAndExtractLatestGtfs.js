const fs = require('fs');
const AdmZip = require('adm-zip');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

module.exports = async (base_dir, extracted_dir, gtfs_url) => {
  //

  const filePath = `${base_dir}/gtfs.zip`;
  const extractedPath = `${base_dir}/${extracted_dir}/`;

  // Download GTFS file to given destination
  const stream = fs.createWriteStream(filePath);
  const { body } = await fetch(gtfs_url);
  await finished(Readable.fromWeb(body).pipe(stream));
  console.log(`⤷ Downloaded file from "${gtfs_url}" to "${filePath}" successfully.`);

  // Extract archive to directory
  const zip = new AdmZip(filePath);
  zip.extractAllTo(extractedPath, true, false);
  console.log(`⤷ Extracted file to "${extractedPath}" successfully.`);

  //
};

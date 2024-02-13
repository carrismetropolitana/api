/* * */

import { existsSync, mkdirSync, createWriteStream } from 'fs';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { BASE_DIR, GTFS_BASE_DIR, GTFS_RAW_DIR } from '../config/settings';

/* * */

export default async () => {
  //

  const filePath = `${BASE_DIR}/${GTFS_BASE_DIR}/gtfs.zip`;
  const extractedPath = `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}/`;

  // Create directory if it does not already exist
  if (!existsSync(`${BASE_DIR}/${GTFS_BASE_DIR}`)) {
    console.log(`⤷ Creating directory "${BASE_DIR}/${GTFS_BASE_DIR}"...`);
    mkdirSync(`${BASE_DIR}/${GTFS_BASE_DIR}`, { recursive: true });
  }

  // Download GTFS file to given destination
  const stream = createWriteStream(filePath);
  const { body } = await fetch(process.env.GTFS_URL);
  await finished(Readable.fromWeb(body).pipe(stream));
  console.log(`⤷ Downloaded file from "${process.env.GTFS_URL}" to "${filePath}" successfully.`);

  // Extract archive to directory
  const zip = new AdmZip(filePath);
  zip.extractAllTo(extractedPath, true, false);
  console.log(`⤷ Extracted file to "${extractedPath}" successfully.`);

  //
};

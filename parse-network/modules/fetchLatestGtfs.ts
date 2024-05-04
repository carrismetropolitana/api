/* * */

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { BASE_DIR, GTFS_BASE_DIR } from '../config/settings';

/* * */

export default async () => {
  //

  const filePath = `${BASE_DIR}/${GTFS_BASE_DIR}/gtfs.zip`;

  // Create directory if it does not already exist
  if (!existsSync(`${BASE_DIR}/${GTFS_BASE_DIR}`)) {
    console.log(`⤷ Creating directory "${BASE_DIR}/${GTFS_BASE_DIR}"...`);
    mkdirSync(`${BASE_DIR}/${GTFS_BASE_DIR}`, { recursive: true });
  }

  // Download GTFS file to given destination
  const stream = createWriteStream(filePath);
  const resp: Response = await fetch(process.env.GTFS_URL);
  const body: ReadableStream<Uint8Array> = resp.body;
  // @ts-expect-error Readable.fromWeb actually accepts a ReadableStream<Uint8Array>, even though we are mixing nodejs and web ReadableStreams
  await finished(Readable.fromWeb(body).pipe(stream));
  console.log(`⤷ Downloaded file from "${process.env.GTFS_URL}" to "${filePath}" successfully.`);

  //
};

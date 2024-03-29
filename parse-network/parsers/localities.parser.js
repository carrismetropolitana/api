/* * */

const crypto = require('crypto');
const NETWORKDB = require('../services/NETWORKDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');
const collator = require('../modules/sortCollator');

/* * */

module.exports = async () => {
  //
  // 1.
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();

  // 2.
  // Query Postgres for all unique localities, municipalities
  console.log(`⤷ Querying database...`);
  const allLocalities = await NETWORKDB.connection.query(`
    SELECT DISTINCT ON (locality, municipality_id, municipality_name)
        locality,
        municipality_id,
        municipality_name
    FROM stops;
  `);

  // 3.
  // Log progress
  console.log(`⤷ Updating Localities...`);

  // 4.
  // Initate a temporary variable to hold updated Localities
  const allLocalitiesData = [];
  const updatedLocalityKeys = new Set();

  // 5.
  // For each locality, update its entry in the database
  for (const localityData of allLocalities.rows) {
    // Skip if the locality is the same as the municipality
    if (!localityData.locality) continue;
    else if (localityData.locality === localityData.municipality_name) continue;
    // Setup the display string for this locality
    const displayString = `${localityData.locality}, ${localityData.municipality_name}`;
    // Setup a unique ID for this locality
    const hash = crypto.createHash('sha256');
    hash.update(displayString);
    // Initiate a variable to hold the parsed locality
    const parsedLocality = {
      id: hash.digest('hex'),
      display: displayString,
      locality: localityData.locality,
      municipality_id: localityData.municipality_id,
      municipality_name: localityData.municipality_name,
    };
    // Update or create new document
    allLocalitiesData.push(parsedLocality);
    await SERVERDB.client.set(`localities:${parsedLocality.id}`, JSON.stringify(parsedLocality));
    updatedLocalityKeys.add(`localities:${parsedLocality.id}`);
    //
  }

  // 6.
  // Log count of updated Localities
  console.log(`⤷ Updated ${updatedLocalityKeys.size} Localities.`);

  // 7.
  // Add the 'all' option
  allLocalitiesData.sort((a, b) => collator.compare(a.id, b.id));
  await SERVERDB.client.set('localities:all', JSON.stringify(allLocalitiesData));
  updatedLocalityKeys.add('localities:all');

  // 8.
  // Delete all Localities not present in the current update
  const allSavedStopKeys = [];
  for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'localities:*' })) {
    allSavedStopKeys.push(key);
  }
  const staleLocalityKeys = allSavedStopKeys.filter((id) => !updatedLocalityKeys.has(id));
  if (staleLocalityKeys.length) await SERVERDB.client.del(staleLocalityKeys);
  console.log(`⤷ Deleted ${staleLocalityKeys.length} stale Localities.`);

  // 9.
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Localities (${elapsedTime}).`);

  //
};

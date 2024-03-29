/* * */

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
  // Fetch all Municipalities from Postgres
  console.log(`⤷ Querying database...`);
  const allMunicipalities = await NETWORKDB.connection.query('SELECT * FROM municipalities');

  // 3.
  // Initate a temporary variable to hold updated Municipalities
  const allMunicipalitiesData = [];
  const updatedMunicipalityKeys = new Set();

  // 4.
  // Log progress
  console.log(`⤷ Updating Municipalities...`);

  // 5.
  // For each municipality, update its entry in the database
  for (const municipality of allMunicipalities.rows) {
    // Parse municipality
    const parsedMunicipality = {
      id: municipality.municipality_id,
      name: municipality.municipality_name,
      prefix: municipality.municipality_prefix,
      district_id: municipality.district_id,
      district_name: municipality.district_name,
      region_id: municipality.region_id,
      region_name: municipality.region_name,
    };
    // Update or create new document
    allMunicipalitiesData.push(parsedMunicipality);
    await SERVERDB.client.set(`municipalities:${parsedMunicipality.id}`, JSON.stringify(parsedMunicipality));
    updatedMunicipalityKeys.add(`municipalities:${parsedMunicipality.id}`);
  }

  // 6.
  // Log count of updated Municipalities
  console.log(`⤷ Updated ${updatedMunicipalityKeys.size} Municipalities.`);

  // 7.
  // Add the 'all' option
  allMunicipalitiesData.sort((a, b) => collator.compare(a.id, b.id));
  await SERVERDB.client.set('municipalities:all', JSON.stringify(allMunicipalitiesData));
  updatedMunicipalityKeys.add('municipalities:all');

  // 8.
  // Delete all Municipalities not present in the current update
  const allSavedMunicipalityKeys = [];
  for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'municipalities:*' })) {
    allSavedMunicipalityKeys.push(key);
  }
  const staleMunicipalityKeys = allSavedMunicipalityKeys.filter((id) => !updatedMunicipalityKeys.has(id));
  if (staleMunicipalityKeys.length) await SERVERDB.client.del(staleMunicipalityKeys);
  console.log(`⤷ Deleted ${staleMunicipalityKeys.length} stale Municipalities.`);

  // 9.
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);

  //
};

const FEEDERDB = require('../services/FEEDERDB');
const SERVERDBREDIS = require('../services/SERVERDBREDIS');
const timeCalc = require('../modules/timeCalc');

/* UPDATE MUNICIPALITIES */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Fetch all Municipalities from Postgres
  console.log(`⤷ Querying database...`);
  const allMunicipalities = await FEEDERDB.connection.query('SELECT * FROM municipalities');
  // Initate a temporary variable to hold updated Municipalities
  const allMunicipalitiesData = [];
  const updatedMunicipalityKeys = new Set();
  // Log progress
  console.log(`⤷ Updating Municipalities...`);
  // For each municipality, update its entry in the database
  for (const municipality of allMunicipalities.rows) {
    // Parse municipality
    const parsedMunicipality = {
      code: municipality.municipality_id,
      name: municipality.municipality_name,
      prefix: municipality.municipality_prefix,
      district_code: municipality.district_id,
      district_name: municipality.district_name,
      region_code: municipality.region_id,
      region_name: municipality.region_name,
    };
    // Update or create new document
    allMunicipalitiesData.push(parsedMunicipality);
    await SERVERDBREDIS.client.set(`municipalities:${parsedMunicipality.code}`, JSON.stringify(parsedMunicipality));
    updatedMunicipalityKeys.add(`municipalities:${parsedMunicipality.code}`);
    //
  }
  // Log count of updated Municipalities
  console.log(`⤷ Updated ${updatedMunicipalityKeys.size} Municipalities.`);
  // Add the 'all' option
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  allMunicipalitiesData.sort((a, b) => collator.compare(a.code, b.code));
  await SERVERDBREDIS.client.set('municipalities:all', JSON.stringify(allMunicipalitiesData));
  updatedMunicipalityKeys.add('municipalities:all');
  // Delete all Municipalities not present in the current update
  const allSavedMunicipalityKeys = [];
  for await (const key of SERVERDBREDIS.client.scanIterator({ TYPE: 'string', MATCH: 'municipalities:*' })) {
    allSavedMunicipalityKeys.push(key);
  }
  const staleMunicipalityKeys = allSavedMunicipalityKeys.filter((code) => !updatedMunicipalityKeys.has(code));
  if (staleMunicipalityKeys.length) await SERVERDBREDIS.client.del(staleMunicipalityKeys);
  console.log(`⤷ Deleted ${staleMunicipalityKeys.length} stale Municipalities.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);
  //
};

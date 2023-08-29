const FEEDERDB = require('../services/FEEDERDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');

/* UPDATE MUNICIPALITIES */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Fetch all Municipalities from Postgres
  console.log(`⤷ Querying database...`);
  const allMunicipalities = await FEEDERDB.connection.query('SELECT * FROM municipalities');
  // Initate a temporary variable to hold updated Municipalities
  let updatedMunicipalityIds = [];
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
    // Save to database
    const updatedMunicipalityDocument = await SERVERDB.Municipality.findOneAndReplace({ code: parsedMunicipality.code }, parsedMunicipality, { new: true, upsert: true });
    updatedMunicipalityIds.push(updatedMunicipalityDocument._id);
  }
  // Log count of updated Municipalities
  console.log(`⤷ Updated ${updatedMunicipalityIds.length} Municipalities.`);
  // Delete all Municipalities not present in the current update
  const deletedStaleMunicipalities = await SERVERDB.Municipality.deleteMany({ _id: { $nin: updatedMunicipalityIds } });
  console.log(`⤷ Deleted ${deletedStaleMunicipalities.deletedCount} stale Municipalities.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);
  //
};
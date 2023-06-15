/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');

/**
 * UPDATE MUNICIPALITIES
 * Fetch Municipalities from www,
 * parse them and save them to MongoDB.
 * @async
 */
module.exports = async () => {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Municipalities...`);
  const startTime = process.hrtime();
  // Fetch all Municipalities from Postgres
  const allMunicipalities = await GTFSParseDB.connection.query('SELECT * FROM municipalities');
  // Initate a temporary variable to hold updated Municipalities
  let updatedMunicipalityIds = [];
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
    const updatedMunicipalityDocument = await GTFSAPIDB.Municipality.findOneAndReplace({ code: parsedMunicipality.code }, parsedMunicipality, { new: true, upsert: true });
    updatedMunicipalityIds.push(updatedMunicipalityDocument._id);
  }
  // Log count of updated Municipalities
  console.log(`⤷ Updated ${updatedMunicipalityIds.length} Municipalities.`);
  // Delete all Municipalities not present in the current update
  const deletedStaleMunicipalities = await GTFSAPIDB.Municipality.deleteMany({ _id: { $nin: updatedMunicipalityIds } });
  console.log(`⤷ Deleted ${deletedStaleMunicipalities.deletedCount} stale Municipalities.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);
  //
};

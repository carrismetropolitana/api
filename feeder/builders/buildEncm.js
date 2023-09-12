const FEEDERDB = require('../services/FEEDERDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');

/* UPDATE HELPDESKS */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Fetch all ENCM from Postgres
  console.log(`⤷ Querying database...`);
  const allEncm = await FEEDERDB.connection.query('SELECT * FROM encm');
  // Initate a temporary variable to hold updated ENCM
  let updatedEncmCodes = [];
  // Log progress
  console.log(`⤷ Updating ENCM...`);
  // For each facility, update its entry in the database
  for (const encm of allEncm.rows) {
    // Parse encm
    const parsedEncm = {
      code: encm.id,
      name: encm.name,
      lat: encm.lat,
      lon: encm.lon,
      phone: encm.phone,
      email: encm.email,
      url: encm.url,
      address: encm.address,
      postal_code: encm.postal_code,
      locality: encm.locality,
      parish_code: encm.parish_id,
      parish_name: encm.parish_name,
      municipality_code: encm.municipality_id,
      municipality_name: encm.municipality_name,
      district_code: encm.district_id,
      district_name: encm.district_name,
      region_code: encm.region_id,
      region_name: encm.region_name,
      hours_monday: encm.hours_monday?.length ? encm.hours_monday.split('|') : [],
      hours_tuesday: encm.hours_tuesday?.length ? encm.hours_tuesday.split('|') : [],
      hours_wednesday: encm.hours_wednesday?.length ? encm.hours_wednesday.split('|') : [],
      hours_thursday: encm.hours_thursday?.length ? encm.hours_thursday.split('|') : [],
      hours_friday: encm.hours_friday?.length ? encm.hours_friday.split('|') : [],
      hours_saturday: encm.hours_saturday?.length ? encm.hours_saturday.split('|') : [],
      hours_sunday: encm.hours_sunday?.length ? encm.hours_sunday.split('|') : [],
      hours_special: encm.hours_special,
      stops: encm.stops?.length ? encm.encm_stops.split('|') : [],
    };
    // Save to database
    await SERVERDB.Encm.replaceOne({ code: parsedEncm.code }, parsedEncm, { upsert: true });
    updatedEncmCodes.push(parsedEncm.code);
  }
  // Log count of updated ENCM
  console.log(`⤷ Updated ${updatedEncmCodes.length} ENCM.`);
  // Delete all ENCM not present in the current update
  const deletedStaleEncm = await SERVERDB.Encm.deleteMany({ code: { $nin: updatedEncmCodes } });
  console.log(`⤷ Deleted ${deletedStaleEncm.deletedCount} stale ENCM.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating ENCM (${elapsedTime}).`);
  //
};

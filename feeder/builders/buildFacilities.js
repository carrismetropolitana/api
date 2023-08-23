const FEEDERDB = require('../services/FEEDERDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');

/* UPDATE FACILITIES */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Fetch all Facilities from Postgres
  console.log(`⤷ Querying database...`);
  const allFacilities = await FEEDERDB.connection.query('SELECT * FROM facilities');
  // Initate a temporary variable to hold updated Facilities
  let updatedFacilityIds = [];
  // Log progress
  console.log(`⤷ Updating Facilities...`);
  // For each facility, update its entry in the database
  for (const facility of allFacilities.rows) {
    // Split stops into discrete IDs
    let parsedFacilityStops = [];
    if (facility.facility_stops?.length) parsedFacilityStops = facility.facility_stops.split('|');
    // Parse facility
    const parsedFacility = {
      code: facility.facility_id,
      type: facility.facility_type,
      name: facility.facility_name,
      lat: facility.facility_lat,
      lon: facility.facility_lon,
      phone: facility.facility_phone,
      email: facility.facility_email,
      url: facility.facility_url,
      address: facility.address,
      postal_code: facility.postal_code,
      locality: facility.locality,
      parish_code: facility.parish_id,
      parish_name: facility.parish_name,
      municipality_code: facility.municipality_id,
      municipality_name: facility.municipality_name,
      district_code: facility.district_id,
      district_name: facility.district_name,
      region_code: facility.region_id,
      region_name: facility.region_name,
      stops: parsedFacilityStops,
    };
    // Save to database
    const updatedFacilityDocument = await SERVERDB.Facility.findOneAndReplace({ code: parsedFacility.code }, parsedFacility, { new: true, upsert: true });
    updatedFacilityIds.push(updatedFacilityDocument._id);
  }
  // Log count of updated Facilities
  console.log(`⤷ Updated ${updatedFacilityIds.length} Facilities.`);
  // Delete all Facilities not present in the current update
  const deletedStaleFacilities = await SERVERDB.Facility.deleteMany({ _id: { $nin: updatedFacilityIds } });
  console.log(`⤷ Deleted ${deletedStaleFacilities.deletedCount} stale Facilities.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Facilities (${elapsedTime}).`);
  //
};

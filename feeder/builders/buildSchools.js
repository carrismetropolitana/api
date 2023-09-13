const FEEDERDB = require('../services/FEEDERDB');
const SERVERDBREDIS = require('../services/SERVERDBREDIS');
const timeCalc = require('../modules/timeCalc');

/* UPDATE STOPS */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Query Postgres for all unique schools by school_id
  console.log(`⤷ Querying database...`);
  const allSchools = await FEEDERDB.connection.query(`SELECT * FROM schools;`);
  // Log progress
  console.log(`⤷ Updating Schools...`);
  // Initate a temporary variable to hold updated Schools
  const allSchoolsData = [];
  const updatedSchoolKeys = new Set();
  // For each school, update its entry in the database
  for (const school of allSchools.rows) {
    // Discover which cicles this school has
    const cicles = [];
    if (school.pre_school) cicles.push('pre_school');
    if (school.basic_1) cicles.push('basic_1');
    if (school.basic_2) cicles.push('basic_2');
    if (school.basic_3) cicles.push('basic_3');
    if (school.high_school) cicles.push('high_school');
    if (school.professional) cicles.push('professional');
    if (school.special) cicles.push('special');
    if (school.artistic) cicles.push('artistic');
    if (school.university) cicles.push('university');
    if (school.other) cicles.push('other');
    // Split stops into discrete IDs
    let parsedSchoolStops = [];
    if (school.stops?.length) parsedSchoolStops = school.stops.split('|');
    // Initiate a variable to hold the parsed school
    const parsedSchool = {
      code: school.id,
      name: school.name,
      lat: school.lat,
      lon: school.lon,
      nature: school.nature,
      grouping: school.grouping,
      cicles: cicles,
      address: school.address,
      postal_code: school.postal_code,
      locality: school.locality,
      parish_code: school.parish_id,
      parish_name: school.parish_name,
      municipality_code: school.municipality_id,
      municipality_name: school.municipality_name,
      district_code: school.district_id,
      district_name: school.district_name,
      region_code: school.region_id,
      region_name: school.region_name,
      url: school.url,
      email: school.email,
      phone: school.phone,
      stops: parsedSchoolStops,
    };
    // Update or create new document
    allSchoolsData.push(parsedSchool);
    await SERVERDBREDIS.client.set(`schools:${parsedSchool.code}`, JSON.stringify(parsedSchool));
    updatedSchoolKeys.add(`schools:${parsedSchool.code}`);
    //
  }
  // Log count of updated Schools
  console.log(`⤷ Updated ${updatedSchoolKeys.size} Schools.`);
  // Add the 'all' option
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  allSchoolsData.sort((a, b) => collator.compare(a.code, b.code));
  await SERVERDBREDIS.client.set('schools:all', JSON.stringify(allSchoolsData));
  updatedSchoolKeys.add('schools:all');
  // Delete all Schools not present in the current update
  const allSavedSchoolKeys = [];
  for await (const key of SERVERDBREDIS.client.scanIterator({ TYPE: 'string', MATCH: 'schools:*' })) {
    allSavedSchoolKeys.push(key);
  }
  const staleSchoolKeys = allSavedSchoolKeys.filter((code) => !updatedSchoolKeys.has(code));
  if (staleSchoolKeys.length) await SERVERDBREDIS.client.del(staleSchoolKeys);
  console.log(`⤷ Deleted ${staleSchoolKeys.length} stale Schools.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Schools (${elapsedTime}).`);
  //
};

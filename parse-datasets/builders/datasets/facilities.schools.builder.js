/* * */

const FEEDERDB = require('../../services/FEEDERDB');
const SERVERDB = require('../../services/SERVERDB');
const timeCalc = require('../../modules/timeCalc');
const collator = require('../../modules/sortCollator');

/* * */

module.exports = async () => {
  //
  // 1.
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();

  // 2.
  // Query Postgres for all unique schools by school_id
  console.log(`⤷ Querying database...`);
  const allSchools = await FEEDERDB.connection.query(`SELECT * FROM schools;`);

  // 3.
  // Log progress
  console.log(`⤷ Updating Schools...`);

  // 4.
  // Initate a temporary variable to hold updated Schools
  const allSchoolsData = [];
  const updatedSchoolKeys = new Set();

  // 5.
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
      id: school.id,
      name: school.name,
      lat: school.lat,
      lon: school.lon,
      nature: school.nature,
      grouping: school.grouping,
      cicles: cicles,
      address: school.address,
      postal_code: school.postal_code,
      locality: school.locality,
      parish_id: school.parish_id,
      parish_name: school.parish_name,
      municipality_id: school.municipality_id,
      municipality_name: school.municipality_name,
      district_id: school.district_id,
      district_name: school.district_name,
      region_id: school.region_id,
      region_name: school.region_name,
      url: school.url,
      email: school.email,
      phone: school.phone,
      stops: parsedSchoolStops,
    };
    // Update or create new document
    allSchoolsData.push(parsedSchool);
    await SERVERDB.client.set(`schools:${parsedSchool.id}`, JSON.stringify(parsedSchool));
    updatedSchoolKeys.add(`schools:${parsedSchool.id}`);
    //
  }

  // 6.
  // Log count of updated Schools
  console.log(`⤷ Updated ${updatedSchoolKeys.size} Schools.`);

  // 7.
  // Add the 'all' option
  allSchoolsData.sort((a, b) => collator.compare(a.id, b.id));
  await SERVERDB.client.set('schools:all', JSON.stringify(allSchoolsData));
  updatedSchoolKeys.add('schools:all');

  // 8.
  // Delete all Schools not present in the current update
  const allSavedSchoolKeys = [];
  for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'schools:*' })) {
    allSavedSchoolKeys.push(key);
  }
  const staleSchoolKeys = allSavedSchoolKeys.filter((id) => !updatedSchoolKeys.has(id));
  if (staleSchoolKeys.length) await SERVERDB.client.del(staleSchoolKeys);
  console.log(`⤷ Deleted ${staleSchoolKeys.length} stale Schools.`);

  // 9.
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Schools (${elapsedTime}).`);

  //
};

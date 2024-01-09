/* * */

const fs = require('fs');
const Papa = require('papaparse');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');
const collator = require('../modules/sortCollator');
const settings = require('../config/settings');

/* * */

module.exports = async () => {
  //
  // 1.
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();

  // 2.
  // Open file from cloned repository
  console.log(`⤷ Open data file...`);
  const allSchoolsRaw = fs.readFileSync(`${settings.BASE_DIR}/facilities/schools/schools.csv`, { encoding: 'utf-8' });
  const allSchoolsCsv = Papa.parse(allSchoolsRaw, { header: true });

  // 3.
  // Log progress
  console.log(`⤷ Updating Schools...`);

  // 4.
  // Initate a temporary variable to hold updated Schools
  const allSchoolsData = [];
  const updatedSchoolKeys = new Set();

  // 5.
  // For each school, update its entry in the database
  for (const schoolData of allSchoolsCsv.data) {
    // Discover which cicles this school has
    const cicles = [];
    if (schoolData.pre_school) cicles.push('pre_school');
    if (schoolData.basic_1) cicles.push('basic_1');
    if (schoolData.basic_2) cicles.push('basic_2');
    if (schoolData.basic_3) cicles.push('basic_3');
    if (schoolData.high_school) cicles.push('high_school');
    if (schoolData.professional) cicles.push('professional');
    if (schoolData.special) cicles.push('special');
    if (schoolData.artistic) cicles.push('artistic');
    if (schoolData.university) cicles.push('university');
    if (schoolData.other) cicles.push('other');
    // Split stops into discrete IDs
    let parsedSchoolStops = [];
    if (schoolData.stops?.length) parsedSchoolStops = schoolData.stops.split('|');
    // Initiate a variable to hold the parsed school
    const parsedSchool = {
      id: schoolData.id,
      name: schoolData.name,
      lat: schoolData.lat,
      lon: schoolData.lon,
      nature: schoolData.nature,
      grouping: schoolData.grouping,
      cicles: cicles,
      address: schoolData.address,
      postal_code: schoolData.postal_code,
      locality: schoolData.locality,
      parish_id: schoolData.parish_id,
      parish_name: schoolData.parish_name,
      municipality_id: schoolData.municipality_id,
      municipality_name: schoolData.municipality_name,
      district_id: schoolData.district_id,
      district_name: schoolData.district_name,
      region_id: schoolData.region_id,
      region_name: schoolData.region_name,
      url: schoolData.url,
      email: schoolData.email,
      phone: schoolData.phone,
      stops: parsedSchoolStops,
    };
    // Update or create new document
    allSchoolsData.push(parsedSchool);
    await SERVERDB.client.set(`datasets/facilities/schools/${parsedSchool.id}`, JSON.stringify(parsedSchool));
    updatedSchoolKeys.add(`datasets/facilities/schools/${parsedSchool.id}`);
    //
  }

  // 6.
  // Log count of updated Schools
  console.log(`⤷ Updated ${updatedSchoolKeys.size} Schools.`);

  // 7.
  // Add the 'all' option
  allSchoolsData.sort((a, b) => collator.compare(a.id, b.id));
  await SERVERDB.client.set('datasets/facilities/schools/all', JSON.stringify(allSchoolsData));
  updatedSchoolKeys.add('datasets/facilities/schools/all');

  // 8.
  // Delete all Schools not present in the current update
  const allSavedSchoolKeys = [];
  for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'datasets/facilities/schools/*' })) {
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

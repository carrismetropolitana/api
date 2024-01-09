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
  // Fetch file from cloned repository
  console.log(`⤷ Open data file...`);
  const allEncmRaw = fs.readFileSync(`${settings.BASE_DIR}/facilities/encm/encm.csv`, { encoding: 'utf-8' });
  const allEncmCsv = Papa.unparse(allEncmRaw);

  console.log(allEncmCsv);

  return;

  // 3.
  // Initate a temporary variable to hold updated ENCM
  const allEncmData = [];
  const updatedEncmKeys = new Set();

  // 4.
  // Log progress
  console.log(`⤷ Updating ENCM...`);

  // 5.
  // For each facility, update its entry in the database
  for (const encm of allEncmCsv) {
    // Parse encm
    const parsedEncm = {
      id: encm.id,
      name: encm.name,
      lat: encm.lat,
      lon: encm.lon,
      phone: encm.phone,
      email: encm.email,
      url: encm.url,
      address: encm.address,
      postal_code: encm.postal_code,
      locality: encm.locality,
      parish_id: encm.parish_id,
      parish_name: encm.parish_name,
      municipality_id: encm.municipality_id,
      municipality_name: encm.municipality_name,
      district_id: encm.district_id,
      district_name: encm.district_name,
      region_id: encm.region_id,
      region_name: encm.region_name,
      hours_monday: encm.hours_monday?.length ? encm.hours_monday.split('|') : [],
      hours_tuesday: encm.hours_tuesday?.length ? encm.hours_tuesday.split('|') : [],
      hours_wednesday: encm.hours_wednesday?.length ? encm.hours_wednesday.split('|') : [],
      hours_thursday: encm.hours_thursday?.length ? encm.hours_thursday.split('|') : [],
      hours_friday: encm.hours_friday?.length ? encm.hours_friday.split('|') : [],
      hours_saturday: encm.hours_saturday?.length ? encm.hours_saturday.split('|') : [],
      hours_sunday: encm.hours_sunday?.length ? encm.hours_sunday.split('|') : [],
      hours_special: encm.hours_special,
      stops: encm.stops?.length ? encm.stops.split('|') : [],
      currently_waiting: 0,
      expected_wait_time: 0,
      active_counters: 0,
      is_open: false,
    };
    // Save to database
    allEncmData.push(parsedEncm);
    await SERVERDB.client.set(`datasets/facilities/encm/${parsedEncm.id}`, JSON.stringify(parsedEncm));
    updatedEncmKeys.add(`datasets/facilities/encm/${parsedEncm.id}`);
    //
  }

  // 6.
  // Log count of updated ENCM
  console.log(`⤷ Updated ${updatedEncmKeys.size} ENCM.`);

  // 7.
  // Add the 'all' option
  allEncmData.sort((a, b) => collator.compare(a.id, b.id));
  await SERVERDB.client.set('datasets/facilities/encm/all', JSON.stringify(allEncmData));
  updatedEncmKeys.add('datasets/facilities/encm/all');

  // 8.
  // Delete all ENCM not present in the current update
  const allSavedEncmKeys = [];
  for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'datasets/facilities/encm/*' })) {
    allSavedEncmKeys.push(key);
  }
  const staleEncmKeys = allSavedEncmKeys.filter((id) => !updatedEncmKeys.has(id));
  if (staleEncmKeys.length) await SERVERDB.client.del(staleEncmKeys);
  console.log(`⤷ Deleted ${staleEncmKeys.length} stale ENCM.`);

  // 9.
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating ENCM (${elapsedTime}).`);

  //
};

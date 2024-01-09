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
  const allEncmCsv = Papa.parse(allEncmRaw);

  // 3.
  // Initate a temporary variable to hold updated ENCM
  const allEncmData = [];
  const updatedEncmKeys = new Set();

  // 4.
  // Log progress
  console.log(`⤷ Updating ENCM...`);

  // 5.
  // For each facility, update its entry in the database
  for (const encmData of allEncmCsv.data) {
    // Parse encm
    console.log(encmData);
    const parsedEncm = {
      id: encmData.id,
      name: encmData.name,
      lat: encmData.lat,
      lon: encmData.lon,
      phone: encmData.phone,
      email: encmData.email,
      url: encmData.url,
      address: encmData.address,
      postal_code: encmData.postal_code,
      locality: encmData.locality,
      parish_id: encmData.parish_id,
      parish_name: encmData.parish_name,
      municipality_id: encmData.municipality_id,
      municipality_name: encmData.municipality_name,
      district_id: encmData.district_id,
      district_name: encmData.district_name,
      region_id: encmData.region_id,
      region_name: encmData.region_name,
      hours_monday: encmData.hours_monday?.length ? encmData.hours_monday.split('|') : [],
      hours_tuesday: encmData.hours_tuesday?.length ? encmData.hours_tuesday.split('|') : [],
      hours_wednesday: encmData.hours_wednesday?.length ? encmData.hours_wednesday.split('|') : [],
      hours_thursday: encmData.hours_thursday?.length ? encmData.hours_thursday.split('|') : [],
      hours_friday: encmData.hours_friday?.length ? encmData.hours_friday.split('|') : [],
      hours_saturday: encmData.hours_saturday?.length ? encmData.hours_saturday.split('|') : [],
      hours_sunday: encmData.hours_sunday?.length ? encmData.hours_sunday.split('|') : [],
      hours_special: encmData.hours_special,
      stops: encmData.stops?.length ? encmData.stops.split('|') : [],
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

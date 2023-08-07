/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');

/**
 * UPDATE STORES
 * parse them and save them to MongoDB.
 * @async
 */
module.exports = async () => {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Stores...`);
  const startTime = process.hrtime();
  // Fetch all Stores from Postgres
  const allStores = await GTFSParseDB.connection.query('SELECT * FROM stores');
  // Initate a temporary variable to hold updated Stores
  let updatedStoreIds = [];
  // For each facility, update its entry in the database
  for (const store of allStores.rows) {
    // Parse store
    const parsedStore = {
      code: store.store_id,
      type: store.store_type,
      name: store.store_name,
      lat: store.store_lat,
      lon: store.store_lon,
      phone: store.store_phone,
      email: store.store_email,
      url: store.store_url,
      address: store.address,
      postal_code: store.postal_code,
      locality: store.locality,
      parish_code: store.parish_id,
      parish_name: store.parish_name,
      municipality_code: store.municipality_id,
      municipality_name: store.municipality_name,
      district_code: store.district_id,
      district_name: store.district_name,
      region_code: store.region_id,
      region_name: store.region_name,
      hours_monday: store.hours_monday?.length ? store.hours_monday.split('|') : [],
      hours_tuesday: store.hours_tuesday?.length ? store.hours_tuesday.split('|') : [],
      hours_wednesday: store.hours_wednesday?.length ? store.hours_wednesday.split('|') : [],
      hours_thursday: store.hours_thursday?.length ? store.hours_thursday.split('|') : [],
      hours_friday: store.hours_friday?.length ? store.hours_friday.split('|') : [],
      hours_saturday: store.hours_saturday?.length ? store.hours_saturday.split('|') : [],
      hours_sunday: store.hours_sunday?.length ? store.hours_sunday.split('|') : [],
      hours_special: store.hours_special,
      stops: store.store_stops?.length ? store.store_stops.split('|') : [],
    };
    // Save to database
    const updatedStoreDocument = await GTFSAPIDB.Store.findOneAndReplace({ code: parsedStore.code }, parsedStore, { new: true, upsert: true });
    updatedStoreIds.push(updatedStoreDocument._id);
  }
  // Log count of updated Stores
  console.log(`⤷ Updated ${updatedStoreIds.length} Stores.`);
  // Delete all Stores not present in the current update
  const deletedStaleStores = await GTFSAPIDB.Store.deleteMany({ _id: { $nin: updatedStoreIds } });
  console.log(`⤷ Deleted ${deletedStaleStores.deletedCount} stale Stores.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Stores (${elapsedTime}).`);
  //
};

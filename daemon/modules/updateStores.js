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
    // Split stops into discrete IDs
    let parsedStoreStops = [];
    if (store.store_stops?.length) parsedStoreStops = store.store_stops.split('|');
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
      hours_monday: store.hours_monday,
      hours_tuesday: store.hours_tuesday,
      hours_wednesday: store.hours_wednesday,
      hours_thursday: store.hours_thursday,
      hours_friday: store.hours_friday,
      hours_saturday: store.hours_saturday,
      hours_sunday: store.hours_sunday,
      stops: parsedStoreStops,
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

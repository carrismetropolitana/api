/* * */
/* IMPORTS */
const FEEDERDB = require('../databases/feederdb');
const SERVERDB = require('../databases/serverdb');
const timeCalc = require('./timeCalc');

/**
 * UPDATE HELPDESKS
 * parse them and save them to MongoDB.
 * @async
 */
module.exports = async () => {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Helpdesks...`);
  const startTime = process.hrtime();
  // Fetch all Helpdesks from Postgres
  const allHelpdesks = await FEEDERDB.connection.query('SELECT * FROM helpdesks');
  // Initate a temporary variable to hold updated Helpdesks
  let updatedHelpdeskIds = [];
  // For each facility, update its entry in the database
  for (const helpdesk of allHelpdesks.rows) {
    // Parse helpdesk
    const parsedHelpdesk = {
      code: helpdesk.helpdesk_id,
      type: helpdesk.helpdesk_type,
      name: helpdesk.helpdesk_name,
      lat: helpdesk.helpdesk_lat,
      lon: helpdesk.helpdesk_lon,
      phone: helpdesk.helpdesk_phone,
      email: helpdesk.helpdesk_email,
      url: helpdesk.helpdesk_url,
      address: helpdesk.address,
      postal_code: helpdesk.postal_code,
      locality: helpdesk.locality,
      parish_code: helpdesk.parish_id,
      parish_name: helpdesk.parish_name,
      municipality_code: helpdesk.municipality_id,
      municipality_name: helpdesk.municipality_name,
      district_code: helpdesk.district_id,
      district_name: helpdesk.district_name,
      region_code: helpdesk.region_id,
      region_name: helpdesk.region_name,
      hours_monday: helpdesk.hours_monday?.length ? helpdesk.hours_monday.split('|') : [],
      hours_tuesday: helpdesk.hours_tuesday?.length ? helpdesk.hours_tuesday.split('|') : [],
      hours_wednesday: helpdesk.hours_wednesday?.length ? helpdesk.hours_wednesday.split('|') : [],
      hours_thursday: helpdesk.hours_thursday?.length ? helpdesk.hours_thursday.split('|') : [],
      hours_friday: helpdesk.hours_friday?.length ? helpdesk.hours_friday.split('|') : [],
      hours_saturday: helpdesk.hours_saturday?.length ? helpdesk.hours_saturday.split('|') : [],
      hours_sunday: helpdesk.hours_sunday?.length ? helpdesk.hours_sunday.split('|') : [],
      hours_special: helpdesk.hours_special,
      stops: helpdesk.helpdesk_stops?.length ? helpdesk.helpdesk_stops.split('|') : [],
    };
    // Save to database
    const updatedHelpdeskDocument = await SERVERDB.Helpdesk.findOneAndReplace({ code: parsedHelpdesk.code }, parsedHelpdesk, { new: true, upsert: true });
    updatedHelpdeskIds.push(updatedHelpdeskDocument._id);
  }
  // Log count of updated Helpdesks
  console.log(`⤷ Updated ${updatedHelpdeskIds.length} Helpdesks.`);
  // Delete all Helpdesks not present in the current update
  const deletedStaleHelpdesks = await SERVERDB.Helpdesk.deleteMany({ _id: { $nin: updatedHelpdeskIds } });
  console.log(`⤷ Deleted ${deletedStaleHelpdesks.deletedCount} stale Helpdesks.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Helpdesks (${elapsedTime}).`);
  //
};

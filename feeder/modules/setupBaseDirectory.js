const fs = require('fs');
const settings = require('../config/settings');

module.exports = async () => {
  //

  // Remove directory, if exists
  fs.rmSync(settings.BASE_DIR, { recursive: true, force: true });
  console.log(`⤷ Removed directory "${settings.BASE_DIR}" successfully.`);

  // Create directory
  fs.mkdirSync(settings.BASE_DIR);
  console.log(`⤷ Created directory "${settings.BASE_DIR}" successfully.`);

  //
};

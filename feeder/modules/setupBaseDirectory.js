const fs = require('fs');

module.exports = async (BASE_DIR) => {
  //

  // Remove directory, if exists
  fs.rmSync(BASE_DIR, { recursive: true, force: true });
  console.log(`⤷ Removed directory "${BASE_DIR}" successfully.`);

  // Create directory
  fs.mkdirSync(BASE_DIR);
  console.log(`⤷ Created directory "${BASE_DIR}" successfully.`);

  //
};

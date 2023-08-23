const fs = require('fs');

module.exports = async (base_dir) => {
  //

  // Remove directory, if exists
  fs.rmSync(base_dir, { recursive: true, force: true });
  console.log(`⤷ Removed directory "${base_dir}" successfully.`);

  // Create directory
  fs.mkdirSync(base_dir);
  console.log(`⤷ Created directory "${base_dir}" successfully.`);

  //
};

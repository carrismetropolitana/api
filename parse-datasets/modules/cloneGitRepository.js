/* * */

const fs = require('fs');
const settings = require('../config/settings');
const shell = require('shelljs');

/* * */

export default async () => {
  //

  // Delete directory if it exists
  fs.rmSync(settings.BASE_DIR, { recursive: true, force: true });
  console.log(`⤷ Removed directory "${settings.BASE_DIR}" successfully.`);

  // Create directory
  fs.mkdirSync(settings.BASE_DIR, { recursive: true });
  console.log(`⤷ Created directory "${settings.BASE_DIR}" successfully.`);

  // Check if git is installed
  if (!shell.which('git')) {
    shell.echo('Error: Git is not installed.');
    shell.exit(1);
  }

  // Run external tool synchronously
  if (shell.exec(`git clone https://github.com/carrismetropolitana/datasets.git ${settings.BASE_DIR}`).code !== 0) {
    shell.echo('Error: Git clone failed');
    shell.exit(1);
  }

  //
};

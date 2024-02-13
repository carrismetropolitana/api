/* * */

import dotenv from 'dotenv';
dotenv.config();
import { RUN_INTERVAL } from './config/settings';
import start from './start';

/* * */

(async function init() {
  //

  // Initiate a flag to detect overlapping runs
  let TASK_IS_RUNNING = false;

  // Define a function that is run on every interval
  async function runOnInterval() {
    // Force restart if an overlapping task is detected.
    if (TASK_IS_RUNNING) throw new Error('Force restart: Overlapping tasks.');
    // Set the flag to TRUE
    TASK_IS_RUNNING = true;
    // Run the program
    await start();
    // Set the flag to FALSE
    TASK_IS_RUNNING = false;
    //
  }

  // Run immediately on init
  runOnInterval();

  // Set the interval
  setInterval(runOnInterval, RUN_INTERVAL);

  //
})();
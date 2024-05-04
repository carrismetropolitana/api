/* * */

import NETWORKDB from '@/services/NETWORKDB';
import SERVERDB from '@/services/SERVERDB';
import collator from '@/modules/sortCollator';
import { getElapsedTime } from '@/modules/timeCalc';

/* * */

export default async () => {
  //
  // 1.
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();

  // 2.
  // Fetch all Plans from Postgres
  console.log(`⤷ Querying database...`);
  const allPlans = await NETWORKDB.client.query('SELECT * FROM plans');

  // 3.
  // Initate a temporary variable to hold updated Plans
  const allPlansData = [];
  const updatedPlanKeys = new Set();

  // 4.
  // Log progress
  console.log(`⤷ Updating Plans...`);

  // 5.
  // For each plan, update its entry in the database
  for (const plan of allPlans.rows) {
    // Parse plan
    const parsedPlan = {
      id: plan.plan_id,
      operator_id: plan.operator_id,
      start_date: plan.plan_start_date,
      end_date: plan.plan_end_date,

    };
    // Update or create new document
    allPlansData.push(parsedPlan);
    await SERVERDB.client.set(`plans:${parsedPlan.id}`, JSON.stringify(parsedPlan));
    updatedPlanKeys.add(`plans:${parsedPlan.id}`);
  }

  // 6.
  // Log count of updated Plans
  console.log(`⤷ Updated ${updatedPlanKeys.size} Plans.`);

  // 7.
  // Add the 'all' option
  allPlansData.sort((a, b) => collator.compare(a.start_date, b.start_date));
  await SERVERDB.client.set('plans:all', JSON.stringify(allPlansData));
  updatedPlanKeys.add('plans:all');

  // 8.
  // Delete all Plans not present in the current update
  const allSavedPlanKeys = [];
  for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'plans:*' }))
    allSavedPlanKeys.push(key);

  const stalePlanKeys = allSavedPlanKeys.filter(plan => !updatedPlanKeys.has(plan));
  if (stalePlanKeys.length)
    await SERVERDB.client.del(stalePlanKeys);
  console.log(`⤷ Deleted ${stalePlanKeys.length} stale Plans.`);

  // 9.
  // Log elapsed time in the current operation
  const elapsedTime = getElapsedTime(startTime);
  console.log(`⤷ Done updating Plans (${elapsedTime}).`);

  //
};

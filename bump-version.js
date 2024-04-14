/* * */

const fs = require('fs');

/* * */

const now = new Date();
const year = now.getFullYear();
const month = padNumber(now.getMonth() + 1);
const day = padNumber(now.getDate());
const hours = padNumber(now.getHours());
const minutes = padNumber(now.getMinutes());

const newVersion = `${year}.${month}.${day}-${hours}${minutes}`;

fs.writeFileSync('./parse-datasets/package.json', JSON.stringify({ ...require('./parse-datasets/package.json'), version: newVersion }, null, 2));
fs.writeFileSync('./parse-network/package.json', JSON.stringify({ ...require('./parse-network/package.json'), version: newVersion }, null, 2));
fs.writeFileSync('./server/package.json', JSON.stringify({ ...require('./server/package.json'), version: newVersion }, null, 2));
fs.writeFileSync('./switch/package.json', JSON.stringify({ ...require('./switch/package.json'), version: newVersion }, null, 2));
fs.writeFileSync('./sync/package.json', JSON.stringify({ ...require('./sync/package.json'), version: newVersion }, null, 2));

/* * */

function padNumber(number) {
  return number.toString().padStart(2, '0');
}

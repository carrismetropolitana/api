/* * * * * */
/* DATABASE */
/* * */

/* * */
/* IMPORTS */
const mongoose = require('mongoose');
const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_NAME } = process.env;

exports.connect = async function () {
  await mongoose
    .set('strictQuery', true)
    .connect(`mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_NAME}?authSource=admin`)
    .then(() => console.log('Connected to MongoDB.'))
    .catch((error) => {
      console.log('Connection to MongoDB failed.');
      console.log('At database.js > mongoose.connect()');
      console.log(error);
      process.exit();
    });
};

exports.disconnect = async function () {
  await mongoose
    .disconnect()
    .then(() => console.log('Disconnected from MongoDB.'))
    .catch((error) => {
      console.log('Failed closing connection to MongoDB.');
      console.log('At database.js > mongoose.disconnect()');
      console.log(error);
    });
};

/* * * * * */
/* MODEL: TRANSACTION */
/* * */

/* * */
/* IMPORTS */
const mongoose = require('mongoose');

/* * */
/* Schema for MongoDB ["KV"] Object */
module.exports =
  mongoose.models.Transaction ||
  mongoose.model(
    'KV',
    new mongoose.Schema({
      key: {
        type: String,
        maxlength: 1000,
        unique: true,
      },
      value: {
        type: String,
        maxlength: 5000000,
      },
      storedAt: {
        type: Date,
        expires: 86400,
        default: Date.now,
      },
    })
  );
